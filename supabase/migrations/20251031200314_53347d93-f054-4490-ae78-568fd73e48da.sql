-- Create albums table
CREATE TABLE public.albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  cover_art_path TEXT,
  release_date DATE,
  genre TEXT,
  description TEXT,
  total_tracks INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tracks table
CREATE TABLE public.tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  track_number INTEGER,
  genre TEXT,
  mood TEXT,
  bpm INTEGER,
  key TEXT,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  waveform_data JSONB,
  ai_tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_path TEXT,
  is_public BOOLEAN DEFAULT false,
  is_collaborative BOOLEAN DEFAULT false,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_tracks junction table
CREATE TABLE public.playlist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(playlist_id, track_id)
);

-- Create user_library table for favorites and saved content
CREATE TABLE public.user_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
  library_type TEXT NOT NULL CHECK (library_type IN ('liked_track', 'saved_album', 'saved_playlist')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id, library_type),
  UNIQUE(user_id, album_id, library_type),
  UNIQUE(user_id, playlist_id, library_type)
);

-- Create listening_history table for analytics and recommendations
CREATE TABLE public.listening_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  play_duration INTEGER,
  completion_percentage INTEGER,
  device_type TEXT,
  location_data JSONB
);

-- Create artist_profiles table
CREATE TABLE public.artist_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  artist_name TEXT NOT NULL,
  bio TEXT,
  profile_image_path TEXT,
  banner_image_path TEXT,
  verified BOOLEAN DEFAULT false,
  monthly_listeners INTEGER DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for albums
CREATE POLICY "Users can view published albums or their own" ON public.albums
  FOR SELECT USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own albums" ON public.albums
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own albums" ON public.albums
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own albums" ON public.albums
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tracks
CREATE POLICY "Users can view published tracks or their own" ON public.tracks
  FOR SELECT USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own tracks" ON public.tracks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks" ON public.tracks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks" ON public.tracks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for playlists
CREATE POLICY "Users can view public playlists or their own" ON public.playlists
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists" ON public.playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists" ON public.playlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists" ON public.playlists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for playlist_tracks
CREATE POLICY "Users can view tracks in accessible playlists" ON public.playlist_tracks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND (playlists.is_public = true OR playlists.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add tracks to their playlists" ON public.playlist_tracks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tracks from their playlists" ON public.playlist_tracks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- RLS Policies for user_library
CREATE POLICY "Users can view their own library" ON public.user_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their library" ON public.user_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their library" ON public.user_library
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for listening_history
CREATE POLICY "Users can view their own history" ON public.listening_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own history" ON public.listening_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for artist_profiles
CREATE POLICY "Anyone can view artist profiles" ON public.artist_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can create their artist profile" ON public.artist_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their artist profile" ON public.artist_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('album-covers', 'album-covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('track-files', 'track-files', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('artist-images', 'artist-images', true);

-- Storage policies for album-covers
CREATE POLICY "Anyone can view album covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'album-covers');

CREATE POLICY "Users can upload album covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'album-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their album covers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'album-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for track-files
CREATE POLICY "Anyone can view track files" ON storage.objects
  FOR SELECT USING (bucket_id = 'track-files');

CREATE POLICY "Users can upload track files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'track-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for artist-images
CREATE POLICY "Anyone can view artist images" ON storage.objects
  FOR SELECT USING (bucket_id = 'artist-images');

CREATE POLICY "Users can upload artist images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artist-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Triggers for updated_at
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON public.albums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artist_profiles_updated_at BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_tracks_album_id ON public.tracks(album_id);
CREATE INDEX idx_tracks_user_id ON public.tracks(user_id);
CREATE INDEX idx_tracks_published ON public.tracks(is_published);
CREATE INDEX idx_albums_user_id ON public.albums(user_id);
CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_listening_history_user_id ON public.listening_history(user_id);
CREATE INDEX idx_listening_history_track_id ON public.listening_history(track_id);
CREATE INDEX idx_listening_history_played_at ON public.listening_history(played_at DESC);