import { InvoiceCategory, InvoiceStatus, CATEGORY_LABELS, STATUS_LABELS, getCardOptions } from '@/types/invoice';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface FiltersBarProps {
  referenceMonth: string;
  onMonthChange: (month: string) => void;
  filterStatus: InvoiceStatus | 'all';
  onStatusChange: (status: InvoiceStatus | 'all') => void;
  filterCategory: InvoiceCategory | 'all';
  onCategoryChange: (category: InvoiceCategory | 'all') => void;
  filterCard: string;
  onCardChange: (card: string) => void;
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
}: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div>
        <Input
          type="month"
          value={referenceMonth}
          onChange={e => onMonthChange(e.target.value)}
          className="h-9 text-sm w-36"
        />
      </div>
      <Select value={filterStatus} onValueChange={(v) => onStatusChange(v as InvoiceStatus | 'all')}>
        <SelectTrigger className="w-36 h-9">
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
        <SelectTrigger className="w-44 h-9">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas Categorias</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filterCard} onValueChange={onCardChange}>
        <SelectTrigger className="w-40 h-9">
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
  );
}
