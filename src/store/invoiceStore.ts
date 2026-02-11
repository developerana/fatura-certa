import { Invoice, Payment, InvoiceWithStatus, InvoiceStatus } from '@/types/invoice';

const INVOICES_KEY = 'invoices';
const PAYMENTS_KEY = 'payments';

function seedDemoData() {
  if (localStorage.getItem(INVOICES_KEY)) return;
  
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  const invoices: Invoice[] = [
    { id: 'demo1', description: 'Conta de Luz', category: 'energia', totalAmount: 350, dueDate: `${y}-${String(m).padStart(2,'0')}-15`, referenceMonth: month, card: 'Nubank', createdAt: new Date().toISOString() },
    { id: 'demo2', description: 'Internet Fibra', category: 'internet', totalAmount: 150, dueDate: `${y}-${String(m).padStart(2,'0')}-20`, referenceMonth: month, card: 'Caixa', createdAt: new Date().toISOString() },
    { id: 'demo3', description: 'Fatura Cartão', category: 'cartao', totalAmount: 1200, dueDate: `${y}-${String(m).padStart(2,'0')}-10`, referenceMonth: month, card: 'Nubank', createdAt: new Date().toISOString() },
    { id: 'demo4', description: 'Supermercado', category: 'alimentacao', totalAmount: 800, dueDate: `${y}-${String(m).padStart(2,'0')}-18`, referenceMonth: month, card: 'Mercado Pago', createdAt: new Date().toISOString() },
    { id: 'demo5', description: 'Aluguel', category: 'aluguel', totalAmount: 2000, dueDate: `${y}-${String(m).padStart(2,'0')}-05`, referenceMonth: month, paymentMethod: 'PIX', createdAt: new Date().toISOString() },
    { id: 'demo6', description: 'Plano de Saúde', category: 'saude', totalAmount: 450, dueDate: `${y}-${String(m).padStart(2,'0')}-25`, referenceMonth: month, card: 'Caixa', createdAt: new Date().toISOString() },
  ];

  const payments: Payment[] = [
    { id: 'dpay1', invoiceId: 'demo3', amount: 1200, date: `${y}-${String(m).padStart(2,'0')}-09`, isEarly: true },
    { id: 'dpay2', invoiceId: 'demo5', amount: 2000, date: `${y}-${String(m).padStart(2,'0')}-04`, isEarly: true },
    { id: 'dpay3', invoiceId: 'demo4', amount: 300, date: `${y}-${String(m).padStart(2,'0')}-12`, isEarly: false },
  ];

  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

seedDemoData();

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