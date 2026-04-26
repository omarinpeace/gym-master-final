-- Add progress photos table
CREATE TABLE public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own photos all" ON public.progress_photos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add equipment to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS equipment TEXT[] DEFAULT '{}';

-- Storage for progress photos
INSERT INTO storage.buckets (id, name, public) VALUES ('progress', 'progress', false);

CREATE POLICY "own progress read" ON storage.objects FOR SELECT
  USING (bucket_id = 'progress' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own progress insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'progress' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own progress delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'progress' AND auth.uid()::text = (storage.foldername(name))[1]);
