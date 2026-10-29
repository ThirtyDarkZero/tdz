-- Per-artist payout shortfall: earned minus paid minus in-flight
WITH earned AS (
  SELECT artist_id, SUM(total_earnings) AS total_earned, SUM(total_streams) AS total_streams
  FROM public.artist_earnings GROUP BY artist_id
), paid AS (
  SELECT artist_id,
    SUM(amount) FILTER (WHERE status = 'completed') AS paid_out,
    SUM(amount) FILTER (WHERE status IN ('pending','processing')) AS in_flight,
    SUM(amount) FILTER (WHERE status = 'failed') AS failed
  FROM public.artist_payouts GROUP BY artist_id
)
SELECT e.artist_id,
  COALESCE(ap.artist_name, '') AS artist_name,
  e.total_streams,
  ROUND(COALESCE(e.total_earned,0),2) AS total_earned,
  ROUND(COALESCE(p.paid_out,0),2) AS paid_out,
  ROUND(COALESCE(p.in_flight,0),2) AS in_flight,
  ROUND(COALESCE(p.failed,0),2) AS failed,
  ROUND(COALESCE(e.total_earned,0) - COALESCE(p.paid_out,0) - COALESCE(p.in_flight,0),2) AS shortfall
FROM earned e
LEFT JOIN paid p USING (artist_id)
LEFT JOIN public.artist_profiles ap ON ap.user_id = e.artist_id
ORDER BY shortfall DESC;
