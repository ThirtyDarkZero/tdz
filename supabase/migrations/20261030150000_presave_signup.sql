-- Pre-save pages that fans can actually use.
-- /presave/<slug> had no page, and signing up required a TDZ account. Fans now
-- leave an email (no account needed). Each signup also joins the artist's fan
-- email list, with consent, so release-day and later emails can reach them.

CREATE UNIQUE INDEX IF NOT EXISTS uq_presave_signups_email
  ON public.presave_signups (campaign_id, lower(email));
ALTER TABLE public.presave_signups ADD COLUMN IF NOT EXISTS consent_at timestamptz;

CREATE OR REPLACE FUNCTION public.presave_signup(p_slug text, p_email text, p_platforms jsonb DEFAULT '[]'::jsonb)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_c public.presave_campaigns;
  v_email text := lower(trim(p_email));
  v_new boolean;
BEGIN
  IF v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' OR length(v_email) > 254 THEN
    RAISE EXCEPTION 'Enter a valid email address' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_c FROM public.presave_campaigns WHERE lower(slug) = lower(p_slug) AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'This pre-save has ended' USING ERRCODE = 'P0002'; END IF;

  INSERT INTO public.presave_signups (campaign_id, email, user_id, platform_preferences, consent_at)
  VALUES (v_c.id, v_email, auth.uid(), COALESCE(p_platforms, '[]'::jsonb), now())
  ON CONFLICT (campaign_id, lower(email)) DO NOTHING;
  GET DIAGNOSTICS v_new = ROW_COUNT;

  IF v_new THEN
    UPDATE public.presave_campaigns SET total_presaves = total_presaves + 1, updated_at = now() WHERE id = v_c.id;
    INSERT INTO public.artist_contacts (artist_id, email, source, subscribed, tags)
    VALUES (v_c.user_id, v_email, 'presave', true, ARRAY['presave:' || v_c.slug])
    ON CONFLICT (artist_id, email) DO UPDATE
      SET tags = (SELECT array_agg(DISTINCT t) FROM unnest(COALESCE(artist_contacts.tags, '{}') || EXCLUDED.tags) t);
    RETURN 'joined';
  END IF;
  RETURN 'already';
END;
$$;
GRANT EXECUTE ON FUNCTION public.presave_signup(text, text, jsonb) TO anon, authenticated;
