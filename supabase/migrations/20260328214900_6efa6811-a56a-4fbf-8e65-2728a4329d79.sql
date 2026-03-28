-- Fix 1: smart_links - Remove permissive UPDATE policy and add a security definer function for click counting
DROP POLICY IF EXISTS "Anyone can update click count" ON public.smart_links;

CREATE OR REPLACE FUNCTION public.increment_smart_link_clicks(p_short_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.smart_links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE short_code = p_short_code;
END;
$$;

-- Fix 2: user_roles - Restrict self-assignment to safe roles only
DROP POLICY IF EXISTS "Users can set their initial role" ON public.user_roles;

CREATE POLICY "Users can set their initial role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('artist'::app_role, 'listener'::app_role, 'user'::app_role)
);