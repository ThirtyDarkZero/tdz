-- Artist payout fixes
-- 1. credit_artist_stream: atomic $-per-stream credit into the current month's
--    PENDING earnings row (never into a paid/processing row).
-- 2. Hourly pg_cron job that runs the scheduled-artist-payouts sweep.
--    Before this, the sweep existed but nothing ever called it.

CREATE OR REPLACE FUNCTION public.credit_artist_stream(p_artist_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_start date := date_trunc('month', now())::date;
  v_end   date := (date_trunc('month', now()) + interval '1 month - 1 day')::date;
  v_id    uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('earn:' || p_artist_id::text));

  SELECT id INTO v_id
  FROM public.artist_earnings
  WHERE artist_id = p_artist_id
    AND period_start = v_start
    AND payout_status = 'pending'
    AND idempotency_key IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.artist_earnings
      (artist_id, period_start, period_end, streaming_revenue, total_streams,
       download_revenue, total_downloads, payout_status)
    VALUES (p_artist_id, v_start, v_end, p_amount, 1, 0, 0, 'pending');
  ELSE
    UPDATE public.artist_earnings
    SET streaming_revenue = streaming_revenue + p_amount,
        total_streams = total_streams + 1,
        updated_at = now()
    WHERE id = v_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_artist_stream(uuid, numeric) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_artist_stream(uuid, numeric) TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('scheduled-artist-payouts')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scheduled-artist-payouts');
END $$;

SELECT cron.schedule(
  'scheduled-artist-payouts',
  '7 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://rcjzvfskkoqygnlolrcs.supabase.co/functions/v1/scheduled-artist-payouts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1), ''),
      'x-cron-secret', coalesce(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'payout_cron_secret' LIMIT 1), '')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $cron$
);
