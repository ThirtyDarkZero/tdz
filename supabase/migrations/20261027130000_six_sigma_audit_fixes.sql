-- Six Sigma audit fixes (database)
-- 1. Lock down SECURITY DEFINER functions that clients could call directly:
--    deduct_render_credits accepted any user id and negative amounts (free credits),
--    validate_stream let any user burn another user's stream limits.
-- 2. Stream fraud: enforce the hourly cap and a 25-second minimum gap between
--    counted streams (a counted stream requires 30s of listening).

DO $do$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN ('deduct_render_credits', 'validate_stream')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END
$do$;

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
  v_max_streams_per_hour INTEGER := 60;
  v_max_streams_per_day INTEGER := 500;
  v_max_users_per_ip INTEGER := 5;
  v_max_users_per_device INTEGER := 3;
BEGIN
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
     AND v_user_limits.last_stream_at > now() - interval '25 seconds' THEN
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

  RETURN jsonb_build_object('allowed', true, 'fraud_score', v_fraud_score);
END;
$$;


REVOKE ALL ON FUNCTION public.validate_stream(uuid, uuid, inet, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_stream(uuid, uuid, inet, text) TO service_role;
