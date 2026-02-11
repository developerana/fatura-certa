import { useMonthSummary } from '@/hooks/useInvoices';
import { InvoiceWithStatus } from '@/types/invoice';

interface FinancialIndexCardProps {
  referenceMonth: string;
  invoices: InvoiceWithStatus[];
}

function getIndexColor(pct: number) {
  if (pct >= 80) return { stroke: 'hsl(142, 71%, 45%)', label: 'Excelente controle', bg: 'from-emerald-500/10 to-emerald-500/5' };
  if (pct >= 41) return { stroke: 'hsl(45, 93%, 47%)', label: 'Em andamento', bg: 'from-amber-500/10 to-amber-500/5' };
  return { stroke: 'hsl(0, 72%, 51%)', label: 'Atenção', bg: 'from-red-500/10 to-red-500/5' };
}

export function FinancialIndexCard({ referenceMonth, invoices }: FinancialIndexCardProps) {
  const summary = useMonthSummary(referenceMonth, invoices);
  const pct = summary.totalExpected > 0 ? Math.min(Math.round((summary.totalPaid / summary.totalExpected) * 100), 100) : 0;
  const { stroke, label, bg } = getIndexColor(pct);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={`glass-card p-4 sm:p-6 bg-gradient-to-br ${bg} flex flex-col items-center justify-center gap-3 animate-fade-in`}>
      <span className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">
        Índice de Controle
      </span>

      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            opacity="0.3"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl sm:text-3xl font-bold font-mono" style={{ color: stroke }}>
            {pct}%
          </span>
        </div>
      </div>

      <span className="text-xs sm:text-sm font-semibold" style={{ color: stroke }}>
        {label}
      </span>
    </div>
  );
}
