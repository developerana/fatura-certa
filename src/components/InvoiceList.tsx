import { useState } from 'react';
import { InvoiceWithStatus, STATUS_LABELS, CATEGORY_LABELS, InvoiceCategory, InvoiceStatus } from '@/types/invoice';
import { deleteInvoice } from '@/store/invoiceStore';
import { CalendarDays, Trash2, CreditCard, MoreHorizontal } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InvoiceListProps {
  invoices: InvoiceWithStatus[];
  onPayment: (invoice: InvoiceWithStatus) => void;
  onEdit: (invoice: InvoiceWithStatus) => void;
  onRefresh: () => void;
  filterStatus: InvoiceStatus | 'all';
  filterCategory: InvoiceCategory | 'all';
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
}

const statusClass: Record<InvoiceStatus, string> = {
  paid: 'status-paid',
  partial: 'status-partial',
  overdue: 'status-overdue',
  pending: 'status-pending',
};

export function InvoiceList({ invoices, onPayment, onEdit, onRefresh, filterStatus, filterCategory }: InvoiceListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = invoices.filter(inv => {
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
    if (filterCategory !== 'all' && inv.category !== filterCategory) return false;
    return true;
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteInvoice(deleteId);
      setDeleteId(null);
      onRefresh();
    }
  };

  if (filtered.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {filtered.map((inv, i) => {
          const progress = inv.totalAmount > 0 ? (inv.totalPaid / inv.totalAmount) * 100 : 0;
          const isOverdue = inv.status === 'overdue';

          return (
            <div
              key={inv.id}
              className="glass-card p-4 hover:border-primary/20 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-sm truncate">{inv.description}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusClass[inv.status]}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span>{CATEGORY_LABELS[inv.category]}</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(inv.dueDate)}
                    </span>
                    {inv.card && (
                      <span className="flex items-center gap-1 text-primary">
                        <CreditCard className="h-3 w-3" />
                        {inv.card}
                      </span>
                    )}
                    {inv.paymentMethod && (
                      <span className="text-muted-foreground">
                        {inv.paymentMethod}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Total</span>
                      <p className="font-mono text-sm font-semibold">{formatCurrency(inv.totalAmount)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Pago</span>
                      <p className="font-mono text-sm font-medium text-status-paid">{formatCurrency(inv.totalPaid)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Restante</span>
                      <p className={`font-mono text-sm font-medium ${isOverdue ? 'text-status-overdue' : ''}`}>
                        {formatCurrency(inv.remainingBalance)}
                      </p>
                    </div>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {inv.status !== 'paid' && (
                      <DropdownMenuItem onClick={() => onPayment(inv)}>
                        Registrar Pagamento
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEdit(inv)}>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(inv.id)}
                    >
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os pagamentos vinculados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
