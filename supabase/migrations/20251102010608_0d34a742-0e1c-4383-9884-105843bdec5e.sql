-- SECURITY FIX 1: Restrict listener_profiles to authenticated users only
-- This prevents public scraping of user profile data
DROP POLICY IF EXISTS "Anyone can view listener profiles" ON public.listener_profiles;

CREATE POLICY "Authenticated users can view listener profiles"
ON public.listener_profiles
FOR SELECT
TO authenticated
USING (true);

-- SECURITY FIX 2: Restrict artist_profiles to show only essential public data
-- Keep the public view but consider what data truly needs to be public
DROP POLICY IF EXISTS "Anyone can view artist profiles" ON public.artist_profiles;

CREATE POLICY "Public can view verified artist profiles"
ON public.artist_profiles
FOR SELECT
USING (verified = true OR auth.uid() = user_id);

-- SECURITY FIX 3: Restrict artist_follows to authenticated users
DROP POLICY IF EXISTS "Anyone can view follows" ON public.artist_follows;

CREATE POLICY "Authenticated users can view follows"
ON public.artist_follows
FOR SELECT
TO authenticated
USING (true);

-- SECURITY FIX 4: Restrict track_comments to authenticated users
DROP POLICY IF EXISTS "Anyone can view comments" ON public.track_comments;

CREATE POLICY "Authenticated users can view comments"
ON public.track_comments
FOR SELECT
TO authenticated
USING (true);

-- SECURITY FIX 5: Restrict comment_likes to authenticated users
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.comment_likes;

CREATE POLICY "Authenticated users can view comment likes"
ON public.comment_likes
FOR SELECT
TO authenticated
USING (true);

-- SECURITY FIX 6: Tighten tracks policy to prevent metadata leaks
-- Ensure unpublished tracks are completely hidden
DROP POLICY IF EXISTS "Users can view published tracks or their own" ON public.tracks;

CREATE POLICY "Users can view published tracks or their own"
ON public.tracks
FOR SELECT
USING (
  (is_published = true) OR 
  (auth.uid() = user_id AND auth.uid() IS NOT NULL)
);

-- Add index for performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_tracks_published_user ON public.tracks(is_published, user_id);

-- SECURITY FIX 7: Add rate limiting table for authentication attempts
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- email or IP address
  attempt_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(identifier, window_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier ON public.auth_rate_limits(identifier, window_start);

-- Enable RLS
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can manage rate limits
CREATE POLICY "No public access to rate limits"
ON public.auth_rate_limits
FOR ALL
USING (false);

-- SECURITY FIX 8: Add audit log for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- SECURITY FIX 9: Add function to log sensitive operations
CREATE OR REPLACE FUNCTION public.log_audit(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata
  );
END;
$$;

-- SECURITY FIX 10: Add trigger to log track uploads
CREATE OR REPLACE FUNCTION public.log_track_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.log_audit(
    'track_upload',
    'track',
    NEW.id,
    jsonb_build_object(
      'title', NEW.title,
      'artist_name', NEW.artist_name,
      'is_published', NEW.is_published
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS track_upload_audit ON public.tracks;
CREATE TRIGGER track_upload_audit
  AFTER INSERT ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_track_upload();