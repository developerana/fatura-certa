import { InvoiceCategory, InvoiceStatus, CATEGORY_LABELS, STATUS_LABELS } from '@/types/invoice';
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
}

export function FiltersBar({
  referenceMonth,
  onMonthChange,
  filterStatus,
  onStatusChange,
  filterCategory,
  onCategoryChange,
}: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-40">
        <Input
          type="month"
          value={referenceMonth}
          onChange={e => onMonthChange(e.target.value)}
          className="h-9 text-sm"
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
    </div>
  );
}
