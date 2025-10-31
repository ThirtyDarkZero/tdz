-- Create characters table for multiple AI twin uploads
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Character',
  media_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Create policies for characters
CREATE POLICY "Users can view characters of their projects"
ON public.characters
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = characters.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create characters for their projects"
ON public.characters
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = characters.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update characters of their projects"
ON public.characters
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = characters.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete characters of their projects"
ON public.characters
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = characters.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_characters_project_id ON public.characters(project_id);

-- Create storage bucket for characters if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('characters', 'characters', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for characters bucket
CREATE POLICY "Users can view their project characters"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'characters' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their project characters"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'characters' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their project characters"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'characters' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their project characters"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'characters' AND
  auth.uid()::text = (storage.foldername(name))[1]
);