-- Update rate limit to 20 uploads per hour
CREATE OR REPLACE FUNCTION public.check_upload_rate_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uploads_count integer;
  v_window_start timestamptz;
  v_max_uploads_per_hour integer := 20; -- Increased from 10 to 20
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
$function$;

-- Create storage bucket for motion art covers (animated album covers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'motion-covers', 
  'motion-covers', 
  true,
  52428800, -- 50MB limit for video files
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for motion-covers bucket
CREATE POLICY "Anyone can view motion covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'motion-covers');

CREATE POLICY "Users can upload their own motion covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'motion-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own motion covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'motion-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own motion covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'motion-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);