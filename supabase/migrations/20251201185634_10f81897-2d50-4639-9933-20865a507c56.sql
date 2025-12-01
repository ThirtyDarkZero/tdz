-- Create storage bucket for listener profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listener-images', 'listener-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for listener image uploads
CREATE POLICY "Users can upload their listener images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listener-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for public read access
CREATE POLICY "Listener images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'listener-images');

-- Create policy for users to update their images
CREATE POLICY "Users can update their listener images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listener-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to delete their images
CREATE POLICY "Users can delete their listener images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listener-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add UPDATE policy for playlist_tracks to allow reordering
CREATE POLICY "Users can update tracks in their playlists"
ON public.playlist_tracks FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM playlists
  WHERE playlists.id = playlist_tracks.playlist_id
  AND playlists.user_id = auth.uid()
));