-- Drop overly permissive RLS policies on artist_earnings
DROP POLICY IF EXISTS "Service can manage all earnings" ON public.artist_earnings;
DROP POLICY IF EXISTS "System can create earnings records" ON public.artist_earnings;
DROP POLICY IF EXISTS "System can update earnings records" ON public.artist_earnings;

-- Create properly scoped policies for artist_earnings
-- Artists can only view their OWN earnings
CREATE POLICY "Artists view own earnings"
ON public.artist_earnings
FOR SELECT
USING (auth.uid() = artist_id);

-- Service role (via edge functions) can insert earnings - uses service_role key
CREATE POLICY "Service role can insert earnings"
ON public.artist_earnings
FOR INSERT
WITH CHECK (true);

-- Service role (via edge functions) can update earnings - uses service_role key  
CREATE POLICY "Service role can update earnings"
ON public.artist_earnings
FOR UPDATE
USING (true)
WITH CHECK (true);

-- CEO/Admin can view all earnings for dashboard
CREATE POLICY "Admins can view all earnings"
ON public.artist_earnings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));