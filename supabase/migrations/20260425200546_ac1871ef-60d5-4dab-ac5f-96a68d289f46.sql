ALTER TABLE public.injuries
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'moderate'
  CHECK (severity IN ('mild', 'moderate', 'severe'));