-- Check if INSERT policy exists for track-files, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND cmd = 'INSERT'
    AND policyname LIKE '%track%'
  ) THEN
    CREATE POLICY "Users can upload track files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'track-files' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;