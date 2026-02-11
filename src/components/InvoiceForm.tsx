import { useState, useEffect } from 'react';
import { Invoice, InvoiceCategory, CATEGORY_LABELS, CARD_OPTIONS } from '@/types/invoice';
import { addInvoice, updateInvoice } from '@/store/invoiceStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editInvoice?: Invoice | null;
  defaultMonth: string;
}

export function InvoiceForm({ open, onOpenChange, onSaved, editInvoice, defaultMonth }: InvoiceFormProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<InvoiceCategory>('outros');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [referenceMonth, setReferenceMonth] = useState(defaultMonth);
  const [card, setCard] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

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
        setDescription('');
        setCategory('outros');
        setTotalAmount('');
        setDueDate('');
        setReferenceMonth(defaultMonth);
        setCard('');
        setPaymentMethod('');
        setNotes('');
      }
    }
  }, [open, editInvoice, defaultMonth]);

  const handleSubmit = (e: React.FormEvent) => {
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
      notes: notes.trim() || undefined,
    };

    if (editInvoice) {
      updateInvoice(editInvoice.id, data);
    } else {
      addInvoice(data);
    }

    onSaved();
    onOpenChange(false);
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
            <Input
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Conta de luz"
              maxLength={100}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as InvoiceCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Valor Total *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dueDate">Vencimento *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="refMonth">Mês Referência *</Label>
              <Input
                id="refMonth"
                type="month"
                value={referenceMonth}
                onChange={e => setReferenceMonth(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cartão</Label>
              <Select value={card || 'none'} onValueChange={(v) => setCard(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cartão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {CARD_OPTIONS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Input
                id="paymentMethod"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                placeholder="Ex: PIX, Boleto, Débito"
                maxLength={50}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas adicionais..."
              maxLength={500}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editInvoice ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
