-- Make audio-files bucket public so audio can be played
UPDATE storage.buckets 
SET public = true 
WHERE id = 'audio-files';