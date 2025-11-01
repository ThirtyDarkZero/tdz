-- Add album cover columns to tracks table
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS album_cover_path TEXT,
ADD COLUMN IF NOT EXISTS album_cover_bucket TEXT DEFAULT 'album-covers';

-- Update published_tracks_view to include album cover
DROP VIEW IF EXISTS public.published_tracks_view;

CREATE VIEW public.published_tracks_view AS
SELECT 
  t.id,
  t.title,
  t.artist_name,
  t.duration,
  t.genre,
  t.mood,
  t.bpm,
  t.play_count,
  t.like_count,
  t.album_id,
  t.created_at,
  t.ai_tags,
  a.title as album_title,
  CASE 
    WHEN t.album_cover_path IS NOT NULL AND t.album_cover_bucket IS NOT NULL THEN
      concat(
        current_setting('request.protocol', true), '://',
        current_setting('request.host', true),
        '/storage/v1/object/public/',
        t.album_cover_bucket, '/',
        t.album_cover_path
      )
    WHEN a.cover_art_path IS NOT NULL THEN
      concat(
        current_setting('request.protocol', true), '://',
        current_setting('request.host', true),
        '/storage/v1/object/public/album-covers/',
        a.cover_art_path
      )
    ELSE NULL
  END as album_cover
FROM public.tracks t
LEFT JOIN public.albums a ON t.album_id = a.id
WHERE t.is_published = true
ORDER BY t.created_at DESC;