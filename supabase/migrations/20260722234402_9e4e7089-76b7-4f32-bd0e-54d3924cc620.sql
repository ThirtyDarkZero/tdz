
-- 1) Helper: is caller a manager of the given artist?
CREATE OR REPLACE FUNCTION public.is_manager_of(_manager uuid, _artist uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.manager_artists
    WHERE manager_id = _manager AND artist_id = _artist
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_manager_of(uuid, uuid) TO authenticated;

-- 2) Loosen tracks RLS so managers can act on behalf of roster artists
DROP POLICY IF EXISTS "Users can create their own tracks" ON public.tracks;
CREATE POLICY "Users or their managers can create tracks"
ON public.tracks FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.is_manager_of(auth.uid(), user_id)
);

DROP POLICY IF EXISTS "Users can update their own tracks" ON public.tracks;
DROP POLICY IF EXISTS "Users can update own tracks" ON public.tracks;
CREATE POLICY "Users or their managers can update tracks"
ON public.tracks FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_manager_of(auth.uid(), user_id)
);

DROP POLICY IF EXISTS "Users can delete their own tracks" ON public.tracks;
CREATE POLICY "Users or their managers can delete tracks"
ON public.tracks FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_manager_of(auth.uid(), user_id)
);

DROP POLICY IF EXISTS "Users can view published tracks or their own" ON public.tracks;
CREATE POLICY "View published tracks or own or managed"
ON public.tracks FOR SELECT
USING (
  is_published = true
  OR auth.uid() = user_id
  OR (auth.uid() IS NOT NULL AND public.is_manager_of(auth.uid(), user_id))
);

-- 3) Same for albums
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='albums' AND policyname='Users can create their own albums') THEN
    DROP POLICY "Users can create their own albums" ON public.albums;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='albums' AND policyname='Users can update their own albums') THEN
    DROP POLICY "Users can update their own albums" ON public.albums;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='albums' AND policyname='Users can delete their own albums') THEN
    DROP POLICY "Users can delete their own albums" ON public.albums;
  END IF;
END $$;

CREATE POLICY "Users or managers can create albums"
ON public.albums FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_manager_of(auth.uid(), user_id));

CREATE POLICY "Users or managers can update albums"
ON public.albums FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_manager_of(auth.uid(), user_id));

CREATE POLICY "Users or managers can delete albums"
ON public.albums FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.is_manager_of(auth.uid(), user_id));

-- 4) Relax file_path check in validate_track_insert:
--    allow either uploader (auth.uid()) or track owner (user_id) prefix
CREATE OR REPLACE FUNCTION public.validate_track_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.check_upload_rate_limit(auth.uid()) THEN
    RAISE EXCEPTION 'Upload rate limit exceeded. Maximum 20 uploads per hour.';
  END IF;

  IF NEW.file_path !~ ('^' || NEW.user_id::text)
     AND NEW.file_path !~ ('^' || COALESCE(auth.uid()::text, '00000000-0000-0000-0000-000000000000'))
  THEN
    RAISE EXCEPTION 'Invalid file path: must belong to track owner or uploader';
  END IF;

  RETURN NEW;
END;
$function$;

-- 5) Storage: allow managers to upload into an artist's folder in track-files & album-covers
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='mgr_upload_track_files') THEN
    DROP POLICY "mgr_upload_track_files" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='mgr_upload_album_covers') THEN
    DROP POLICY "mgr_upload_album_covers" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='mgr_upload_artist_images') THEN
    DROP POLICY "mgr_upload_artist_images" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "mgr_upload_track_files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'track-files'
  AND public.is_manager_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "mgr_upload_album_covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'album-covers'
  AND public.is_manager_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "mgr_upload_artist_images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'artist-images'
  AND public.is_manager_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- 6) Auto-create manager_artists row when an artist accepts a manager-flagged invite
CREATE OR REPLACE FUNCTION public.on_collaborator_invite_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_accepter uuid;
  v_is_manager_invite boolean := false;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    -- Detect manager-invite flag in permissions JSON
    v_is_manager_invite := (
      NEW.permissions IS NOT NULL
      AND (
        (jsonb_typeof(NEW.permissions) = 'object' AND (NEW.permissions ->> 'manager')::boolean IS TRUE)
        OR (jsonb_typeof(NEW.permissions) = 'array'  AND NEW.permissions ? 'manager')
      )
    );

    IF v_is_manager_invite THEN
      SELECT id INTO v_accepter FROM auth.users WHERE lower(email) = lower(NEW.invited_email) LIMIT 1;
      IF v_accepter IS NOT NULL AND v_accepter <> NEW.artist_id THEN
        INSERT INTO public.manager_artists (manager_id, artist_id, commission_rate)
        VALUES (NEW.artist_id, v_accepter, 15.00)
        ON CONFLICT (manager_id, artist_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_collab_invite_accepted ON public.collaborator_invites;
CREATE TRIGGER trg_collab_invite_accepted
AFTER UPDATE ON public.collaborator_invites
FOR EACH ROW EXECUTE FUNCTION public.on_collaborator_invite_accepted();
