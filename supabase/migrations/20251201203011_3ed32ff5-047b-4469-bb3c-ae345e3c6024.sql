-- Add storage policies for listener-images bucket (fan profile photos)
-- Allow users to view all profile images (public bucket)
CREATE POLICY "Anyone can view listener profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listener-images');

-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listener-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listener-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listener-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);