-- Fan email campaigns: send to an artist's whole list, track every message.
-- Sending goes through Resend (fan-email function); Resend's webhook reports
-- deliveries, opens, clicks, bounces and spam complaints (resend-webhook).

-- Per-fan unsubscribe link, scoped to one artist's list.
ALTER TABLE public.artist_contacts
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS bounced_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS uq_artist_contacts_unsub ON public.artist_contacts (unsubscribe_token);

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id       uuid NOT NULL,
  subject         text NOT NULL CHECK (length(subject) BETWEEN 1 AND 200),
  preview_text    text,
  body_html       text NOT NULL,
  audience_tags   text[] NOT NULL DEFAULT '{}',   -- empty = everyone subscribed
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'canceled')),
  scheduled_at    timestamptz,
  started_at      timestamptz,
  sent_at         timestamptz,
  error           text,
  recipients      integer NOT NULL DEFAULT 0,
  delivered       integer NOT NULL DEFAULT 0,
  opened          integer NOT NULL DEFAULT 0,
  clicked         integer NOT NULL DEFAULT 0,
  bounced         integer NOT NULL DEFAULT 0,
  complained      integer NOT NULL DEFAULT 0,
  unsubscribed    integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_artist ON public.email_campaigns (artist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_due ON public.email_campaigns (scheduled_at) WHERE status = 'scheduled';

CREATE TABLE IF NOT EXISTS public.email_campaign_sends (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  contact_id    uuid REFERENCES public.artist_contacts(id) ON DELETE SET NULL,
  email         text NOT NULL,
  provider_id   text,
  status        text NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed')),
  opened_at     timestamptz,
  clicked_at    timestamptz,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, email)
);
CREATE INDEX IF NOT EXISTS idx_email_sends_provider ON public.email_campaign_sends (provider_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_queue ON public.email_campaign_sends (campaign_id, status);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_sends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Artists read their campaigns" ON public.email_campaigns;
CREATE POLICY "Artists read their campaigns" ON public.email_campaigns FOR SELECT TO authenticated
  USING (artist_id = auth.uid() OR public.is_manager_of(auth.uid(), artist_id));
DROP POLICY IF EXISTS "Artists write draft campaigns" ON public.email_campaigns;
CREATE POLICY "Artists write draft campaigns" ON public.email_campaigns FOR ALL TO authenticated
  USING ((artist_id = auth.uid() OR public.is_manager_of(auth.uid(), artist_id)) AND status IN ('draft', 'scheduled', 'canceled'))
  WITH CHECK ((artist_id = auth.uid() OR public.is_manager_of(auth.uid(), artist_id)) AND status IN ('draft', 'scheduled', 'canceled'));
DROP POLICY IF EXISTS "Artists read their sends" ON public.email_campaign_sends;
CREATE POLICY "Artists read their sends" ON public.email_campaign_sends FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.email_campaigns c WHERE c.id = campaign_id
                 AND (c.artist_id = auth.uid() OR public.is_manager_of(auth.uid(), c.artist_id))));

-- Counters only move server-side.
CREATE OR REPLACE FUNCTION public.guard_email_campaign() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      NEW.recipients := 0; NEW.delivered := 0; NEW.opened := 0; NEW.clicked := 0;
      NEW.bounced := 0; NEW.complained := 0; NEW.unsubscribed := 0;
      NEW.started_at := NULL; NEW.sent_at := NULL; NEW.error := NULL;
    ELSE
      NEW.recipients := OLD.recipients; NEW.delivered := OLD.delivered; NEW.opened := OLD.opened;
      NEW.clicked := OLD.clicked; NEW.bounced := OLD.bounced; NEW.complained := OLD.complained;
      NEW.unsubscribed := OLD.unsubscribed; NEW.started_at := OLD.started_at; NEW.sent_at := OLD.sent_at;
    END IF;
    IF NEW.status = 'scheduled' AND (NEW.scheduled_at IS NULL OR NEW.scheduled_at < now() - interval '5 minutes') THEN
      RAISE EXCEPTION 'Pick a time in the future to schedule' USING ERRCODE = '22023';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_email_campaign ON public.email_campaigns;
CREATE TRIGGER trg_guard_email_campaign BEFORE INSERT OR UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.guard_email_campaign();

-- Audience size for the composer ("This goes to 1,240 fans").
CREATE OR REPLACE FUNCTION public.fan_audience_count(p_artist uuid, p_tags text[] DEFAULT '{}')
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.artist_contacts c
  WHERE c.artist_id = p_artist
    AND (p_artist = auth.uid() OR public.is_manager_of(auth.uid(), p_artist))
    AND COALESCE(c.subscribed, true) AND c.unsubscribed_at IS NULL AND c.bounced_at IS NULL
    AND (cardinality(p_tags) = 0 OR c.tags && p_tags)
    AND NOT EXISTS (SELECT 1 FROM public.suppressed_emails s WHERE s.email = lower(c.email));
$$;
GRANT EXECUTE ON FUNCTION public.fan_audience_count(uuid, text[]) TO authenticated;

-- Fan unsubscribes from one artist's emails via their link.
CREATE OR REPLACE FUNCTION public.fan_unsubscribe(p_token uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_artist uuid; v_name text; v_already boolean;
BEGIN
  SELECT id, artist_id, (unsubscribed_at IS NOT NULL) INTO v_id, v_artist, v_already
  FROM public.artist_contacts WHERE unsubscribe_token = p_token;
  IF v_id IS NULL THEN RAISE EXCEPTION 'This unsubscribe link isn''t valid' USING ERRCODE = 'P0002'; END IF;
  SELECT artist_name INTO v_name FROM public.artist_profiles WHERE user_id = v_artist;
  IF NOT v_already THEN
    UPDATE public.artist_contacts SET subscribed = false, unsubscribed_at = now() WHERE id = v_id;
    -- Count it against the most recent campaign this fan received.
    UPDATE public.email_campaigns c SET unsubscribed = unsubscribed + 1
    WHERE c.id = (SELECT s.campaign_id FROM public.email_campaign_sends s WHERE s.contact_id = v_id
                  ORDER BY s.created_at DESC LIMIT 1);
  END IF;
  RETURN COALESCE(v_name, 'this artist');
END $$;
GRANT EXECUTE ON FUNCTION public.fan_unsubscribe(uuid) TO anon, authenticated;

-- Webhook bookkeeping: record one event, bump the campaign counter once.
CREATE OR REPLACE FUNCTION public.record_fan_email_event(p_provider_id text, p_type text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.email_campaign_sends;
BEGIN
  SELECT * INTO v FROM public.email_campaign_sends WHERE provider_id = p_provider_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF p_type = 'email.delivered' AND v.status IN ('queued', 'sent') THEN
    UPDATE public.email_campaign_sends SET status = 'delivered' WHERE id = v.id;
    UPDATE public.email_campaigns SET delivered = delivered + 1 WHERE id = v.campaign_id;
  ELSIF p_type = 'email.opened' AND v.opened_at IS NULL THEN
    UPDATE public.email_campaign_sends SET opened_at = now() WHERE id = v.id;
    UPDATE public.email_campaigns SET opened = opened + 1 WHERE id = v.campaign_id;
  ELSIF p_type = 'email.clicked' AND v.clicked_at IS NULL THEN
    UPDATE public.email_campaign_sends SET clicked_at = now(), opened_at = COALESCE(opened_at, now()) WHERE id = v.id;
    UPDATE public.email_campaigns SET clicked = clicked + 1,
      opened = opened + CASE WHEN v.opened_at IS NULL THEN 1 ELSE 0 END WHERE id = v.campaign_id;
  ELSIF p_type = 'email.bounced' AND v.status <> 'bounced' THEN
    UPDATE public.email_campaign_sends SET status = 'bounced' WHERE id = v.id;
    UPDATE public.email_campaigns SET bounced = bounced + 1 WHERE id = v.campaign_id;
    UPDATE public.artist_contacts SET bounced_at = now() WHERE id = v.contact_id;
    INSERT INTO public.suppressed_emails (email, reason, metadata)
    VALUES (lower(v.email), 'bounce', jsonb_build_object('campaign', v.campaign_id)) ON CONFLICT (email) DO NOTHING;
  ELSIF p_type = 'email.complained' AND v.status <> 'complained' THEN
    UPDATE public.email_campaign_sends SET status = 'complained' WHERE id = v.id;
    UPDATE public.email_campaigns SET complained = complained + 1 WHERE id = v.campaign_id;
    UPDATE public.artist_contacts SET subscribed = false, unsubscribed_at = COALESCE(unsubscribed_at, now()) WHERE id = v.contact_id;
    INSERT INTO public.suppressed_emails (email, reason, metadata)
    VALUES (lower(v.email), 'complaint', jsonb_build_object('campaign', v.campaign_id)) ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.record_fan_email_event(text, text) FROM PUBLIC, anon, authenticated;

-- Send scheduled campaigns every 5 minutes.
SELECT cron.unschedule('fan-email-dispatch') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fan-email-dispatch');
SELECT cron.schedule(
  'fan-email-dispatch',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://rcjzvfskkoqygnlolrcs.supabase.co/functions/v1/fan-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1), ''),
      'x-cron-secret', coalesce(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'payout_cron_secret' LIMIT 1), '')
    ),
    body := '{"action": "dispatch"}'::jsonb
  );
  $cron$
);
