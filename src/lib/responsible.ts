import { InvoiceWithStatus } from '@/types/invoice';

export function parseResponsiblePeople(value?: string | null): string[] {
  if (!value) return [];

  return value
    .split(/[,;]+/)
    .map(name => name.trim())
    .filter(Boolean);
}

export function isResponsibleForInvoice(invoice: InvoiceWithStatus, responsible: string): boolean {
  return parseResponsiblePeople(invoice.responsiblePerson).includes(responsible);
}

export function getResponsibleShare(invoice: InvoiceWithStatus, responsible: string): number {
  const people = parseResponsiblePeople(invoice.responsiblePerson);
  if (!people.includes(responsible)) return 0;
  return invoice.remainingBalance / people.length;
}

export function getUniqueResponsiblePeople(invoices: InvoiceWithStatus[]): string[] {
  return [...new Set(invoices.flatMap(invoice => parseResponsiblePeople(invoice.responsiblePerson)))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}