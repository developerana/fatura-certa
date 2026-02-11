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
