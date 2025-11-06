-- Add audio quality field to tracks table for Dolby Atmos and HD Audio support
ALTER TABLE public.tracks 
ADD COLUMN audio_quality TEXT DEFAULT 'standard' CHECK (audio_quality IN ('standard', 'hd', 'dolby_atmos', 'hi_res'));

-- Add comment for documentation
COMMENT ON COLUMN public.tracks.audio_quality IS 'Audio quality tier: standard (MP3, AAC), hd (FLAC, WAV), dolby_atmos (EC-3, AC-4 with Atmos), hi_res (24-bit or higher)';

-- Add index for filtering by audio quality
CREATE INDEX idx_tracks_audio_quality ON public.tracks(audio_quality) WHERE audio_quality IN ('dolby_atmos', 'hi_res');