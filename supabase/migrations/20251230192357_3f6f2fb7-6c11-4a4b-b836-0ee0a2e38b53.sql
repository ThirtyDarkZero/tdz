-- Create a table to store virtual YouTube tracks for playlists
CREATE TABLE IF NOT EXISTS public.virtual_tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  youtube_id TEXT,
  thumbnail TEXT,
  duration INTEGER DEFAULT 0,
  source TEXT DEFAULT 'youtube',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.virtual_tracks ENABLE ROW LEVEL SECURITY;

-- Public read access for virtual tracks (they're just metadata)
CREATE POLICY "Anyone can read virtual tracks"
  ON public.virtual_tracks
  FOR SELECT
  USING (true);

-- Users can insert virtual tracks when adding to playlists
CREATE POLICY "Authenticated users can insert virtual tracks"
  ON public.virtual_tracks
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create a liked_tracks table for YouTube tracks and global library
CREATE TABLE IF NOT EXISTS public.liked_youtube_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  track_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  youtube_id TEXT,
  thumbnail TEXT,
  source TEXT DEFAULT 'youtube',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Enable RLS
ALTER TABLE public.liked_youtube_tracks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own liked YouTube tracks
CREATE POLICY "Users can view their own liked YouTube tracks"
  ON public.liked_youtube_tracks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own liked YouTube tracks
CREATE POLICY "Users can insert their own liked YouTube tracks"
  ON public.liked_youtube_tracks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own liked YouTube tracks
CREATE POLICY "Users can delete their own liked YouTube tracks"
  ON public.liked_youtube_tracks
  FOR DELETE
  USING (auth.uid() = user_id);