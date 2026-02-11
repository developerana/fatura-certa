
ALTER TABLE public.invoices ADD COLUMN installments INTEGER DEFAULT 1;
ALTER TABLE public.invoices ADD COLUMN installment_number INTEGER DEFAULT 1;
ALTER TABLE public.invoices ADD COLUMN installment_group TEXT;
