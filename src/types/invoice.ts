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
  | 'supermercado'
  | 'streaming'
  | 'seguro'
  | 'combustivel'
  | 'estacionamento'
  | 'academia'
  | 'pet'
  | 'vestuario'
  | 'lazer'
  | 'assinatura'
  | 'condominio'
  | 'iptu'
  | 'ipva'
  | 'impostos'
  | 'manutencao'
  | 'emprestimo'
  | 'investimento'
  | 'doacao'
  | 'viagem'
  | 'beleza'
  | 'farmacia'
  | 'delivery'
  | 'gas'
  | 'setup'
  | 'outros';

export const CATEGORY_LABELS: Record<InvoiceCategory, string> = {
  aluguel: 'Aluguel',
  condominio: 'Condomínio',
  cartao: 'Cartão de Crédito',
  energia: 'Energia',
  agua: 'Água',
  gas: 'Gás',
  internet: 'Internet',
  telefone: 'Telefone',
  streaming: 'Streaming',
  assinatura: 'Assinatura',
  supermercado: 'Supermercado',
  delivery: 'Delivery',
  alimentacao: 'Alimentação',
  educacao: 'Educação',
  saude: 'Saúde',
  farmacia: 'Farmácia',
  academia: 'Academia',
  beleza: 'Beleza',
  transporte: 'Transporte',
  combustivel: 'Combustível',
  estacionamento: 'Estacionamento',
  seguro: 'Seguro',
  iptu: 'IPTU',
  ipva: 'IPVA',
  impostos: 'Impostos',
  emprestimo: 'Empréstimo',
  investimento: 'Investimento',
  manutencao: 'Manutenção',
  vestuario: 'Vestuário',
  lazer: 'Lazer',
  viagem: 'Viagem',
  pet: 'Pet',
  doacao: 'Doação',
  setup: 'Setup',
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
  category: InvoiceCategory;
  totalAmount: number;
  dueDate: string;
  referenceMonth: string;
  card?: string;
  paymentMethod?: string;
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
