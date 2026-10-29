-- TDZ artist shortfall report — READ ONLY (changes nothing)
-- One row per artist who was shorted, overpaid, or is owed money now.
--
-- Confirmed shortfall (exact, from payout records):
--   unpaid_after_payout   streams credited to an earnings row AFTER that row was paid out;
--                         those dollars were marked paid but never transferred
--   reversed_not_repaid   transfers Stripe reversed; earnings stayed "paid"
--   failed_not_reopened   transfers that failed while their earnings stayed "paid"
--   unpaid_tips           tips Stripe charged (verified webhook) but never added to earnings,
--                         net of the 2.9% + $0.30 processing fee used for downloads and merch
-- Review:
--   unverified_tips_review "completed" tips with no verified Stripe payment (possibly forged
--                         before the 2026-10-27 security fix); not counted as owed
-- Estimate (approximate):
--   est_lost_streams_usd  paid-subscriber streams in listening history that never reached
--                         earnings (concurrent streams overwriting each other). Uses each
--                         listener's current subscription dates, so treat it as an estimate.
-- Review:
--   paid_no_payout_record earnings marked paid with no payout record (paid off-platform?)
--   adhoc_payouts_usd     CEO payouts not tied to earnings rows; that money may ALSO be in
--                         pending_now, i.e. the artist could be paid twice
--   pending_now           unpaid balance today (paid out by the hourly run once PR #1 is live)

WITH
completed AS (
  SELECT id, artist_id, amount, earnings_ids
  FROM public.artist_payouts
  WHERE status = 'completed'
),
row_payouts AS (            -- how many completed payouts cover each earnings row
  SELECT e.id, e.artist_id, e.total_earnings, e.payout_status,
         count(c.id) AS n_completed
  FROM public.artist_earnings e
  LEFT JOIN completed c ON e.id = ANY (c.earnings_ids)
  GROUP BY e.id, e.artist_id, e.total_earnings, e.payout_status
),
a_after_payout AS (
  SELECT c.artist_id,
         sum(GREATEST(r.rows_now - c.amount, 0)) AS unpaid_after_payout
  FROM completed c
  JOIN LATERAL (
    SELECT coalesce(sum(e.total_earnings), 0) AS rows_now
    FROM public.artist_earnings e
    WHERE e.id = ANY (c.earnings_ids)
  ) r ON true
  WHERE cardinality(c.earnings_ids) > 0
  GROUP BY c.artist_id
),
adhoc AS (
  SELECT artist_id, sum(amount) AS adhoc_payouts_usd
  FROM completed
  WHERE cardinality(coalesce(earnings_ids, '{}')) = 0
  GROUP BY artist_id
),
reversed AS (
  SELECT p.artist_id, sum(p.amount) AS reversed_not_repaid
  FROM public.artist_payouts p
  WHERE p.status = 'reversed'
  GROUP BY p.artist_id
),
failed AS (
  SELECT r.artist_id, sum(r.total_earnings) AS failed_not_reopened
  FROM row_payouts r
  WHERE r.payout_status = 'paid' AND r.n_completed = 0
    AND EXISTS (SELECT 1 FROM public.artist_payouts p
                WHERE p.status = 'failed' AND r.id = ANY (p.earnings_ids))
  GROUP BY r.artist_id
),
paid_no_record AS (
  SELECT r.artist_id, sum(r.total_earnings) AS paid_no_payout_record
  FROM row_payouts r
  WHERE r.payout_status = 'paid' AND r.n_completed = 0
    AND NOT EXISTS (SELECT 1 FROM public.artist_payouts p WHERE r.id = ANY (p.earnings_ids))
  GROUP BY r.artist_id
),
expected_streams AS (       -- valid streams by listeners on a paid plan at play time
  SELECT t.user_id AS artist_id, count(*) AS expected_paid_streams
  FROM public.listening_history lh
  JOIN public.tracks t ON t.id = lh.track_id
  JOIN public.user_subscriptions s ON s.user_id = lh.user_id
  WHERE s.plan::text IN ('starter', 'pro', 'enterprise', 'fan')
    AND lh.played_at >= s.started_at
    AND (coalesce(s.canceled_at, s.expires_at) IS NULL
         OR lh.played_at < coalesce(s.canceled_at, s.expires_at))
    AND lh.user_id <> t.user_id
  GROUP BY t.user_id
),
credited_streams AS (
  SELECT artist_id, sum(total_streams) AS credited_paid_streams
  FROM public.artist_earnings
  WHERE idempotency_key IS NULL
  GROUP BY artist_id
),
tips AS (
  SELECT t.artist_id,
         sum(GREATEST(t.amount - round(t.amount * 0.029 + 0.30, 2), 0))
           FILTER (WHERE EXISTS (SELECT 1 FROM public.stripe_webhook_events w
                  WHERE w.status = 'processed' AND w.signature_valid
                    AND w.payload -> 'data' -> 'object' ->> 'payment_intent' = t.square_payment_id)) AS unpaid_tips,
         sum(t.amount) FILTER (WHERE NOT EXISTS (SELECT 1 FROM public.stripe_webhook_events w
                  WHERE w.status = 'processed' AND w.signature_valid
                    AND w.payload -> 'data' -> 'object' ->> 'payment_intent' = t.square_payment_id)) AS unverified_tips
  FROM public.artist_tips t
  WHERE t.status = 'completed'
    AND NOT EXISTS (SELECT 1 FROM public.artist_earnings e
                    WHERE e.idempotency_key = 'tip:' || t.square_payment_id)
  GROUP BY t.artist_id
),
pending AS (
  SELECT artist_id, sum(total_earnings) AS pending_now
  FROM public.artist_earnings
  WHERE payout_status IN ('pending', 'processing')
  GROUP BY artist_id
),
artists AS (
  SELECT artist_id FROM a_after_payout UNION SELECT artist_id FROM adhoc
  UNION SELECT artist_id FROM reversed UNION SELECT artist_id FROM failed
  UNION SELECT artist_id FROM paid_no_record UNION SELECT artist_id FROM expected_streams
  UNION SELECT artist_id FROM pending UNION SELECT artist_id FROM tips
)
SELECT
  ap.artist_name,
  a.artist_id,
  round(coalesce(x.unpaid_after_payout, 0), 2)  AS unpaid_after_payout,
  round(coalesce(rv.reversed_not_repaid, 0), 2) AS reversed_not_repaid,
  round(coalesce(f.failed_not_reopened, 0), 2)  AS failed_not_reopened,
  round(coalesce(tp.unpaid_tips, 0), 2)         AS unpaid_tips,
  round(coalesce(tp.unverified_tips, 0), 2)     AS unverified_tips_review,
  round(coalesce(x.unpaid_after_payout, 0) + coalesce(rv.reversed_not_repaid, 0)
        + coalesce(f.failed_not_reopened, 0) + coalesce(tp.unpaid_tips, 0), 2) AS confirmed_shortfall_usd,
  coalesce(es.expected_paid_streams, 0)         AS expected_paid_streams,
  coalesce(cs.credited_paid_streams, 0)         AS credited_paid_streams,
  GREATEST(coalesce(es.expected_paid_streams, 0) - coalesce(cs.credited_paid_streams, 0), 0) * 1.00
                                                AS est_lost_streams_usd,
  round(coalesce(pr.paid_no_payout_record, 0), 2) AS paid_no_payout_record,
  round(coalesce(ah.adhoc_payouts_usd, 0), 2)   AS adhoc_payouts_usd,
  round(coalesce(pd.pending_now, 0), 2)         AS pending_now,
  coalesce(d.payout_enabled, false)             AS stripe_ready,
  d.stripe_connect_id IS NOT NULL               AS stripe_connected
FROM artists a
LEFT JOIN public.artist_profiles ap        ON ap.user_id = a.artist_id
LEFT JOIN public.artist_payout_details d   ON d.artist_id = a.artist_id
LEFT JOIN a_after_payout x   ON x.artist_id = a.artist_id
LEFT JOIN reversed rv        ON rv.artist_id = a.artist_id
LEFT JOIN failed f           ON f.artist_id = a.artist_id
LEFT JOIN paid_no_record pr  ON pr.artist_id = a.artist_id
LEFT JOIN adhoc ah           ON ah.artist_id = a.artist_id
LEFT JOIN expected_streams es ON es.artist_id = a.artist_id
LEFT JOIN credited_streams cs ON cs.artist_id = a.artist_id
LEFT JOIN pending pd         ON pd.artist_id = a.artist_id
LEFT JOIN tips tp            ON tp.artist_id = a.artist_id
ORDER BY confirmed_shortfall_usd DESC, est_lost_streams_usd DESC, pending_now DESC;
