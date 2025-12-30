-- Fix artist_earnings RLS policies for the payment ecosystem

-- Allow service role and admins to insert/update artist earnings
CREATE POLICY "Service can manage all earnings"
ON public.artist_earnings
FOR ALL
USING (true)
WITH CHECK (true);

-- Add INSERT policy for system operations
CREATE POLICY "System can create earnings records"
ON public.artist_earnings
FOR INSERT
WITH CHECK (true);

-- Add UPDATE policy for system operations  
CREATE POLICY "System can update earnings records"
ON public.artist_earnings
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Fix listening_history RLS - allow system inserts
CREATE POLICY "System can record listening history"
ON public.listening_history
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own listening history
CREATE POLICY "Users can view own listening history"
ON public.listening_history
FOR SELECT
USING (auth.uid() = user_id);