
-- Rename column
ALTER TABLE public.artist_payout_details RENAME COLUMN square_merchant_id TO stripe_connect_id;

-- Drop and recreate the safe view
DROP VIEW IF EXISTS public.artist_payout_details_safe;
CREATE VIEW public.artist_payout_details_safe AS
SELECT
  id,
  artist_id,
  payout_enabled,
  account_holder_name,
  stripe_connect_id,
  last_payout_date,
  created_at,
  updated_at
FROM public.artist_payout_details;

-- Update the token retrieval function to use new column name
CREATE OR REPLACE FUNCTION public.get_artist_square_tokens(p_artist_id uuid)
 RETURNS TABLE(access_token text, refresh_token text, token_expires_at timestamp with time zone, merchant_id text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_artist_id IS NULL THEN
    RAISE EXCEPTION 'artist_id is required';
  END IF;
  
  RETURN QUERY
  SELECT 
    apd.square_access_token,
    apd.square_refresh_token,
    apd.square_token_expires_at,
    apd.stripe_connect_id
  FROM public.artist_payout_details apd
  WHERE apd.artist_id = p_artist_id;
END;
$function$;
