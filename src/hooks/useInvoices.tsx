import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { InvoiceWithStatus, InvoiceStatus, InvoiceCategory } from '@/types/invoice';

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

export function useInvoicesWithStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async (): Promise<InvoiceWithStatus[]> => {
      if (!user) return [];

      const [{ data: invoices, error: ie }, { data: payments, error: pe }] = await Promise.all([
        supabase.from('invoices').select('*').eq('user_id', user.id),
        supabase.from('payments').select('*').eq('user_id', user.id),
      ]);

      if (ie) throw ie;
      if (pe) throw pe;

      const inv = (invoices || []) as DbInvoice[];
      const pay = (payments || []) as DbPayment[];

      return inv.map(invoice => {
        const invoicePayments = pay.filter(p => p.invoice_id === invoice.id);
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
    },
    enabled: !!user,
  });
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
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('invoices').insert({
        user_id: user.id,
        description: data.description,
        category: data.category,
        total_amount: data.totalAmount,
        due_date: data.dueDate,
        reference_month: data.referenceMonth,
        card: data.card || null,
        payment_method: data.paymentMethod || null,
      });
      if (error) throw error;
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

      const { error } = await supabase.from('invoices').update(mapped).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
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
      const { error } = await supabase.from('payments').insert({
        user_id: user.id,
        invoice_id: data.invoiceId,
        amount: data.amount,
        date: data.date,
        is_early: data.isEarly,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
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
