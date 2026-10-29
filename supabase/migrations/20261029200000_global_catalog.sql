-- Global music catalog: one saved profile per artist, with typed releases and
-- playable tracks. MusicBrainz supplies identity + discography (albums, singles,
-- EPs, tracklists, cover art); YouTube supplies the playable video for each
-- track. Everything is stored, so an artist is fetched from the outside world
-- once and then served from the database.

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.catalog_artists (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  norm_name           text NOT NULL,
  mbid                text UNIQUE,                 -- MusicBrainz artist id
  youtube_channel_id  text UNIQUE,                 -- "<Artist> - Topic" channel
  image_url           text,
  country             text,
  disambiguation      text,
  artist_type         text,                        -- Person, Group, ...
  genres              text[] NOT NULL DEFAULT '{}',
  tdz_user_id         uuid,                        -- linked TDZ Distribution artist, if any
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'syncing', 'ready', 'partial', 'failed')),
  sync_error          text,
  synced_at           timestamptz,
  sync_started_at     timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_catalog_artists_norm ON public.catalog_artists (norm_name);
CREATE INDEX IF NOT EXISTS idx_catalog_artists_trgm ON public.catalog_artists USING gin (norm_name extensions.gin_trgm_ops);

CREATE TABLE IF NOT EXISTS public.catalog_releases (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id         uuid NOT NULL REFERENCES public.catalog_artists(id) ON DELETE CASCADE,
  mbid              text UNIQUE,                   -- MusicBrainz release-group id
  title             text NOT NULL,
  norm_title        text NOT NULL,
  release_type      text NOT NULL DEFAULT 'album'
                    CHECK (release_type IN ('album', 'single', 'ep', 'compilation', 'live', 'other')),
  release_date      date,
  year              integer,
  cover_url         text,
  tracklist_synced  boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_id, norm_title, release_type)
);
CREATE INDEX IF NOT EXISTS idx_catalog_releases_artist ON public.catalog_releases (artist_id, release_type, year DESC);

CREATE TABLE IF NOT EXISTS public.catalog_tracks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id      uuid NOT NULL REFERENCES public.catalog_artists(id) ON DELETE CASCADE,
  release_id     uuid REFERENCES public.catalog_releases(id) ON DELETE SET NULL,
  title          text NOT NULL,
  norm_title     text NOT NULL,
  position       integer,
  duration_sec   integer,
  youtube_id     text,
  view_count     bigint,
  mb_recording   text,
  lookup_failed  boolean NOT NULL DEFAULT false,   -- searched YouTube, nothing found
  created_at     timestamptz NOT NULL DEFAULT now()
);
-- A video can appear on several releases (single + album), once per release.
CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_tracks_release_video ON public.catalog_tracks (release_id, youtube_id)
  WHERE release_id IS NOT NULL AND youtube_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_tracks_artist_norm ON public.catalog_tracks (artist_id, norm_title);
CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_tracks_release_pos ON public.catalog_tracks (release_id, position) WHERE release_id IS NOT NULL AND position IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_tracks_artist_views ON public.catalog_tracks (artist_id, view_count DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_catalog_tracks_release ON public.catalog_tracks (release_id, position);

-- YouTube Data API units spent per day, so the catalog never exhausts the
-- quota the rest of the app needs.
CREATE TABLE IF NOT EXISTS public.catalog_api_usage (
  day    date PRIMARY KEY DEFAULT current_date,
  units  integer NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.catalog_spend_youtube_units(p_units integer, p_budget integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v integer;
BEGIN
  INSERT INTO public.catalog_api_usage (day, units) VALUES (current_date, 0) ON CONFLICT (day) DO NOTHING;
  UPDATE public.catalog_api_usage SET units = units + p_units
  WHERE day = current_date AND units + p_units <= p_budget
  RETURNING units INTO v;
  RETURN v IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.catalog_spend_youtube_units(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.catalog_spend_youtube_units(integer, integer) TO service_role;

-- Claim an artist for syncing so two visitors don't fetch the same artist at once.
CREATE OR REPLACE FUNCTION public.catalog_claim_sync(p_artist uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v uuid;
BEGIN
  UPDATE public.catalog_artists
  SET status = 'syncing', sync_started_at = now(), updated_at = now()
  WHERE id = p_artist
    AND (status <> 'syncing' OR sync_started_at < now() - interval '2 minutes')
  RETURNING id INTO v;
  RETURN v IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.catalog_claim_sync(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.catalog_claim_sync(uuid) TO service_role;

-- Bulk upsert of playable tracks found on the artist's YouTube channel.
CREATE OR REPLACE FUNCTION public.catalog_upsert_tracks(p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  INSERT INTO public.catalog_tracks (artist_id, release_id, title, norm_title, youtube_id, duration_sec, view_count)
  SELECT (r->>'artist_id')::uuid, (r->>'release_id')::uuid, r->>'title', r->>'norm_title', r->>'youtube_id',
         (r->>'duration_sec')::integer, (r->>'view_count')::bigint
  FROM jsonb_array_elements(p_rows) r
  ON CONFLICT (release_id, youtube_id) WHERE release_id IS NOT NULL AND youtube_id IS NOT NULL
  DO UPDATE SET view_count   = coalesce(EXCLUDED.view_count, catalog_tracks.view_count),
                duration_sec = coalesce(catalog_tracks.duration_sec, EXCLUDED.duration_sec);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- Apply an official tracklist to a release: positions, and the playable video
-- matched to each song (or a placeholder row found later on first play).
CREATE OR REPLACE FUNCTION public.catalog_apply_tracklist(p_release uuid, p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb; v_artist uuid; v_done boolean; n integer := 0;
BEGIN
  -- Lock the release: if two visitors open a new album at once, the second
  -- waits here, then sees it's already done instead of adding songs twice.
  SELECT artist_id, tracklist_synced INTO v_artist, v_done
  FROM public.catalog_releases WHERE id = p_release FOR UPDATE;
  IF v_artist IS NULL OR v_done THEN RETURN 0; END IF;
  -- Positions are re-assigned from the official list.
  UPDATE public.catalog_tracks SET position = NULL WHERE release_id = p_release;
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    IF r->>'youtube_id' IS NOT NULL THEN
      INSERT INTO public.catalog_tracks (artist_id, release_id, title, norm_title, position, duration_sec,
                                         youtube_id, view_count, mb_recording)
      VALUES (v_artist, p_release, r->>'title', r->>'norm_title', (r->>'position')::integer,
              (r->>'duration_sec')::integer, r->>'youtube_id', (r->>'view_count')::bigint, r->>'mb_recording')
      ON CONFLICT (release_id, youtube_id) WHERE release_id IS NOT NULL AND youtube_id IS NOT NULL
      DO UPDATE SET position = EXCLUDED.position, title = EXCLUDED.title, norm_title = EXCLUDED.norm_title,
                    mb_recording = EXCLUDED.mb_recording,
                    duration_sec = coalesce(EXCLUDED.duration_sec, catalog_tracks.duration_sec);
    ELSE
      INSERT INTO public.catalog_tracks (artist_id, release_id, title, norm_title, position, duration_sec, mb_recording)
      VALUES (v_artist, p_release, r->>'title', r->>'norm_title', (r->>'position')::integer,
              (r->>'duration_sec')::integer, r->>'mb_recording')
      ON CONFLICT (release_id, position) WHERE release_id IS NOT NULL AND position IS NOT NULL DO NOTHING;
    END IF;
    n := n + 1;
  END LOOP;
  UPDATE public.catalog_releases SET tracklist_synced = true WHERE id = p_release;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_upsert_tracks(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.catalog_upsert_tracks(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.catalog_apply_tracklist(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.catalog_apply_tracklist(uuid, jsonb) TO service_role;

-- Anyone can browse the catalog; only the catalog function writes it.
ALTER TABLE public.catalog_artists  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_tracks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_api_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Catalog artists are public" ON public.catalog_artists;
CREATE POLICY "Catalog artists are public" ON public.catalog_artists FOR SELECT USING (true);
DROP POLICY IF EXISTS "Catalog releases are public" ON public.catalog_releases;
CREATE POLICY "Catalog releases are public" ON public.catalog_releases FOR SELECT USING (true);
DROP POLICY IF EXISTS "Catalog tracks are public" ON public.catalog_tracks;
CREATE POLICY "Catalog tracks are public" ON public.catalog_tracks FOR SELECT USING (true);
