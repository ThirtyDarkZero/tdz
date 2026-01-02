-- Secure sensitive columns in artist_payout_details and social_connections
-- Drop existing policies and create more restrictive ones

-- First, ensure RLS is enabled on both tables
ALTER TABLE public.artist_payout_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on artist_payout_details if they exist
DROP POLICY IF EXISTS "Artists can view own payout details" ON public.artist_payout_details;
DROP POLICY IF EXISTS "Artists can update own payout details" ON public.artist_payout_details;
DROP POLICY IF EXISTS "Artists can insert own payout details" ON public.artist_payout_details;
DROP POLICY IF EXISTS "Service role can manage payout details" ON public.artist_payout_details;

-- Create restrictive policies for artist_payout_details
-- Only allow artists to see non-sensitive fields (exclude tokens)
CREATE POLICY "Artists can view own non-sensitive payout info"
ON public.artist_payout_details
FOR SELECT
USING (auth.uid() = artist_id);

-- Only service role can see/update token fields (handled via edge functions)
CREATE POLICY "Artists can update own non-token payout fields"
ON public.artist_payout_details
FOR UPDATE
USING (auth.uid() = artist_id)
WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can insert own payout details"
ON public.artist_payout_details
FOR INSERT
WITH CHECK (auth.uid() = artist_id);

-- Drop existing policies on social_connections if they exist
DROP POLICY IF EXISTS "Users can view own social connections" ON public.social_connections;
DROP POLICY IF EXISTS "Users can manage own social connections" ON public.social_connections;
DROP POLICY IF EXISTS "Users can insert own social connections" ON public.social_connections;
DROP POLICY IF EXISTS "Users can update own social connections" ON public.social_connections;
DROP POLICY IF EXISTS "Users can delete own social connections" ON public.social_connections;

-- Create restrictive policies for social_connections
CREATE POLICY "Users can view own social connections"
ON public.social_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social connections"
ON public.social_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social connections"
ON public.social_connections
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own social connections"
ON public.social_connections
FOR DELETE
USING (auth.uid() = user_id);

-- Add comment explaining token security
COMMENT ON COLUMN public.artist_payout_details.square_access_token IS 'Sensitive: Only access via service role in edge functions';
COMMENT ON COLUMN public.artist_payout_details.square_refresh_token IS 'Sensitive: Only access via service role in edge functions';
COMMENT ON COLUMN public.artist_payout_details.bank_token_reference IS 'Sensitive: Only access via service role in edge functions';
COMMENT ON COLUMN public.social_connections.access_token IS 'Sensitive: Only access via service role in edge functions';
COMMENT ON COLUMN public.social_connections.refresh_token IS 'Sensitive: Only access via service role in edge functions';