

# Update Stripe Secret Key & Verify Stripe-Only Payment System

## What's Happening
The payment system code is already fully migrated to Stripe — the artist payout settings UI correctly shows "Stripe Connect Payouts" with no Square references. The main action needed is updating the Stripe secret key so all edge functions use the new credentials.

## Plan

### 1. Update Stripe Secret Key
Use the `update_stripe_secret_key` tool to let you securely enter the new key. This updates the `STRIPE_SECRET_KEY` secret used by all edge functions (checkout, payouts, balance checks, etc.).

### 2. Clean Up Legacy Square References
- **Remove `SquareOAuthCallback` route** from `App.tsx` and delete `src/pages/SquareOAuthCallback.tsx`
- **Remove `get-square-config` edge function** (no longer needed)
- **Remove `create-square-subscription` edge function** (replaced by `create-checkout-session`)
- **Rename DB column references**: The `artist_payout_details` table still uses `square_merchant_id` to store Stripe Connect account IDs — add a migration to rename it to `stripe_connect_id` for clarity, and update all code that references it

### 3. Verify All Edge Functions Use STRIPE_SECRET_KEY
These functions already use `STRIPE_SECRET_KEY` correctly:
- `create-checkout-session` — Stripe Checkout subscriptions
- `check-subscription` — subscription verification
- `setup-artist-payout` — Stripe Connect onboarding
- `process-artist-payout` — Stripe transfers to artists
- `stripe-balance` — CEO balance monitoring
- `create-tip-session` — artist tips
- `scheduled-artist-payouts` — automated monthly payouts

No code changes needed in these — they automatically pick up the new secret.

### 4. Update Frontend References
- `ArtistPayoutSettings.tsx`: Change `square_merchant_id` references to `stripe_connect_id`
- `StripeFinancialAgents.tsx`: Update safe view references if column is renamed

### Files Modified
- `src/App.tsx` — remove Square OAuth route
- `src/components/ArtistPayoutSettings.tsx` — rename column references
- `src/components/admin/StripeFinancialAgents.tsx` — update column references
- Delete: `src/pages/SquareOAuthCallback.tsx`, `supabase/functions/get-square-config/`, `supabase/functions/create-square-subscription/`
- New migration: rename `square_merchant_id` → `stripe_connect_id` in `artist_payout_details`

