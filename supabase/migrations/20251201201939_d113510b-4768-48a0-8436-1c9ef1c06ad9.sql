-- Drop the restrictive policy that hides unverified artists
DROP POLICY IF EXISTS "Public can view verified artist profiles" ON public.artist_profiles;

-- Create new policy that allows viewing all artist profiles publicly
CREATE POLICY "Anyone can view artist profiles" 
ON public.artist_profiles 
FOR SELECT 
USING (true);