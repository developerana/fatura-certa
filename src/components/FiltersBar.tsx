import { InvoiceCategory, InvoiceStatus, CATEGORY_LABELS, STATUS_LABELS, getCardOptions } from '@/types/invoice';
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
  filterStatus: InvoiceStatus | 'all';
  onStatusChange: (status: InvoiceStatus | 'all') => void;
  filterCategory: InvoiceCategory | 'all';
  onCategoryChange: (category: InvoiceCategory | 'all') => void;
  filterCard: string;
  onCardChange: (card: string) => void;
  availableCategories?: InvoiceCategory[];
}

export function FiltersBar({
  referenceMonth,
  onMonthChange,
  filterStatus,
  onStatusChange,
  filterCategory,
  onCategoryChange,
  filterCard,
  onCardChange,
  availableCategories,
}: FiltersBarProps) {
  const categoriesToShow = availableCategories
    ? Object.entries(CATEGORY_LABELS).filter(([key]) => availableCategories.includes(key as InvoiceCategory))
    : Object.entries(CATEGORY_LABELS);
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
      <div className="grid grid-cols-3 sm:flex gap-2 w-full sm:w-auto">
        <Select value={filterStatus} onValueChange={(v) => onStatusChange(v as InvoiceStatus | 'all')}>
          <SelectTrigger className="h-9 text-xs sm:text-sm sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={(v) => onCategoryChange(v as InvoiceCategory | 'all')}>
          <SelectTrigger className="h-9 text-xs sm:text-sm sm:w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categoriesToShow.map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      </div>
    </div>
  );
}
