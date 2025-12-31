-- Allow playlists to contain either native TDZ tracks (tracks.id) OR external/YouTube tracks (virtual_tracks.id)

-- 1) Add virtual_track_id (text) to playlist_tracks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'playlist_tracks'
      AND column_name = 'virtual_track_id'
  ) THEN
    ALTER TABLE public.playlist_tracks
      ADD COLUMN virtual_track_id text;
  END IF;
END $$;

-- 2) Make track_id nullable (so a row can reference a virtual track instead)
ALTER TABLE public.playlist_tracks
  ALTER COLUMN track_id DROP NOT NULL;

-- 3) FK to virtual_tracks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'playlist_tracks_virtual_track_id_fkey'
  ) THEN
    ALTER TABLE public.playlist_tracks
      ADD CONSTRAINT playlist_tracks_virtual_track_id_fkey
      FOREIGN KEY (virtual_track_id)
      REFERENCES public.virtual_tracks(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4) Ensure exactly one reference is set (XOR)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'playlist_tracks_track_ref_check'
  ) THEN
    ALTER TABLE public.playlist_tracks
      ADD CONSTRAINT playlist_tracks_track_ref_check
      CHECK ( (track_id IS NOT NULL) <> (virtual_track_id IS NOT NULL) );
  END IF;
END $$;

-- 5) Index for virtual track lookups
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_virtual_track_id
  ON public.playlist_tracks (virtual_track_id);
