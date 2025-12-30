-- Add comprehensive distribution metadata to tracks table
ALTER TABLE public.tracks
ADD COLUMN IF NOT EXISTS isrc TEXT,
ADD COLUMN IF NOT EXISTS upc TEXT,
ADD COLUMN IF NOT EXISTS label TEXT,
ADD COLUMN IF NOT EXISTS copyright_owner TEXT,
ADD COLUMN IF NOT EXISTS copyright_year INTEGER,
ADD COLUMN IF NOT EXISTS p_line TEXT,
ADD COLUMN IF NOT EXISTS c_line TEXT,
ADD COLUMN IF NOT EXISTS explicit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS release_type TEXT DEFAULT 'single',
ADD COLUMN IF NOT EXISTS release_version TEXT DEFAULT 'Original',
ADD COLUMN IF NOT EXISTS preorder_date DATE,
ADD COLUMN IF NOT EXISTS original_release_date DATE,
ADD COLUMN IF NOT EXISTS credits JSONB DEFAULT '{"writers": [], "producers": [], "performers": [], "featured_artists": []}'::jsonb,
ADD COLUMN IF NOT EXISTS publishing_info JSONB DEFAULT '{"pro": null, "youtube_monetization": false, "sound_exchange": false}'::jsonb,
ADD COLUMN IF NOT EXISTS apple_motion_art_1x1 TEXT,
ADD COLUMN IF NOT EXISTS apple_motion_art_3x4 TEXT,
ADD COLUMN IF NOT EXISTS metadata_complete BOOLEAN DEFAULT false;

-- Add similar fields to albums table for album-level metadata
ALTER TABLE public.albums
ADD COLUMN IF NOT EXISTS upc TEXT,
ADD COLUMN IF NOT EXISTS label TEXT,
ADD COLUMN IF NOT EXISTS copyright_owner TEXT,
ADD COLUMN IF NOT EXISTS copyright_year INTEGER,
ADD COLUMN IF NOT EXISTS p_line TEXT,
ADD COLUMN IF NOT EXISTS c_line TEXT,
ADD COLUMN IF NOT EXISTS explicit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS preorder_date DATE,
ADD COLUMN IF NOT EXISTS original_release_date DATE,
ADD COLUMN IF NOT EXISTS apple_motion_art_1x1 TEXT,
ADD COLUMN IF NOT EXISTS apple_motion_art_3x4 TEXT,
ADD COLUMN IF NOT EXISTS metadata_complete BOOLEAN DEFAULT false;

-- Create function to auto-generate ISRC if missing
CREATE OR REPLACE FUNCTION public.generate_isrc()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  country_code TEXT := 'US';
  registrant_code TEXT := 'TDZ';
  year_code TEXT;
  designation_code TEXT;
BEGIN
  year_code := to_char(NOW(), 'YY');
  designation_code := LPAD(floor(random() * 99999 + 1)::TEXT, 5, '0');
  RETURN country_code || registrant_code || year_code || designation_code;
END;
$$;

-- Create function to auto-generate UPC if missing
CREATE OR REPLACE FUNCTION public.generate_upc()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  prefix TEXT := '8';
  random_digits TEXT;
  check_digit INTEGER;
  full_upc TEXT;
  sum_odd INTEGER := 0;
  sum_even INTEGER := 0;
  i INTEGER;
BEGIN
  random_digits := LPAD(floor(random() * 99999999999 + 1)::TEXT, 11, '0');
  full_upc := prefix || random_digits;
  
  FOR i IN 1..12 LOOP
    IF i % 2 = 1 THEN
      sum_odd := sum_odd + CAST(SUBSTRING(full_upc, i, 1) AS INTEGER);
    ELSE
      sum_even := sum_even + CAST(SUBSTRING(full_upc, i, 1) AS INTEGER);
    END IF;
  END LOOP;
  
  check_digit := (10 - ((sum_odd * 3 + sum_even) % 10)) % 10;
  RETURN full_upc || check_digit::TEXT;
END;
$$;

-- Create trigger to auto-generate ISRC on track insert if missing
CREATE OR REPLACE FUNCTION public.auto_generate_track_codes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.isrc IS NULL OR NEW.isrc = '' THEN
    NEW.isrc := public.generate_isrc();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_generate_track_codes_trigger ON public.tracks;
CREATE TRIGGER auto_generate_track_codes_trigger
BEFORE INSERT ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_track_codes();

-- Create trigger to auto-generate UPC on album insert if missing
CREATE OR REPLACE FUNCTION public.auto_generate_album_codes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.upc IS NULL OR NEW.upc = '' THEN
    NEW.upc := public.generate_upc();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_generate_album_codes_trigger ON public.albums;
CREATE TRIGGER auto_generate_album_codes_trigger
BEFORE INSERT ON public.albums
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_album_codes();