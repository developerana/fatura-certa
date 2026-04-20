---
name: Importação de Faturas
description: Importação em lote de transações via OFX/CSV/XLSX com auto-categorização, detecção de cartão e duplicatas.
type: feature
---
Botão "Importar" no header abre `ImportInvoicesDialog`. Suporta OFX/QFX (node-ofx-parser), CSV (papaparse) e XLS/XLSX (xlsx). Apenas valores negativos (despesas) são considerados em OFX.

Auto-categorização por dicionário regex em `src/lib/invoiceImport.ts` (CATEGORY_KEYWORDS): iFood→delivery, Uber→transporte, Posto→combustível, Netflix→streaming, etc. Fallback: 'outros'.

Detecção de cartão pelo nome do arquivo / texto: Nubank, Mercado Pago, Caixa.

Duplicatas detectadas por data + valor + descrição idêntica em faturas existentes; marcadas amarelas e desmarcadas por padrão.

Preview editável (data, descrição, valor, categoria, cartão) com checkbox por linha. Importa em lote via `useAddInvoice` sequencialmente. `referenceMonth` derivado da data da transação.
