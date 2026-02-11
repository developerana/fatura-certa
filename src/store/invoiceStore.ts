import { Invoice, Payment, InvoiceWithStatus, InvoiceStatus } from '@/types/invoice';

const INVOICES_KEY = 'invoices';
const PAYMENTS_KEY = 'payments';

// Clear demo data on first load after update
if (localStorage.getItem('demo_cleared') !== 'true') {
  localStorage.removeItem(INVOICES_KEY);
  localStorage.removeItem(PAYMENTS_KEY);
  localStorage.setItem('demo_cleared', 'true');
}

function loadFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Invoices
export function getInvoices(): Invoice[] {
  return loadFromStorage<Invoice>(INVOICES_KEY);
}

export function addInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Invoice {
  const invoices = getInvoices();
  const newInvoice: Invoice = {
    ...invoice,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  invoices.push(newInvoice);
  saveToStorage(INVOICES_KEY, invoices);
  return newInvoice;
}

export function updateInvoice(id: string, data: Partial<Invoice>): Invoice | null {
  const invoices = getInvoices();
  const index = invoices.findIndex(i => i.id === id);
  if (index === -1) return null;
  invoices[index] = { ...invoices[index], ...data };
  saveToStorage(INVOICES_KEY, invoices);
  return invoices[index];
}

export function deleteInvoice(id: string): boolean {
  const invoices = getInvoices();
  const filtered = invoices.filter(i => i.id !== id);
  if (filtered.length === invoices.length) return false;
  saveToStorage(INVOICES_KEY, filtered);
  // Also delete related payments
  const payments = getPayments().filter(p => p.invoiceId !== id);
  saveToStorage(PAYMENTS_KEY, payments);
  return true;
}

// Payments
export function getPayments(): Payment[] {
  return loadFromStorage<Payment>(PAYMENTS_KEY);
}

export function getPaymentsByInvoice(invoiceId: string): Payment[] {
  return getPayments().filter(p => p.invoiceId === invoiceId);
}

export function addPayment(payment: Omit<Payment, 'id'>): Payment | null {
  const invoice = getInvoices().find(i => i.id === payment.invoiceId);
  if (!invoice) return null;

  const existingPayments = getPaymentsByInvoice(payment.invoiceId);
  const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
  
  // Cannot exceed total amount
  if (totalPaid + payment.amount > invoice.totalAmount) return null;

  const payments = getPayments();
  const newPayment: Payment = {
    ...payment,
    id: generateId(),
  };
  payments.push(newPayment);
  saveToStorage(PAYMENTS_KEY, payments);
  return newPayment;
}

// Computed
function computeStatus(invoice: Invoice, payments: Payment[]): InvoiceStatus {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  
  if (totalPaid >= invoice.totalAmount) return 'paid';
  
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  
  if (totalPaid > 0 && totalPaid < invoice.totalAmount) return 'partial';
  if (now > dueDate && totalPaid < invoice.totalAmount) return 'overdue';
  
  return 'pending';
}

export function getInvoicesWithStatus(): InvoiceWithStatus[] {
  const invoices = getInvoices();
  const allPayments = getPayments();

  return invoices.map(invoice => {
    const payments = allPayments.filter(p => p.invoiceId === invoice.id);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      ...invoice,
      status: computeStatus(invoice, payments),
      totalPaid,
      remainingBalance: invoice.totalAmount - totalPaid,
      payments,
    };
  });
}

export function getMonthSummary(referenceMonth: string) {
  const invoices = getInvoicesWithStatus().filter(i => i.referenceMonth === referenceMonth);
  
  const totalExpected = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.totalPaid, 0);
  const totalPending = totalExpected - totalPaid;
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const paidCount = invoices.filter(i => i.status === 'paid').length;

  return { totalExpected, totalPaid, totalPending, overdueCount, paidCount, invoiceCount: invoices.length };
}

export function getCategoryBreakdown(referenceMonth: string) {
  const invoices = getInvoicesWithStatus().filter(i => i.referenceMonth === referenceMonth);
  
  const breakdown: Record<string, number> = {};
  invoices.forEach(i => {
    breakdown[i.category] = (breakdown[i.category] || 0) + i.totalAmount;
  });
  
  return Object.entries(breakdown).map(([category, value]) => ({
    category,
    value,
  }));
}

export function getCardBreakdown(referenceMonth: string) {
  const invoices = getInvoicesWithStatus().filter(i => i.referenceMonth === referenceMonth && i.card);
  
  const breakdown: Record<string, number> = {};
  invoices.forEach(i => {
    const card = i.card!;
    breakdown[card] = (breakdown[card] || 0) + i.totalAmount;
  });
  
  return Object.entries(breakdown).map(([card, value]) => ({ card, value }));
}