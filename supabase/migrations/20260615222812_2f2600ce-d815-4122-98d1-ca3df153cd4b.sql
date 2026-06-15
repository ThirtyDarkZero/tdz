
-- Remove permissive "true" policies; service_role bypasses RLS automatically
DROP POLICY IF EXISTS "Service role can insert earnings" ON public.artist_earnings;
DROP POLICY IF EXISTS "Service role can update earnings" ON public.artist_earnings;

DROP POLICY IF EXISTS "System can insert payouts" ON public.artist_payouts;

DROP POLICY IF EXISTS "System can insert demographics" ON public.listener_demographics;

DROP POLICY IF EXISTS "System can record listening history" ON public.listening_history;

DROP POLICY IF EXISTS "System can insert fraud detection" ON public.stream_fraud_detection;

DROP POLICY IF EXISTS "Service role can insert stream limits" ON public.user_stream_limits;
DROP POLICY IF EXISTS "Service role can update stream limits" ON public.user_stream_limits;

-- Presave signups: let fans delete their own signups
CREATE POLICY "Users can delete their own signups"
ON public.presave_signups
FOR DELETE
TO authenticated
USING (email = (SELECT auth.jwt() ->> 'email'));

CREATE POLICY "Users can view their own signups"
ON public.presave_signups
FOR SELECT
TO authenticated
USING (email = (SELECT auth.jwt() ->> 'email'));
