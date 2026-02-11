import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
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

  return (
    <div className="glass-card p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Gastos por Cartão</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="card" width={90} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '12px' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
              {data.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {data.map((item, index) => (
          <div key={item.card} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
            <span className="text-muted-foreground">{item.card}</span>
            <span className="font-mono font-medium">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
