import { CreditCard } from 'lucide-react';
import { InvoiceWithStatus } from '@/types/invoice';

interface CardTotalCardProps {
  referenceMonth: string;
  invoices: InvoiceWithStatus[];
  filterCard: string;
}

const CARD_COLORS: Record<string, string> = {
  'nubank': 'hsl(270, 70%, 45%)',
  'mercado pago': 'hsl(50, 90%, 50%)',
  'caixa': 'hsl(200, 75%, 60%)',
};

function getCardColor(cardName: string) {
  const key = cardName.toLowerCase().trim();
  for (const [match, color] of Object.entries(CARD_COLORS)) {
    if (key.includes(match)) return color;
  }
  return 'hsl(var(--primary))';
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CardTotalCard({ referenceMonth, invoices, filterCard }: CardTotalCardProps) {
  const monthInvoices = invoices.filter(i => i.referenceMonth === referenceMonth && i.card);

  const targetCard = filterCard !== 'all' ? filterCard : null;
  const filtered = targetCard
    ? monthInvoices.filter(i => i.card === targetCard)
    : monthInvoices;

  const total = filtered.reduce((sum, i) => sum + i.totalAmount, 0);
  const paid = filtered.reduce((sum, i) => sum + i.totalPaid, 0);
  const remaining = total - paid;
  const count = filtered.length;

  const title = targetCard ? `Fatura ${targetCard}` : 'Fatura Total (Cartões)';
  const accent = targetCard ? getCardColor(targetCard) : 'hsl(var(--primary))';

  return (
    <div
      className="glass-card p-4 sm:p-5 border"
      style={{ borderColor: `${accent}`, borderWidth: '1px', borderTopWidth: '3px' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">
          {title}
        </span>
        <CreditCard className="h-4 w-4" style={{ color: accent }} />
      </div>

      <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight" style={{ color: accent }}>
        {formatCurrency(total)}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {count} {count === 1 ? 'lançamento' : 'lançamentos'}
      </p>

      <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Pago</p>
          <p className="font-mono font-semibold text-status-paid">{formatCurrency(paid)}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground">A pagar</p>
          <p className="font-mono font-semibold">{formatCurrency(remaining)}</p>
        </div>
      </div>
    </div>
  );
}
