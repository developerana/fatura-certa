import { Receipt, CheckCircle2, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PreviewPanel({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <div className={mode === 'dark' ? 'dark' : ''}>
      <div className="bg-background text-foreground min-h-[600px] p-6 rounded-xl border border-border">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm rounded-lg mb-6">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Gerenciador</h1>
                <p className="text-xs text-muted-foreground">Fatura de Maio 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <CheckCircle2 className="h-4 w-4 mr-1" /> Pagar Mês
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Nova
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Fatura Total</p>
            <p className="text-2xl font-bold font-mono mt-2">R$ 4.250,00</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Pago</p>
            <p className="text-2xl font-bold font-mono mt-2 text-[hsl(var(--status-paid))]">R$ 2.100,00</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Pendente</p>
            <p className="text-2xl font-bold font-mono mt-2 text-[hsl(var(--status-pending))]">R$ 2.150,00</p>
          </div>
        </div>

        {/* Status badges */}
        <div className="mb-6 space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Status</p>
          <div className="flex flex-wrap gap-2">
            <span className="status-paid px-3 py-1 rounded-full text-xs border font-medium">Pago</span>
            <span className="status-partial px-3 py-1 rounded-full text-xs border font-medium">Parcial</span>
            <span className="status-overdue px-3 py-1 rounded-full text-xs border font-medium">Atrasado</span>
            <span className="status-pending px-3 py-1 rounded-full text-xs border font-medium">Pendente</span>
          </div>
        </div>

        {/* Invoice list */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Lançamentos</p>
          {[
            { desc: 'Mercado', card: 'Nubank', val: 'R$ 540,00', status: 'status-paid' },
            { desc: 'Streaming', card: 'Caixa', val: 'R$ 39,90', status: 'status-pending' },
            { desc: 'Combustível', card: 'Mercado Pago', val: 'R$ 220,00', status: 'status-overdue' },
          ].map((it, i) => (
            <div key={i} className="glass-card p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{it.desc}</p>
                <p className="text-xs text-muted-foreground">{it.card}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold">{it.val}</span>
                <span className={`${it.status} px-2 py-0.5 rounded-full text-[10px] border font-medium`}>
                  {it.status.replace('status-', '')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Inputs */}
        <div className="mt-6 space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Inputs</p>
          <input
            type="text"
            placeholder="Digite algo..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <Button variant="default" size="sm">Primário</Button>
            <Button variant="secondary" size="sm">Secundário</Button>
            <Button variant="outline" size="sm">Outline</Button>
            <Button variant="ghost" size="sm">Ghost</Button>
            <Button variant="destructive" size="sm">Destructive</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThemePreview() {
  return (
    <div className="min-h-screen bg-neutral-200 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-1 text-neutral-900">Prévia de Tema</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Comparação lado a lado — fundo escuro fixado em <code className="font-mono">#000000</code>.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold mb-2 text-neutral-700">☀️ Claro</p>
            <PreviewPanel mode="light" />
          </div>
          <div>
            <p className="text-sm font-semibold mb-2 text-neutral-700">🌙 Escuro (#000000)</p>
            <PreviewPanel mode="dark" />
          </div>
        </div>
      </div>
    </div>
  );
}
