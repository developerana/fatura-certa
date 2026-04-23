import { useState } from 'react';
import { InvoiceWithStatus, STATUS_LABELS, CATEGORY_LABELS, InvoiceStatus } from '@/types/invoice';
import { useDeleteInvoice } from '@/hooks/useInvoices';
import { CalendarDays, Trash2, CreditCard, MoreHorizontal, UserRound } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { getResponsibleShare, isResponsibleForInvoice } from '@/lib/responsible';

interface InvoiceListProps {
  invoices: InvoiceWithStatus[];
  onPayment: (invoice: InvoiceWithStatus) => void;
  onEdit: (invoice: InvoiceWithStatus) => void;
  filterCard: string;
  filterResponsible: string;
  viewMode?: 'list' | 'grid';
}

function formatCurrency(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function formatDate(dateStr: string) { return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR'); }

const statusClass: Record<InvoiceStatus, string> = {
  paid: 'status-paid', partial: 'status-partial', overdue: 'status-overdue', pending: 'status-pending',
};

export function InvoiceList({ invoices, onPayment, onEdit, filterCard, filterResponsible, viewMode = 'list' }: InvoiceListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteInvoice = useDeleteInvoice();

  const filtered = invoices.filter(inv => {
    if (filterCard !== 'all' && (inv.card || '') !== filterCard) return false;
    if (filterResponsible !== 'all' && !isResponsibleForInvoice(inv, filterResponsible)) return false;
    return true;
  });

  const handleDelete = async () => {
    if (deleteId) {
      try {
        const target = invoices.find(i => i.id === deleteId);
        const group = target?.installments && target.installments > 1 ? target.installmentGroup : undefined;
        await deleteInvoice.mutateAsync({ id: deleteId, installmentGroup: group });
        toast.success(group ? 'Todas as parcelas excluídas' : 'Fatura excluída');
      } catch { toast.error('Erro ao excluir'); }
      setDeleteId(null);
    }
  };

  if (filtered.length === 0) {
    return (<div className="glass-card p-12 text-center"><p className="text-muted-foreground">Nenhuma fatura encontrada</p></div>);
  }

  const isGrid = viewMode === 'grid';

  return (
    <>
      <div className={isGrid ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
        {filtered.map((inv, i) => {
          const progress = inv.totalAmount > 0 ? (inv.totalPaid / inv.totalAmount) * 100 : 0;
          const isOverdue = inv.status === 'overdue';

          if (isGrid) {
            return (
              <div
                key={inv.id}
                className="group relative glass-card p-5 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-fade-in flex flex-col overflow-hidden"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Status accent bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    inv.status === 'paid' ? 'bg-[hsl(var(--status-paid))]' :
                    inv.status === 'partial' ? 'bg-[hsl(var(--status-partial))]' :
                    inv.status === 'overdue' ? 'bg-[hsl(var(--status-overdue))]' :
                    'bg-[hsl(var(--status-pending))]'
                  }`}
                />

                {/* Header: status + menu */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border uppercase tracking-wide ${statusClass[inv.status]}`}>
                    {STATUS_LABELS[inv.status]}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 -mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {inv.status !== 'paid' && (<DropdownMenuItem onClick={() => onPayment(inv)}>Registrar Pagamento</DropdownMenuItem>)}
                      <DropdownMenuItem onClick={() => onEdit(inv)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(inv.id)}>Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Title + category */}
                <div className="mb-4">
                  <h3 className="font-semibold text-base leading-tight line-clamp-2 mb-1">{inv.description}</h3>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[inv.category]}</p>
                </div>

                {/* Big amount */}
                <div className="mb-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">Total</p>
                  <p className="font-mono text-2xl font-bold tracking-tight">{formatCurrency(inv.totalAmount)}</p>
                </div>

                {/* Paid / Remaining mini-grid */}
                <div className="grid grid-cols-2 gap-2 mb-3 p-2.5 rounded-lg bg-muted/40">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Pago</p>
                    <p className="font-mono text-sm font-semibold text-[hsl(var(--status-paid))]">{formatCurrency(inv.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Restante</p>
                    <p className={`font-mono text-sm font-semibold ${isOverdue ? 'text-[hsl(var(--status-overdue))]' : ''}`}>{formatCurrency(inv.remainingBalance)}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span className="uppercase tracking-wider font-medium">Progresso</span>
                    <span className="font-mono font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                {filterResponsible !== 'all' && (
                  <div className="mb-3 p-2 rounded-md bg-primary/10 border border-primary/20">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Repasse</p>
                    <p className="font-mono text-sm font-bold text-primary">{formatCurrency(getResponsibleShare(inv, filterResponsible))}</p>
                  </div>
                )}

                {/* Footer meta */}
                <div className="mt-auto pt-3 border-t border-border/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3 flex-shrink-0" />
                    <span>Vence em {formatDate(inv.dueDate)}</span>
                  </div>
                  {inv.card && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <CreditCard className="h-3 w-3 text-primary flex-shrink-0" />
                      <span className="text-foreground font-medium truncate">{inv.card}</span>
                      {inv.paymentMethod && <span className="text-muted-foreground">· {inv.paymentMethod}</span>}
                    </div>
                  )}
                  {!inv.card && inv.paymentMethod && (
                    <div className="text-xs text-muted-foreground">{inv.paymentMethod}</div>
                  )}
                  {inv.responsiblePerson && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <UserRound className="h-3 w-3 text-primary flex-shrink-0" />
                      <span className="text-foreground truncate">{inv.responsiblePerson}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={inv.id} className="glass-card p-4 hover:border-primary/20 transition-colors animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-sm truncate">{inv.description}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusClass[inv.status]}`}>{STATUS_LABELS[inv.status]}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span>{CATEGORY_LABELS[inv.category]}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDate(inv.dueDate)}</span>
                    {inv.card && (<span className="flex items-center gap-1 text-primary"><CreditCard className="h-3 w-3" />{inv.card}</span>)}
                    {inv.responsiblePerson && (<span className="flex items-center gap-1 text-primary"><UserRound className="h-3 w-3" />{inv.responsiblePerson}</span>)}
                    {inv.paymentMethod && (<span className="text-muted-foreground">{inv.paymentMethod}</span>)}
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div><span className="text-xs text-muted-foreground">Total</span><p className="font-mono text-sm font-semibold">{formatCurrency(inv.totalAmount)}</p></div>
                    <div><span className="text-xs text-muted-foreground">Pago</span><p className="font-mono text-sm font-medium text-status-paid">{formatCurrency(inv.totalPaid)}</p></div>
                    <div><span className="text-xs text-muted-foreground">Restante</span><p className={`font-mono text-sm font-medium ${isOverdue ? 'text-status-overdue' : ''}`}>{formatCurrency(inv.remainingBalance)}</p></div>
                    {filterResponsible !== 'all' && (<div><span className="text-xs text-muted-foreground">Repasse</span><p className="font-mono text-sm font-medium text-primary">{formatCurrency(getResponsibleShare(inv, filterResponsible))}</p></div>)}
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {inv.status !== 'paid' && (<DropdownMenuItem onClick={() => onPayment(inv)}>Registrar Pagamento</DropdownMenuItem>)}
                    <DropdownMenuItem onClick={() => onEdit(inv)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(inv.id)}>Excluir</DropdownMenuItem>
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
              {(() => {
                const target = invoices.find(i => i.id === deleteId);
                const isInstallment = target?.installments && target.installments > 1;
                return isInstallment
                  ? `Esta fatura é parcelada (${target.installments}x). Todas as parcelas e pagamentos vinculados serão excluídos. Esta ação não pode ser desfeita.`
                  : 'Esta ação não pode ser desfeita. Todos os pagamentos vinculados também serão removidos.';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground"><Trash2 className="h-4 w-4 mr-1" /> Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
