
-- 1) Stream events: only authenticated users may record their own plays
DROP POLICY IF EXISTS "Anyone can insert streams" ON public.stream_events;
CREATE POLICY "Users record their own streams"
ON public.stream_events FOR INSERT TO authenticated
WITH CHECK (listener_id = auth.uid());

-- 2) Smart link clicks: only for links that actually exist
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.smart_link_clicks;
CREATE POLICY "Clicks only for existing links"
ON public.smart_link_clicks FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.smart_links sl WHERE sl.id = smart_link_id));

-- 3) Stop anonymous enumeration of public buckets.
-- Public buckets still serve files over their public URLs; only *listing* is restricted.
DROP POLICY IF EXISTS "Anyone can view album covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view artist gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view artist images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view generated videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view listener profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view motion covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view track files" ON storage.objects;
DROP POLICY IF EXISTS "Listener images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Fan banners publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Post media publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view audio files" ON storage.objects;

CREATE POLICY "Owners can list their own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN (
    'album-covers','artist-gallery','artist-images','generated-videos',
    'listener-images','motion-covers','track-files','post-media',
    'fan-banners','audio-files'
  )
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
