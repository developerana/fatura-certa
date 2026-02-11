import { DollarSign, TrendingUp, Clock, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { useMonthSummary } from '@/hooks/useInvoices';
import { InvoiceWithStatus } from '@/types/invoice';

interface DashboardCardsProps {
  referenceMonth: string;
  invoices: InvoiceWithStatus[];
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function DashboardCards({ referenceMonth, invoices }: DashboardCardsProps) {
  const summary = useMonthSummary(referenceMonth, invoices);

  const cards = [
    { title: 'Total Previsto', value: formatCurrency(summary.totalExpected), subtitle: `${summary.invoiceCount} faturas`, icon: FileText, className: 'glass-card' },
    { title: 'Total Pago', value: formatCurrency(summary.totalPaid), subtitle: `${summary.paidCount} pagas`, icon: CheckCircle, className: 'glass-card border-status-paid/30' },
    { title: 'Saldo Pendente', value: formatCurrency(summary.totalPending), subtitle: 'a pagar', icon: Clock, className: 'glass-card' },
    { title: 'Atrasadas', value: String(summary.overdueCount), subtitle: summary.overdueCount > 0 ? 'atenção!' : 'tudo em dia', icon: summary.overdueCount > 0 ? AlertTriangle : TrendingUp, className: summary.overdueCount > 0 ? 'glass-card border-status-overdue/30' : 'glass-card' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {cards.map((card, i) => (
        <div key={card.title} className={`${card.className} p-3 sm:p-5 animate-fade-in`} style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">{card.title}</span>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono tracking-tight">{card.value}</div>
          <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
