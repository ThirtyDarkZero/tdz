-- Create artist_payout_details table for storing bank account info
CREATE TABLE IF NOT EXISTS public.artist_payout_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL UNIQUE,
  square_customer_id TEXT,
  account_holder_name TEXT,
  bank_token_reference TEXT,
  payout_enabled BOOLEAN NOT NULL DEFAULT false,
  last_payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create artist_payouts table for tracking payout transactions
CREATE TABLE IF NOT EXISTS public.artist_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  square_payout_id TEXT,
  earnings_ids UUID[] DEFAULT '{}',
  processed_by UUID,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.artist_payout_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for artist_payout_details
CREATE POLICY "Artists can view their own payout details"
ON public.artist_payout_details
FOR SELECT
USING (auth.uid() = artist_id);

CREATE POLICY "Artists can insert their own payout details"
ON public.artist_payout_details
FOR INSERT
WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update their own payout details"
ON public.artist_payout_details
FOR UPDATE
USING (auth.uid() = artist_id);

-- RLS policies for artist_payouts
CREATE POLICY "Artists can view their own payouts"
ON public.artist_payouts
FOR SELECT
USING (auth.uid() = artist_id);

CREATE POLICY "System can insert payouts"
ON public.artist_payouts
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_artist_payouts_artist_id ON public.artist_payouts(artist_id);
CREATE INDEX idx_artist_payouts_status ON public.artist_payouts(status);