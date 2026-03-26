-- Artist Shopify store config (per-artist merch connection)
CREATE TABLE IF NOT EXISTS public.artist_shopify_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL UNIQUE,
  store_domain text NOT NULL,
  storefront_token text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.artist_shopify_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists manage own shopify config"
  ON public.artist_shopify_config FOR ALL TO authenticated
  USING (artist_id = auth.uid())
  WITH CHECK (artist_id = auth.uid());

-- Tour dates table
CREATE TABLE IF NOT EXISTS public.tour_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL,
  venue text NOT NULL,
  city text NOT NULL,
  state text,
  country text DEFAULT 'US',
  date_time timestamptz NOT NULL,
  ticket_url text,
  eventbrite_event_id text,
  status text DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tour_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists manage own tour dates"
  ON public.tour_dates FOR ALL TO authenticated
  USING (artist_id = auth.uid())
  WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Public read tour dates"
  ON public.tour_dates FOR SELECT TO anon
  USING (true);

-- Tour recommendations table
CREATE TABLE IF NOT EXISTS public.tour_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  city text NOT NULL,
  match_score integer DEFAULT 0,
  reason text,
  audience_size text,
  best_month text,
  venues text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tour_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own tour recs"
  ON public.tour_recommendations FOR SELECT TO authenticated
  USING (user_id = auth.uid());