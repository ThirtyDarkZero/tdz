-- Security Hardening: Fix generated-videos bucket policy and add missing storage policies

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can upload generated videos" ON storage.objects;

-- Create user-folder-restricted policy for generated-videos uploads
CREATE POLICY "Users can upload their own generated videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'generated-videos' AND
  (
    -- Allow user-specific folders (for fallback images and scene videos)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Allow exports folder with user ID as subfolder (exports/user_id/*)
    (
      (storage.foldername(name))[1] = 'exports' AND
      auth.uid()::text = (storage.foldername(name))[2]
    )
  )
);

-- Add update policy for generated-videos
CREATE POLICY "Users can update their own generated videos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'generated-videos' AND
  (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    (
      (storage.foldername(name))[1] = 'exports' AND
      auth.uid()::text = (storage.foldername(name))[2]
    )
  )
);

-- Add delete policy for generated-videos
CREATE POLICY "Users can delete their own generated videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'generated-videos' AND
  (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    (
      (storage.foldername(name))[1] = 'exports' AND
      auth.uid()::text = (storage.foldername(name))[2]
    )
  )
);

-- Drop existing policies before recreating to avoid conflicts
DROP POLICY IF EXISTS "Users can delete their album covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their track files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their artist images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their track files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their artist images" ON storage.objects;

-- Add missing delete and update policies for public buckets
CREATE POLICY "Users can delete their album covers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'album-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their track files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'track-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their artist images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'artist-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their track files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'track-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their artist images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'artist-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);