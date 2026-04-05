
-- Create curated_playlists table
CREATE TABLE public.curated_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  youtube_playlist_id TEXT NOT NULL UNIQUE,
  genre TEXT,
  cover_url TEXT,
  tracks JSONB DEFAULT '[]'::jsonb,
  track_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.curated_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Curated playlists are viewable by everyone"
ON public.curated_playlists FOR SELECT USING (true);

-- Add demographic columns to listener_profiles
ALTER TABLE public.listener_profiles
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS discovery_source TEXT;
