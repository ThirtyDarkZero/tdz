-- Add new columns to artist_payout_details for Square OAuth
ALTER TABLE public.artist_payout_details 
ADD COLUMN IF NOT EXISTS square_merchant_id text,
ADD COLUMN IF NOT EXISTS square_access_token text,
ADD COLUMN IF NOT EXISTS square_refresh_token text,
ADD COLUMN IF NOT EXISTS square_token_expires_at text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_artist_payout_merchant ON public.artist_payout_details(square_merchant_id);
