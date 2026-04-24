import { useState } from 'react';
import { useResponsibles, useAddResponsible, useDeleteResponsible } from '@/hooks/useResponsibles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Plus, Trash2, UserRound, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ResponsibleSelectProps {
  /** Comma separated list of selected names */
  value: string;
  onChange: (next: string) => void;
}

function parse(value: string): string[] {
  return value.split(',').map(s => s.trim()).filter(Boolean);
}
function stringify(items: string[]): string {
  return items.join(', ');
}

export function ResponsibleSelect({ value, onChange }: ResponsibleSelectProps) {
  const { data: responsibles = [], isLoading } = useResponsibles();
  const addResponsible = useAddResponsible();
  const deleteResponsible = useDeleteResponsible();

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const selected = parse(value);

  const toggle = (name: string) => {
    const exists = selected.some(s => s.toLowerCase() === name.toLowerCase());
    const next = exists
      ? selected.filter(s => s.toLowerCase() !== name.toLowerCase())
      : [...selected, name];
    onChange(stringify(next));
  };

  const removeChip = (name: string) => {
    onChange(stringify(selected.filter(s => s !== name)));
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (responsibles.some(r => r.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Já existe um responsável com esse nome');
      return;
    }
    try {
      await addResponsible.mutateAsync(trimmed);
      // auto-select the new one
      if (!selected.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
        onChange(stringify([...selected, trimmed]));
      }
      setNewName('');
      toast.success('Responsável adicionado');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao adicionar');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteResponsible.mutateAsync(id);
      // also remove from selection if present
      if (selected.some(s => s.toLowerCase() === name.toLowerCase())) {
        onChange(stringify(selected.filter(s => s.toLowerCase() !== name.toLowerCase())));
      }
      toast.success('Responsável removido');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full min-h-10 flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left',
              'hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring'
            )}
          >
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">Selecionar responsáveis...</span>
              ) : (
                selected.map(name => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    <UserRound className="h-3 w-3" />
                    {name}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); removeChip(name); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); removeChip(name); } }}
                      className="hover:text-destructive cursor-pointer ml-0.5"
                      aria-label={`Remover ${name}`}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </span>
                ))
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="max-h-56 overflow-y-auto py-1">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Carregando...</div>
            ) : responsibles.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum responsável cadastrado</div>
            ) : (
              responsibles.map(r => {
                const isSelected = selected.some(s => s.toLowerCase() === r.name.toLowerCase());
                return (
                  <div
                    key={r.id}
                    className="group flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm mx-1 cursor-pointer"
                    onClick={() => toggle(r.name)}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <div className={cn(
                        'h-4 w-4 rounded border flex items-center justify-center flex-shrink-0',
                        isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
                      )}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span>{r.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(r.id, r.name); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                      aria-label={`Excluir ${r.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t p-2 flex gap-1.5 bg-muted/30">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
              placeholder="Novo responsável"
              maxLength={60}
              className="h-8 text-sm"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={!newName.trim() || addResponsible.isPending}
              className="h-8 px-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
