-- Add scheduled_release_date column to tracks table
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS scheduled_release_date DATE;

-- Add comment for clarity
COMMENT ON COLUMN public.tracks.scheduled_release_date IS 'Scheduled future release date for the track';