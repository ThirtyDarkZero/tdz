
CREATE TABLE public.artist_eventbrite_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  access_token text NOT NULL,
  organization_id text,
  organization_name text,
  connected_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.artist_eventbrite_tokens ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_artist_eventbrite_tokens_user ON public.artist_eventbrite_tokens(user_id);

CREATE POLICY "Users can view own eventbrite tokens"
  ON public.artist_eventbrite_tokens FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own eventbrite tokens"
  ON public.artist_eventbrite_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own eventbrite tokens"
  ON public.artist_eventbrite_tokens FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own eventbrite tokens"
  ON public.artist_eventbrite_tokens FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
