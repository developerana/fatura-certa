import { useState } from 'react';
import { InvoiceWithStatus, STATUS_LABELS, InvoiceStatus } from '@/types/invoice';
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

          const statusStyles = {
            paid: { bar: 'bg-[hsl(var(--status-paid))]', soft: 'bg-[hsl(var(--status-paid))]/10', text: 'text-[hsl(var(--status-paid))]', border: 'border-[hsl(var(--status-paid))]/20' },
            partial: { bar: 'bg-[hsl(var(--status-partial))]', soft: 'bg-[hsl(var(--status-partial))]/10', text: 'text-[hsl(var(--status-partial))]', border: 'border-[hsl(var(--status-partial))]/20' },
            overdue: { bar: 'bg-[hsl(var(--status-overdue))]', soft: 'bg-[hsl(var(--status-overdue))]/10', text: 'text-[hsl(var(--status-overdue))]', border: 'border-[hsl(var(--status-overdue))]/20' },
            pending: { bar: 'bg-[hsl(var(--status-pending))]', soft: 'bg-[hsl(var(--status-pending))]/10', text: 'text-[hsl(var(--status-pending))]', border: 'border-[hsl(var(--status-pending))]/20' },
          }[inv.status];

          const initials = inv.description
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(w => w[0])
            .join('')
            .toUpperCase();

          return (
            <div
              key={inv.id}
              className="group relative glass-card hover:border-primary/40 hover:shadow-lg transition-all duration-200 animate-fade-in overflow-hidden"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* Status accent bar */}
              <div className={`absolute top-0 left-0 bottom-0 w-[3px] ${statusStyles.bar}`} />

              <div className="flex items-center gap-4 p-4 sm:p-5 pl-5 sm:pl-6">
                {/* Avatar circle */}
                <div className="relative flex-shrink-0">
                  <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center font-semibold text-sm ${statusStyles.soft} ${statusStyles.text} border ${statusStyles.border}`}>
                    {initials || '·'}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ${statusStyles.bar} ring-2 ring-background`} />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{inv.description}</h3>
                  </div>
                  <div className="flex items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground flex-wrap">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted text-foreground/70 font-medium text-[11px]">
                      {CATEGORY_LABELS[inv.category]}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(inv.dueDate)}
                    </span>
                    {inv.card && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-foreground/70">
                        <CreditCard className="h-3 w-3" />{inv.card}
                      </span>
                    )}
                    {inv.responsiblePerson && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                        <UserRound className="h-3 w-3" />{inv.responsiblePerson}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: amount + status (desktop) */}
                <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusStyles.soft} ${statusStyles.text}`}>
                    {STATUS_LABELS[inv.status]}
                  </span>
                  <p className="font-mono text-base sm:text-lg font-bold tracking-tight leading-none">
                    {formatCurrency(inv.totalAmount)}
                  </p>
                  {inv.remainingBalance > 0 && inv.totalPaid > 0 && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      restam {formatCurrency(inv.remainingBalance)}
                    </p>
                  )}
                  {filterResponsible !== 'all' && (
                    <p className="text-[10px] text-primary font-mono font-medium">
                      repasse {formatCurrency(getResponsibleShare(inv, filterResponsible))}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
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

              {/* Mobile amount row */}
              <div className="md:hidden flex items-center justify-between gap-2 px-4 sm:px-5 pl-5 sm:pl-6 pb-3 -mt-1">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusStyles.soft} ${statusStyles.text}`}>
                  {STATUS_LABELS[inv.status]}
                </span>
                <p className="font-mono text-base font-bold tracking-tight">{formatCurrency(inv.totalAmount)}</p>
              </div>

              {/* Progress footer */}
              <div className="border-t border-border/50 bg-muted/20 px-4 sm:px-5 pl-5 sm:pl-6 py-2.5 flex items-center gap-3">
                <div className="flex-1">
                  <Progress value={progress} className="h-1" />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-[hsl(var(--status-paid))] font-semibold">{formatCurrency(inv.totalPaid)}</span>
                  <span className="text-muted-foreground/50">/</span>
                  <span className="text-muted-foreground">{formatCurrency(inv.totalAmount)}</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-background text-foreground/70 font-semibold text-[10px]">
                    {Math.round(progress)}%
                  </span>
                </div>
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
