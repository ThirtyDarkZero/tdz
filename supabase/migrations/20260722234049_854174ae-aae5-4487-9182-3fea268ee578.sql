DROP POLICY IF EXISTS "Users can set their initial role" ON public.user_roles;
CREATE POLICY "Users can set their initial role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = ANY (ARRAY['artist'::app_role, 'listener'::app_role, 'manager'::app_role])
);