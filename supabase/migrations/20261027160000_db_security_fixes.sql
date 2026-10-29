-- Six Sigma step 5: database security fixes.

-- 1. Self-granted paid plans. Any signed-in user could insert their own
--    user_subscriptions row with a paid plan, making their plays earn artists
--    $1 each without paying. The app only ever creates 'free' rows from the
--    browser; paid plans come from Stripe via the service role.
DROP POLICY IF EXISTS "Users can create their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can create their own free subscription"
  ON public.user_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND plan::text = 'free' AND expires_at IS NULL);

-- 2. Fake tips. Users could insert tip rows (any amount, any status) directly.
--    Tips are created only by create-tip-session and the Stripe webhook, which
--    use the service role, so the browser needs no insert access at all.
DROP POLICY IF EXISTS "Service role can insert tips" ON public.artist_tips;

-- 3. Notifications to anyone. create_system_notification let any user send a
--    notification to any other user (phishing risk). Server-side only now.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'create_system_notification'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;
