
-- FIX 1: artist_contacts table for CSV import
CREATE TABLE IF NOT EXISTS public.artist_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  city TEXT,
  phone TEXT,
  source TEXT DEFAULT 'manual',
  tags TEXT[],
  subscribed BOOLEAN DEFAULT true,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, email)
);

ALTER TABLE public.artist_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists manage own contacts" ON public.artist_contacts
  FOR ALL USING (auth.uid() = artist_id);

-- FIX 3: upload_drafts table for state persistence
CREATE TABLE IF NOT EXISTS public.upload_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL UNIQUE,
  draft_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.upload_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artist owns draft" ON public.upload_drafts
  FOR ALL USING (auth.uid() = artist_id);

-- FIX 4: stream_events table for real-time analytics
CREATE TABLE IF NOT EXISTS public.stream_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID,
  artist_id UUID NOT NULL,
  listener_id UUID,
  session_id TEXT,
  country_code TEXT,
  city TEXT,
  region TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  device_type TEXT,
  platform TEXT DEFAULT 'web',
  duration_seconds INTEGER,
  streamed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_events_artist ON public.stream_events(artist_id, streamed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_events_track ON public.stream_events(track_id, streamed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_events_country ON public.stream_events(artist_id, country_code);

ALTER TABLE public.stream_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists see own streams" ON public.stream_events
  FOR SELECT USING (auth.uid() = artist_id);

CREATE POLICY "Anyone can insert streams" ON public.stream_events
  FOR INSERT WITH CHECK (true);

-- FIX 6: milestone_definitions + artist_milestones
CREATE TABLE IF NOT EXISTS public.milestone_definitions (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  threshold INTEGER,
  type TEXT,
  icon TEXT,
  card_color TEXT
);

CREATE TABLE IF NOT EXISTS public.artist_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL,
  milestone_id TEXT REFERENCES public.milestone_definitions(id),
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  play_count_at_time INTEGER,
  UNIQUE(artist_id, milestone_id)
);

ALTER TABLE public.milestone_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read milestones" ON public.milestone_definitions FOR SELECT USING (true);
CREATE POLICY "Artists see own milestones" ON public.artist_milestones FOR SELECT USING (auth.uid() = artist_id);
CREATE POLICY "System inserts milestones" ON public.artist_milestones FOR INSERT WITH CHECK (auth.uid() = artist_id);

-- Insert milestone definitions
INSERT INTO public.milestone_definitions VALUES
  ('plays_100',   '100 Streams',    'Your music has been streamed 100 times',    100,   'plays', '🎵', 'linear-gradient(135deg, #1a1a4e, #0d3b6e)'),
  ('plays_500',   '500 Streams',    'Half a thousand streams achieved',          500,   'plays', '🔥', 'linear-gradient(135deg, #4a0e2a, #8b1a4a)'),
  ('plays_1000',  '1K Streams',     'One thousand streams — you are rising',     1000,  'plays', '⭐', 'linear-gradient(135deg, #3d2200, #8b5e00)'),
  ('plays_5000',  '5K Streams',     'Five thousand streams. A movement begins',  5000,  'plays', '🚀', 'linear-gradient(135deg, #0a3322, #0d6e4e)'),
  ('plays_10000', '10K Streams',    'Ten thousand streams. You are an artist',   10000, 'plays', '💫', 'linear-gradient(135deg, #2d1a5e, #6b3fa0)'),
  ('plays_50000', '50K Streams',    'Fifty thousand. Legendary status',          50000, 'plays', '👑', 'linear-gradient(135deg, #7C2D12, #C2410C)'),
  ('follows_100', '100 Followers',  'One hundred fans following your journey',   100,   'followers', '❤️', 'linear-gradient(135deg, #1a0a0a, #3d1212)'),
  ('follows_1000','1K Followers',   'A thousand people believe in your music',   1000,  'followers', '🎤', 'linear-gradient(135deg, #0a3322, #0d6e4e)')
ON CONFLICT DO NOTHING;

-- FIX 11: artist_earnings_summary view
CREATE OR REPLACE VIEW public.artist_earnings_summary AS
SELECT
  artist_id,
  COUNT(*) AS total_streams,
  COUNT(*) AS total_earnings_dollars,
  COUNT(*) FILTER (WHERE streamed_at > NOW() - INTERVAL '7 days') AS streams_this_week,
  COUNT(*) FILTER (WHERE streamed_at > NOW() - INTERVAL '30 days') AS streams_this_month
FROM public.stream_events
GROUP BY artist_id;

-- Enable realtime for stream_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_events;
