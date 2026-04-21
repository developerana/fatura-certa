ALTER TABLE public.invoices
ADD COLUMN responsible_person TEXT;

CREATE INDEX idx_invoices_user_responsible_person
ON public.invoices (user_id, responsible_person)
WHERE responsible_person IS NOT NULL;