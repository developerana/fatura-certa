import { useState, useEffect } from 'react';
import { Invoice, InvoiceCategory, CATEGORY_LABELS, getCardOptions, addCardOption } from '@/types/invoice';
import { useAddInvoice, useUpdateInvoice } from '@/hooks/useInvoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editInvoice?: Invoice | null;
  defaultMonth: string;
}

export function InvoiceForm({ open, onOpenChange, editInvoice, defaultMonth }: InvoiceFormProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<InvoiceCategory>('outros');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [referenceMonth, setReferenceMonth] = useState(defaultMonth);
  const [card, setCard] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [installments, setInstallments] = useState('1');
  const [showCustomCard, setShowCustomCard] = useState(false);
  const [customCard, setCustomCard] = useState('');

  const addInvoice = useAddInvoice();
  const updateInvoice = useUpdateInvoice();

  useEffect(() => {
    if (open) {
      if (editInvoice) {
        setDescription(editInvoice.description);
        setCategory(editInvoice.category);
        setTotalAmount(editInvoice.totalAmount.toString());
        setDueDate(editInvoice.dueDate);
        setReferenceMonth(editInvoice.referenceMonth);
        setCard(editInvoice.card || '');
        setPaymentMethod(editInvoice.paymentMethod || '');
        setNotes(editInvoice.notes || '');
      } else {
        setDescription(''); setCategory('outros'); setTotalAmount(''); setDueDate('');
        setReferenceMonth(defaultMonth); setCard(''); setPaymentMethod(''); setNotes(''); setInstallments('1');
      }
    }
  }, [open, editInvoice, defaultMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(totalAmount);
    if (!description.trim() || isNaN(amount) || amount <= 0 || !dueDate || !referenceMonth) return;

    const data = {
      description: description.trim(),
      category,
      totalAmount: amount,
      dueDate,
      referenceMonth,
      card: card || undefined,
      paymentMethod: paymentMethod.trim() || undefined,
      installments: parseInt(installments) || 1,
    };

    try {
      if (editInvoice) {
        await updateInvoice.mutateAsync({ id: editInvoice.id, data });
        toast.success('Fatura atualizada!');
      } else {
        await addInvoice.mutateAsync(data);
        const n = data.installments;
        toast.success(n > 1 ? `${n} parcelas cadastradas!` : 'Fatura cadastrada!');
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editInvoice ? 'Editar Fatura' : 'Nova Fatura'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Conta de luz" maxLength={100} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as InvoiceCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Valor Total *</Label>
              <Input id="amount" type="number" step="0.01" min="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0,00" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="dueDate">Vencimento *</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="refMonth">Mês Ref. *</Label>
              <Input id="refMonth" type="month" value={referenceMonth} onChange={e => setReferenceMonth(e.target.value)} required />
            </div>
            {!editInvoice && (
              <div>
                <Label htmlFor="installments">Parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  min="1"
                  max="48"
                  value={installments}
                  onChange={e => setInstallments(e.target.value)}
                  placeholder="1"
                />
                {parseInt(installments) > 1 && totalAmount && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {parseInt(installments)}x de {(parseFloat(totalAmount) / parseInt(installments)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cartão</Label>
              <Select value={card || 'none'} onValueChange={(v) => { if (v === 'custom') { setShowCustomCard(true); } else { setCard(v === 'none' ? '' : v); } }}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione o cartão" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {getCardOptions().map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  <SelectItem value="custom">+ Adicionar cartão</SelectItem>
                </SelectContent>
              </Select>
              {showCustomCard && (
                <div className="flex gap-2 mt-2">
                  <Input value={customCard} onChange={e => setCustomCard(e.target.value)} placeholder="Nome do cartão" maxLength={30} className="flex-1" />
                  <Button type="button" size="sm" onClick={() => { if (customCard.trim()) { addCardOption(customCard.trim()); setCard(customCard.trim()); setCustomCard(''); setShowCustomCard(false); } }}>OK</Button>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Input id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} placeholder="Ex: PIX, Boleto, Débito" maxLength={50} />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas adicionais..." maxLength={500} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={addInvoice.isPending || updateInvoice.isPending}>
              {addInvoice.isPending || updateInvoice.isPending ? 'Salvando...' : editInvoice ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
