
-- Tighten the artist_tips update policy to only allow service role
DROP POLICY IF EXISTS "Service role can update tips" ON public.artist_tips;
CREATE POLICY "Only service role can update tips"
  ON public.artist_tips FOR UPDATE
  USING (auth.uid() = artist_id OR auth.uid() = tipper_id);
