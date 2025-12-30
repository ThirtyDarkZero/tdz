-- Drop the old check constraint and add a new one with correct values
ALTER TABLE public.platform_revenue DROP CONSTRAINT platform_revenue_revenue_type_check;

ALTER TABLE public.platform_revenue ADD CONSTRAINT platform_revenue_revenue_type_check 
CHECK (revenue_type = ANY (ARRAY[
  'subscription'::text, 
  'subscription_revenue'::text,
  'download_revenue'::text,
  'ads'::text, 
  'sponsorship'::text, 
  'premium_features'::text, 
  'downloads'::text, 
  'events'::text, 
  'other'::text,
  'manual_deposit'::text,
  'fan_subscription'::text,
  'artist_subscription'::text
]));