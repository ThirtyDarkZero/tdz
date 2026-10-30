-- Ad agents: plan, launch and optimize Meta and Google campaigns in the
-- artist's own ad accounts. Meta/Google bill the artist directly; TDZ never
-- holds ad money and takes no fee. The agent works inside the approved
-- budget: it can pause weak ads and move budget between ad sets, but any
-- launch or budget increase needs the artist's approval.

-- Connected ad accounts. Tokens are encrypted and never readable by clients.
CREATE TABLE IF NOT EXISTS public.ad_connections (
  artist_id        uuid NOT NULL,
  platform         text NOT NULL CHECK (platform IN ('meta', 'google')),
  account_id       text,
  account_name     text,
  currency         text,
  page_id          text,              -- Meta: Facebook Page that runs the ads
  choices          jsonb,             -- accounts/pages to pick from after connecting
  token_cipher     text NOT NULL,
  refresh_cipher   text,
  token_expires_at timestamptz,
  status           text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'needs_account', 'expired', 'error')),
  error            text,
  connected_by     uuid,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (artist_id, platform)
);
ALTER TABLE public.ad_connections ENABLE ROW LEVEL SECURITY;  -- server only

CREATE TABLE IF NOT EXISTS public.ad_oauth_states (
  state       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id   uuid NOT NULL,
  platform    text NOT NULL,
  created_by  uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_oauth_states ENABLE ROW LEVEL SECURITY;  -- server only

CREATE OR REPLACE FUNCTION public.ad_connection_status(p_artist uuid)
RETURNS TABLE (platform text, account_name text, currency text, page_id text, status text, choices jsonb, error text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.platform, c.account_name, c.currency, c.page_id,
         CASE WHEN c.token_expires_at IS NOT NULL AND c.token_expires_at < now() AND c.refresh_cipher IS NULL THEN 'expired' ELSE c.status END,
         c.choices, c.error
  FROM public.ad_connections c
  WHERE c.artist_id = p_artist AND (p_artist = auth.uid() OR public.is_manager_of(auth.uid(), p_artist));
$$;
GRANT EXECUTE ON FUNCTION public.ad_connection_status(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id           uuid NOT NULL,
  platform            text NOT NULL CHECK (platform IN ('meta', 'google')),
  name                text NOT NULL,
  goal                text NOT NULL DEFAULT 'streams' CHECK (goal IN ('streams', 'presaves', 'followers')),
  duration_days       integer NOT NULL CHECK (duration_days IN (30, 60, 90)),
  total_budget_cents  integer NOT NULL CHECK (total_budget_cents > 0),
  start_date          date NOT NULL,
  destination_url     text NOT NULL CHECK (destination_url ~* '^https://'),
  countries           text[] NOT NULL DEFAULT '{US}',
  age_min             integer NOT NULL DEFAULT 18 CHECK (age_min BETWEEN 13 AND 65),
  age_max             integer NOT NULL DEFAULT 44 CHECK (age_max BETWEEN 13 AND 65),
  keywords            text[] NOT NULL DEFAULT '{}',            -- Google
  creatives           jsonb NOT NULL DEFAULT '[]'::jsonb,      -- [{imageUrl|videoUrl, headline, primaryText}]
  plan                jsonb,
  status              text NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'awaiting_approval', 'launching', 'active', 'paused', 'completed', 'failed', 'canceled')),
  external            jsonb NOT NULL DEFAULT '{}'::jsonb,
  spent_cents         integer NOT NULL DEFAULT 0,
  approved_at         timestamptz,
  approved_by         uuid,
  last_optimized_on   date,
  error               text,
  created_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_artist ON public.ad_campaigns (artist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_active ON public.ad_campaigns (status) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.ad_daily_reports (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id        uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  report_date        date NOT NULL,
  day_number         integer NOT NULL,
  phase              text,
  spend_cents        integer NOT NULL DEFAULT 0,
  impressions        integer NOT NULL DEFAULT 0,
  clicks             integer NOT NULL DEFAULT 0,
  smart_link_visits  integer NOT NULL DEFAULT 0,
  budget_next_cents  integer,
  decisions          jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary            text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, report_date)
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_daily_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Artists read their ad campaigns" ON public.ad_campaigns;
CREATE POLICY "Artists read their ad campaigns" ON public.ad_campaigns FOR SELECT TO authenticated
  USING (artist_id = auth.uid() OR public.is_manager_of(auth.uid(), artist_id));
DROP POLICY IF EXISTS "Artists edit draft ad campaigns" ON public.ad_campaigns;
CREATE POLICY "Artists edit draft ad campaigns" ON public.ad_campaigns FOR ALL TO authenticated
  USING ((artist_id = auth.uid() OR public.is_manager_of(auth.uid(), artist_id)) AND status IN ('draft', 'awaiting_approval'))
  WITH CHECK ((artist_id = auth.uid() OR public.is_manager_of(auth.uid(), artist_id)) AND status IN ('draft', 'awaiting_approval'));
DROP POLICY IF EXISTS "Artists read their ad reports" ON public.ad_daily_reports;
CREATE POLICY "Artists read their ad reports" ON public.ad_daily_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ad_campaigns c WHERE c.id = campaign_id
                 AND (c.artist_id = auth.uid() OR public.is_manager_of(auth.uid(), c.artist_id))));

-- Clients may edit a draft's settings, never its money or launch fields.
CREATE OR REPLACE FUNCTION public.guard_ad_campaign() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'draft'; NEW.spent_cents := 0; NEW.external := '{}'; NEW.plan := NULL;
      NEW.approved_at := NULL; NEW.approved_by := NULL; NEW.created_by := auth.uid();
    ELSE
      NEW.spent_cents := OLD.spent_cents; NEW.external := OLD.external; NEW.approved_at := OLD.approved_at;
      NEW.approved_by := OLD.approved_by; NEW.plan := OLD.plan;
      -- Editing anything that affects money or targeting sends it back to draft.
      IF NEW.status = 'awaiting_approval' AND OLD.status = 'awaiting_approval' AND (
           NEW.total_budget_cents <> OLD.total_budget_cents OR NEW.duration_days <> OLD.duration_days
        OR NEW.destination_url <> OLD.destination_url OR NEW.countries <> OLD.countries OR NEW.creatives <> OLD.creatives) THEN
        NEW.status := 'draft'; NEW.plan := NULL;
      ELSIF NEW.status <> OLD.status AND NOT (NEW.status = 'draft' AND OLD.status = 'awaiting_approval') THEN
        RAISE EXCEPTION 'Use the campaign controls to change its status' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_ad_campaign ON public.ad_campaigns;
CREATE TRIGGER trg_guard_ad_campaign BEFORE INSERT OR UPDATE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.guard_ad_campaign();

-- Daily optimization cron (reads vault secrets) omitted: schedule separately.