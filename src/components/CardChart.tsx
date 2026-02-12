import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

  const chartData = data.map(d => ({ name: d.card, value: d.value }));
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="glass-card p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Gastos por Cartão</h3>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {chartData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-mono text-xs font-semibold text-foreground">{formatCurrency(total)}</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-sm gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{item.name}</span>
              </div>
              <span className="font-mono text-xs font-medium flex-shrink-0">{((item.value / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
