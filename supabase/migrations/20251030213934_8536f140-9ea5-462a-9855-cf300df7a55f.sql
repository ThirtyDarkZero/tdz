-- Enable storage for audio files and generated videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-files', 'audio-files', false),
       ('generated-videos', 'generated-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  audio_file_path TEXT,
  lyrics TEXT,
  bpm INTEGER,
  tempo_map JSONB,
  mood TEXT,
  style_preset TEXT DEFAULT 'Golden Hour',
  emotion_intensity INTEGER DEFAULT 70,
  camera_motion INTEGER DEFAULT 50,
  fantasy_realism INTEGER DEFAULT 60,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scenes table
CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_order INTEGER NOT NULL,
  scene_type TEXT NOT NULL,
  start_time NUMERIC NOT NULL,
  end_time NUMERIC NOT NULL,
  description TEXT NOT NULL,
  mood TEXT NOT NULL,
  intensity INTEGER NOT NULL,
  camera_preset TEXT,
  generated_video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for scenes
CREATE POLICY "Users can view scenes of their projects"
  ON public.scenes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = scenes.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scenes for their projects"
  ON public.scenes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = scenes.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scenes of their projects"
  ON public.scenes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = scenes.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scenes of their projects"
  ON public.scenes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = scenes.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Storage policies for audio files
CREATE POLICY "Users can upload their own audio files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own audio files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for generated videos (public)
CREATE POLICY "Anyone can view generated videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-videos');

CREATE POLICY "Authenticated users can upload generated videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'generated-videos' AND auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON public.scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_order ON public.scenes(project_id, scene_order);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();