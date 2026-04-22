import { InvoiceCategory, InvoiceStatus, getCardOptions } from '@/types/invoice';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatMonthLabel(month: string) {
  const [year, m] = month.split('-');
  return `${MONTH_NAMES[parseInt(m) - 1]} ${year}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

interface FiltersBarProps {
  referenceMonth: string;
  onMonthChange: (month: string) => void;
  filterCard: string;
  onCardChange: (card: string) => void;
  filterResponsible: string;
  onResponsibleChange: (responsible: string) => void;
  availableResponsibles?: string[];
}

export function FiltersBar({
  referenceMonth,
  onMonthChange,
  filterCard,
  onCardChange,
  filterResponsible,
  onResponsibleChange,
  availableResponsibles = [],
}: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
      <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMonthChange(shiftMonth(referenceMonth, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium w-32 sm:w-36 text-center select-none">
          {formatMonthLabel(referenceMonth)}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMonthChange(shiftMonth(referenceMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
        <Select value={filterCard} onValueChange={onCardChange}>
          <SelectTrigger className="h-9 text-xs sm:text-sm sm:w-40">
            <SelectValue placeholder="Cartão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Cartões</SelectItem>
            {getCardOptions().map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterResponsible} onValueChange={onResponsibleChange}>
          <SelectTrigger className="h-9 text-xs sm:text-sm sm:w-44">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Responsáveis</SelectItem>
            {availableResponsibles.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
