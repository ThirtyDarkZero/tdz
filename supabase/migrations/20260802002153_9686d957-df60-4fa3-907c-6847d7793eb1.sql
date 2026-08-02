-- 1. Mutation ledger -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_mutations (
  idempotency_key text PRIMARY KEY,
  event_id text NOT NULL,
  event_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.webhook_mutations TO service_role;
ALTER TABLE public.webhook_mutations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view webhook mutations"
  ON public.webhook_mutations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE INDEX IF NOT EXISTS idx_webhook_mutations_event ON public.webhook_mutations(event_id);

CREATE OR REPLACE FUNCTION public.claim_webhook_mutation(
  p_key text, p_event_id text, p_event_type text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inserted int;
BEGIN
  INSERT INTO public.webhook_mutations (idempotency_key, event_id, event_type)
  VALUES (p_key, p_event_id, p_event_type)
  ON CONFLICT (idempotency_key) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted = 1;
END;
$$;

-- 2. Atomic event claim -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_payload jsonb,
  p_received_at timestamptz
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status text; v_processed timestamptz; v_rows int;
BEGIN
  INSERT INTO public.stripe_webhook_events (
    stripe_event_id, event_type, status, livemode, signature_valid, payload, received_at
  ) VALUES (
    p_event_id, p_event_type, 'processing', p_livemode, true, p_payload, p_received_at
  )
  ON CONFLICT (stripe_event_id) DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 1 THEN RETURN 'claimed'; END IF;

  SELECT status, processed_at INTO v_status, v_processed
  FROM public.stripe_webhook_events
  WHERE stripe_event_id = p_event_id
  FOR UPDATE;

  IF v_status IN ('processed', 'ignored') THEN
    RETURN 'duplicate';
  END IF;

  -- 'processing' rows younger than 5 minutes are owned by a concurrent delivery.
  IF v_status = 'processing'
     AND COALESCE(v_processed, now()) > now() - interval '5 minutes'
     AND (SELECT received_at FROM public.stripe_webhook_events WHERE stripe_event_id = p_event_id)
         > now() - interval '5 minutes' THEN
    RETURN 'in_progress';
  END IF;

  UPDATE public.stripe_webhook_events
  SET status = 'processing', event_type = p_event_type, payload = p_payload, error_message = NULL
  WHERE stripe_event_id = p_event_id;
  RETURN 'claimed';
END;
$$;

-- 3. Per-row idempotency keys for inserts ----------------------------------
ALTER TABLE public.download_purchases ADD COLUMN IF NOT EXISTS stripe_session_id text;
CREATE UNIQUE INDEX IF NOT EXISTS uq_download_purchases_session
  ON public.download_purchases(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

ALTER TABLE public.artist_earnings ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS uq_artist_earnings_idem
  ON public.artist_earnings(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_merch_purchases_session
  ON public.merch_purchases(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_artist_tips_payment
  ON public.artist_tips(square_payment_id) WHERE square_payment_id IS NOT NULL;

-- 4. Ordered (last-writer-by-event-time) state application -----------------
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS last_stripe_event_at timestamptz;
ALTER TABLE public.artist_payout_details ADD COLUMN IF NOT EXISTS last_stripe_event_at timestamptz;

CREATE OR REPLACE FUNCTION public.apply_stripe_subscription_event(
  p_user_id uuid, p_fields jsonb, p_event_at timestamptz
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_existing timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('sub:' || p_user_id::text));

  SELECT last_stripe_event_at INTO v_existing
  FROM public.user_subscriptions WHERE user_id = p_user_id;

  IF v_existing IS NOT NULL AND v_existing > p_event_at THEN
    RETURN false; -- stale/out-of-order delivery
  END IF;

  INSERT INTO public.user_subscriptions (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_subscriptions us SET
    plan = COALESCE((p_fields->>'plan')::subscription_plan, us.plan),
    status = COALESCE(p_fields->>'status', us.status),
    current_period_start = COALESCE((p_fields->>'current_period_start')::timestamptz, us.current_period_start),
    current_period_end = COALESCE((p_fields->>'current_period_end')::timestamptz, us.current_period_end),
    expires_at = COALESCE((p_fields->>'expires_at')::timestamptz, us.expires_at),
    canceled_at = CASE WHEN p_fields ? 'canceled_at'
                       THEN (p_fields->>'canceled_at')::timestamptz ELSE us.canceled_at END,
    last_stripe_event_at = p_event_at,
    updated_at = now()
  WHERE us.user_id = p_user_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_stripe_account_event(
  p_user_id uuid, p_account_id text, p_payout_enabled boolean, p_event_at timestamptz
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_existing timestamptz; v_artist uuid;
BEGIN
  IF p_user_id IS NULL THEN
    SELECT artist_id INTO v_artist FROM public.artist_payout_details
    WHERE stripe_connect_id = p_account_id LIMIT 1;
  ELSE
    v_artist := p_user_id;
  END IF;

  IF v_artist IS NULL THEN RETURN false; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('acct:' || v_artist::text));

  SELECT last_stripe_event_at INTO v_existing
  FROM public.artist_payout_details WHERE artist_id = v_artist;

  IF v_existing IS NOT NULL AND v_existing > p_event_at THEN
    RETURN false;
  END IF;

  INSERT INTO public.artist_payout_details (artist_id, stripe_connect_id, payout_enabled, last_stripe_event_at)
  VALUES (v_artist, p_account_id, p_payout_enabled, p_event_at)
  ON CONFLICT (artist_id) DO UPDATE SET
    stripe_connect_id = COALESCE(EXCLUDED.stripe_connect_id, public.artist_payout_details.stripe_connect_id),
    payout_enabled = EXCLUDED.payout_enabled,
    last_stripe_event_at = EXCLUDED.last_stripe_event_at,
    updated_at = now();

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_webhook_mutation(text, text, text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_stripe_webhook_event(text, text, boolean, jsonb, timestamptz) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_stripe_subscription_event(uuid, jsonb, timestamptz) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_stripe_account_event(uuid, text, boolean, timestamptz) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webhook_mutation(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(text, text, boolean, jsonb, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_stripe_subscription_event(uuid, jsonb, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_stripe_account_event(uuid, text, boolean, timestamptz) TO service_role;