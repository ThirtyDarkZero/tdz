
-- Artist Tips table for tip jar monetization
CREATE TABLE public.artist_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  tipper_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  message TEXT,
  square_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_tips ENABLE ROW LEVEL SECURITY;

-- Artists can see tips they received
CREATE POLICY "Artists can view their tips"
  ON public.artist_tips FOR SELECT
  USING (artist_id = auth.uid());

-- Tippers can see their own tips
CREATE POLICY "Tippers can view their own tips"
  ON public.artist_tips FOR SELECT
  USING (tipper_id = auth.uid());

-- Anyone can see completed tips (for leaderboard)
CREATE POLICY "Public can view completed tips"
  ON public.artist_tips FOR SELECT
  USING (status = 'completed');

-- Service role inserts tips (via edge function)
CREATE POLICY "Service role can insert tips"
  ON public.artist_tips FOR INSERT
  WITH CHECK (auth.uid() = tipper_id);

-- Service role can update tip status
CREATE POLICY "Service role can update tips"
  ON public.artist_tips FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Track lyrics sync table for timed lyrics
CREATE TABLE public.track_lyrics_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lyrics_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(track_id, version)
);

ALTER TABLE public.track_lyrics_sync ENABLE ROW LEVEL SECURITY;

-- Track owners can manage their lyrics sync
CREATE POLICY "Track owners can manage lyrics sync"
  ON public.track_lyrics_sync FOR ALL
  USING (user_id = auth.uid());

-- Anyone can read published lyrics
CREATE POLICY "Public can read published lyrics"
  ON public.track_lyrics_sync FOR SELECT
  USING (is_published = true);

-- Collaboration comments for studio
CREATE TABLE public.collaboration_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  timestamp_seconds NUMERIC(10,3),
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collaboration_comments ENABLE ROW LEVEL SECURITY;

-- Track owners and collaborators can manage comments
CREATE POLICY "Track owners can manage comments"
  ON public.collaboration_comments FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Collaborators can view comments"
  ON public.collaboration_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks t 
      WHERE t.id = track_id AND t.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.artist_collaborators ac
      JOIN public.tracks t ON t.user_id = ac.artist_id
      WHERE t.id = track_id AND ac.collaborator_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can insert comments"
  ON public.collaboration_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tracks t 
      WHERE t.id = track_id AND t.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.artist_collaborators ac
      JOIN public.tracks t ON t.user_id = ac.artist_id
      WHERE t.id = track_id AND ac.collaborator_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_artist_tips_artist ON public.artist_tips(artist_id);
CREATE INDEX idx_artist_tips_tipper ON public.artist_tips(tipper_id);
CREATE INDEX idx_artist_tips_status ON public.artist_tips(status);
CREATE INDEX idx_track_lyrics_sync_track ON public.track_lyrics_sync(track_id);
CREATE INDEX idx_collaboration_comments_track ON public.collaboration_comments(track_id);

-- Triggers for updated_at
CREATE TRIGGER update_artist_tips_updated_at
  BEFORE UPDATE ON public.artist_tips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_track_lyrics_sync_updated_at
  BEFORE UPDATE ON public.track_lyrics_sync
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaboration_comments_updated_at
  BEFORE UPDATE ON public.collaboration_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
