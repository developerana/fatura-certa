import { useCardBreakdown } from '@/hooks/useInvoices';
import { InvoiceWithStatus } from '@/types/invoice';

interface CardChartProps {
  referenceMonth: string;
  invoices: InvoiceWithStatus[];
}

const COLORS = ['hsl(172, 66%, 50%)', 'hsl(262, 60%, 55%)', 'hsl(45, 93%, 47%)', 'hsl(340, 65%, 55%)', 'hsl(200, 70%, 50%)', 'hsl(30, 80%, 55%)'];

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

  const maxValue = Math.max(...data.map(d => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="glass-card p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Gastos por Cartão</h3>
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const share = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
          return (
            <div key={item.card} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
                  <span className="text-muted-foreground truncate">{item.card}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-xs font-medium">{formatCurrency(item.value)}</span>
                  <span className="text-[10px] text-muted-foreground w-8 text-right">{share}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%`, background: COLORS[index % COLORS.length] }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total</span>
        <span className="font-mono font-semibold">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
