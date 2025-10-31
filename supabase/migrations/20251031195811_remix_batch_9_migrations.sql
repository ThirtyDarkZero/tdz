
-- Migration: 20251030213933
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

-- Migration: 20251030214030
-- Fix search path for security
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration: 20251030222406
-- Add video_provider column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS video_provider TEXT DEFAULT 'sora';

-- Migration: 20251030223638
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

-- Migration: 20251031133310
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

-- Migration: 20251031134944
-- B) Beat-accurate editing infrastructure
CREATE TABLE public.tempo_maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  bpm_points JSONB NOT NULL, -- [{time: number, bpm: number}]
  beat_grid JSONB NOT NULL, -- [{beat: number, time: number, frame: number}]
  time_signature TEXT NOT NULL DEFAULT '4/4',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- C) Lyric alignment system
CREATE TABLE public.lyric_alignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  start_time NUMERIC NOT NULL,
  end_time NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.95,
  phonemes JSONB, -- [{phoneme: string, start: number, end: number}]
  line_index INTEGER NOT NULL,
  word_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- D) Export tracking
CREATE TABLE public.exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('prores_4k', 'h265_9x16', 'preview_1080p')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  file_path TEXT,
  file_size_bytes BIGINT,
  duration_seconds NUMERIC,
  includes_otio BOOLEAN DEFAULT false,
  includes_edl BOOLEAN DEFAULT false,
  includes_xml BOOLEAN DEFAULT false,
  includes_captions BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- E) Production features

-- Resumable uploads
CREATE TABLE public.upload_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  chunk_size_bytes INTEGER NOT NULL DEFAULT 5242880, -- 5MB
  chunks_uploaded JSONB NOT NULL DEFAULT '[]'::jsonb, -- [chunk_index]
  total_chunks INTEGER NOT NULL,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Version snapshots
CREATE TABLE public.project_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot_data JSONB NOT NULL, -- Full project state
  scenes_snapshot JSONB NOT NULL, -- All scenes at this version
  characters_snapshot JSONB, -- All characters at this version
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, version_number)
);

-- Billing/credits
CREATE TABLE public.render_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL, -- positive for credits, negative for debits
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'render', 'refund', 'bonus')),
  reference_id UUID, -- scene_id or export_id
  reference_type TEXT CHECK (reference_type IN ('scene_render', 'export', 'purchase')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Health monitoring
CREATE TABLE public.provider_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL CHECK (provider_name IN ('sora', 'runway', 'kling', 'veo')),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  error_count_1h INTEGER NOT NULL DEFAULT 0,
  success_count_1h INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER,
  last_error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_name)
);

-- Enable RLS on all new tables
ALTER TABLE public.tempo_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lyric_alignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tempo_maps
CREATE POLICY "Users can view tempo maps of their projects"
ON public.tempo_maps FOR SELECT
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = tempo_maps.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create tempo maps for their projects"
ON public.tempo_maps FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = tempo_maps.project_id AND projects.user_id = auth.uid()));

-- RLS Policies for lyric_alignments
CREATE POLICY "Users can view lyric alignments of their projects"
ON public.lyric_alignments FOR SELECT
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = lyric_alignments.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create lyric alignments for their projects"
ON public.lyric_alignments FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = lyric_alignments.project_id AND projects.user_id = auth.uid()));

-- RLS Policies for exports
CREATE POLICY "Users can view their exports"
ON public.exports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their exports"
ON public.exports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their exports"
ON public.exports FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for upload_sessions
CREATE POLICY "Users can view their upload sessions"
ON public.upload_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their upload sessions"
ON public.upload_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their upload sessions"
ON public.upload_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for project_versions
CREATE POLICY "Users can view versions of their projects"
ON public.project_versions FOR SELECT
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_versions.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create versions for their projects"
ON public.project_versions FOR INSERT
WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_versions.project_id AND projects.user_id = auth.uid()));

-- RLS Policies for render_credits
CREATE POLICY "Users can view their own credits"
ON public.render_credits FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy for provider_health (public read)
CREATE POLICY "Anyone can view provider health"
ON public.provider_health FOR SELECT
USING (true);

-- Indexes for performance
CREATE INDEX idx_tempo_maps_project_id ON public.tempo_maps(project_id);
CREATE INDEX idx_lyric_alignments_project_id ON public.lyric_alignments(project_id);
CREATE INDEX idx_lyric_alignments_timing ON public.lyric_alignments(start_time, end_time);
CREATE INDEX idx_exports_project_user ON public.exports(project_id, user_id);
CREATE INDEX idx_exports_status ON public.exports(status) WHERE status != 'completed';
CREATE INDEX idx_upload_sessions_user ON public.upload_sessions(user_id, status);
CREATE INDEX idx_project_versions_project ON public.project_versions(project_id, version_number DESC);
CREATE INDEX idx_credit_transactions_user ON public.credit_transactions(user_id, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_upload_sessions_updated_at
BEFORE UPDATE ON public.upload_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_render_credits_updated_at
BEFORE UPDATE ON public.render_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251031135139
-- Atomic credit deduction function
CREATE OR REPLACE FUNCTION public.deduct_render_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reference_id UUID,
  p_reference_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get or create user credits record
  INSERT INTO public.render_credits (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock the row and get current balance
  SELECT balance INTO v_current_balance
  FROM public.render_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient credits: have %, need %', v_current_balance, p_amount;
  END IF;

  -- Deduct credits
  v_new_balance := v_current_balance - p_amount;

  UPDATE public.render_credits
  SET 
    balance = v_new_balance,
    total_spent = total_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    reference_id,
    reference_type,
    status
  ) VALUES (
    p_user_id,
    -p_amount,
    'render',
    p_reference_id,
    p_reference_type,
    'completed'
  );

  RETURN v_new_balance;
END;
$$;

-- Migration: 20251031184402
-- Add unique constraint on project_id for tempo_maps table
ALTER TABLE tempo_maps ADD CONSTRAINT tempo_maps_project_id_key UNIQUE (project_id);

-- Migration: 20251031184643
-- Make audio-files bucket public so audio can be played
UPDATE storage.buckets 
SET public = true 
WHERE id = 'audio-files';
