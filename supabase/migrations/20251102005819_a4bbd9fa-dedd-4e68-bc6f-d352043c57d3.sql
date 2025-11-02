-- Add motion cover support to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS motion_cover_path TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS motion_cover_bucket TEXT DEFAULT 'motion-covers';

-- Add motion cover support to albums table
ALTER TABLE albums ADD COLUMN IF NOT EXISTS motion_cover_path TEXT;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS motion_cover_bucket TEXT DEFAULT 'motion-covers';

-- Update the I Own Rome track with the motion cover
UPDATE tracks 
SET motion_cover_path = '8832a61a-474d-42be-ad9a-6506473156cd/artwork/1761959730378-The Grand Motion Cover.mp4',
    motion_cover_bucket = 'motion-covers'
WHERE title = 'I Own Rome' AND artist_name = 'RobHayes';