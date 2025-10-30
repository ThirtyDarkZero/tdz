-- Add video_provider column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS video_provider TEXT DEFAULT 'sora';