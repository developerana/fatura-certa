import { useState } from 'react';
import { InvoiceWithStatus } from '@/types/invoice';
import { useAddPayment } from '@/hooks/useInvoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { CurrencyInput, centsToReal, realToCents } from '@/components/CurrencyInput';
import { toast } from 'sonner';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceWithStatus | null;
}

function formatCurrency(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

export function PaymentDialog({ open, onOpenChange, invoice }: PaymentDialogProps) {
  const [amountCents, setAmountCents] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEarly, setIsEarly] = useState(false);
  const [notes, setNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const addPayment = useAddPayment();

  if (!invoice) return null;
  const maxAmount = invoice.remainingBalance;

  const handleSubmit = async () => {
    const parsedAmount = centsToReal(amountCents);
    if (parsedAmount <= 0) { toast.error('Informe um valor válido'); return; }
    if (parsedAmount > maxAmount) { toast.error(`Valor não pode exceder ${formatCurrency(maxAmount)}`); return; }
    if (!confirming) { setConfirming(true); return; }

    try {
      await addPayment.mutateAsync({ invoiceId: invoice.id, amount: parsedAmount, date, isEarly });
      toast.success(parsedAmount >= maxAmount ? 'Fatura paga integralmente!' : `Pagamento de ${formatCurrency(parsedAmount)} registrado`);
      setAmountCents(0); setDate(new Date().toISOString().split('T')[0]); setIsEarly(false); setNotes(''); setConfirming(false);
      onOpenChange(false);
    } catch { toast.error('Erro ao registrar pagamento'); setConfirming(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setConfirming(false); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>{invoice.description}</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-secondary/50 p-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Total da fatura</span><span className="font-mono font-semibold">{formatCurrency(invoice.totalAmount)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Já pago</span><span className="font-mono text-status-paid">{formatCurrency(invoice.totalPaid)}</span></div>
          <div className="flex justify-between border-t border-border pt-1"><span className="text-muted-foreground font-medium">Saldo restante</span><span className="font-mono font-bold">{formatCurrency(maxAmount)}</span></div>
        </div>
        {invoice.payments.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Histórico</span>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {invoice.payments.map(p => (
                <div key={p.id} className="flex justify-between text-xs bg-secondary/30 rounded px-2 py-1">
                  <span className="text-muted-foreground">{new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')}{p.isEarly && ' (antecipado)'}</span>
                  <span className="font-mono text-status-paid">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Valor do Pagamento *</Label>
              <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => { setAmountCents(realToCents(maxAmount)); setConfirming(false); }}>Pagar total</Button>
            </div>
            <CurrencyInput value={amountCents} onValueChange={(v) => { setAmountCents(v); setConfirming(false); }} />
          </div>
          <div><Label htmlFor="payDate">Data do Pagamento *</Label><Input id="payDate" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div className="flex items-center space-x-2">
            <Checkbox id="isEarly" checked={isEarly} onCheckedChange={(checked) => setIsEarly(checked === true)} />
            <Label htmlFor="isEarly" className="text-sm font-normal cursor-pointer">Pagamento antecipado</Label>
          </div>
          <div><Label htmlFor="payNotes">Observações</Label><Textarea id="payNotes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas..." maxLength={200} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSubmit} disabled={addPayment.isPending}>{confirming ? 'Confirmar Pagamento' : 'Registrar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
