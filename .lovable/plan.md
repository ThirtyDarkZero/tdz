# End-to-End Stripe Revenue System: Wire Up & Automate

## Current State

- ✅ Stripe products exist (Starter $9.99, Pro $19.99, Enterprise $49.99, Fan $12, Free $0)
- ❌ `create-checkout-session` uses **stale/invalid price IDs** → subscription failures
- ❌ Artist payout flow references `artist_payout_info` view but column was renamed; setup fails
- ❌ No Stripe webhook handler — subscriptions, downloads, and merch never get confirmed in DB
- ❌ Merch store has no Stripe checkout function at all
- ❌ No reconciliation system / financial agents for the CEO dashboard
- ❌ Auto-payout on the 1st works but pulls $0 because earnings never get recorded (no webhook)

## What I'll Build with the 5 credits we have today

### 1. Wire the new Stripe Price IDs

Update `create-checkout-session/index.ts` with the live IDs:

- starter → `price_1TMbKeGLQEZqkO65adCcqiRT`
- pro → `price_1TMbQGGLQEZqkO65HKj9j9CP`
- enterprise → `price_1TMbTkGLQEZqkO65DlF54NhG`
- fan → `price_1TMbY5GLQEZqkO65XMRXlj9c`

Add the matching product-id → tier map to `check-subscription` so plan resolution works.

### 2. Fix Artist Stripe Connect onboarding

- `ArtistPayoutSettings.tsx` reads from `artist_payout_info` view → repoint to `artist_payout_details_safe` (which has `stripe_connect_id`)
- Add `account_holder_name` capture when Stripe onboarding returns
- Add `/studio?payout=success` query handler to mark `payout_enabled=true`

### 3. Stripe Webhook (`stripe-webhook` edge function, public, no JWT)

Single source of truth that handles:

- `checkout.session.completed` → route by metadata.type:
  - `subscription` → upsert `user_subscriptions` (plan, status, expires_at)
  - `download` → insert `download_purchases` + insert `artist_earnings` row (download_revenue) for the artist
  - `merch` → insert `merch_purchases` + earnings row
- `customer.subscription.updated/deleted` → sync subscription status
- `invoice.payment_succeeded` → extend subscription
- `account.updated` → set `payout_enabled` on `artist_payout_details` when Connect account is fully onboarded
- Verifies Stripe signature with `STRIPE_WEBHOOK_SECRET` (will request from user)

### 4. Merch Store checkout

New `create-merch-checkout` edge function (mirrors `process-download-purchase`). Update `MerchStore.tsx` "Buy" button to invoke it. Adds `merch_purchases` table.

### 5. Withdraw-after-50-streams (instant payout)

Modify `process-artist-payout`:

- Allow withdrawal when `total_pending >= $50` (already in code) OR when artist has ≥50 lifetime paid streams and pending > 0
- Verifies Connect account capabilities before transfer; clear error if not onboarded

### 6. Auto-payout on the 1st (already scheduled)

Schema migration: add pg_cron job calling `scheduled-artist-payouts` at `0 0 1 * *`. Update the function to use Stripe `transfers.create` (currently it just marks rows; needs to actually move money).

### 7. Income Tracking & Reconciliation Agent

New `financial-reconciliation-agent` edge function (cron: every 6h):

- Pulls last 24h of Stripe `charges`, `transfers`, `payouts`
- Matches each to internal `artist_earnings` / `download_purchases` / `user_subscriptions` by `metadata.user_id`/`track_id`
- Inserts `unmatched_transactions` rows when no match found
- Inserts `platform_revenue` aggregates daily

New tables:

- `merch_purchases` (id, buyer_id, artist_id, item, amount, stripe_session_id)
- `unmatched_transactions` (id, stripe_object_id, type, amount, suggested_match_id, status, reviewed_by)
- `stream_revenue_audit` (track_id, stream_id, validated, amount, recorded_to_earnings)

### 8. CEO Dashboard reconciliation panel

Update `StripeFinancialAgents.tsx` to surface unmatched transactions, with one-click "Approve match" → updates record + marks reviewed.

### 9. 24/7 Health Agent

Existing `system-diagnostics` extended with:

- Stripe API ping
- Webhook delivery success rate (last 24h)
- Pending-but-stuck payouts > 7 days
- Unmatched transaction count
Logged hourly to `system_health_log`; failures notify CEO via `notifications`.

## Files Touched

**Edit:** `create-checkout-session/index.ts`, `check-subscription/index.ts`, `process-artist-payout/index.ts`, `scheduled-artist-payouts/index.ts`, `setup-artist-payout/index.ts`, `system-diagnostics/index.ts`, `ArtistPayoutSettings.tsx`, `MerchStore.tsx`, `admin/StripeFinancialAgents.tsx`, `admin/CEORevenueControl.tsx`, `supabase/config.toml`

**Create:** `stripe-webhook/index.ts`, `create-merch-checkout/index.ts`, `financial-reconciliation-agent/index.ts`

**Migration:** new tables (`merch_purchases`, `unmatched_transactions`, `stream_revenue_audit`, `system_health_log`) + RLS + cron jobs (1st-of-month payouts, 6h reconciliation, hourly health)

## What I'll Need From You

1. **Approve adding** `STRIPE_WEBHOOK_SECRET` secret — required for webhook signature verification. After deploy I'll give you the webhook URL to paste in Stripe Dashboard → Webhooks. (approved already) 
2. **Mock test** — I'll run a $0.50 test charge end-to-end via Stripe test mode to verify checkout → webhook → earnings → payout works.

## Test Plan (autonomous after deploy)

1. Invoke `create-checkout-session` with each plan → confirm session URL returned
2. Curl `stripe-webhook` with a sample event payload → confirm DB updates
3. Invoke `process-artist-payout` against a seeded artist with $60 pending → confirm transfer created
4. Run `financial-reconciliation-agent` → confirm matches logged
5. Verify CEO dashboard shows live Stripe balance + unmatched transaction