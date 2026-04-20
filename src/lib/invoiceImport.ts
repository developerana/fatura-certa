import Papa from 'papaparse';
import * as XLSX from 'xlsx';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import ofxParser from 'node-ofx-parser';
import { InvoiceCategory, InvoiceWithStatus } from '@/types/invoice';

export interface ParsedTransaction {
  id: string; // local id
  description: string;
  amount: number; // always positive (expense)
  date: string; // YYYY-MM-DD
  category: InvoiceCategory;
  card?: string;
  selected: boolean;
  isDuplicate: boolean;
}

// Keyword → category mapping (lowercase)
const CATEGORY_KEYWORDS: Array<[RegExp, InvoiceCategory]> = [
  [/ifood|rappi|ubereats|uber\s*eats|james|99\s*food/i, 'delivery'],
  [/uber|99\s*pop|99\s*taxi|cabify|taxi|metro|metrô|onibus|ônibus|brt|cptm/i, 'transporte'],
  [/posto|shell|ipiranga|petrobras|br\s*mania|combust/i, 'combustivel'],
  [/estacion|zona\s*azul|estapar|multipark/i, 'estacionamento'],
  [/netflix|spotify|prime\s*video|disney|hbo|globoplay|deezer|youtube\s*premium|paramount|apple\s*tv/i, 'streaming'],
  [/mercado\s*livre|amazon|magalu|magazine|shopee|americanas|aliexpress/i, 'outros'],
  [/farmacia|farmácia|drogaria|drogasil|panvel|pacheco|raia/i, 'farmacia'],
  [/hospital|clinic|clínica|laboratorio|laboratório|medico|médico|dentista/i, 'saude'],
  [/academia|smartfit|bluefit|bodytech|crossfit|gym/i, 'academia'],
  [/escola|colegio|colégio|universidade|faculdade|curso|udemy|alura|coursera/i, 'educacao'],
  [/aluguel|imobiliária|imobiliaria/i, 'aluguel'],
  [/condom[ií]nio/i, 'condominio'],
  [/energia|enel|cemig|cpfl|copel|coelba|light|eletropaulo/i, 'energia'],
  [/sabesp|cedae|sanepar|copasa|caesb|embasa|agua|água/i, 'agua'],
  [/comgas|comgás|gas\s*natural|ultragaz|liquigas/i, 'gas'],
  [/vivo|claro|tim|oi(?!nk)|net\s*serv|sky|nextel/i, 'telefone'],
  [/internet|fibra|wifi|gvt|algar/i, 'internet'],
  [/seguro|porto\s*seguro|bradesco\s*seguros|sulamerica/i, 'seguro'],
  [/iptu/i, 'iptu'],
  [/ipva/i, 'ipva'],
  [/imposto|receita\s*federal|darf|das\b/i, 'impostos'],
  [/empresti|emprésti|crediario/i, 'emprestimo'],
  [/aplicação|aplicacao|investimento|tesouro|cdb|nubank\s*ger/i, 'investimento'],
  [/petshop|pet\s*shop|veterinari|veterinári/i, 'pet'],
  [/zara|renner|cea|c&a|riachuelo|hering|nike|adidas/i, 'vestuario'],
  [/cinema|teatro|show|ingresso|park|parque/i, 'lazer'],
  [/airbnb|booking|hotel|decolar|latam|gol|azul|cvc/i, 'viagem'],
  [/cabelo|salao|salão|barbearia|manicure|pedicure|spa/i, 'beleza'],
  [/supermerc|carrefour|extra|p[ãa]o\s*de\s*a[çc][úu]car|atacad[ãa]o|assa[íi]|sams\s*club|big|dia\b/i, 'supermercado'],
  [/restaurante|lanchonete|padaria|cafe|café|bar\s|burger|pizza/i, 'alimentacao'],
];

export function categorize(description: string): InvoiceCategory {
  for (const [regex, cat] of CATEGORY_KEYWORDS) {
    if (regex.test(description)) return cat;
  }
  return 'outros';
}

// Detect card from filename or transaction memo
export function detectCard(filename: string, sampleText?: string): string | undefined {
  const haystack = `${filename} ${sampleText || ''}`.toLowerCase();
  if (/nubank|nu\s*pagamentos/.test(haystack)) return 'Nubank';
  if (/mercado\s*pago|mercadopago|mpago/.test(haystack)) return 'Mercado Pago';
  if (/caixa|cef\b/.test(haystack)) return 'Caixa';
  return undefined;
}

function toIsoDate(value: string | number | Date): string {
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(value);
    if (d) {
      const m = String(d.m).padStart(2, '0');
      const day = String(d.d).padStart(2, '0');
      return `${d.y}-${m}-${day}`;
    }
  }
  const str = String(value).trim();
  // YYYYMMDD (OFX)
  const ofxMatch = str.match(/^(\d{4})(\d{2})(\d{2})/);
  if (ofxMatch) return `${ofxMatch[1]}-${ofxMatch[2]}-${ofxMatch[3]}`;
  // DD/MM/YYYY or DD-MM-YYYY
  const brMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (brMatch) {
    const yr = brMatch[3].length === 2 ? `20${brMatch[3]}` : brMatch[3];
    return `${yr}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`;
  }
  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  // Fallback
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
}

function parseAmount(value: string | number): number {
  if (typeof value === 'number') return Math.abs(value);
  const str = String(value).trim().replace(/[^\d,.\-]/g, '');
  // BR: 1.234,56 → 1234.56
  if (str.includes(',') && str.lastIndexOf(',') > str.lastIndexOf('.')) {
    return Math.abs(parseFloat(str.replace(/\./g, '').replace(',', '.'))) || 0;
  }
  return Math.abs(parseFloat(str)) || 0;
}

// ─── OFX ───
export async function parseOFX(text: string): Promise<Omit<ParsedTransaction, 'isDuplicate' | 'selected' | 'category'>[]> {
  const data = ofxParser.parse(text);
  const stmt = data?.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS
    ?? data?.OFX?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS;
  const list = stmt?.BANKTRANLIST?.STMTTRN;
  if (!list) return [];
  const transactions = Array.isArray(list) ? list : [list];
  return transactions
    .map((t: any) => {
      const amount = parseFloat(t.TRNAMT);
      // For card statements, expenses are negative; for bank, debits are negative.
      // We import only expenses (negative amounts) — flip sign.
      if (isNaN(amount) || amount >= 0) return null;
      return {
        id: crypto.randomUUID(),
        description: String(t.MEMO || t.NAME || 'Transação').trim(),
        amount: Math.abs(amount),
        date: toIsoDate(t.DTPOSTED),
      };
    })
    .filter(Boolean) as any[];
}

// ─── CSV ───
export async function parseCSV(text: string): Promise<Omit<ParsedTransaction, 'isDuplicate' | 'selected' | 'category'>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        try {
          const rows = result.data as Record<string, string>[];
          const out = rows.map((row) => {
            const keys = Object.keys(row);
            const dateKey = keys.find(k => /data|date/i.test(k));
            const descKey = keys.find(k => /descri[çc][ãa]o|description|hist[óo]rico|memo|estabelecimento|lan[çc]amento/i.test(k));
            const valueKey = keys.find(k => /valor|amount|montante/i.test(k));
            if (!dateKey || !descKey || !valueKey) return null;
            const amount = parseAmount(row[valueKey]);
            if (!amount) return null;
            // Skip income (positive in some bank exports, but heuristically, payments to card are positives)
            const raw = String(row[valueKey]);
            if (/^\s*\+/.test(raw)) return null;
            return {
              id: crypto.randomUUID(),
              description: String(row[descKey] || '').trim(),
              amount,
              date: toIsoDate(row[dateKey]),
            };
          }).filter(Boolean) as any[];
          resolve(out);
        } catch (e) {
          reject(e);
        }
      },
      error: reject,
    });
  });
}

// ─── XLSX ───
export async function parseXLSX(buffer: ArrayBuffer): Promise<Omit<ParsedTransaction, 'isDuplicate' | 'selected' | 'category'>[]> {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
  return rows.map((row) => {
    const keys = Object.keys(row);
    const dateKey = keys.find(k => /data|date/i.test(k));
    const descKey = keys.find(k => /descri[çc][ãa]o|description|hist[óo]rico|memo|estabelecimento|lan[çc]amento/i.test(k));
    const valueKey = keys.find(k => /valor|amount|montante/i.test(k));
    if (!dateKey || !descKey || !valueKey) return null;
    const amount = parseAmount(row[valueKey]);
    if (!amount) return null;
    return {
      id: crypto.randomUUID(),
      description: String(row[descKey] || '').trim(),
      amount,
      date: toIsoDate(row[dateKey]),
    };
  }).filter(Boolean) as any[];
}

// ─── Master parse ───
export async function parseFile(file: File): Promise<{ transactions: ParsedTransaction[]; detectedCard?: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  let raw: Omit<ParsedTransaction, 'isDuplicate' | 'selected' | 'category'>[] = [];
  let sampleText = '';

  if (ext === 'ofx' || ext === 'qfx') {
    const text = await file.text();
    sampleText = text.slice(0, 2000);
    raw = await parseOFX(text);
  } else if (ext === 'csv') {
    const text = await file.text();
    sampleText = text.slice(0, 2000);
    raw = await parseCSV(text);
  } else if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer();
    raw = await parseXLSX(buffer);
  } else {
    throw new Error('Formato não suportado. Use OFX, CSV, XLS ou XLSX.');
  }

  const detectedCard = detectCard(file.name, sampleText);

  const transactions: ParsedTransaction[] = raw.map(t => ({
    ...t,
    category: categorize(t.description),
    card: detectedCard,
    selected: true,
    isDuplicate: false,
  }));

  return { transactions, detectedCard };
}

// ─── Duplicate detection ───
export function markDuplicates(
  transactions: ParsedTransaction[],
  existing: InvoiceWithStatus[],
): ParsedTransaction[] {
  return transactions.map(t => {
    const isDup = existing.some(inv =>
      inv.dueDate === t.date &&
      Math.abs(inv.totalAmount - t.amount) < 0.01 &&
      inv.description.toLowerCase().trim() === t.description.toLowerCase().trim(),
    );
    return { ...t, isDuplicate: isDup, selected: !isDup };
  });
}

export function dateToReferenceMonth(date: string): string {
  const [y, m] = date.split('-');
  return `${y}-${m}`;
}
