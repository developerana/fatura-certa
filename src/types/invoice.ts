export type InvoiceStatus = 'pending' | 'paid' | 'partial' | 'overdue';

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  partial: 'Parcial',
  overdue: 'Atrasado',
};

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string; // ISO date
  isEarly: boolean; // pagamento antecipado
  notes?: string;
}

export const DEFAULT_CARDS = ['Caixa', 'Mercado Pago', 'Nubank'];
export const DEFAULT_PAYMENT_METHODS = ['PIX', 'Boleto', 'Débito', 'Crédito', 'Dinheiro', 'Transferência'];

const CARDS_KEY = 'user_cards';
const PAYMENT_METHODS_KEY = 'user_payment_methods';

export function getCardOptions(): string[] {
  try {
    const data = localStorage.getItem(CARDS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [...DEFAULT_CARDS];
}

export function addCardOption(card: string): string[] {
  const cards = getCardOptions();
  const trimmed = card.trim();
  if (trimmed && !cards.includes(trimmed)) {
    cards.push(trimmed);
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  }
  return cards;
}

export function getPaymentMethodOptions(): string[] {
  try {
    const data = localStorage.getItem(PAYMENT_METHODS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [...DEFAULT_PAYMENT_METHODS];
}

export function addPaymentMethodOption(method: string): string[] {
  const methods = getPaymentMethodOptions();
  const trimmed = method.trim();
  if (trimmed && !methods.includes(trimmed)) {
    methods.push(trimmed);
    localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(methods));
  }
  return methods;
}

export interface Invoice {
  id: string;
  description: string;
  totalAmount: number;
  dueDate: string;
  referenceMonth: string;
  card?: string;
  paymentMethod?: string;
  responsiblePerson?: string;
  notes?: string;
  installments?: number;
  installmentNumber?: number;
  installmentGroup?: string;
  createdAt: string;
}

export interface InvoiceWithStatus extends Invoice {
  status: InvoiceStatus;
  totalPaid: number;
  remainingBalance: number;
  payments: Payment[];
}
