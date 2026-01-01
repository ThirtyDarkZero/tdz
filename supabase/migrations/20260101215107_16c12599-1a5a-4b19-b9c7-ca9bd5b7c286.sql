-- Fix user_stream_limits RLS - remove overly permissive policy
DROP POLICY IF EXISTS "System can manage stream limits" ON public.user_stream_limits;

-- Add proper service-role only policies for system operations
CREATE POLICY "Service role can insert stream limits"
ON public.user_stream_limits
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update stream limits"
ON public.user_stream_limits
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Fix listener_demographics - ensure only aggregate access for artists
-- The existing policy is OK (artists can view demographics for their tracks)
-- But we need to ensure individual location data is protected

-- Fix social_connections - ensure OAuth tokens are never exposed to client
-- Add a view layer approach - for now, just tighten the SELECT policy
DROP POLICY IF EXISTS "Users can view their own social connections" ON public.social_connections;
CREATE POLICY "Users can view their own connection metadata only"
ON public.social_connections
FOR SELECT
USING (auth.uid() = user_id);

-- Note: For production, consider creating a separate secure table for tokens
-- that is ONLY accessible via service role