import { useState } from 'react';
import { InvoiceWithStatus } from '@/types/invoice';
import { useAddPaymentsBatch } from '@/hooks/useInvoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

interface PayAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: InvoiceWithStatus[];
  referenceMonth: string;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function PayAllDialog({ open, onOpenChange, invoices, referenceMonth }: PayAllDialogProps) {
  const unpaid = invoices.filter(i => i.referenceMonth === referenceMonth && i.status !== 'paid');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isEarly, setIsEarly] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const addPaymentsBatch = useAddPaymentsBatch();

  const totalToPay = unpaid.reduce((sum, i) => sum + i.remainingBalance, 0);

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setDate(new Date().toISOString().split('T')[0]);
      setIsEarly(false);
      setConfirming(false);
    }
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (unpaid.length === 0) return;
    if (!confirming) { setConfirming(true); return; }

    try {
      // Single batch insert instead of sequential mutations
      await addPaymentsBatch.mutateAsync(
        unpaid.map(inv => ({
          invoiceId: inv.id,
          amount: inv.remainingBalance,
          date,
          isEarly,
        }))
      );
      toast.success(`${unpaid.length} fatura(s) pagas com sucesso!`);
      onOpenChange(false);
    } catch {
      toast.error('Erro ao registrar pagamentos');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Pagar Todas do Mês
          </DialogTitle>
          <DialogDescription>
            Quitar todas as faturas pendentes de uma vez.
          </DialogDescription>
        </DialogHeader>

        {unpaid.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Todas as faturas deste mês já estão pagas! 🎉
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Faturas pendentes</span>
                <span className="font-semibold">{unpaid.length}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="font-medium">Total a pagar</span>
                <span className="font-mono font-bold text-lg">{formatCurrency(totalToPay)}</span>
              </div>
            </div>

            <div className="max-h-32 overflow-y-auto space-y-1 text-xs text-muted-foreground">
              {unpaid.map(inv => (
                <div key={inv.id} className="flex justify-between bg-secondary/30 rounded px-2 py-1">
                  <span className="truncate mr-2">{inv.description}</span>
                  <span className="font-mono flex-shrink-0">{formatCurrency(inv.remainingBalance)}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="payAllDate">Data do Pagamento</Label>
                <Input
                  id="payAllDate"
                  type="date"
                  value={date}
                  onChange={e => { setDate(e.target.value); setConfirming(false); }}
                />
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="payAllEarly"
                    checked={isEarly}
                    onCheckedChange={(checked) => setIsEarly(checked === true)}
                  />
                  <Label htmlFor="payAllEarly" className="text-sm font-normal cursor-pointer">
                    Antecipado
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {unpaid.length > 0 && (
            <Button type="button" onClick={handleSubmit} disabled={addPaymentsBatch.isPending}>
              {addPaymentsBatch.isPending ? 'Processando...' : confirming ? `Confirmar ${formatCurrency(totalToPay)}` : `Pagar Tudo`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
