-- Behaviour checks. Any failed check raises and stops the run.
\set ON_ERROR_STOP on
CREATE OR REPLACE FUNCTION pg_temp.check(ok boolean, what text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF ok IS NOT TRUE THEN RAISE EXCEPTION 'FAILED: %', what; END IF;
  RAISE NOTICE 'ok: %', what;
END $$;
SET client_min_messages = notice;

-- Permissions: money-moving database functions are server-only ----------------
SELECT pg_temp.check(NOT has_function_privilege('authenticated', 'public.deduct_render_credits(uuid,integer,text)', 'execute'), 'clients cannot call deduct_render_credits');
SELECT pg_temp.check(NOT has_function_privilege('authenticated', 'public.validate_stream(uuid,uuid,inet,text)', 'execute'), 'clients cannot call validate_stream');
SELECT pg_temp.check(NOT has_function_privilege('authenticated', 'public.credit_artist_stream(uuid,numeric)', 'execute'), 'clients cannot call credit_artist_stream');
SELECT pg_temp.check(NOT has_function_privilege('anon', 'public.get_quality_scorecard(integer)', 'execute'), 'anonymous users cannot read the scorecard');
SELECT pg_temp.check(NOT has_function_privilege('authenticated', 'public.reconcile_ledger()', 'execute'), 'clients cannot call reconcile_ledger');

-- Stream crediting -------------------------------------------------------------
SELECT public.credit_artist_stream('00000000-0000-4000-8000-00000000000a', 1);
SELECT public.credit_artist_stream('00000000-0000-4000-8000-00000000000a', 1);
SELECT pg_temp.check((SELECT count(*) = 1 AND sum(total_streams) = 2 AND sum(total_earnings) = 2
  FROM artist_earnings WHERE artist_id = '00000000-0000-4000-8000-00000000000a'), 'streams accumulate on one pending row');
UPDATE artist_earnings SET payout_status = 'paid' WHERE artist_id = '00000000-0000-4000-8000-00000000000a';
INSERT INTO artist_payouts (artist_id, amount, status, square_payout_id) VALUES ('00000000-0000-4000-8000-00000000000a', 2, 'completed', 'tr_first');
SELECT public.credit_artist_stream('00000000-0000-4000-8000-00000000000a', 1);
SELECT pg_temp.check((SELECT sum(total_earnings) FILTER (WHERE payout_status = 'pending') = 1
  AND sum(total_earnings) FILTER (WHERE payout_status = 'paid') = 2
  FROM artist_earnings WHERE artist_id = '00000000-0000-4000-8000-00000000000a'), 'a stream after payout lands on a new pending row (not lost)');

-- Stream fraud rules -------------------------------------------------------------
SELECT pg_temp.check((public.validate_stream('00000000-0000-4000-8000-0000000000b1', gen_random_uuid(), '1.2.3.4', 'fp') ->> 'allowed')::boolean, 'first stream allowed');
SELECT pg_temp.check(NOT (public.validate_stream('00000000-0000-4000-8000-0000000000b1', gen_random_uuid(), '1.2.3.4', 'fp') ->> 'allowed')::boolean, 'second stream within 25s blocked');
UPDATE user_stream_limits SET last_stream_at = now() - interval '1 minute', streams_this_hour = 60
  WHERE user_id = '00000000-0000-4000-8000-0000000000b1';
SELECT pg_temp.check((public.validate_stream('00000000-0000-4000-8000-0000000000b1', gen_random_uuid(), '1.2.3.4', 'fp') ->> 'reason') = 'Hourly streaming limit reached', 'hourly cap blocks the 61st stream');

-- Sigma math (standard Six Sigma table) --------------------------------------------
SELECT pg_temp.check(public.sigma_level(3.4) = 6.00, '3.4 DPMO = 6 sigma');
SELECT pg_temp.check(public.sigma_level(233) = 5.00, '233 DPMO = 5 sigma');
SELECT pg_temp.check(public.sigma_level(6210) = 4.00, '6,210 DPMO = 4 sigma');
SELECT pg_temp.check(public.sigma_level(66807) = 3.00, '66,807 DPMO = 3 sigma');

-- Scorecard -----------------------------------------------------------------------
INSERT INTO outcome_events (ctq, ok, reason) SELECT 'payout', g > 1, CASE WHEN g = 1 THEN 'transfer_error' END FROM generate_series(1, 10) g;
SELECT pg_temp.check((SELECT defects = 1 AND opportunities = 10 AND top_failure = 'transfer_error'
  FROM public.get_quality_scorecard(30) WHERE ctq = 'payout'), 'scorecard counts runs, defects and top failure');
UPDATE auth._session SET uid = gen_random_uuid(), role = 'authenticated';
DO $$ BEGIN
  PERFORM public.get_quality_scorecard(30);
  RAISE EXCEPTION 'FAILED: non-admin could read the scorecard';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok: non-admins are refused the scorecard';
END $$;
UPDATE auth._session SET uid = NULL, role = 'service_role';

-- Ledger ------------------------------------------------------------------------------
SELECT pg_temp.check(NOT EXISTS (SELECT 1 FROM public.reconcile_ledger() WHERE artist_id = '00000000-0000-4000-8000-00000000000a'), 'ledger balances after stream credits');
INSERT INTO artist_earnings (artist_id, tip_revenue, idempotency_key) VALUES ('00000000-0000-4000-8000-00000000000a', 4.56, 'tip:pi_test');
SELECT pg_temp.check((SELECT total_earnings = 4.56 FROM artist_earnings WHERE idempotency_key = 'tip:pi_test'), 'tips count toward total earnings');
UPDATE artist_earnings SET payout_status = 'paid' WHERE artist_id = '00000000-0000-4000-8000-00000000000a' AND payout_status = 'pending';
INSERT INTO artist_payouts (artist_id, amount, status, square_payout_id) VALUES ('00000000-0000-4000-8000-00000000000a', 5.56, 'completed', 'tr_test');
SELECT pg_temp.check(NOT EXISTS (SELECT 1 FROM public.reconcile_ledger() WHERE artist_id = '00000000-0000-4000-8000-00000000000a'), 'ledger balances after payout');
UPDATE artist_payouts SET status = 'failed' WHERE square_payout_id = 'tr_test';
SELECT pg_temp.check(EXISTS (SELECT 1 FROM public.reconcile_ledger() WHERE artist_id = '00000000-0000-4000-8000-00000000000a' AND difference = 5.56), 'failed payout shows as owed until earnings reopen');
UPDATE artist_earnings SET payout_status = 'pending' WHERE artist_id = '00000000-0000-4000-8000-00000000000a' AND payout_status = 'paid' AND total_earnings <> 2;
SELECT pg_temp.check(NOT EXISTS (SELECT 1 FROM public.reconcile_ledger() WHERE artist_id = '00000000-0000-4000-8000-00000000000a'), 'ledger balances once earnings reopen');
DO $$ BEGIN
  DELETE FROM money_ledger;
  RAISE EXCEPTION 'FAILED: ledger allowed a delete';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE 'FAILED%' THEN RAISE; END IF;
  RAISE NOTICE 'ok: ledger is append-only';
END $$;

-- Schedules -----------------------------------------------------------------------------
SELECT pg_temp.check(EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scheduled-artist-payouts'), 'payout run is scheduled');
SELECT pg_temp.check(EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'financial-reconciliation'), 'reconciliation is scheduled');

-- Database security (step 5) ----------------------------------------------------------
SELECT pg_temp.check(NOT has_function_privilege('authenticated', 'public.create_system_notification(uuid,text,text)', 'execute'), 'clients cannot send notifications to other users');
UPDATE auth._session SET uid = '00000000-0000-4000-8000-0000000000c1', role = 'authenticated';
SET ROLE authenticated;
INSERT INTO public.user_subscriptions (user_id, plan) VALUES ('00000000-0000-4000-8000-0000000000c1', 'free');
DO $$ BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan, status) VALUES ('00000000-0000-4000-8000-0000000000c2', 'pro', 'active');
  RAISE EXCEPTION 'FAILED: a user created a paid plan for someone else';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok: users cannot create subscriptions for others';
END $$;
DO $$ BEGIN
  DELETE FROM public.user_subscriptions WHERE false;  -- keep role context
  INSERT INTO public.user_subscriptions (user_id, plan, status) VALUES ('00000000-0000-4000-8000-0000000000c1', 'pro', 'active')
    ON CONFLICT DO NOTHING;
  IF EXISTS (SELECT 1 FROM public.user_subscriptions WHERE plan = 'pro') THEN
    RAISE EXCEPTION 'FAILED: a user gave themselves a paid plan';
  END IF;
  RAISE NOTICE 'ok: users cannot give themselves a paid plan (existing row)';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok: users cannot give themselves a paid plan';
END $$;
DO $$ BEGIN
  INSERT INTO public.artist_tips (artist_id, tipper_id, amount, status, square_payment_id)
    VALUES (gen_random_uuid(), '00000000-0000-4000-8000-0000000000c1', 500, 'completed', 'pi_fake');
  RAISE EXCEPTION 'FAILED: a user created a tip without paying';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok: users cannot create tips directly';
END $$;
RESET ROLE;
UPDATE auth._session SET uid = NULL, role = 'service_role';
SELECT pg_temp.check((SELECT count(*) = 1 AND bool_and(plan = 'free') FROM public.user_subscriptions), 'users can still create their own free subscription');
