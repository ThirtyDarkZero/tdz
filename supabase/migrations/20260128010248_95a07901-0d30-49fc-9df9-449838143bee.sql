-- Add advanced demographics columns to listener_demographics table
ALTER TABLE listener_demographics 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS age_range text,
ADD COLUMN IF NOT EXISTS listening_time_of_day text,
ADD COLUMN IF NOT EXISTS language text,
ADD COLUMN IF NOT EXISTS referral_source text;

-- Add website column to artist_profiles for public display
ALTER TABLE artist_profiles 
ADD COLUMN IF NOT EXISTS website text;