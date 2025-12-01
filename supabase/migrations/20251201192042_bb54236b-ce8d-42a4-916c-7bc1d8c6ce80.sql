-- Add download_price column to tracks table for artist-set pricing
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS download_price DECIMAL(10, 2) DEFAULT NULL;

-- Create artist_earnings table for tracking all earnings
CREATE TABLE IF NOT EXISTS public.artist_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_streams BIGINT NOT NULL DEFAULT 0,
  streaming_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total_downloads INTEGER NOT NULL DEFAULT 0,
  download_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total_earnings DECIMAL(12, 2) GENERATED ALWAYS AS (streaming_revenue + download_revenue) STORED,
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
  payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create download_purchases table for tracking individual downloads
CREATE TABLE IF NOT EXISTS public.download_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  artist_id UUID NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  transaction_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  artist_revenue DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'refunded', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create platform_revenue table for tracking revenue pool
CREATE TABLE IF NOT EXISTS public.platform_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  revenue_type TEXT NOT NULL CHECK (revenue_type IN ('subscription', 'ads', 'sponsorship', 'premium_features', 'downloads', 'events', 'other')),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  period_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.artist_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;

-- RLS policies for artist_earnings
CREATE POLICY "Artists can view their own earnings" 
ON public.artist_earnings 
FOR SELECT 
USING (auth.uid() = artist_id);

-- RLS policies for download_purchases
CREATE POLICY "Buyers can view their purchases" 
ON public.download_purchases 
FOR SELECT 
USING (auth.uid() = buyer_id);

CREATE POLICY "Artists can view sales of their tracks" 
ON public.download_purchases 
FOR SELECT 
USING (auth.uid() = artist_id);

CREATE POLICY "Authenticated users can purchase downloads" 
ON public.download_purchases 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

-- RLS policies for platform_revenue (admin only)
CREATE POLICY "Admins can view platform revenue" 
ON public.platform_revenue 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage platform revenue" 
ON public.platform_revenue 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_artist_earnings_artist_id ON public.artist_earnings(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_earnings_period ON public.artist_earnings(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_download_purchases_track_id ON public.download_purchases(track_id);
CREATE INDEX IF NOT EXISTS idx_download_purchases_artist_id ON public.download_purchases(artist_id);
CREATE INDEX IF NOT EXISTS idx_download_purchases_buyer_id ON public.download_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_type ON public.platform_revenue(revenue_type);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_date ON public.platform_revenue(period_date);