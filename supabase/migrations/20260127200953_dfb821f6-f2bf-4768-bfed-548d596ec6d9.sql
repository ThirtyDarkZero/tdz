-- 1. Add release_type to albums table
ALTER TABLE albums ADD COLUMN IF NOT EXISTS release_type text DEFAULT 'album';

-- 2. Create function to update monthly listeners from listening_history
CREATE OR REPLACE FUNCTION update_artist_monthly_listeners()
RETURNS void AS $$
BEGIN
  UPDATE artist_profiles ap
  SET monthly_listeners = COALESCE((
    SELECT COUNT(DISTINCT lh.user_id)
    FROM listening_history lh
    JOIN tracks t ON t.id = lh.track_id
    WHERE t.user_id = ap.user_id
    AND lh.played_at > NOW() - INTERVAL '30 days'
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create trigger to update listeners when a stream is recorded
CREATE OR REPLACE FUNCTION increment_artist_listeners()
RETURNS TRIGGER AS $$
DECLARE
  v_artist_user_id uuid;
BEGIN
  -- Get the artist user_id from the track
  SELECT user_id INTO v_artist_user_id FROM tracks WHERE id = NEW.track_id;
  
  IF v_artist_user_id IS NOT NULL THEN
    -- Update monthly_listeners count
    UPDATE artist_profiles 
    SET monthly_listeners = COALESCE(monthly_listeners, 0) + 1
    WHERE user_id = v_artist_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_listening_history_insert ON listening_history;
CREATE TRIGGER on_listening_history_insert
  AFTER INSERT ON listening_history
  FOR EACH ROW
  EXECUTE FUNCTION increment_artist_listeners();