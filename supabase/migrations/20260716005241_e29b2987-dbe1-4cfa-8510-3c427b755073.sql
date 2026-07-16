
-- artist_tips: drop public completed-tips read
DROP POLICY IF EXISTS "Public can view completed tips" ON public.artist_tips;

-- artist_tips: restrict UPDATE to service_role only
DROP POLICY IF EXISTS "Only service role can update tips" ON public.artist_tips;
CREATE POLICY "Only service role can update tips"
ON public.artist_tips
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- autopilot_logs: remove from realtime publication (guard if not present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'autopilot_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.autopilot_logs';
  END IF;
END $$;

-- fan_badges: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.fan_badges;
CREATE POLICY "Authenticated users can view badges"
ON public.fan_badges
FOR SELECT
TO authenticated
USING (true);

-- fan_engagement: restrict SELECT to owner
DROP POLICY IF EXISTS "Engagement is viewable by everyone" ON public.fan_engagement;
CREATE POLICY "Users can view their own engagement"
ON public.fan_engagement
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- listener_profiles: honor is_public
DROP POLICY IF EXISTS "Authenticated users can view listener profiles" ON public.listener_profiles;
CREATE POLICY "Users can view public listener profiles or their own"
ON public.listener_profiles
FOR SELECT
TO authenticated
USING (is_public = true OR user_id = auth.uid());

-- notifications: require caller to be the actor
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications they authored"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = actor_id);

-- user_roles: remove 'user' from self-assignable roles
DROP POLICY IF EXISTS "Users can set their initial role" ON public.user_roles;
CREATE POLICY "Users can set their initial role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = ANY (ARRAY['artist'::app_role, 'listener'::app_role])
);
