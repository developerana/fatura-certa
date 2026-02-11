import { useState, useCallback } from 'react';
import { InvoiceWithStatus, InvoiceCategory, InvoiceStatus } from '@/types/invoice';
import { getInvoicesWithStatus } from '@/store/invoiceStore';
import { DashboardCards } from '@/components/DashboardCards';
import { CategoryChart } from '@/components/CategoryChart';
import { InvoiceList } from '@/components/InvoiceList';
import { InvoiceForm } from '@/components/InvoiceForm';
import { PaymentDialog } from '@/components/PaymentDialog';
import { FiltersBar } from '@/components/FiltersBar';
import { Button } from '@/components/ui/button';
import { Plus, Receipt } from 'lucide-react';

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month: string) {
  const [year, m] = month.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${months[parseInt(m) - 1]} ${year}`;
}

const Index = () => {
  const [referenceMonth, setReferenceMonth] = useState(getCurrentMonth());
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<InvoiceCategory | 'all'>('all');
  const [filterCard, setFilterCard] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<InvoiceWithStatus | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceWithStatus | null>(null);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  // Re-fetch on refreshKey change
  const allInvoices = getInvoicesWithStatus();
  const monthInvoices = allInvoices.filter(i => i.referenceMonth === referenceMonth);

  // Upcoming invoices (next 7 days, not paid)
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = allInvoices
    .filter(i => i.status !== 'paid' && new Date(i.dueDate) >= now && new Date(i.dueDate) <= in7Days)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const handleEdit = (inv: InvoiceWithStatus) => {
    setEditInvoice(inv);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background" key={refreshKey}>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Controle de Faturas</h1>
              <p className="text-xs text-muted-foreground">{formatMonthLabel(referenceMonth)}</p>
            </div>
          </div>
          <Button onClick={() => { setEditInvoice(null); setFormOpen(true); }} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Nova Fatura
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Cards */}
        <DashboardCards referenceMonth={referenceMonth} />

        {/* Chart + Upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoryChart referenceMonth={referenceMonth} />

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
              Próximos Vencimentos
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum vencimento nos próximos 7 dias</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(inv => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{inv.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Vence em {new Date(inv.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold flex-shrink-0 ml-3">
                      {inv.remainingBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters + Invoice List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold">Faturas</h2>
            <FiltersBar
              referenceMonth={referenceMonth}
              onMonthChange={setReferenceMonth}
              filterStatus={filterStatus}
              onStatusChange={setFilterStatus}
              filterCategory={filterCategory}
              onCategoryChange={setFilterCategory}
              filterCard={filterCard}
              onCardChange={setFilterCard}
            />
          </div>

          <InvoiceList
            invoices={monthInvoices}
            onPayment={setPaymentInvoice}
            onEdit={handleEdit}
            onRefresh={refresh}
            filterStatus={filterStatus}
            filterCategory={filterCategory}
            filterCard={filterCard}
          />
        </div>
      </main>

      {/* Dialogs */}
      <InvoiceForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditInvoice(null); }}
        onSaved={refresh}
        editInvoice={editInvoice}
        defaultMonth={referenceMonth}
      />

      <PaymentDialog
        open={!!paymentInvoice}
        onOpenChange={(v) => { if (!v) setPaymentInvoice(null); }}
        invoice={paymentInvoice}
        onSaved={refresh}
      />
    </div>
  );
};

export default Index;
