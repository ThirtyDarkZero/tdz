-- Fix: Recreate artist_earnings_summary view with SECURITY INVOKER
-- This prevents the view from running with the creator's permissions
DROP VIEW IF EXISTS public.artist_earnings_summary;

CREATE VIEW public.artist_earnings_summary
WITH (security_invoker = true)
AS
SELECT 
  artist_id,
  count(*) AS total_streams,
  count(*) AS total_earnings_dollars,
  count(*) FILTER (WHERE streamed_at > (now() - '7 days'::interval)) AS streams_this_week,
  count(*) FILTER (WHERE streamed_at > (now() - '30 days'::interval)) AS streams_this_month
FROM stream_events
GROUP BY artist_id;