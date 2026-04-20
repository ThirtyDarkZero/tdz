-- Fix: presave_signups INSERT must require auth and email match
DROP POLICY IF EXISTS "Anyone can create signups" ON public.presave_signups;
CREATE POLICY "Authenticated users can sign up themselves"
ON public.presave_signups
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND email = (SELECT auth.jwt() ->> 'email')
);

-- Fix: fan_engagement INSERT must be self-only
DROP POLICY IF EXISTS "System can create engagement" ON public.fan_engagement;
CREATE POLICY "Users can create their own engagement"
ON public.fan_engagement
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS automatically, so backend system writes still work.