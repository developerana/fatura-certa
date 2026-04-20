

## Conexão Automática de Faturas — Visão Geral

Hoje você cadastra cada fatura manualmente. Para automatizar, existem **3 caminhos viáveis** no Brasil — cada um com nível diferente de esforço, custo e cobertura.

---

### Opção A — Importação de Arquivo (OFX / CSV / Excel) ⭐ Recomendado para começar

**Como funciona:** Você baixa o extrato/fatura no app do banco (a maioria oferece export em OFX, CSV ou Excel) e arrasta o arquivo no sistema. Ele lê todas as transações, sugere categoria automaticamente e cria as faturas em lote.

- **Custo:** R$ 0 (sem APIs externas)
- **Esforço técnico:** Baixo
- **Cobertura:** Funciona com Nubank, Caixa, Mercado Pago, Itaú, BB, Bradesco, Santander, Inter, C6 — todos exportam OFX
- **Fricção do usuário:** ~30 segundos por mês por banco (baixar e arrastar)

### Opção B — Open Finance via Pluggy ou Belvo (conexão real-time)

**Como funciona:** O usuário faz login no banco dentro de um widget seguro, autoriza, e o sistema sincroniza faturas automaticamente todos os dias. Conexão verdadeiramente "automática".

- **Custo:** Pluggy ~R$ 0,50–2,00 por conta/mês após o free tier; Belvo similar. Ambos exigem cadastro como empresa/desenvolvedor
- **Esforço técnico:** Médio-alto (edge function + webhooks + tela de conexão)
- **Cobertura:** Excelente (todos bancos grandes BR)
- **Fricção do usuário:** Conecta uma vez, sincroniza pra sempre

### Opção C — Encaminhar email da fatura para um endereço único

**Como funciona:** Cada usuário recebe um email tipo `seu-id@faturas.app`. Você redireciona a fatura do banco para esse email; uma edge function lê o PDF/HTML, extrai os dados via IA (Lovable AI / Gemini) e cria as faturas.

- **Custo:** Baixo (Lovable AI já incluso; precisa serviço de email inbound como Resend Inbound ou CloudMailin ~R$ 0)
- **Esforço técnico:** Médio
- **Cobertura:** Qualquer banco que mande fatura por email
- **Fricção do usuário:** Configurar redirecionamento uma vez por banco

---

### Comparação rápida

```text
                   Custo    Esforço  Auto-sync  Cobertura
A) Importar OFX    Grátis   Baixo    Não        Alta
B) Open Finance    Pago     Alto     Sim        Altíssima
C) Email + IA      Quase 0  Médio    Sim*       Média
```
*depende de o banco enviar fatura por email

---

### Minha recomendação

**Começar pela Opção A (importação OFX/CSV)** — entrega 80% do valor com baixo custo e sem dependências externas. Depois, se quiser sincronização realmente automática, evoluir para a Opção B com Pluggy.

---

### Escopo proposto da Opção A (se aprovada)

**O que será construído:**
1. Botão **"Importar Fatura"** no header da página principal, ao lado de "Nova Fatura".
2. Modal de importação:
   - Drag-and-drop para arquivo `.ofx`, `.csv`, `.xls`, `.xlsx`
   - Preview da tabela com transações detectadas
   - Para cada linha: campos editáveis (descrição, valor, data, categoria, cartão)
   - Sugestão automática de categoria por palavras-chave (ex: "iFood" → delivery, "Posto" → combustível)
   - Sugestão automática de cartão pelo nome do arquivo / banco emissor
   - Checkbox para selecionar quais importar
   - Detecção de duplicatas (mesma data + valor + descrição já existente)
3. Botão final **"Importar X faturas"** que cria tudo em lote (reaproveita `useAddInvoice` em batch).

**Detalhes técnicos:**
- Parser OFX: biblioteca `ofx-js` (client-side, sem backend)
- Parser CSV/Excel: `papaparse` + `xlsx` (já comum no ecossistema)
- Categorização inteligente: dicionário local de palavras-chave → categoria, com fallback para Lovable AI (`google/gemini-2.5-flash-lite`) se a confiança for baixa
- Tudo client-side, sem custo de backend

**Memória a salvar:** nova feature `mem://features/importacao-faturas` documentando formatos suportados e fluxo.

---

### Próximo passo

Me diga **qual opção** você quer seguir (A, B ou C), ou se prefere uma combinação. Se escolher A, já posso implementar direto. Se escolher B (Pluggy/Belvo), você precisará criar conta no provedor e me passar a chave de API.

