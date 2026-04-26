-- Add macro target columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS target_calories NUMERIC,
ADD COLUMN IF NOT EXISTS target_protein_g NUMERIC,
ADD COLUMN IF NOT EXISTS target_carbs_g NUMERIC,
ADD COLUMN IF NOT EXISTS target_fat_g NUMERIC;
