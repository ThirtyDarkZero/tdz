-- Add AI twin support to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_twin_image_path TEXT;

-- Create storage bucket for AI twin images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-twins', 'ai-twins', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for AI twin images
CREATE POLICY "Users can upload their own AI twin images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ai-twins' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own AI twin images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ai-twins' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own AI twin images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'ai-twins' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own AI twin images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ai-twins' AND
  auth.uid()::text = (storage.foldername(name))[1]
);