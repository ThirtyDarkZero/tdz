-- Fix RLS policy to allow manager role during initial role selection
DROP POLICY IF EXISTS "Users can set their initial role" ON public.user_roles;

CREATE POLICY "Users can set their initial role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) 
  AND (role = ANY (ARRAY['artist'::app_role, 'listener'::app_role, 'user'::app_role, 'verified_artist'::app_role, 'manager'::app_role]))
);