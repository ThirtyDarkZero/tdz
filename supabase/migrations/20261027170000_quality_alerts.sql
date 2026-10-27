-- Six Sigma step 6: targets and alerts.

-- 1. Allow payout and system-alert notifications. The notifications type list
--    never included 'payout', so every "Payout sent" notice failed silently.
--    Extend whatever list the live database has rather than replacing it.
DO $$
DECLARE
  c record;
  vals text[] := ARRAY[]::text[];
BEGIN
  FOR c IN
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'public.notifications'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%notification_type%'
  LOOP
    SELECT vals || array_agg(m[1]) INTO vals
    FROM regexp_matches(c.def, '''([^'']+)''', 'g') AS m;
    EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT %I', c.conname);
  END LOOP;
  IF cardinality(vals) > 0 THEN
    SELECT array_agg(DISTINCT v) INTO vals FROM unnest(vals || ARRAY['payout', 'system_alert']) v;
    EXECUTE format(
      'ALTER TABLE public.notifications ADD CONSTRAINT notifications_notification_type_check CHECK (notification_type = ANY (%L::text[]))',
      vals);
  END IF;
END $$;

-- 2. Targets per critical operation (editable by the CEO).
CREATE TABLE IF NOT EXISTS public.quality_targets (
  ctq                 text PRIMARY KEY,
  min_sigma           numeric NOT NULL DEFAULT 4.0,
  alert_on_any_defect boolean NOT NULL DEFAULT false,   -- money flows: every failure matters
  window_hours        integer NOT NULL DEFAULT 24,
  min_runs            integer NOT NULL DEFAULT 20,       -- don't judge sigma on tiny samples
  updated_at          timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.quality_targets (ctq, min_sigma, alert_on_any_defect, window_hours) VALUES
  ('payout',            4.5, true,  24),
  ('ledger_match',      6.0, true,  24),
  ('stripe_match',      6.0, true,  24),
  ('stripe_webhook',    4.5, true,  24),
  ('stream_credit',     4.0, false, 24),
  ('stream_validation', 4.0, false, 24),
  ('checkout_start',    4.0, false, 24),
  ('upload',            4.0, false, 24)
ON CONFLICT (ctq) DO NOTHING;

ALTER TABLE public.quality_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CEO and admin manage targets" ON public.quality_targets;
CREATE POLICY "CEO and admin manage targets" ON public.quality_targets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'ceo'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Alert state, so the same problem isn't re-sent every hour.
CREATE TABLE IF NOT EXISTS public.quality_alerts (
  alert_key   text PRIMARY KEY,
  severity    text NOT NULL,
  message     text NOT NULL,
  first_seen  timestamptz NOT NULL DEFAULT now(),
  last_seen   timestamptz NOT NULL DEFAULT now(),
  last_sent   timestamptz,
  resolved_at timestamptz
);
ALTER TABLE public.quality_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CEO and admin read alerts" ON public.quality_alerts;
CREATE POLICY "CEO and admin read alerts" ON public.quality_alerts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 4. What is wrong right now.
CREATE OR REPLACE FUNCTION public.current_quality_alerts()
RETURNS TABLE (alert_key text, severity text, message text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE t record; n bigint; d bigint; s numeric; top text;
BEGIN
  -- Targets missed
  FOR t IN SELECT * FROM public.quality_targets LOOP
    SELECT count(*), count(*) FILTER (WHERE NOT ok) INTO n, d
    FROM (
      SELECT o.ok FROM public.outcome_events o
      WHERE o.ctq = t.ctq AND o.occurred_at > now() - make_interval(hours => t.window_hours)
      UNION ALL
      SELECT w.status IN ('processed', 'ignored') FROM public.stripe_webhook_events w
      WHERE t.ctq = 'stripe_webhook' AND w.signature_valid AND w.status <> 'received'
        AND w.received_at > now() - make_interval(hours => t.window_hours)
    ) x;
    CONTINUE WHEN n = 0;
    s := public.sigma_level(d::numeric / n * 1000000);
    SELECT o.reason INTO top FROM public.outcome_events o
    WHERE o.ctq = t.ctq AND NOT o.ok AND o.occurred_at > now() - make_interval(hours => t.window_hours)
    GROUP BY o.reason ORDER BY count(*) DESC LIMIT 1;
    IF t.alert_on_any_defect AND d > 0 THEN
      alert_key := 'defects:' || t.ctq; severity := 'critical';
      message := format('%s: %s failure(s) in the last %sh (%s runs)%s', t.ctq, d, t.window_hours, n,
                        coalesce(' — top cause: ' || top, ''));
      RETURN NEXT;
    ELSIF n >= t.min_runs AND s < t.min_sigma THEN
      alert_key := 'sigma:' || t.ctq; severity := 'warning';
      message := format('%s at %sσ, below the %sσ target (%s of %s failed in %sh)%s', t.ctq, s, t.min_sigma, d, n,
                        t.window_hours, coalesce(' — top cause: ' || top, ''));
      RETURN NEXT;
    END IF;
  END LOOP;

  -- Scheduled jobs that stopped running
  IF NOT EXISTS (SELECT 1 FROM public.system_health_log
                 WHERE check_type = 'scheduled_payouts' AND created_at > now() - interval '2 hours') THEN
    alert_key := 'stale:scheduled_payouts'; severity := 'critical';
    message := 'The hourly artist payout run has not reported in 2 hours.';
    RETURN NEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.system_health_log
                 WHERE check_type = 'financial_reconciliation' AND created_at > now() - interval '7 hours') THEN
    alert_key := 'stale:financial_reconciliation'; severity := 'critical';
    message := 'The 6-hourly Stripe reconciliation has not reported in 7 hours.';
    RETURN NEXT;
  END IF;

  -- Money waiting for review
  SELECT count(*) INTO n FROM public.unmatched_transactions WHERE status = 'pending';
  IF n > 0 THEN
    alert_key := 'review:unmatched_transactions'; severity := 'warning';
    message := format('%s Stripe transaction(s) do not match internal records and need review.', n);
    RETURN NEXT;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.current_quality_alerts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_quality_alerts() TO service_role;

-- 5. Run the alert check hourly.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('quality-alerts')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'quality-alerts');
END $$;

SELECT cron.schedule(
  'quality-alerts',
  '41 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://rcjzvfskkoqygnlolrcs.supabase.co/functions/v1/quality-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1), ''),
      'x-cron-secret', coalesce(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'payout_cron_secret' LIMIT 1), '')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cron$
);
