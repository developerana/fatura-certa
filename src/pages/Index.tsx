import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceWithStatus, InvoiceCategory, InvoiceStatus } from '@/types/invoice';
import { useInvoicesWithStatus } from '@/hooks/useInvoices';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { DashboardCards } from '@/components/DashboardCards';
import { CardChart } from '@/components/CardChart';
import { CardTotalCard } from '@/components/CardTotalCard';
import { InvoiceList } from '@/components/InvoiceList';
import { InvoiceForm } from '@/components/InvoiceForm';
import { PaymentDialog } from '@/components/PaymentDialog';
import { PayAllDialog } from '@/components/PayAllDialog';
import { ImportInvoicesDialog } from '@/components/ImportInvoicesDialog';
import { FiltersBar } from '@/components/FiltersBar';
import { Button } from '@/components/ui/button';
import { Plus, Receipt, LogOut, CheckCircle2, Users, UserCircle, Upload, UserRound, LayoutGrid, List } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getResponsibleShare, getUniqueResponsiblePeople, isResponsibleForInvoice } from '@/lib/responsible';

function getCurrentMonth() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
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
  const { signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { data: allInvoices = [], isLoading } = useInvoicesWithStatus();
  const [referenceMonth, setReferenceMonth] = useState(getCurrentMonth());
  const [filterCard, setFilterCard] = useState('all');
  const [filterResponsible, setFilterResponsible] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<InvoiceWithStatus | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceWithStatus | null>(null);
  const [payAllOpen, setPayAllOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const monthInvoices = allInvoices.filter(i => i.referenceMonth === referenceMonth);
  const availableCategories = [...new Set(allInvoices.map(i => i.category))];
  const availableResponsibles = getUniqueResponsiblePeople(allInvoices);
  const responsibleInvoices = filterResponsible === 'all'
    ? []
    : monthInvoices.filter(i => isResponsibleForInvoice(i, filterResponsible));
  const responsibleTotal = responsibleInvoices.reduce((sum, i) => sum + getResponsibleShare(i, filterResponsible), 0);

  const handleEdit = (inv: InvoiceWithStatus) => {
    setEditInvoice(inv);
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando faturas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold tracking-tight truncate">Gerenciador</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Fatura de {formatMonthLabel(referenceMonth)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <ThemeToggle />
            {isAdmin && (
              <Button onClick={() => navigate('/admin')} size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
                <Users className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Usuários</span>
              </Button>
            )}
            <Button onClick={() => setPayAllOpen(true)} size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
              <CheckCircle2 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Pagar Mês</span>
            </Button>
            <Button onClick={() => setImportOpen(true)} size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
              <Upload className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Importar</span>
            </Button>
            <Button onClick={() => { setEditInvoice(null); setFormOpen(true); }} size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
              <Plus className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Nova Fatura</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} title="Perfil">
              <UserCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <DashboardCards referenceMonth={referenceMonth} invoices={allInvoices} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <CardChart referenceMonth={referenceMonth} invoices={allInvoices} />
          <CardTotalCard referenceMonth={referenceMonth} invoices={allInvoices} filterCard={filterCard} />
        </div>

        {filterResponsible !== 'all' && (
          <div className="glass-card p-4 sm:p-5 border border-primary/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">
                Repasse de {filterResponsible}
              </span>
              <UserRound className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-primary">
              {responsibleTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {responsibleInvoices.length} {responsibleInvoices.length === 1 ? 'fatura pendente' : 'faturas pendentes'} no mês
            </p>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold">Lançamentos na Fatura</h2>
            <FiltersBar
              referenceMonth={referenceMonth}
              onMonthChange={setReferenceMonth}
              filterCard={filterCard}
              onCardChange={setFilterCard}
              filterResponsible={filterResponsible}
              onResponsibleChange={setFilterResponsible}
              availableResponsibles={availableResponsibles}
            />
          </div>

          <InvoiceList
            invoices={monthInvoices}
            onPayment={setPaymentInvoice}
            onEdit={handleEdit}
            filterCard={filterCard}
            filterResponsible={filterResponsible}
          />
        </div>
      </main>

      <InvoiceForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditInvoice(null); }}
        editInvoice={editInvoice}
        defaultMonth={referenceMonth}
      />

      <PaymentDialog
        open={!!paymentInvoice}
        onOpenChange={(v) => { if (!v) setPaymentInvoice(null); }}
        invoice={paymentInvoice}
      />

      <PayAllDialog
        open={payAllOpen}
        onOpenChange={setPayAllOpen}
        invoices={allInvoices}
        referenceMonth={referenceMonth}
      />

      <ImportInvoicesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
};

export default Index;
