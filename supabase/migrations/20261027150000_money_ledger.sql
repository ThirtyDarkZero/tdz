-- Six Sigma step 2: every dollar traceable.
-- money_ledger is an append-only record of every change to what an artist is owed.
-- Database triggers write it, so no code path (old, new or a manual edit) can
-- change earnings or payouts without leaving a ledger entry.
--
-- Invariant checked by reconcile_ledger():
--   ledger balance (earned - paid) = unpaid earnings (pending + processing)

-- 1. Tips become payable earnings -------------------------------------------
-- Tips were collected but never added to artist_earnings, so never paid out.
-- total_earnings becomes a trigger-maintained column so tips can be included.
ALTER TABLE public.artist_earnings ADD COLUMN IF NOT EXISTS tip_revenue numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.artist_earnings ALTER COLUMN total_earnings DROP EXPRESSION IF EXISTS;

CREATE OR REPLACE FUNCTION public.set_total_earnings()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.total_earnings := coalesce(NEW.streaming_revenue, 0) + coalesce(NEW.download_revenue, 0)
                        + coalesce(NEW.tip_revenue, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_total_earnings ON public.artist_earnings;
CREATE TRIGGER trg_set_total_earnings
  BEFORE INSERT OR UPDATE ON public.artist_earnings
  FOR EACH ROW EXECUTE FUNCTION public.set_total_earnings();

-- 2. Ledger -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.money_ledger (
  id          bigserial PRIMARY KEY,
  artist_id   uuid          NOT NULL,
  entry_type  text          NOT NULL CHECK (entry_type IN (
                'opening_balance', 'stream_credit', 'download_credit', 'tip_credit',
                'payout', 'payout_failed', 'payout_reversed', 'adjustment')),
  amount      numeric(12,2) NOT NULL,   -- + increases what the artist is owed, - decreases it
  source_type text          NOT NULL,   -- artist_earnings | artist_payouts | manual
  source_id   text,
  detail      jsonb,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_money_ledger_artist ON public.money_ledger (artist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_money_ledger_source ON public.money_ledger (source_type, source_id);

CREATE OR REPLACE FUNCTION public.money_ledger_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'money_ledger is append-only; add an adjustment entry instead';
END;
$$;

DROP TRIGGER IF EXISTS trg_money_ledger_append_only ON public.money_ledger;
CREATE TRIGGER trg_money_ledger_append_only
  BEFORE UPDATE OR DELETE ON public.money_ledger
  FOR EACH ROW EXECUTE FUNCTION public.money_ledger_append_only();

ALTER TABLE public.money_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Artists read own ledger" ON public.money_ledger;
CREATE POLICY "Artists read own ledger" ON public.money_ledger
  FOR SELECT TO authenticated USING (artist_id = auth.uid());
DROP POLICY IF EXISTS "CEO and admin read ledger" ON public.money_ledger;
CREATE POLICY "CEO and admin read ledger" ON public.money_ledger
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Ledger writers (triggers) --------------------------------------------------
CREATE OR REPLACE FUNCTION public.ledger_from_earnings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d_stream   numeric := coalesce(NEW.streaming_revenue, 0) - CASE WHEN TG_OP = 'UPDATE' THEN coalesce(OLD.streaming_revenue, 0) ELSE 0 END;
  d_download numeric := coalesce(NEW.download_revenue, 0)  - CASE WHEN TG_OP = 'UPDATE' THEN coalesce(OLD.download_revenue, 0) ELSE 0 END;
  d_tip      numeric := coalesce(NEW.tip_revenue, 0)       - CASE WHEN TG_OP = 'UPDATE' THEN coalesce(OLD.tip_revenue, 0) ELSE 0 END;
BEGIN
  IF d_stream <> 0 THEN
    INSERT INTO public.money_ledger (artist_id, entry_type, amount, source_type, source_id)
    VALUES (NEW.artist_id, 'stream_credit', d_stream, 'artist_earnings', NEW.id::text);
  END IF;
  IF d_download <> 0 THEN
    INSERT INTO public.money_ledger (artist_id, entry_type, amount, source_type, source_id, detail)
    VALUES (NEW.artist_id, 'download_credit', d_download, 'artist_earnings', NEW.id::text,
            jsonb_build_object('key', NEW.idempotency_key));
  END IF;
  IF d_tip <> 0 THEN
    INSERT INTO public.money_ledger (artist_id, entry_type, amount, source_type, source_id, detail)
    VALUES (NEW.artist_id, 'tip_credit', d_tip, 'artist_earnings', NEW.id::text,
            jsonb_build_object('key', NEW.idempotency_key));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ledger_from_earnings ON public.artist_earnings;
CREATE TRIGGER trg_ledger_from_earnings
  AFTER INSERT OR UPDATE OF streaming_revenue, download_revenue, tip_revenue ON public.artist_earnings
  FOR EACH ROW EXECUTE FUNCTION public.ledger_from_earnings();

CREATE OR REPLACE FUNCTION public.ledger_from_payouts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  was text := CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END;
BEGIN
  IF NEW.status = 'completed' AND was IS DISTINCT FROM 'completed' THEN
    INSERT INTO public.money_ledger (artist_id, entry_type, amount, source_type, source_id, detail)
    VALUES (NEW.artist_id, 'payout', -NEW.amount, 'artist_payouts', NEW.id::text,
            jsonb_build_object('transfer_id', NEW.square_payout_id));
  ELSIF was = 'completed' AND NEW.status IN ('failed', 'reversed') THEN
    INSERT INTO public.money_ledger (artist_id, entry_type, amount, source_type, source_id, detail)
    VALUES (NEW.artist_id, CASE NEW.status WHEN 'failed' THEN 'payout_failed' ELSE 'payout_reversed' END,
            NEW.amount, 'artist_payouts', NEW.id::text,
            jsonb_build_object('transfer_id', NEW.square_payout_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ledger_from_payouts ON public.artist_payouts;
CREATE TRIGGER trg_ledger_from_payouts
  AFTER INSERT OR UPDATE OF status ON public.artist_payouts
  FOR EACH ROW EXECUTE FUNCTION public.ledger_from_payouts();

-- 4. Opening balances (once) ---------------------------------------------------
-- Everything earned so far minus everything paid so far. Any gap between this
-- and today's unpaid earnings is the historical shortfall, surfaced by
-- reconcile_ledger() until it is resolved with an adjustment entry.
INSERT INTO public.money_ledger (artist_id, entry_type, amount, source_type, detail)
SELECT a.artist_id, 'opening_balance',
       coalesce(e.earned, 0) - coalesce(p.paid, 0), 'manual',
       jsonb_build_object('earned', coalesce(e.earned, 0), 'paid', coalesce(p.paid, 0))
FROM (SELECT artist_id FROM public.artist_earnings
      UNION SELECT artist_id FROM public.artist_payouts) a
LEFT JOIN (SELECT artist_id, sum(total_earnings) AS earned FROM public.artist_earnings GROUP BY artist_id) e
  ON e.artist_id = a.artist_id
LEFT JOIN (SELECT artist_id, sum(amount) AS paid FROM public.artist_payouts
           WHERE status = 'completed' GROUP BY artist_id) p
  ON p.artist_id = a.artist_id
WHERE NOT EXISTS (SELECT 1 FROM public.money_ledger WHERE entry_type = 'opening_balance');

-- 5. Reconciliation -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reconcile_ledger()
RETURNS TABLE (artist_id uuid, ledger_balance numeric, unpaid_earnings numeric, difference numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH l AS (SELECT m.artist_id, sum(m.amount) AS bal FROM public.money_ledger m GROUP BY m.artist_id),
       e AS (SELECT ae.artist_id, sum(ae.total_earnings) AS unpaid FROM public.artist_earnings ae
             WHERE ae.payout_status IN ('pending', 'processing') GROUP BY ae.artist_id)
  SELECT coalesce(l.artist_id, e.artist_id), coalesce(l.bal, 0), coalesce(e.unpaid, 0),
         coalesce(l.bal, 0) - coalesce(e.unpaid, 0)
  FROM l FULL JOIN e ON e.artist_id = l.artist_id
  WHERE abs(coalesce(l.bal, 0) - coalesce(e.unpaid, 0)) >= 0.01
  ORDER BY abs(coalesce(l.bal, 0) - coalesce(e.unpaid, 0)) DESC;
$$;

REVOKE ALL ON FUNCTION public.reconcile_ledger() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_ledger() TO service_role;
REVOKE ALL ON FUNCTION public.ledger_from_earnings() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ledger_from_payouts() FROM PUBLIC, anon, authenticated;

-- 6. Schedule the reconciliation agent every 6 hours ------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('financial-reconciliation')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'financial-reconciliation');
END $$;

SELECT cron.schedule(
  'financial-reconciliation',
  '23 */6 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://rcjzvfskkoqygnlolrcs.supabase.co/functions/v1/financial-reconciliation-agent',
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
