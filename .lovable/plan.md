

# TDZ Super Prompt Sprint — Full Implementation Plan

This is a 33-page sprint covering 13 sections. I'll fix the existing build errors first, then work through each section in dependency order.

---

## Phase 0: Fix Existing Build Errors (Immediate)

The `NodeJS.Timeout` type errors across 7 files need fixing by replacing `NodeJS.Timeout` with `ReturnType<typeof setTimeout>`. Files: `Landing.tsx`, `MusicPlayer.tsx`, `DiscoveryHeader.tsx`, `MinimalHeader.tsx`, `YouTubePlayerEnhanced.tsx`, `useCrossfade.tsx`, `useUploadDraft.ts`, `security.ts`.

---

## Phase 1: Database Migrations

New tables and columns needed (some already exist like `support_tickets`, `smart_links`):

- `support_articles` (id, title, body, category, updated_at)
- `artist_contacts` (id, artist_id, email, first_name, last_name, city, source, imported_at)
- `conversations` + `messages` (for DMs with Realtime)
- `artist_narrative` (artist_id, origin_story, artist_mission, target_audience, emotional_core, unique_value_prop, brand_voice, key_phrases, updated_at)
- `artist_content` (id, artist_id, type, media_url, caption, tags, published_at, status, performance_score, explore_featured)
- `content_likes`, `content_comments`, `content_saves`
- `content_schedule` (for calendar)
- `tour_dates` (id, artist_id, venue, city, state, country, date_time, ticket_url, status)
- `inner_circle_config` + `inner_circle_members`
- `user_privacy_settings`
- `smart_link_clicks` (smart_link_id, platform, user_agent, country, timestamp)
- `payout_ledger` (if not exists)

Check existing schema against what's needed, only create what's missing.

---

## Phase 2: Artist Settings Complete Buildout (Section 1)

**1A — Support Center** (`/studio/settings/support`)
- 3-tab interface: Help Center (searchable FAQ from `support_articles`), Submit Ticket (form → `support_tickets`), Live Chat (Tawk.to embed)
- File: `src/components/studio/StudioSettings.tsx` — add support sub-route

**1B — Payouts: Square Integration**
- Already partially built. Ensure $50 minimum threshold is enforced in UI and logic
- Show connected status, disconnect option
- Admin payout approval queue in CEO Dashboard

**1C — Collaborator Invites via Email**
- Role selector + email input → `collaboration_invites` table
- Edge function to send invite email

**1D — Export Data**
- 6 export buttons, each calls an edge function that queries DB and returns CSV/ZIP
- Edge functions: `export-analytics`, `export-catalog`, `export-fans`, `export-payouts`, `export-calendar`, `export-backup`

**1E — Google Sign-In**
- Configure Google OAuth provider via `configure_auth` tool
- Add "Continue with Google" button to Auth page

**1F — Privacy Settings**
- Full privacy panel with toggles → `user_privacy_settings` table
- Blocked users list

---

## Phase 3: Promote Suite (Section 2)

**2A — CSV Fan Import** — PapaParse client-side, column mapping UI, insert to `artist_contacts`

**2B — Email Campaign Generator** — Two modes (Fan Email + Press Release), AI generation via Lovable AI edge function

**2C — Mass Email** — Resend.com integration via edge function (campaigns@thirtydarkzero.net)

**2D — Fan Direct Messaging** — Supabase Realtime conversations, chat bubble UI on both artist and fan sides

**2E — Smart Links** — Builder UI + public `/link/:slug` page with blurred artwork background, click tracking

**2F — Shopify/Squarespace Merch** — OAuth connection, product fetch, display on artist profile MERCH tab

**2G — TDZ Store in Discovery** — Add "STORE" tab to Discovery nav, connect to TDZ's own Shopify store

**2H — Tour Dates** — Artist input form, public TOUR tab on artist profile

**2I — Inner Circle Superfan Program** — Configuration, subscription flow, exclusive content feed, perks

**2J — Community Hub** — Real-time counters, engagement feed, metrics dashboard

---

## Phase 4: Storytelling Studio Data Architecture (Section 3)

- `artist_narrative` table with all fields
- "Save & Apply" state on each field
- Feed narrative data to email campaigns, smart links, community hub
- Active connections panel showing what's powered by narrative data

---

## Phase 5: Content Library Rebuild (Section 4)

**4A** — Content types (Photo, Video, Reel, Blog, etc.) push to artist profile POSTS tab
**4B** — Performance scoring algorithm (edge function cron every 15 min) → Explore page
**4C** — Remove Visual Identity System entirely
**4D** — Content Calendar with push notifications + iCal export

---

## Phase 6: Landing Page Fixes (Section 5)

**5A** — Find/replace all "No minimum threshold" → "$50 minimum payout threshold"
**5B** — Subscription card text: `#FFFFFF` at top (dark area), `#111111` at bottom (light silver area)
**5C** — GSAP ScrollTrigger scroll effects (install `gsap`):
  - Word clip reveal (large background text)
  - Section title scale-down on scroll
  - Phone mockup animate-in
  - Pricing cards stagger
**5D** — Floating crystal diamonds in hero aurora, nebula backgrounds on sections

---

## Phase 7: Artist Studio Redesign (Section 6)

- Background: `#141414` with subtle cyan radial gradient
- Sidebar: `#111111`, 260px, profile block + stats + quick actions
- Main: Greeting + 4 metric cards (IMPACT/RELEASES/EARNINGS/COMMUNITY)
- "YOUR STORY SO FAR" track list, notifications panel
- Apply to all Studio sub-pages

---

## Phase 8: YouTube API Fix (Section 8)

- Move all YouTube API calls to edge function (already have `youtube-search`)
- Ensure proper error handling (quota exceeded → graceful fallback)
- Normalize YouTube results to universal Track/Artist format

---

## Phase 9: Global Library Uniform UI (Section 9)

- Search returns Artist Profiles first, not song lists
- Universal Artist Profile page for external artists (`/discovery/artist/ext/:source/:id`)
- `createUniversalArtist` normalization function
- All results use SongRow/ArtistCard/AlbumCard consistently

---

## Phase 10: Discovery Organization (Section 11)

- **11A** — Change "New TDZ Releases" limit from 9 to 10
- **11B** — Moodscapes change entire app theme (CSS custom properties + MoodContext)
  - Each mood has nebula colors + accent color
  - SpaceBackground transitions, player bar gradient changes
  - 1.2s CSS transition on all color changes
- **11C** — Consistent page padding (80px top, 100px bottom), section spacing (64px)

---

## Phase 11: Minimizable Music Player (Section 12)

- 3 states: Full (80px bar), Mini (floating pill, 200px), Hidden
- Mini: draggable, shows tiny art + title + play/pause
- Transitions: CSS animations (300ms cubic-bezier)
- Minimize/expand/close buttons

---

## Phase 12: AI Features (Section 10)

- Smart Release Recommendations (after upload, AI suggests release timing)
- Auto-Tagging (genre, mood, BPM from upload metadata)
- Personalized Discovery (hero filtered by listening history)
- Email Subject Line Optimizer
- Community Hub AI Weekly Insights
- Narrative Strength Score (0-100)
- Smart Link Copy AI
- Quantum Label Dashboard AI analysis

All AI calls through Lovable AI edge functions (no API keys needed).

---

## Phase 13: Fan Settings Page

- Route: `/settings` (or `/fan-settings`)
- Space background, glass panels
- Categories: Account, Subscription, Listening, Privacy, Connected Apps, Support, Danger Zone
- All settings save to DB with optimistic updates

---

## Implementation Priority

I'll work through these in this order, grouping by what can be done in parallel:

1. **Fix build errors** (immediate, unblocks everything)
2. **Database migrations** (foundation for all features)
3. **Landing page fixes** (Section 5 — quick visual wins including GSAP install)
4. **Discovery organization + Moodscape themes** (Section 11)
5. **Minimizable player** (Section 12)
6. **Artist Settings** (Section 1)
7. **Studio redesign** (Section 6)
8. **Promote suite** (Section 2 — largest section)
9. **Content Library** (Section 4)
10. **Storytelling Studio** (Section 3)
11. **Global Library + YouTube fix** (Sections 8-9)
12. **AI features** (Section 10)
13. **Fan Settings** (Section 4 from original prompt)
14. **Production audit** (Section 7 + 13)

This is a very large sprint. I'll implement each phase sequentially, writing all necessary files without stopping for approval.

