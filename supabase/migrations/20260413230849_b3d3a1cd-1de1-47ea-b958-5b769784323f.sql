
-- ============================================================
-- 1. FIX: Notifications - remove public INSERT policy
-- ============================================================
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Allow authenticated users to create notifications where they are the actor
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create SECURITY DEFINER function for system-generated notifications
CREATE OR REPLACE FUNCTION public.create_system_notification(
  p_user_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;
  IF p_notification_type IS NULL OR length(trim(p_notification_type)) = 0 THEN
    RAISE EXCEPTION 'notification_type is required';
  END IF;
  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'title is required';
  END IF;
  
  INSERT INTO public.notifications (user_id, notification_type, title, message, metadata)
  VALUES (p_user_id, p_notification_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- ============================================================
-- 2. FIX: IP stream tracking - remove public ALL policy
-- ============================================================
DROP POLICY IF EXISTS "System can manage IP tracking" ON public.ip_stream_tracking;

-- No public or authenticated access - only service role can access
-- Service role bypasses RLS by default, so no policy needed for it
-- Add a deny-all policy to ensure no public access
CREATE POLICY "Deny all public access to IP tracking"
  ON public.ip_stream_tracking FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- 3. FIX: Artist payout details - hide Square tokens from client
-- ============================================================

-- Revoke column-level SELECT on sensitive token columns
REVOKE SELECT (square_access_token, square_refresh_token, square_token_expires_at) 
  ON public.artist_payout_details FROM authenticated;
REVOKE SELECT (square_access_token, square_refresh_token, square_token_expires_at) 
  ON public.artist_payout_details FROM anon;

-- Create a safe view for client-side access
CREATE OR REPLACE VIEW public.artist_payout_details_safe AS
  SELECT 
    id, artist_id, account_holder_name, payout_enabled,
    square_merchant_id, square_customer_id, last_payout_date,
    bank_token_reference, created_at, updated_at,
    CASE WHEN square_access_token IS NOT NULL THEN true ELSE false END AS has_square_connected
  FROM public.artist_payout_details;

-- Create SECURITY DEFINER function for Edge Functions to read tokens
CREATE OR REPLACE FUNCTION public.get_artist_square_tokens(p_artist_id UUID)
RETURNS TABLE(access_token TEXT, refresh_token TEXT, token_expires_at TIMESTAMPTZ, merchant_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_artist_id IS NULL THEN
    RAISE EXCEPTION 'artist_id is required';
  END IF;
  
  RETURN QUERY
  SELECT 
    apd.square_access_token,
    apd.square_refresh_token,
    apd.square_token_expires_at,
    apd.square_merchant_id
  FROM public.artist_payout_details apd
  WHERE apd.artist_id = p_artist_id;
END;
$$;
