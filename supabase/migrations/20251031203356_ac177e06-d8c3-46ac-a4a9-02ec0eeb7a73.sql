-- Add input validation constraints and minimize data exposure for published tracks

-- 1. Add check constraints for data validation
ALTER TABLE public.tracks
  ADD CONSTRAINT tracks_title_length CHECK (char_length(title) <= 200 AND char_length(title) > 0),
  ADD CONSTRAINT tracks_artist_length CHECK (char_length(artist_name) <= 100 AND char_length(artist_name) > 0),
  ADD CONSTRAINT tracks_duration_positive CHECK (duration > 0);

-- 2. Add check constraint for file paths (must belong to user)
ALTER TABLE public.tracks
  ADD CONSTRAINT tracks_file_path_format CHECK (file_path ~ '^[a-f0-9-]+/[0-9]+-[a-zA-Z0-9._-]+$');

-- 3. Create a secure view for published tracks that exposes only necessary fields
DROP VIEW IF EXISTS public.published_tracks_view;
CREATE VIEW public.published_tracks_view AS
SELECT 
  t.id,
  t.title,
  t.artist_name,
  t.duration,
  t.genre,
  t.play_count,
  t.like_count,
  t.bpm,
  t.mood,
  t.created_at,
  t.album_id,
  a.title as album_title,
  a.cover_art_path as album_cover
FROM tracks t
LEFT JOIN albums a ON t.album_id = a.id
WHERE t.is_published = true;

-- Grant access to the view
GRANT SELECT ON public.published_tracks_view TO anon, authenticated;

-- 4. Add rate limiting for track uploads (prevent spam)
CREATE TABLE IF NOT EXISTS public.upload_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  uploads_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.upload_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits"
ON public.upload_rate_limits FOR SELECT
USING (auth.uid() = user_id);

-- Function to check and update rate limits (max 10 uploads per hour)
CREATE OR REPLACE FUNCTION public.check_upload_rate_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uploads_count integer;
  v_window_start timestamptz;
  v_max_uploads_per_hour integer := 10;
BEGIN
  -- Get current rate limit data
  SELECT uploads_count, window_start 
  INTO v_uploads_count, v_window_start
  FROM public.upload_rate_limits
  WHERE user_id = p_user_id;

  -- If no record exists or window expired, create/reset
  IF v_window_start IS NULL OR v_window_start < (now() - interval '1 hour') THEN
    INSERT INTO public.upload_rate_limits (user_id, uploads_count, window_start)
    VALUES (p_user_id, 1, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET uploads_count = 1, window_start = now();
    
    RETURN true;
  END IF;

  -- Check if limit exceeded
  IF v_uploads_count >= v_max_uploads_per_hour THEN
    RETURN false;
  END IF;

  -- Increment counter
  UPDATE public.upload_rate_limits
  SET uploads_count = uploads_count + 1
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;

-- 5. Add validation trigger for track inserts
CREATE OR REPLACE FUNCTION public.validate_track_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check rate limit
  IF NOT public.check_upload_rate_limit(NEW.user_id) THEN
    RAISE EXCEPTION 'Upload rate limit exceeded. Maximum 10 uploads per hour.';
  END IF;

  -- Validate file path belongs to user
  IF NEW.file_path !~ ('^' || NEW.user_id::text) THEN
    RAISE EXCEPTION 'Invalid file path: must belong to user';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_track_before_insert ON public.tracks;
CREATE TRIGGER validate_track_before_insert
  BEFORE INSERT ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_track_insert();