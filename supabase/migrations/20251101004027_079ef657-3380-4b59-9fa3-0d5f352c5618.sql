-- Allow users to insert their own role (but not admin/moderator roles)
CREATE POLICY "Users can set their initial role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role IN ('artist', 'listener', 'user', 'verified_artist')
);