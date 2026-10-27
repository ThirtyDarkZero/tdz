-- OPT-IN: make historical tips payable.  RUN ONLY AFTER REVIEWING THE SHORTFALL REPORT.
-- Requires migration 20261027150000_money_ledger.sql.
-- Adds one pending earnings row per completed tip that was never credited
-- (net of the 2.9% + $0.30 processing fee). The hourly payout run then pays
-- artists who meet the $50 + 50-stream rule. Safe to re-run: each tip is keyed.

INSERT INTO public.artist_earnings
  (artist_id, period_start, period_end, tip_revenue, streaming_revenue, download_revenue,
   total_streams, total_downloads, payout_status, idempotency_key)
SELECT t.artist_id,
       date_trunc('month', t.created_at)::date,
       (date_trunc('month', t.created_at) + interval '1 month - 1 day')::date,
       GREATEST(t.amount - round(t.amount * 0.029 + 0.30, 2), 0),
       0, 0, 0, 0, 'pending',
       'tip:' || t.square_payment_id
FROM public.artist_tips t
WHERE t.status = 'completed'
  AND t.square_payment_id IS NOT NULL
  AND GREATEST(t.amount - round(t.amount * 0.029 + 0.30, 2), 0) > 0
ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
