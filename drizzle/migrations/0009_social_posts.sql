-- Social posting and scheduling through Ayrshare.
-- Each artist gets an Ayrshare user profile; its key is a secret kept
-- server-side (no client policy). Posts are created by the `social` function.

CREATE TABLE IF NOT EXISTS public.social_profiles (
  artist_id   uuid PRIMARY KEY,
  profile_key text NOT NULL,
  platforms   text[] NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;  -- no policies: server only

CREATE TABLE IF NOT EXISTS public.social_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id     uuid NOT NULL,
  created_by    uuid,
  body          text NOT NULL DEFAULT '',
  media_urls    text[] NOT NULL DEFAULT '{}',
  platforms     text[] NOT NULL,
  scheduled_at  timestamptz,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'scheduled', 'posted', 'partial', 'failed', 'canceled')),
  provider_id   text,
  results       jsonb NOT NULL DEFAULT '[]'::jsonb,   -- per platform: {platform, status, postUrl}
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_social_posts_artist ON public.social_posts (artist_id, COALESCE(scheduled_at, created_at) DESC);
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Artists read their social posts" ON public.social_posts;
CREATE POLICY "Artists read their social posts" ON public.social_posts FOR SELECT TO authenticated
  USING (artist_id = auth.uid() OR public.is_manager_of(auth.uid(), artist_id));

-- Which networks are linked (without exposing the key).
CREATE OR REPLACE FUNCTION public.social_platforms(p_artist uuid)
RETURNS text[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT platforms FROM public.social_profiles
                   WHERE artist_id = p_artist AND (p_artist = auth.uid() OR public.is_manager_of(auth.uid(), p_artist))), '{}');
$$;
GRANT EXECUTE ON FUNCTION public.social_platforms(uuid) TO authenticated;

-- Bucket 'social-media' (public, 500 MB limit) is created via storage tooling.
DROP POLICY IF EXISTS "Artists upload social media" ON storage.objects;
CREATE POLICY "Artists upload social media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'social-media' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_manager_of(auth.uid(), ((storage.foldername(name))[1])::uuid)));
DROP POLICY IF EXISTS "Artists delete social media" ON storage.objects;
CREATE POLICY "Artists delete social media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'social-media' AND (storage.foldername(name))[1] = auth.uid()::text);