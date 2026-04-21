

# Fix Stripe Checkout, Auth, CEO Dashboard, Eventbrite, Support & Google Login

## Issues & Fixes

### 1. Subscribe → "non-2xx" error
**Root cause**: `create-checkout-session` masks the real Stripe error and returns 500. The failing call is most likely the Stripe API version (`2025-08-27.basil`) or a price ID that doesn't exist in the active Stripe mode (test vs live).

**Fix**:
- Replace pinned API version with the SDK default (drop `apiVersion` so account default is used).
- Verify each plan's `priceId` exists at runtime; on missing/invalid, return a clear error.
- Always return `200` with `{ ok, url?, error?, stage? }` so the client can read the body (Supabase functions client treats non-2xx as opaque error).
- Log detailed `stage` markers (`auth`, `parse`, `stripe_init`, `customer_lookup`, `session_create`).
- Update `src/lib/subscription-checkout.ts` to read the new `{ ok, url, error }` shape.

### 2. Login hangs on /auth
**Root cause**: `RequireGuest` blocks rendering while `isRoleLoading` is true. If `loadRole` errors silently (RLS / network), the page never advances.

**Fix**:
- In `RequireGuest`, add a 2.5 s timeout fallback so authenticated users redirect even if role load stalls.
- In `AuthContext.loadRole`, ensure `setIsRoleLoading(false)` runs on every code path (already in `finally`, but add an outer try guard for sync throws).

### 3. CEO Dashboard missing / `/ceo` redirects to /studio
**Root cause**: `CEODashboard` redirects on first render because `isCEO=false` by default, and the role check runs in a separate effect after mount. Sidebar Crown also depends on async check.

**Fix**:
- Gate the redirect on `roleChecked && !isCEO` only (already partial — verify ordering and add explicit loading screen until role known).
- Add a top-bar/sidebar always-visible "CEO" entry for the verified CEO email (`info@thirtydarkzero.com`) using server `has_role('ceo')` cached in `AuthContext` so it's available everywhere instantly after login.

### 4. /checkout redirects to /pricing
**Root cause**: `src/pages/Checkout.tsx` still calls deleted Square endpoints (`get-square-config`, `create-square-subscription`). It also auto-redirects when Square config fails.

**Fix**:
- Replace the entire `Checkout.tsx` body with a simple Stripe redirect: read `?plan=` → call `openStripeCheckout(plan)` → on error show retry button (no redirect to /pricing).

### 5. /eventbrite-callback "missing authorization code"
**Root cause**: `eventbrite-oauth-url` uses `EVENTBRITE_API_TOKEN` (the private API token) as the OAuth `client_id`. Eventbrite rejects the authorize request silently and redirects back without `?code=`.

**Fix**:
- Add new secret `EVENTBRITE_CLIENT_ID` (OAuth App Client ID from Eventbrite App Management).
- Update `eventbrite-oauth-url` to use `EVENTBRITE_CLIENT_ID` as `client_id` (keep `EVENTBRITE_API_TOKEN` for API calls).
- Update `eventbrite-oauth-callback` to also use `EVENTBRITE_CLIENT_ID` + `EVENTBRITE_CLIENT_SECRET` for the token exchange.

### 6. Support tickets not visible in CEO Dashboard
**Root cause**: No admin tickets view exists. Tickets save to `support_tickets` table but no UI surfaces them for the CEO.

**Fix**:
- Create `src/components/admin/SupportTicketsAdmin.tsx`: lists all tickets (CEO RLS already allows via role), shows status/priority filters, lets CEO update status & add `resolution_notes`.
- Add new sidebar entry `support` (LifeBuoy icon) in `AdminSidebar` and render the new component in `CEODashboard`'s tab switch.

### 7. "Continue with Google" not working on /auth
**Root cause**: Likely Google provider isn't enabled in Lovable Cloud Auth settings; current code uses `supabase.auth.signInWithOAuth({ provider: 'google' })` which requires the provider to be enabled.

**Fix**:
- Verify Google provider is enabled in Lovable Cloud → Users → Auth Settings (managed credentials work out of the box).
- Improve error surface: when `signInWithOAuth` returns a "provider not enabled" error, show a clear toast guiding the user instead of generic "Failed to sign in with Google."

## Files to Edit / Create

| File | Action |
|---|---|
| `supabase/functions/create-checkout-session/index.ts` | Always-200 response shape + stage logging + drop API version pin |
| `src/lib/subscription-checkout.ts` | Read new `{ ok, url, error }` shape |
| `src/components/auth/AuthGuard.tsx` | Timeout fallback in `RequireGuest` |
| `src/contexts/AuthContext.tsx` | Harden `loadRole` error path; expose `isCEO` flag |
| `src/pages/CEODashboard.tsx` | Show loader until `roleChecked`, then decide |
| `src/components/studio/StudioSidebar.tsx` | Use `isCEO` from context (immediate render) |
| `src/pages/Checkout.tsx` | Rewrite as Stripe redirect page |
| `supabase/functions/eventbrite-oauth-url/index.ts` | Use `EVENTBRITE_CLIENT_ID` |
| `supabase/functions/eventbrite-oauth-callback/index.ts` | Use `EVENTBRITE_CLIENT_ID` + secret |
| `src/components/admin/SupportTicketsAdmin.tsx` | New: CEO ticket queue UI |
| `src/components/admin/AdminSidebar.tsx` | Add "Support" tab |
| `src/pages/CEODashboard.tsx` | Render `SupportTicketsAdmin` for `support` tab |
| `src/pages/Auth.tsx` | Better Google error surfacing |

## Required User Action After Approval
1. Add secret `EVENTBRITE_CLIENT_ID` (OAuth Client ID from Eventbrite App Management).
2. Confirm Google provider is enabled in Lovable Cloud → Auth Settings (managed credentials).

## Test Plan (autonomous)
1. `curl create-checkout-session` for each plan (starter/pro/enterprise/fan) — expect `{ ok: true, url }`.
2. Verify `/checkout?plan=pro` redirects to Stripe.
3. Sign in with email/password — confirm redirect to /studio within 3s.
4. Visit `/ceo` as CEO — confirm dashboard renders, sidebar Crown visible.
5. Open new "Support" tab — list of tickets renders.
6. Click "Connect Eventbrite" in Studio — confirm authorize URL has correct `client_id` and Eventbrite returns a `code`.
7. Click "Continue with Google" — confirm OAuth popup or clear error.

