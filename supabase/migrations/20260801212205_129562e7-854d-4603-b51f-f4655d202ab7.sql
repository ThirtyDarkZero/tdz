-- Column-level lockdown: sensitive payment credentials must never be readable
-- through the Data API, even by the owning artist.
REVOKE SELECT, INSERT, UPDATE ON public.artist_payout_details FROM authenticated;

GRANT SELECT (
  id, artist_id, square_customer_id, account_holder_name,
  payout_enabled, last_payout_date, created_at, updated_at, stripe_connect_id
) ON public.artist_payout_details TO authenticated;

GRANT INSERT (
  id, artist_id, account_holder_name, created_at, updated_at
) ON public.artist_payout_details TO authenticated;

GRANT UPDATE (
  account_holder_name, updated_at
) ON public.artist_payout_details TO authenticated;

GRANT ALL ON public.artist_payout_details TO service_role;