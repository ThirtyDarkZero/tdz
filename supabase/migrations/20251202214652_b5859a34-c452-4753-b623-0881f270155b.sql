-- Add 'ceo' to the app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ceo' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'ceo';
  END IF;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.stream_fraud_detection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  device_fingerprint TEXT,
  detection_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_stream_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  streams_today INTEGER DEFAULT 0,
  streams_this_hour INTEGER DEFAULT 0,
  unique_tracks_today INTEGER DEFAULT 0,
  last_stream_at TIMESTAMPTZ,
  hour_window_start TIMESTAMPTZ DEFAULT now(),
  day_window_start TIMESTAMPTZ DEFAULT now(),
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ip_stream_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_ids UUID[] DEFAULT '{}',
  streams_today INTEGER DEFAULT 0,
  unique_users_today INTEGER DEFAULT 0,
  day_window_start TIMESTAMPTZ DEFAULT now(),
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL,
  user_ids UUID[] DEFAULT '{}',
  streams_today INTEGER DEFAULT 0,
  unique_users_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blocked_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_value TEXT NOT NULL,
  reason TEXT,
  blocked_by UUID,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(entity_type, entity_value)
);

-- Enable RLS on all tables
ALTER TABLE public.stream_fraud_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stream_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_stream_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_entities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Only admins can view fraud detection" ON public.stream_fraud_detection;
DROP POLICY IF EXISTS "System can insert fraud detection" ON public.stream_fraud_detection;
DROP POLICY IF EXISTS "Only admins can view stream limits" ON public.user_stream_limits;
DROP POLICY IF EXISTS "System can manage stream limits" ON public.user_stream_limits;
DROP POLICY IF EXISTS "Only admins can view IP tracking" ON public.ip_stream_tracking;
DROP POLICY IF EXISTS "System can manage IP tracking" ON public.ip_stream_tracking;
DROP POLICY IF EXISTS "Only admins can view device fingerprints" ON public.device_fingerprints;
DROP POLICY IF EXISTS "System can manage device fingerprints" ON public.device_fingerprints;
DROP POLICY IF EXISTS "Only admins can manage blocked entities" ON public.blocked_entities;

-- Create RLS policies using only 'admin' role
CREATE POLICY "Only admins can view fraud detection"
ON public.stream_fraud_detection FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert fraud detection"
ON public.stream_fraud_detection FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only admins can view stream limits"
ON public.user_stream_limits FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "System can manage stream limits"
ON public.user_stream_limits FOR ALL
USING (true);

CREATE POLICY "Only admins can view IP tracking"
ON public.ip_stream_tracking FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage IP tracking"
ON public.ip_stream_tracking FOR ALL
USING (true);

CREATE POLICY "Only admins can view device fingerprints"
ON public.device_fingerprints FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage device fingerprints"
ON public.device_fingerprints FOR ALL
USING (true);

CREATE POLICY "Only admins can manage blocked entities"
ON public.blocked_entities FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fraud_detection_user ON public.stream_fraud_detection(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_ip ON public.stream_fraud_detection(ip_address);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_created ON public.stream_fraud_detection(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_stream_limits_flagged ON public.user_stream_limits(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_ip_tracking_flagged ON public.ip_stream_tracking(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_blocked_entities_lookup ON public.blocked_entities(entity_type, entity_value);

-- Create validate_stream function
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

  -- Check hourly rate limit
  IF v_user_limits.streams_this_hour >= v_max_streams_per_hour THEN
    INSERT INTO public.stream_fraud_detection (user_id, ip_address, device_fingerprint, detection_type, severity, details)
    VALUES (p_user_id, p_ip_address, p_device_fingerprint, 'rate_limit', 'medium', 
      jsonb_build_object('type', 'hourly_limit', 'count', v_user_limits.streams_this_hour));
    v_fraud_score := v_fraud_score + 30;
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