-- Six Sigma step 7: fraud controls.
-- Stream limits become settings (defaults = today's behaviour), replays of one
-- track can be capped from earning, and suspicious concentration patterns are
-- flagged in the hourly quality alerts.

CREATE TABLE IF NOT EXISTS public.stream_policy (
  id                                boolean PRIMARY KEY DEFAULT true CHECK (id),   -- single row
  max_streams_per_listener_day integer NOT NULL DEFAULT 500,
  max_streams_per_hour              integer NOT NULL DEFAULT 60,
  min_seconds_between_streams       integer NOT NULL DEFAULT 25,
  max_paid_repeats_per_track_day    integer,          -- NULL = unlimited (today's behaviour)
  flag_min_streams                  integer NOT NULL DEFAULT 100,
  flag_listener_share               numeric NOT NULL DEFAULT 0.80,  -- listener sends >= 80% of paid plays to one artist
  flag_artist_share                 numeric NOT NULL DEFAULT 0.50,  -- one listener is >= 50% of an artist's paid plays
  updated_at                        timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.stream_policy (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.stream_policy ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CEO and admin manage stream policy" ON public.stream_policy;
CREATE POLICY "CEO and admin manage stream policy" ON public.stream_policy
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'ceo'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_listening_history_user_track_time
  ON public.listening_history (user_id, track_id, played_at DESC);

CREATE OR REPLACE FUNCTION public.validate_stream(
  p_user_id UUID,
  p_track_id UUID,
  p_ip_address INET,
  p_device_fingerprint TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_limits RECORD;
  v_ip_record RECORD;
  v_device_record RECORD;
  v_is_blocked BOOLEAN := false;
  v_fraud_score INTEGER := 0;
  v_policy public.stream_policy%ROWTYPE;
  v_max_streams_per_hour INTEGER := 60;
  v_max_streams_per_day INTEGER := 500;
  v_track_plays_today INTEGER;
  v_max_users_per_ip INTEGER := 5;
  v_max_users_per_device INTEGER := 3;
BEGIN
  SELECT * INTO v_policy FROM public.stream_policy LIMIT 1;
  IF FOUND THEN
    v_max_streams_per_hour := v_policy.max_streams_per_hour;
    v_max_streams_per_day  := v_policy.max_streams_per_listener_day;
  END IF;

  -- Check if user is blocked
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_entities 
    WHERE entity_type = 'user' 
    AND entity_value = p_user_id::TEXT
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_is_blocked;
  
  IF v_is_blocked THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Account suspended');
  END IF;

  -- Check if IP is blocked
  IF p_ip_address IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.blocked_entities 
      WHERE entity_type = 'ip' 
      AND entity_value = p_ip_address::TEXT
      AND (expires_at IS NULL OR expires_at > now())
    ) INTO v_is_blocked;
    
    IF v_is_blocked THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'Access denied');
    END IF;
  END IF;

  -- Check if device is blocked
  IF p_device_fingerprint IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.blocked_entities 
      WHERE entity_type = 'device' 
      AND entity_value = p_device_fingerprint
      AND (expires_at IS NULL OR expires_at > now())
    ) INTO v_is_blocked;
    
    IF v_is_blocked THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'Device blocked');
    END IF;
  END IF;

  -- Get or create user stream limits
  INSERT INTO public.user_stream_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING * INTO v_user_limits;

  -- Reset hourly counter if needed
  IF v_user_limits.hour_window_start < now() - interval '1 hour' THEN
    UPDATE public.user_stream_limits 
    SET streams_this_hour = 0, hour_window_start = now()
    WHERE user_id = p_user_id;
    v_user_limits.streams_this_hour := 0;
  END IF;

  -- Reset daily counter if needed
  IF v_user_limits.day_window_start < now() - interval '1 day' THEN
    UPDATE public.user_stream_limits 
    SET streams_today = 0, unique_tracks_today = 0, day_window_start = now()
    WHERE user_id = p_user_id;
    v_user_limits.streams_today := 0;
  END IF;

  -- Physical limit: a qualifying stream needs 30s of listening, so two can't
  -- finish closer together than that (25s allows for network jitter).
  IF v_user_limits.last_stream_at IS NOT NULL
     AND v_user_limits.last_stream_at > now() - make_interval(secs => coalesce(v_policy.min_seconds_between_streams, 25)) THEN
    INSERT INTO public.stream_fraud_detection (user_id, ip_address, device_fingerprint, detection_type, severity, details)
    VALUES (p_user_id, p_ip_address, p_device_fingerprint, 'rate_limit', 'high',
      jsonb_build_object('type', 'too_fast', 'last_stream_at', v_user_limits.last_stream_at));
    RETURN jsonb_build_object('allowed', false, 'reason', 'Streams too close together');
  END IF;

  -- Check hourly rate limit (now enforced; previously only added to the score)
  IF v_user_limits.streams_this_hour >= v_max_streams_per_hour THEN
    INSERT INTO public.stream_fraud_detection (user_id, ip_address, device_fingerprint, detection_type, severity, details)
    VALUES (p_user_id, p_ip_address, p_device_fingerprint, 'rate_limit', 'medium', 
      jsonb_build_object('type', 'hourly_limit', 'count', v_user_limits.streams_this_hour));
    RETURN jsonb_build_object('allowed', false, 'reason', 'Hourly streaming limit reached');
  END IF;

  -- Check daily rate limit
  IF v_user_limits.streams_today >= v_max_streams_per_day THEN
    INSERT INTO public.stream_fraud_detection (user_id, ip_address, device_fingerprint, detection_type, severity, details)
    VALUES (p_user_id, p_ip_address, p_device_fingerprint, 'rate_limit', 'high', 
      jsonb_build_object('type', 'daily_limit', 'count', v_user_limits.streams_today));
    RETURN jsonb_build_object('allowed', false, 'reason', 'Daily streaming limit reached');
  END IF;

  -- Update user stream counts
  UPDATE public.user_stream_limits 
  SET 
    streams_this_hour = streams_this_hour + 1,
    streams_today = streams_today + 1,
    last_stream_at = now(),
    is_flagged = CASE WHEN v_fraud_score >= 50 THEN true ELSE is_flagged END,
    flag_reason = CASE WHEN v_fraud_score >= 50 THEN 'High fraud score: ' || v_fraud_score ELSE flag_reason END
  WHERE user_id = p_user_id;

  IF v_fraud_score >= 80 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Suspicious activity detected', 'fraud_score', v_fraud_score);
  END IF;

  -- Repeat-play cap: the play still counts, but replays of one track beyond the
  -- daily cap don't earn money. NULL cap = unlimited.
  IF v_policy.max_paid_repeats_per_track_day IS NOT NULL THEN
    SELECT count(*) INTO v_track_plays_today
    FROM public.listening_history
    WHERE user_id = p_user_id AND track_id = p_track_id AND played_at > now() - interval '1 day';
    IF v_track_plays_today >= v_policy.max_paid_repeats_per_track_day THEN
      INSERT INTO public.stream_fraud_detection (user_id, ip_address, device_fingerprint, detection_type, severity, details)
      VALUES (p_user_id, p_ip_address, p_device_fingerprint, 'repeat_cap', 'low',
        jsonb_build_object('track_id', p_track_id, 'plays_today', v_track_plays_today));
      RETURN jsonb_build_object('allowed', true, 'earns', false, 'reason', 'Daily replay limit for this track reached', 'fraud_score', v_fraud_score);
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', true, 'earns', true, 'fraud_score', v_fraud_score);
END;
$$;

REVOKE ALL ON FUNCTION public.validate_stream(uuid, uuid, inet, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_stream(uuid, uuid, inet, text) TO service_role;

-- Concentration patterns typical of play farming, from credited paid streams.
CREATE OR REPLACE FUNCTION public.fraud_anomalies(p_hours integer DEFAULT 24)
RETURNS TABLE (kind text, subject_id text, summary text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH p AS (SELECT * FROM public.stream_policy LIMIT 1),
  s AS (
    SELECT o.artist_id, o.detail ->> 'listener' AS listener
    FROM public.outcome_events o
    WHERE o.ctq = 'stream_credit' AND o.ok AND o.detail ? 'listener'
      AND o.occurred_at > now() - make_interval(hours => p_hours)
  ),
  by_listener AS (
    SELECT listener, artist_id, count(*) AS n, sum(count(*)) OVER (PARTITION BY listener) AS total
    FROM s GROUP BY listener, artist_id
  ),
  by_artist AS (
    SELECT artist_id, listener, count(*) AS n, sum(count(*)) OVER (PARTITION BY artist_id) AS total
    FROM s GROUP BY artist_id, listener
  )
  SELECT 'listener_concentration', bl.listener,
         format('Listener %s sent %s of %s paid plays (%s%%) to one artist (%s) in %sh — review for play farming.',
                left(bl.listener, 8), bl.n, bl.total, round(100.0 * bl.n / bl.total), left(bl.artist_id::text, 8), p_hours)
  FROM by_listener bl, p
  WHERE bl.total >= p.flag_min_streams AND bl.n::numeric / bl.total >= p.flag_listener_share
  UNION ALL
  SELECT 'artist_concentration', ba.artist_id::text,
         format('Artist %s got %s of %s paid plays (%s%%) from one listener (%s) in %sh — review for play farming.',
                left(ba.artist_id::text, 8), ba.n, ba.total, round(100.0 * ba.n / ba.total), left(ba.listener, 8), p_hours)
  FROM by_artist ba, p
  WHERE ba.total >= p.flag_min_streams AND ba.n::numeric / ba.total >= p.flag_artist_share;
$$;

REVOKE ALL ON FUNCTION public.fraud_anomalies(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fraud_anomalies(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.current_quality_alerts()
RETURNS TABLE (alert_key text, severity text, message text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE t record; n bigint; d bigint; s numeric; top text; f record;
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

  -- Suspicious play patterns
  FOR f IN SELECT * FROM public.fraud_anomalies(24) LOOP
    alert_key := 'fraud:' || f.kind || ':' || f.subject_id; severity := 'warning';
    message := f.summary;
    RETURN NEXT;
  END LOOP;

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
