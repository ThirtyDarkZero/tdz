
CREATE TABLE public.store_click_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  campaign TEXT,
  content TEXT,
  path TEXT,
  referrer TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.store_click_events TO anon;
GRANT INSERT ON public.store_click_events TO authenticated;
GRANT ALL ON public.store_click_events TO service_role;

ALTER TABLE public.store_click_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors on the landing page) may log a click.
CREATE POLICY "Anyone can log a store click"
  ON public.store_click_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

-- Only admins / CEO can read the raw click log.
CREATE POLICY "Admins can read store click events"
  ON public.store_click_events
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE INDEX idx_store_click_events_source_created
  ON public.store_click_events (source, created_at DESC);
