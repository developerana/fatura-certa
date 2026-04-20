# Memory: index.md
Updated: now

# Project Memory

## Core
Supabase with RLS for Auth and DB. Public sign-up disabled; admin only.
Offline-first (localStorage queue), PWA & Capacitor support.
React Query for caching, optimistic updates, and performance.
Dark theme (slate-950 bg), teal/emerald accents, glassmorphism UI.

## Memories
- [Payment Rules](mem://logic/regras-pagamento) — Total, partial, advance payments. Advance payments deduct from total.
- [Invoice Status Rules](mem://logic/status-fatura) — Dynamic calculation of Pending (Gray), Paid (Green), Partial (Yellow), Overdue (Red).
- [Credit Cards Management](mem://features/cartoes) — Dynamic cards (Caixa, Mercado Pago, Nubank default). Users can add new ones.
- [Dashboard Metrics](mem://features/dashboard) — Totals, charts, Total Debt, Financial Control Index.
- [Installments](mem://features/parcelamento) — 1-48x auto generation. Support for logging already started installments.
- [Mobile Responsiveness](mem://ui/responsividade) — Adaptive grids and font sizes optimized for screens down to 320px.
- [Batch Payments](mem://features/pagamento-em-lote) — "Pagar Mês" consolidates and pays all pending invoices for a reference month.
- [Categories](mem://features/categorias) — Pre-defined categories including "Setup" for computer/content.
- [Currency Input](mem://ui/input-moeda) — BRL mask (R$ 1.234,56), RTL input (calculator style).
- [Installment Deletion](mem://logic/exclusao-parcelada) — Deleting one installment deletes all linked installments in the group.
- [Payment Methods](mem://features/formas-pagamento) — Dynamic methods (PIX, Boleto, etc.). Users can create new ones.
- [Default Reference Month](mem://logic/mes-referencia-padrao) — Initial navigation defaults to the subsequent month.
- [Card Brand Colors](mem://style/cores-cartoes) — Nubank (Purple), Mercado Pago (Yellow), Caixa (Light Blue).
- [Card Expense Chart](mem://ui/grafico-cartoes) — Custom horizontal stacked bar chart for expenses per card.
- [Dynamic Category Filter](mem://ui/filtros-dinamicos) — Hides categories with no records in the invoice list.
- [Admin Panel](mem://auth/painel-admin) — User management, manual creation, deletion, password reset.
- [Admin Privacy](mem://auth/privacidade-admin) — Admins manage users but cannot read their financial data (RLS enforced).
- [Force Password Change](mem://auth/seguranca-senha) — Mandatory password change on first login or after admin reset.
- [Performance Guidelines](mem://tech/otimizacao-performance) — React Query cache, optimistic updates, batching.
- [Progressive Web App](mem://tech/pwa) — PWA manifest, service workers, Android/iOS install banners.
- [Offline Synchronization](mem://tech/sincronizacao-offline) — Offline-first, localStorage mutation queue syncs to Supabase when online.
- [Capacitor Native App](mem://tech/app-nativo) — 'Controle de Faturas' Capacitor setup for iOS/Android stores.
- [Invoice Import](mem://features/importacao-faturas) — Bulk import via OFX/CSV/XLSX with auto-categorization and duplicate detection.
