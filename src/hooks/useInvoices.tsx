import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { InvoiceWithStatus, InvoiceStatus, InvoiceCategory } from '@/types/invoice';
import { addToQueue, isOnline } from '@/lib/offlineQueue';

// ─── Local cache helpers ───
const LOCAL_CACHE_KEY = 'invoices_cache';

function saveLocalCache(userId: string, data: InvoiceWithStatus[]) {
  try {
    localStorage.setItem(`${LOCAL_CACHE_KEY}_${userId}`, JSON.stringify(data));
  } catch {}
}

function loadLocalCache(userId: string): InvoiceWithStatus[] | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_CACHE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── DB types ───
interface DbInvoice {
  id: string;
  user_id: string;
  description: string;
  category: string;
  total_amount: number;
  due_date: string;
  reference_month: string;
  card: string | null;
  payment_method: string | null;
  installments: number | null;
  installment_number: number | null;
  installment_group: string | null;
  created_at: string;
}

interface DbPayment {
  id: string;
  user_id: string;
  invoice_id: string;
  amount: number;
  date: string;
  is_early: boolean;
  created_at: string;
}

function computeStatus(invoice: DbInvoice, totalPaid: number): InvoiceStatus {
  if (totalPaid >= invoice.total_amount) return 'paid';
  const now = new Date();
  const dueDate = new Date(invoice.due_date);
  if (totalPaid > 0 && totalPaid < invoice.total_amount) return 'partial';
  if (now > dueDate && totalPaid < invoice.total_amount) return 'overdue';
  return 'pending';
}

function mapInvoices(invoices: DbInvoice[], payments: DbPayment[]): InvoiceWithStatus[] {
  return invoices.map(invoice => {
    const invoicePayments = payments.filter(p => p.invoice_id === invoice.id);
    const totalPaid = invoicePayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      id: invoice.id,
      description: invoice.description,
      category: invoice.category as InvoiceCategory,
      totalAmount: Number(invoice.total_amount),
      dueDate: invoice.due_date,
      referenceMonth: invoice.reference_month,
      card: invoice.card || undefined,
      paymentMethod: invoice.payment_method || undefined,
      installments: invoice.installments || 1,
      installmentNumber: invoice.installment_number || 1,
      installmentGroup: invoice.installment_group || undefined,
      createdAt: invoice.created_at,
      status: computeStatus(invoice, totalPaid),
      totalPaid,
      remainingBalance: Number(invoice.total_amount) - totalPaid,
      payments: invoicePayments.map(p => ({
        id: p.id,
        invoiceId: p.invoice_id,
        amount: Number(p.amount),
        date: p.date,
        isEarly: p.is_early,
      })),
    };
  });
}

export function useInvoicesWithStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async (): Promise<InvoiceWithStatus[]> => {
      if (!user) return [];

      // If offline, return cached data
      if (!isOnline()) {
        const cached = loadLocalCache(user.id);
        if (cached) return cached;
        throw new Error('Sem conexão e sem cache local');
      }

      const [{ data: invoices, error: ie }, { data: payments, error: pe }] = await Promise.all([
        supabase.from('invoices').select('*').eq('user_id', user.id),
        supabase.from('payments').select('*').eq('user_id', user.id),
      ]);

      if (ie) throw ie;
      if (pe) throw pe;

      const result = mapInvoices(
        (invoices || []) as DbInvoice[],
        (payments || []) as DbPayment[],
      );

      // Save to local cache for offline use
      saveLocalCache(user.id, result);

      return result;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry when offline
      if (!isOnline()) return false;
      return failureCount < 3;
    },
  });
}

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftDate(dateStr: string, monthsDelta: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setMonth(d.getMonth() + monthsDelta);
  return d.toISOString().split('T')[0];
}

export function useAddInvoice() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      description: string;
      category: string;
      totalAmount: number;
      dueDate: string;
      referenceMonth: string;
      card?: string;
      paymentMethod?: string;
      installments?: number;
      currentInstallment?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const installments = data.installments && data.installments > 1 ? data.installments : 1;
      const startFrom = data.currentInstallment && data.currentInstallment > 1 ? data.currentInstallment : 1;
      const installmentGroup = installments > 1 ? crypto.randomUUID() : null;
      const perInstallment = Math.round((data.totalAmount / installments) * 100) / 100;

      const rows = Array.from({ length: installments - startFrom + 1 }, (_, idx) => {
        const i = startFrom - 1 + idx;
        return {
          description: installments > 1 ? `${data.description} (${i + 1}/${installments})` : data.description,
          category: data.category,
          total_amount: i === installments - 1
            ? Math.round((data.totalAmount - perInstallment * (installments - 1)) * 100) / 100
            : perInstallment,
          due_date: shiftDate(data.dueDate, idx),
          reference_month: shiftMonth(data.referenceMonth, idx),
          card: data.card || null,
          payment_method: data.paymentMethod || null,
          installments,
          installment_number: i + 1,
          installment_group: installmentGroup,
        };
      });

      if (!isOnline()) {
        addToQueue({ type: 'add_invoice', payload: rows });
        return rows; // Return for optimistic update
      }

      const rowsWithUser = rows.map(r => ({ ...r, user_id: user.id }));
      const { data: inserted, error } = await supabase.from('invoices').insert(rowsWithUser).select();
      if (error) throw error;
      return inserted;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const mapped: Record<string, any> = {};
      if (data.description !== undefined) mapped.description = data.description;
      if (data.category !== undefined) mapped.category = data.category;
      if (data.totalAmount !== undefined) mapped.total_amount = data.totalAmount;
      if (data.dueDate !== undefined) mapped.due_date = data.dueDate;
      if (data.referenceMonth !== undefined) mapped.reference_month = data.referenceMonth;
      if (data.card !== undefined) mapped.card = data.card || null;
      if (data.paymentMethod !== undefined) mapped.payment_method = data.paymentMethod || null;

      if (!isOnline()) {
        addToQueue({ type: 'update_invoice', payload: { id, data: mapped } });
        return;
      }

      const { error } = await supabase.from('invoices').update(mapped).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ['invoices'] });
      const prev = qc.getQueriesData<InvoiceWithStatus[]>({ queryKey: ['invoices'] });

      qc.setQueriesData<InvoiceWithStatus[]>({ queryKey: ['invoices'] }, (old) => {
        if (!old) return old;
        return old.map(inv => inv.id === id ? {
          ...inv,
          ...(data.description !== undefined && { description: data.description }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount, remainingBalance: data.totalAmount - inv.totalPaid }),
          ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
          ...(data.referenceMonth !== undefined && { referenceMonth: data.referenceMonth }),
          ...(data.card !== undefined && { card: data.card || undefined }),
          ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod || undefined }),
        } : inv);
      });

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        context.prev.forEach(([key, data]) => qc.setQueryData(key, data));
      }
    },
    onSettled: () => {
      if (isOnline()) qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, installmentGroup }: { id: string; installmentGroup?: string | null }) => {
      if (!isOnline()) {
        addToQueue({ type: 'delete_invoice', payload: { id, installmentGroup } });
        return { id, installmentGroup };
      }

      if (installmentGroup) {
        const { error } = await supabase.from('invoices').delete().eq('installment_group', installmentGroup);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('invoices').delete().eq('id', id);
        if (error) throw error;
      }
      return { id, installmentGroup };
    },
    onMutate: async ({ id, installmentGroup }) => {
      await qc.cancelQueries({ queryKey: ['invoices'] });
      const prev = qc.getQueriesData<InvoiceWithStatus[]>({ queryKey: ['invoices'] });

      qc.setQueriesData<InvoiceWithStatus[]>({ queryKey: ['invoices'] }, (old) => {
        if (!old) return old;
        if (installmentGroup) {
          return old.filter(inv => inv.installmentGroup !== installmentGroup);
        }
        return old.filter(inv => inv.id !== id);
      });

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        context.prev.forEach(([key, data]) => qc.setQueryData(key, data));
      }
    },
    onSettled: () => {
      if (isOnline()) qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useAddPayment() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      invoiceId: string;
      amount: number;
      date: string;
      isEarly: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const payload = {
        invoice_id: data.invoiceId,
        amount: data.amount,
        date: data.date,
        is_early: data.isEarly,
      };

      if (!isOnline()) {
        addToQueue({ type: 'add_payment', payload });
        return;
      }

      const { error } = await supabase.from('payments').insert({
        ...payload,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['invoices'] });
      const prev = qc.getQueriesData<InvoiceWithStatus[]>({ queryKey: ['invoices'] });

      qc.setQueriesData<InvoiceWithStatus[]>({ queryKey: ['invoices'] }, (old) => {
        if (!old) return old;
        return old.map(inv => {
          if (inv.id !== data.invoiceId) return inv;
          const newTotalPaid = inv.totalPaid + data.amount;
          const newRemaining = inv.totalAmount - newTotalPaid;
          let status: InvoiceStatus = 'pending';
          if (newTotalPaid >= inv.totalAmount) status = 'paid';
          else if (newTotalPaid > 0) status = 'partial';
          else if (new Date() > new Date(inv.dueDate)) status = 'overdue';

          return {
            ...inv,
            totalPaid: newTotalPaid,
            remainingBalance: newRemaining,
            status,
            payments: [...inv.payments, {
              id: `temp-${Date.now()}`,
              invoiceId: data.invoiceId,
              amount: data.amount,
              date: data.date,
              isEarly: data.isEarly,
            }],
          };
        });
      });

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        context.prev.forEach(([key, data]) => qc.setQueryData(key, data));
      }
    },
    onSettled: () => {
      if (isOnline()) qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useAddPaymentsBatch() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payments: Array<{
      invoiceId: string;
      amount: number;
      date: string;
      isEarly: boolean;
    }>) => {
      if (!user) throw new Error('Not authenticated');

      const rows = payments.map(p => ({
        invoice_id: p.invoiceId,
        amount: p.amount,
        date: p.date,
        is_early: p.isEarly,
      }));

      if (!isOnline()) {
        addToQueue({ type: 'add_payments_batch', payload: rows });
        return;
      }

      const rowsWithUser = rows.map(r => ({ ...r, user_id: user.id }));
      const { error } = await supabase.from('payments').insert(rowsWithUser);
      if (error) throw error;
    },
    onMutate: async (payments) => {
      await qc.cancelQueries({ queryKey: ['invoices'] });
      const prev = qc.getQueriesData<InvoiceWithStatus[]>({ queryKey: ['invoices'] });

      const paymentMap = new Map<string, { amount: number; date: string; isEarly: boolean }>();
      payments.forEach(p => paymentMap.set(p.invoiceId, p));

      qc.setQueriesData<InvoiceWithStatus[]>({ queryKey: ['invoices'] }, (old) => {
        if (!old) return old;
        return old.map(inv => {
          const p = paymentMap.get(inv.id);
          if (!p) return inv;
          const newTotalPaid = inv.totalPaid + p.amount;
          return {
            ...inv,
            totalPaid: newTotalPaid,
            remainingBalance: inv.totalAmount - newTotalPaid,
            status: 'paid' as InvoiceStatus,
            payments: [...inv.payments, {
              id: `temp-${Date.now()}-${inv.id}`,
              invoiceId: inv.id,
              amount: p.amount,
              date: p.date,
              isEarly: p.isEarly,
            }],
          };
        });
      });

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        context.prev.forEach(([key, data]) => qc.setQueryData(key, data));
      }
    },
    onSettled: () => {
      if (isOnline()) qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useMonthSummary(referenceMonth: string, invoices?: InvoiceWithStatus[]) {
  const filtered = (invoices || []).filter(i => i.referenceMonth === referenceMonth);
  const totalExpected = filtered.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = filtered.reduce((sum, i) => sum + i.totalPaid, 0);
  const totalPending = totalExpected - totalPaid;
  const overdueCount = filtered.filter(i => i.status === 'overdue').length;
  const paidCount = filtered.filter(i => i.status === 'paid').length;
  return { totalExpected, totalPaid, totalPending, overdueCount, paidCount, invoiceCount: filtered.length };
}

export function useCategoryBreakdown(referenceMonth: string, invoices?: InvoiceWithStatus[]) {
  const filtered = (invoices || []).filter(i => i.referenceMonth === referenceMonth);
  const breakdown: Record<string, number> = {};
  filtered.forEach(i => { breakdown[i.category] = (breakdown[i.category] || 0) + i.totalAmount; });
  return Object.entries(breakdown).map(([category, value]) => ({ category, value }));
}

export function useCardBreakdown(referenceMonth: string, invoices?: InvoiceWithStatus[]) {
  const filtered = (invoices || []).filter(i => i.referenceMonth === referenceMonth && i.card);
  const breakdown: Record<string, number> = {};
  filtered.forEach(i => { breakdown[i.card!] = (breakdown[i.card!] || 0) + i.totalAmount; });
  return Object.entries(breakdown).map(([card, value]) => ({ card, value }));
}
