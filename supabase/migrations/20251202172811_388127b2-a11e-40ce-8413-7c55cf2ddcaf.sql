-- Create artist_narrative table for storytelling studio
CREATE TABLE public.artist_narrative (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  narrative_arc TEXT,
  origin_story TEXT,
  defining_moment TEXT,
  current_chapter TEXT,
  future_vision TEXT,
  color_palette JSONB DEFAULT '[]'::jsonb,
  typography JSONB DEFAULT '{}'::jsonb,
  visual_style TEXT,
  narrative_strength INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_calendar table
CREATE TABLE public.content_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  platform TEXT,
  status TEXT DEFAULT 'scheduled',
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create listener_demographics table for tracking fan demographics
CREATE TABLE public.listener_demographics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  listener_id UUID,
  ip_address INET,
  city TEXT,
  region TEXT,
  country TEXT,
  country_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  track_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_library table
CREATE TABLE public.content_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT,
  thumbnail_path TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artist_narrative ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listener_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

-- Policies for artist_narrative
CREATE POLICY "Users can manage their own narrative"
ON public.artist_narrative FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for content_calendar
CREATE POLICY "Users can manage their own calendar"
ON public.content_calendar FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for listener_demographics
CREATE POLICY "Artists can view demographics for their tracks"
ON public.listener_demographics FOR SELECT
USING (auth.uid() = artist_id);

CREATE POLICY "System can insert demographics"
ON public.listener_demographics FOR INSERT
WITH CHECK (true);

-- Policies for content_library
CREATE POLICY "Users can manage their content library"
ON public.content_library FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_artist_narrative_updated_at
BEFORE UPDATE ON public.artist_narrative
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert real masterclass content
INSERT INTO public.master_classes (title, instructor, duration, level, price, topics, rating, enrolled, available, thumbnail)
VALUES
  ('TDZ Platform Masterclass: Complete Guide', 'TDZ Academy', '2h 30m', 'Beginner', 'Free', '["Platform Navigation", "Uploading Music", "Artist Profile Setup", "Analytics Dashboard", "Fan Engagement", "Monetization Basics"]', 4.9, 1250, true, '🎓'),
  ('Music Production Fundamentals', 'Grammy Winner Marcus Chen', '4h 15m', 'Beginner', '$49.99', '["DAW Setup", "Sound Design", "Mixing Basics", "EQ & Compression", "Arrangement", "Home Studio Setup"]', 4.8, 3420, true, '🎹'),
  ('Advanced Mixing & Mastering', 'Platinum Engineer Sarah Liu', '6h 45m', 'Advanced', '$99.99', '["Stem Mixing", "Dynamic Processing", "Spatial Audio", "Dolby Atmos", "Mastering Chain", "Reference Tracks"]', 4.9, 1890, true, '🎚️'),
  ('Building Your Fanbase from Zero', 'Artist Development Coach Jake Mills', '3h 20m', 'Intermediate', '$39.99', '["Social Strategy", "Content Calendar", "Email Marketing", "Fan Engagement", "Release Strategy", "Playlist Pitching"]', 4.7, 5670, true, '📈'),
  ('Music Business & Legal Essentials', 'Entertainment Lawyer Dr. Kim', '5h 00m', 'Intermediate', '$79.99', '["Copyright Basics", "Publishing Deals", "Sync Licensing", "Distribution Rights", "Contract Negotiation", "Royalty Streams"]', 4.8, 2340, true, '⚖️'),
  ('AI in Music Production', 'Tech Producer Nova', '2h 45m', 'Intermediate', '$59.99', '["AI Tools Overview", "AI-Assisted Mixing", "Lyric Generation", "Vocal Processing", "Sample Creation", "Workflow Integration"]', 4.6, 4120, true, '🤖'),
  ('Songwriting Masterclass', 'Hit Songwriter Maya Torres', '4h 30m', 'Beginner', '$44.99', '["Song Structure", "Melody Writing", "Lyric Craft", "Chord Progressions", "Hooks & Bridges", "Co-Writing Sessions"]', 4.9, 6780, true, '✍️'),
  ('Live Performance & Touring', 'Tour Manager Chris Evans', '3h 15m', 'Intermediate', '$54.99', '["Stage Presence", "Set Building", "Tour Planning", "Venue Relations", "Merch Strategy", "Fan Meetups"]', 4.7, 1560, true, '🎤');

-- Update momentum_scores to allow updates
CREATE POLICY "Users can update their own momentum scores"
ON public.momentum_scores FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);