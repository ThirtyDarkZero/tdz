-- Fix security definer view issue
-- Recreate published_tracks_view without security definer if it exists
DROP VIEW IF EXISTS public.published_tracks_view CASCADE;

CREATE VIEW public.published_tracks_view 
WITH (security_invoker=true)
AS
SELECT 
  t.id,
  t.title,
  t.artist_name,
  t.genre,
  t.mood,
  t.duration,
  t.bpm,
  t.play_count,
  t.like_count,
  t.created_at,
  t.album_id,
  a.title as album_title,
  a.cover_art_path as album_cover
FROM public.tracks t
LEFT JOIN public.albums a ON t.album_id = a.id
WHERE t.is_published = true;