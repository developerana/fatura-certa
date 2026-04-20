import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Upload, FileWarning, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { parseFile, markDuplicates, dateToReferenceMonth, ParsedTransaction } from '@/lib/invoiceImport';
import { CATEGORY_LABELS, InvoiceCategory, getCardOptions } from '@/types/invoice';
import { useAddInvoice, useInvoicesWithStatus } from '@/hooks/useInvoices';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ImportInvoicesDialog({ open, onOpenChange }: Props) {
  const { data: existing = [] } = useInvoicesWithStatus();
  const addInvoice = useAddInvoice();
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [filename, setFilename] = useState<string>('');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const cardOptions = useMemo(() => getCardOptions(), []);

  const reset = () => {
    setTransactions([]);
    setFilename('');
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const { transactions: parsed } = await parseFile(file);
      if (parsed.length === 0) {
        toast.error('Nenhuma transação encontrada no arquivo.');
        return;
      }
      const withDups = markDuplicates(parsed, existing);
      setTransactions(withDups);
      setFilename(file.name);
      const dups = withDups.filter(t => t.isDuplicate).length;
      toast.success(`${parsed.length} transações encontradas${dups > 0 ? ` (${dups} duplicadas)` : ''}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Erro ao ler arquivo.');
    } finally {
      setParsing(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [existing]);

  const updateTx = (id: string, patch: Partial<ParsedTransaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const removeTx = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const selectedCount = transactions.filter(t => t.selected).length;

  const handleImport = async () => {
    const toImport = transactions.filter(t => t.selected);
    if (toImport.length === 0) {
      toast.error('Selecione ao menos uma transação.');
      return;
    }
    setImporting(true);
    try {
      // Sequential to avoid hammering the queue / preserve optimistic UI order
      for (const t of toImport) {
        await addInvoice.mutateAsync({
          description: t.description,
          category: t.category,
          totalAmount: t.amount,
          dueDate: t.date,
          referenceMonth: dateToReferenceMonth(t.date),
          card: t.card,
        });
      }
      toast.success(`${toImport.length} fatura(s) importada(s) com sucesso!`);
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao importar faturas.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Faturas</DialogTitle>
          <DialogDescription>
            Importe transações de extratos bancários (OFX, CSV, Excel). Os formatos OFX são exportados pelos apps Nubank, Caixa, Mercado Pago, Itaú, BB e outros.
          </DialogDescription>
        </DialogHeader>

        {transactions.length === 0 ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              'flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 transition-colors',
              dragOver ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            {parsing ? (
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground mb-3" />
            )}
            <p className="text-sm font-medium mb-1">
              {parsing ? 'Lendo arquivo...' : 'Arraste o arquivo ou clique para selecionar'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">Formatos: .ofx, .qfx, .csv, .xls, .xlsx</p>
            <Input
              type="file"
              accept=".ofx,.qfx,.csv,.xls,.xlsx"
              disabled={parsing}
              className="max-w-xs"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{filename}</Badge>
                <span className="text-muted-foreground">{selectedCount} de {transactions.length} selecionadas</span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>Trocar arquivo</Button>
            </div>

            <div className="overflow-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>
                    <th className="p-2 w-10">
                      <Checkbox
                        checked={selectedCount === transactions.length && transactions.length > 0}
                        onCheckedChange={(v) => setTransactions(prev => prev.map(t => ({ ...t, selected: !!v })))}
                      />
                    </th>
                    <th className="p-2 text-left">Data</th>
                    <th className="p-2 text-left">Descrição</th>
                    <th className="p-2 text-left">Valor</th>
                    <th className="p-2 text-left">Categoria</th>
                    <th className="p-2 text-left">Cartão</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} className={cn('border-t border-border', t.isDuplicate && 'bg-[hsl(var(--status-partial-bg))]')}>
                      <td className="p-2">
                        <Checkbox
                          checked={t.selected}
                          onCheckedChange={(v) => updateTx(t.id, { selected: !!v })}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="date"
                          value={t.date}
                          onChange={(e) => updateTx(t.id, { date: e.target.value })}
                          className="h-8 w-36"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={t.description}
                          onChange={(e) => updateTx(t.id, { description: e.target.value })}
                          className="h-8 min-w-[180px]"
                        />
                        {t.isDuplicate && (
                          <span className="text-[10px] text-[hsl(var(--status-partial))] flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3" /> Possível duplicata
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={t.amount}
                          onChange={(e) => updateTx(t.id, { amount: parseFloat(e.target.value) || 0 })}
                          className="h-8 w-24"
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={t.category}
                          onValueChange={(v) => updateTx(t.id, { category: v as InvoiceCategory })}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                              <SelectItem key={k} value={k}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Select
                          value={t.card || 'none'}
                          onValueChange={(v) => updateTx(t.id, { card: v === 'none' ? undefined : v })}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— Nenhum —</SelectItem>
                            {cardOptions.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeTx(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.some(t => t.isDuplicate) && (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <FileWarning className="h-4 w-4" />
                Duplicatas foram desmarcadas automaticamente. Marque-as caso queira importar mesmo assim.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>Cancelar</Button>
          <Button
            onClick={handleImport}
            disabled={importing || selectedCount === 0}
          >
            {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Importar {selectedCount > 0 ? `${selectedCount} fatura(s)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
