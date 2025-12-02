-- Add INSERT policy for track-files bucket
CREATE POLICY "Users can upload their own track files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'track-files' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Add UPDATE policy for track-files bucket
CREATE POLICY "Users can update their own track files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'track-files' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Add DELETE policy for track-files bucket (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own track files'
  ) THEN
    CREATE POLICY "Users can delete their own track files"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'track-files' AND 
      (auth.uid())::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;