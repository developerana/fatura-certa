CREATE TABLE public.responsibles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.responsibles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own responsibles"
  ON public.responsibles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responsibles"
  ON public.responsibles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responsibles"
  ON public.responsibles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own responsibles"
  ON public.responsibles FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_responsibles_user ON public.responsibles(user_id);