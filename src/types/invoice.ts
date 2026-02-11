export type InvoiceStatus = 'pending' | 'paid' | 'partial' | 'overdue';

export type InvoiceCategory = 
  | 'aluguel' 
  | 'cartao' 
  | 'energia' 
  | 'internet' 
  | 'agua' 
  | 'telefone' 
  | 'educacao' 
  | 'saude' 
  | 'transporte' 
  | 'alimentacao' 
  | 'outros';

export const CATEGORY_LABELS: Record<InvoiceCategory, string> = {
  aluguel: 'Aluguel',
  cartao: 'Cartão de Crédito',
  energia: 'Energia',
  internet: 'Internet',
  agua: 'Água',
  telefone: 'Telefone',
  educacao: 'Educação',
  saude: 'Saúde',
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  outros: 'Outros',
};

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

const CARDS_KEY = 'user_cards';

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

export interface Invoice {
  id: string;
  description: string;
  category: InvoiceCategory;
  totalAmount: number;
  dueDate: string;
  referenceMonth: string;
  card?: string;
  paymentMethod?: string;
  notes?: string;
  installments?: number;
  installmentNumber?: number;
  createdAt: string;
}

export interface InvoiceWithStatus extends Invoice {
  status: InvoiceStatus;
  totalPaid: number;
  remainingBalance: number;
  payments: Payment[];
}
