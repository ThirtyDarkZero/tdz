-- Drop and recreate the published_tracks_view with file_path included
DROP VIEW IF EXISTS public.published_tracks_view;

CREATE VIEW public.published_tracks_view 
WITH (security_invoker=true) AS
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
  t.album_cover_path,
  t.album_cover_bucket,
  t.file_path,
  a.title as album_title
FROM public.tracks t
LEFT JOIN public.albums a ON t.album_id = a.id
WHERE t.is_published = true;