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

export const CARD_OPTIONS = [
  'Nubank',
  'Inter',
  'Itaú',
  'Bradesco',
  'Santander',
  'C6 Bank',
  'BTG',
  'XP',
  'Caixa',
  'Banco do Brasil',
  'Outro',
] as const;

export interface Invoice {
  id: string;
  description: string;
  category: InvoiceCategory;
  totalAmount: number;
  dueDate: string; // ISO date
  referenceMonth: string; // YYYY-MM format
  card?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceWithStatus extends Invoice {
  status: InvoiceStatus;
  totalPaid: number;
  remainingBalance: number;
  payments: Payment[];
}
