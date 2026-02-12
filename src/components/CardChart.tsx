import { useCardBreakdown } from '@/hooks/useInvoices';
import { InvoiceWithStatus } from '@/types/invoice';

interface CardChartProps {
  referenceMonth: string;
  invoices: InvoiceWithStatus[];
}

const CARD_COLORS: Record<string, string> = {
  'nubank': 'hsl(270, 70%, 45%)',
  'mercado pago': 'hsl(50, 90%, 50%)',
  'caixa': 'hsl(200, 75%, 60%)',
};
const FALLBACK_COLORS = ['hsl(340, 65%, 55%)', 'hsl(172, 66%, 50%)', 'hsl(30, 80%, 55%)'];

function getCardColor(cardName: string, index: number) {
  const key = cardName.toLowerCase().trim();
  for (const [match, color] of Object.entries(CARD_COLORS)) {
    if (key.includes(match)) return color;
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CardChart({ referenceMonth, invoices }: CardChartProps) {
  const data = useCardBreakdown(referenceMonth, invoices);

  if (data.length === 0) {
    return (
      <div className="glass-card p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Gastos por Cartão</h3>
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Nenhuma fatura com cartão neste mês</div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="glass-card p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Gastos por Cartão</h3>
      
      {/* Stacked horizontal bar */}
      <div className="h-8 rounded-lg overflow-hidden flex">
        {data.map((item, index) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div
              key={item.card}
              className="h-full transition-all duration-500 ease-out relative group"
              style={{ width: `${pct}%`, background: getCardColor(item.card, index) }}
              title={`${item.card}: ${formatCurrency(item.value)}`}
            >
              {pct > 15 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm">
                  {pct.toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2.5">
        {data.map((item, index) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
          return (
            <div key={item.card} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-3 h-3 rounded flex-shrink-0" style={{ background: getCardColor(item.card, index) }} />
                <span className="text-foreground font-medium truncate">{item.card}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono text-xs">{formatCurrency(item.value)}</span>
                <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total</span>
        <span className="font-mono font-semibold">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
