-- 1. Fix device_fingerprints: remove dangerous public ALL policy
DROP POLICY IF EXISTS "System can manage device fingerprints" ON public.device_fingerprints;

-- 2. Remove direct_messages from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.direct_messages;

-- 3. Drop ip_address column from listener_demographics
ALTER TABLE public.listener_demographics DROP COLUMN IF EXISTS ip_address;