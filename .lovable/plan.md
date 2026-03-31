# TDZ Platform Overhaul: Stripe Migration, Discovery UX, Player Fixes

## Overview

This is a multi-phase update covering: (1) full payment migration from Square to Stripe, (2) Discovery UI polish to match the player/profile aesthetic, (3) player artwork and glow fixes, (4) visualizer fullscreen, (5) carousel tightening, and (6) Investor page phone mockup sync.

---

## Phase 1: Square → Stripe Payment Migration

### What changes

Replace all Square payment infrastructure with Stripe. This affects subscriptions, tips, download purchases, and artist payouts.

### Steps

1. **Enable Stripe via Lovable's native Stripe integration** — this provisions Stripe keys and exposes Stripe-specific tools/docs for implementation.
2. **Rewrite `create-checkout-session` edge function** — Replace Square `payment-links` API with Stripe Checkout Sessions (`stripe.checkout.sessions.create`). Map the 4 plans (starter $9.99, pro $19.99, enterprise $49.99, fan $12.00) to Stripe Price objects. Use `mode: 'subscription'` with `success_url` and `cancel_url`.
3. **Rewrite `create-tip-session` edge function** — Replace Square payment processing with Stripe PaymentIntents for one-time tip amounts ($1–$500).
4. **Rewrite `process-download-purchase` edge function** — Replace Square Payments API with Stripe PaymentIntents for track download purchases.
5. **Rewrite `setup-artist-payout` edge function** — Replace Square customer creation with Stripe Connect (Express accounts) for artist bank account linking and payouts.
6. **Rewrite `process-artist-payout` and `scheduled-artist-payouts**` — Use Stripe Transfer API to pay artists from platform balance instead of Square payout API.
7. **Update client-side checkout** — Rewrite `src/lib/subscription-checkout.ts`: rename `openSquareCheckout` → `openStripeCheckout`, call updated edge function, redirect to Stripe Checkout URL.
8. **Update `SubscriptionModal.tsx`, `Pricing.tsx`, `Landing.tsx**` — Replace all `openSquareCheckout` imports/calls with the new Stripe checkout function.
9. **Update `SubscriptionSuccess.tsx**` — Handle Stripe's `session_id` query param instead of just `plan`. Verify payment via Stripe API before activating subscription.
10. **Remove/archive Square-specific edge functions**: `get-square-config`, `square-account-balance`, `square-oauth-url`, `square-oauth-callback`, `create-square-subscription`.
11. **Update `SquareOAuthCallback.tsx**` — Remove or redirect to Stripe Connect onboarding flow.
12. **Update CEO Dashboard** — Replace `square-account-balance` with Stripe balance retrieval.
13. Add back the quantum intellegent label ai agents into studio and deploy agents across all functions of the app using [https://github.com/langchain-ai/deepagents](https://github.com/langchain-ai/deepagents)

---

## Phase 2: Discovery Top/Bottom Bars — Match Player UI

### What changes

Restyle `CosmicTopBar` and `BottomNavBar` to use the same dark glassmorphic treatment as `OrbPlayerBar` (deep blur, coral accents, ultra-dark backgrounds).

### Steps

- **CosmicTopBar**: Change background to `rgba(3,3,15,0.92)` with `backdrop-blur(40px)`, coral active tab indicators, refined border (`rgba(255,255,255,0.06)`). Match the typography weight and spacing from OrbPlayerBar.
- **BottomNavBar**: Apply same `rgba(3,3,15,0.92)` background with coral active icon coloring, reduce padding, match the shadow treatment from the mini player bar.

---

## Phase 3: Player Artwork Fix (from Artist Profile)

### What changes

When a track is played from the artist profile, the `album_cover_path` is not being passed into the PlayerContext track object.

### Steps

- Trace how `ArtistProfile.tsx` and `UnifiedArtistProfile.tsx` call `playTrack()` and ensure the track object includes `album_cover_path`, `album_cover_bucket`, and `thumbnail` fields.
- Verify `OrbPlayerBar`'s `coverUrl` resolver handles all field mappings correctly.

---

## Phase 4: Beat-Reactive Glow on Artwork

### What changes

The glow behind artwork in the full-screen player should pulse to the beat.

### Steps

- In `OrbPlayerBar` full-screen artwork view (line ~293–308), add CSS animation that scales and modulates the glow `opacity`/`blur` using a CSS keyframe driven by `isPlaying` state.
- Use a pulsing animation (e.g., `scale(1) → scale(1.15)` on a ~500ms cycle) applied to the glow div when `isPlaying` is true.

---

## Phase 5: Fullscreen Visualizer

### What changes

Add a button to expand the visualizer canvas to fill the entire screen.

### Steps

- Add a "fullscreen" toggle button (Maximize icon) next to the visualizer theme selector.
- When toggled, render the canvas at `100vw × 100vh` with absolute positioning, hiding the top bar and controls. Add an exit button overlay.

---

## Phase 6: Discovery Main Page Organization

### What changes

Better visual hierarchy and spacing on the Discover home tab.

### Steps

- Increase section spacing from `py-5` to `py-6`/`py-8`.
- Add subtle section dividers (thin gradient lines).
- Ensure consistent section ordering: Carousel → Moodscapes → Popular Tracks → Featured Artists → New This Week → Albums → Playlists.

---

## Phase 7: Discovery Carousel — Tighten Spacing

### What changes

The 7-cover carousel on Discovery has too much gap between covers compared to the Landing page version.

### Steps

- In `Discover.tsx` carousel (line ~466), reduce `gap-2` to `gap-0` or `gap-px`.
- Increase scale values for adjacent covers (e.g., side covers at `0.92` instead of `0.82`).
- Reduce `translateX` spread so covers overlap slightly, matching the Landing page's tight coverflow effect.

---

## Phase 8: Investor Page Phone Mockups

### What changes

The `StudioPhoneMockups`, `MusicPlayerPhoneMockups`, and `DiscoveryPhoneMockups` on the Investor page need to match the Landing page versions.

### Steps

- Import and use the same phone mockup components from `Landing.tsx` in `Investors.tsx`, or update `StudioPhoneMockup.tsx` exports to reflect the current UI (coral theme, glassmorphic cards, Six Caps typography).
- Ensure visual parity between both pages.

---

## Technical Details

### Files to create/edit:

- **New edge functions**: Stripe versions of checkout, tips, purchases, payouts (6 functions)
- **Delete/archive**: 5 Square-specific edge functions
- **Client files**: `subscription-checkout.ts`, `SubscriptionModal.tsx`, `Pricing.tsx`, `Landing.tsx`, `SubscriptionSuccess.tsx`, `SquareOAuthCallback.tsx`
- **Discovery UI**: `CosmicTopBar.tsx`, `BottomNavBar.tsx`, `Discover.tsx`
- **Player**: `OrbPlayerBar.tsx`, `ArtistProfile.tsx`, `UnifiedArtistProfile.tsx`
- **Investor**: `Investors.tsx`, `StudioPhoneMockup.tsx`

### Dependencies:

- Stripe must be enabled via Lovable's native integration before implementation begins
- Stripe secret key will be collected automatically during enablement

&nbsp;

&nbsp;