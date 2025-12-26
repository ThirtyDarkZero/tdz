-- Create a secure view for artist payout information that excludes sensitive tokens
CREATE OR REPLACE VIEW public.artist_payout_info AS
SELECT 
  id,
  artist_id,
  payout_enabled,
  account_holder_name,
  last_payout_date,
  square_merchant_id,
  square_customer_id,
  created_at,
  updated_at
  -- Excluded: square_access_token, square_refresh_token, square_token_expires_at, bank_token_reference
FROM public.artist_payout_details;

-- Enable RLS on the view
ALTER VIEW public.artist_payout_info SET (security_invoker = true);

-- Create explicit DENY policies for audit_logs to ensure immutability
-- First drop any existing non-admin modification policies
DROP POLICY IF EXISTS "No user modifications to audit logs" ON public.audit_logs;

-- Create policy that denies all user modifications (INSERT/UPDATE/DELETE)
-- The log_audit() SECURITY DEFINER function will bypass this for legitimate logging
CREATE POLICY "Prevent user audit log modifications"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Prevent user audit log updates"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Prevent user audit log deletes"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (false);

-- Add comment to sensitive columns as warning
COMMENT ON COLUMN public.artist_payout_details.square_access_token IS 'SENSITIVE: Square OAuth access token - never expose in client responses';
COMMENT ON COLUMN public.artist_payout_details.square_refresh_token IS 'SENSITIVE: Square OAuth refresh token - never expose in client responses';
COMMENT ON COLUMN public.social_connections.access_token IS 'SENSITIVE: OAuth access token - never expose in client responses';
COMMENT ON COLUMN public.social_connections.refresh_token IS 'SENSITIVE: OAuth refresh token - never expose in client responses';