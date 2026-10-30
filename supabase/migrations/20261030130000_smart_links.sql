-- Smart links that work.
--
-- What was broken: the Smart Link builder wrote columns that don't exist
-- (artist_id, slug, artwork_url, platforms, click_count), so every create
-- failed; the click counter updated a missing column; and no page served
-- /link/<code> or /s/<code>, so shared links 404'd.
--
-- Now a link can point at a TDZ track/album/artist and/or any outside
-- platforms, the public page reads it by code, and clicks are counted
-- per platform through one server function.

ALTER TABLE public.smart_links
  ADD COLUMN IF NOT EXISTS artwork_url text,
  ADD COLUMN IF NOT EXISTS platforms jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.smart_links ALTER COLUMN target_type DROP NOT NULL;
ALTER TABLE public.smart_links ALTER COLUMN target_id DROP NOT NULL;
ALTER TABLE public.smart_links DROP CONSTRAINT IF EXISTS smart_links_target_type_check;
ALTER TABLE public.smart_links ADD CONSTRAINT smart_links_target_type_check
  CHECK (target_type IS NULL OR target_type IN ('track', 'album', 'playlist', 'artist'));
ALTER TABLE public.smart_links DROP CONSTRAINT IF EXISTS smart_links_short_code_format;
ALTER TABLE public.smart_links ADD CONSTRAINT smart_links_short_code_format
  CHECK (short_code ~ '^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$') NOT VALID;
ALTER TABLE public.smart_links DROP CONSTRAINT IF EXISTS smart_links_has_destination;
ALTER TABLE public.smart_links ADD CONSTRAINT smart_links_has_destination
  CHECK (target_id IS NOT NULL OR platforms <> '{}'::jsonb) NOT VALID;

-- Owners can delete their links.
DROP POLICY IF EXISTS "Users can delete own smart links" ON public.smart_links;
CREATE POLICY "Users can delete own smart links" ON public.smart_links
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.smart_link_clicks ADD COLUMN IF NOT EXISTS referrer text;
CREATE INDEX IF NOT EXISTS idx_smart_link_clicks_link ON public.smart_link_clicks (smart_link_id, clicked_at DESC);

DROP FUNCTION IF EXISTS public.increment_smart_link_clicks(text);

-- Count one click (page view = platform 'view'). Callable by anyone; only
-- touches the counter and the click log.
CREATE OR REPLACE FUNCTION public.record_smart_link_click(
  p_code text, p_platform text, p_user_agent text DEFAULT NULL, p_referrer text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.smart_links WHERE lower(short_code) = lower(p_code);
  IF v_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.smart_link_clicks (smart_link_id, platform, user_agent, referrer)
  VALUES (v_id, left(COALESCE(p_platform, 'view'), 40), left(p_user_agent, 300), left(p_referrer, 300));
  IF COALESCE(p_platform, 'view') <> 'view' THEN
    UPDATE public.smart_links SET clicks = COALESCE(clicks, 0) + 1 WHERE id = v_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_smart_link_click(text, text, text, text) TO anon, authenticated;

-- Per-platform totals for the owner.
CREATE OR REPLACE FUNCTION public.smart_link_stats(p_link uuid)
RETURNS TABLE (platform text, clicks bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.platform, count(*)
  FROM public.smart_link_clicks c
  JOIN public.smart_links l ON l.id = c.smart_link_id
  WHERE c.smart_link_id = p_link AND l.user_id = auth.uid()
  GROUP BY c.platform ORDER BY 2 DESC;
$$;
GRANT EXECUTE ON FUNCTION public.smart_link_stats(uuid) TO authenticated;
