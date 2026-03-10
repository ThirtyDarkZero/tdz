
-- Smart link clicks tracking
CREATE TABLE IF NOT EXISTS public.smart_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_link_id UUID REFERENCES public.smart_links(id) ON DELETE CASCADE NOT NULL,
  platform TEXT,
  user_agent TEXT,
  country TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.smart_link_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Link owners can view clicks" ON public.smart_link_clicks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.smart_links sl WHERE sl.id = smart_link_id AND sl.user_id = auth.uid())
);
CREATE POLICY "Anyone can insert clicks" ON public.smart_link_clicks FOR INSERT WITH CHECK (true);

-- Inner circle config
CREATE TABLE IF NOT EXISTS public.inner_circle_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  monthly_price NUMERIC DEFAULT 4.99,
  welcome_message TEXT,
  perks TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inner_circle_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view enabled configs" ON public.inner_circle_config FOR SELECT USING (is_enabled = true);
CREATE POLICY "Artists manage own config" ON public.inner_circle_config FOR ALL USING (artist_id = auth.uid()) WITH CHECK (artist_id = auth.uid());

-- Inner circle members
CREATE TABLE IF NOT EXISTS public.inner_circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL,
  fan_id UUID NOT NULL,
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(artist_id, fan_id)
);
ALTER TABLE public.inner_circle_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists see own members" ON public.inner_circle_members FOR SELECT USING (artist_id = auth.uid());
CREATE POLICY "Fans see own memberships" ON public.inner_circle_members FOR SELECT USING (fan_id = auth.uid());
CREATE POLICY "Fans can join" ON public.inner_circle_members FOR INSERT WITH CHECK (fan_id = auth.uid());

-- Add missing columns to artist_narrative
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artist_narrative' AND column_name = 'artist_mission') THEN
    ALTER TABLE public.artist_narrative ADD COLUMN artist_mission TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artist_narrative' AND column_name = 'target_audience') THEN
    ALTER TABLE public.artist_narrative ADD COLUMN target_audience TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artist_narrative' AND column_name = 'emotional_core') THEN
    ALTER TABLE public.artist_narrative ADD COLUMN emotional_core TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artist_narrative' AND column_name = 'unique_value_prop') THEN
    ALTER TABLE public.artist_narrative ADD COLUMN unique_value_prop TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artist_narrative' AND column_name = 'brand_voice') THEN
    ALTER TABLE public.artist_narrative ADD COLUMN brand_voice TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artist_narrative' AND column_name = 'key_phrases') THEN
    ALTER TABLE public.artist_narrative ADD COLUMN key_phrases TEXT[];
  END IF;
END $$;
