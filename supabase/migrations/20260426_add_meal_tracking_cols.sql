-- Add columns for meal tracking and recipes
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS recipe TEXT,
ADD COLUMN IF NOT EXISTS ingredients JSONB,
ADD COLUMN IF NOT EXISTS is_planned BOOLEAN NOT NULL DEFAULT TRUE;

-- Add index to filter planned vs logged meals
CREATE INDEX IF NOT EXISTS meals_user_date_planned_idx ON public.meals (user_id, date, is_planned);
