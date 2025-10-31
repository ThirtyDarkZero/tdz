-- Add release_date to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS release_date date;

-- Add scheduled_release_date to albums table if not exists (for reference)
ALTER TABLE albums ADD COLUMN IF NOT EXISTS scheduled_release_date date;

-- Create index for efficient querying of tracks ready to publish
CREATE INDEX IF NOT EXISTS idx_tracks_release_date ON tracks(release_date) WHERE is_published = false;

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests from cron
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;