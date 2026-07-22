## Sprint Plan

### Part 1 — Auth: Google + Apple sign-in
- Re-run `configure_social_auth` for `["google","apple"]` so managed Lovable Cloud credentials are wired in (no builder keys needed).
- Refactor `src/pages/Auth.tsx` to call `lovable.auth.signInWithOAuth("google" | "apple", { redirect_uri: window.location.origin })` (drop any legacy `supabase.auth.signInWithOAuth` calls, no iframe hacks, no `/login?google=1` shims). Handle `result.error` (toast), `result.redirected` (return), otherwise navigate to `/onboarding`.
- Preserve intended destination via a same-origin `next` param stored in `sessionStorage`, applied only after `getSession()` confirms auth.
- Verify onAuthStateChange listener registered in `AuthContext` before the getSession call.

### Part 2 — Simpler onboarding for artists & managers
- New `/onboarding` route (`src/pages/Onboarding.tsx`) — 3-step wizard:
  1. Pick role → Artist / Manager / Fan (writes `user_roles`).
  2. Artist: artist name + genre + profile image (creates `artist_profiles`).
     Manager: label/company name + logo + invite roster emails (creates `manager_profiles` + pending `collaborator_invites`).
     Fan: skip.
  3. Success → route to Studio / Manager HQ / Discover.
- Replace old post-signup redirect logic to send new users to `/onboarding` when role missing.
- Progress bar, skip buttons, autosave to draft in localStorage.

### Part 3 — Manager Roster Management (Enterprise-gated)
- New `ManagerHQ` shell replacing single-artist ManagerDashboard when plan = enterprise:
  - `src/pages/ManagerHQ.tsx` with tabs: Roster · Releases · Insights · Branding · Integrations · Settings.
  - `src/components/manager/RosterManager.tsx` — list all artists linked via `collaborator_invites` (accepted), add/remove artists, switch active artist context.
  - `src/components/manager/RosterReleases.tsx` — upload/release music on behalf of any roster artist (reuses `MultiTrackUploader` with `artist_id` prop override).
  - `src/components/manager/RosterInsights.tsx` — aggregated analytics: total streams, revenue, top tracks, per-artist breakdown, exportable CSV. Queries `listening_history`, `artist_payouts`, `tracks` filtered by roster artist_ids.
- Enterprise gate via `has_plan_access(user_id, 'enterprise')` — non-enterprise managers see upgrade CTA.
- DB: add `manager_profiles` (label_name, logo_path, brand_colors jsonb, custom_domain) + `manager_integrations` (provider, credentials jsonb encrypted, config jsonb) with RLS scoped to `auth.uid()`.

### Part 4 — White-label branding
- `src/components/manager/BrandingStudio.tsx`:
  - Logo upload (bucket `manager-branding`), primary/accent color pickers, custom font selector, favicon.
  - Preview panel showing sample artist profile with branding applied.
  - Save to `manager_profiles.brand_colors` + `logo_path`.
- `ManagerBrandingProvider` context injects CSS vars (`--brand-primary`, `--brand-logo-url`) into ManagerHQ + child artist pages when viewed under manager scope.

### Part 5 — Custom Integrations (Enterprise)
- `src/components/manager/IntegrationsHub.tsx` — cards for:
  - Google Ads Manager (OAuth via App User Connector `google_ads` if available, else API key form).
  - Meta Ads, TikTok Ads, Google Analytics 4, Mailchimp — API key/token form.
  - Zapier webhook URL (generic outbound).
- Store secrets in `manager_integrations` (service_role only, never returned to client — masked display).
- Edge function `manager-integration-proxy` performs authenticated calls using stored creds; enforces `has_plan_access enterprise`.

### Technical Details
- Migration adds `manager_profiles`, `manager_integrations`, `manager-branding` storage bucket, indexes, RLS + GRANTs.
- Reuses existing `has_plan_access`, `has_role`, `user_roles` — no privilege escalation surface.
- All new tables: `GRANT` to authenticated + service_role, RLS `auth.uid() = user_id`.
- No breaking changes to existing single-artist Manager dashboard — it stays as fallback for non-enterprise managers.

### Out of scope
- Building actual Google Ads campaign UI (surface + credential storage only in this sprint).
- Custom domain DNS provisioning (stored as string, actual routing later).
