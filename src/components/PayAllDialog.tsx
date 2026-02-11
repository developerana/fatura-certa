import { useState } from 'react';
import { InvoiceWithStatus } from '@/types/invoice';
import { useAddPayment } from '@/hooks/useInvoices';
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
  const [selected, setSelected] = useState<Set<string>>(() => new Set(unpaid.map(i => i.id)));
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isEarly, setIsEarly] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [processing, setProcessing] = useState(false);
  const addPayment = useAddPayment();

  // Initialize selection when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setSelected(new Set(unpaid.map(i => i.id)));
      setDate(new Date().toISOString().split('T')[0]);
      setIsEarly(false);
      setConfirming(false);
    }
    onOpenChange(v);
  };

  const toggleInvoice = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirming(false);
  };

  const toggleAll = () => {
    if (selected.size === unpaid.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unpaid.map(i => i.id)));
    }
    setConfirming(false);
  };

  const selectedInvoices = unpaid.filter(i => selected.has(i.id));
  const totalToPay = selectedInvoices.reduce((sum, i) => sum + i.remainingBalance, 0);

  const handleSubmit = async () => {
    if (selectedInvoices.length === 0) {
      toast.error('Selecione ao menos uma fatura');
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setProcessing(true);
    try {
      for (const inv of selectedInvoices) {
        await addPayment.mutateAsync({
          invoiceId: inv.id,
          amount: inv.remainingBalance,
          date,
          isEarly,
        });
      }
      toast.success(`${selectedInvoices.length} fatura(s) pagas com sucesso!`);
      onOpenChange(false);
    } catch {
      toast.error('Erro ao registrar pagamentos');
    } finally {
      setProcessing(false);
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Pagar Faturas do Mês
          </DialogTitle>
          <DialogDescription>
            Selecione as faturas que deseja quitar integralmente.
          </DialogDescription>
        </DialogHeader>

        {unpaid.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Todas as faturas deste mês já estão pagas! 🎉
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-primary hover:underline"
              >
                {selected.size === unpaid.length ? 'Desmarcar todas' : 'Selecionar todas'}
              </button>
              <span className="text-xs text-muted-foreground">
                {selected.size} de {unpaid.length} selecionadas
              </span>
            </div>

            <div className="overflow-y-auto max-h-48 space-y-1 border rounded-lg p-2">
              {unpaid.map(inv => (
                <label
                  key={inv.id}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors text-sm ${
                    selected.has(inv.id) ? 'bg-primary/10' : 'hover:bg-secondary/50'
                  }`}
                >
                  <Checkbox
                    checked={selected.has(inv.id)}
                    onCheckedChange={() => toggleInvoice(inv.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{inv.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Vence: {new Date(inv.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold flex-shrink-0">
                    {formatCurrency(inv.remainingBalance)}
                  </span>
                </label>
              ))}
            </div>

            <div className="rounded-lg bg-secondary/50 p-3 flex justify-between items-center text-sm">
              <span className="font-medium">Total a pagar</span>
              <span className="font-mono font-bold text-base">{formatCurrency(totalToPay)}</span>
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
          </>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {unpaid.length > 0 && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={processing || selected.size === 0}
            >
              {processing
                ? 'Processando...'
                : confirming
                ? `Confirmar ${selected.size} pagamento(s)`
                : `Pagar ${selected.size} fatura(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
