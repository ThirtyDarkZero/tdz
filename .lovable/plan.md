

# Fix Login Error + Evolve the Discovery Side

## Part 1 — Fix the login that's blocking you and your users

I have two suspects but need one detail to nail it. The auth logs for the past hour show only **successful** logins (CEO logged in 19:41 UTC), so the failure is happening client-side. The most likely culprits, ordered by probability:

### Suspect A — `loadRole` race-condition guard skips the second call (most likely)

In `src/contexts/AuthContext.tsx`:

```ts
if (loadingRoleRef.current && lastUserIdRef.current === userId) return;
```

The auth flow fires **twice** rapidly: once from `onAuthStateChange(SIGNED_IN)` and once from `getSession()`. The second call hits the guard and returns **before** `setIsRoleLoading(true)` and **before** `setIsRoleLoading(false)` ever resolve again. Result: `isRoleLoading` stays `true` for some users, `RequireGuest` falls back to its 2.5s timeout, and the page appears to "freeze" or show a generic loader before bouncing.

### Suspect B — Email confirmation required

If the test user signed up but never clicked the confirmation email, `signIn` returns `email_not_confirmed`. Our toast for this exists but reads "Please confirm your email" — easy to miss.

### Suspect C — Validation schema mismatch on legacy passwords

The sign-**in** schema only requires `password.min(1)` (good). But if a user copy-pasted with whitespace, `.trim()` only runs on email. Low probability.

### Fixes (sprint mode)

1. **Rewrite `loadRole`** to drop the userId guard and always release `isRoleLoading` in `finally`. Use a per-call AbortController-style ref instead.
2. **Force a single role-load path** — gate inside `useEffect` so `getSession` doesn't re-trigger if `onAuthStateChange` already fired.
3. **Surface the real Supabase error** in the toast when sign-in fails (currently a generic "Unable to sign in right now"), so future failures are diagnosable in one screenshot.
4. **Add a "Resend confirmation email" link** under the password field when the sign-in error is `email_not_confirmed`.
5. **Auth-page diagnostics** — log `event` + `error.code` from `onAuthStateChange` to console so you can see exactly what's failing in the next attempt.

## Part 2 — Ways to evolve the Discovery side

The Discovery surface is already strong (3D carousel, genre Top 50, immersive hero, mood bubbles). High-impact next moves, ranked by effort vs. signal:

### Tier 1 — Ship this sprint (high signal, low effort)
1. **"Today's Drop" hero rotator** — pin the freshest TDZ release at top with a 10s audio preview on hover, $1/stream badge, and a one-tap *Save to Library*.
2. **Live "Now Streaming" ticker** — subtle marquee under the hero showing real-time plays from across the platform (anonymized: *"Someone in Atlanta just played..."*). Powered by `stream_events` realtime.
3. **Smart "For You" rail** that learns from `listening_history` — first 10 tracks personalized, falls back to mood-based for new users.
4. **Artist Story Cards** — Instagram-style 24h disappearing posts on the hero strip (artists already have `artist_posts` table; surface them).

### Tier 2 — Differentiators (medium effort, big positioning win)
5. **"Discover by Mood" full-screen experience** — tapping a mood bubble fades the whole UI into that mood's color palette and queues a 30-track mix (uses existing `generate-mood-mix` function).
6. **Geo Heatmap rail** — *"Trending in your city"* — uses listener demographics to surface tracks blowing up locally.
7. **Co-listening rooms** — extend the existing Listen Together banner into named, joinable rooms (Lo-Fi Lounge, Hype Hour) with chat.
8. **"Resonated" reactions** — Spotify has likes; we have *Resonated* (hand-raise emoji). Surface Resonated counts on every track row + a personal *Resonance Score* on the listener profile.

### Tier 3 — Platform-defining (larger build)
9. **Deep Artist Pages 2.0** — merge YouTube discography, MusicBrainz bio, and TDZ originals into a single living page with a "Behind the Music" AI-generated narrative.
10. **Ticket → Stream attribution** — when a fan buys an Eventbrite ticket through TDZ, auto-add the artist's catalog to a *"You're Going!"* playlist with countdown.
11. **Fan Impact Wall** — show each fan how many dollars they've sent to artists this month based on their intentional plays. Built-in viral share.
12. **Curator profiles** — let any user become a playlist curator with follower counts; their playlists surface in Discovery alongside editorial.

## Question I need answered

To pick the right login fix, please confirm which error you saw:

- A toast that said something specific (paste the text), OR
- The page just spun forever / went blank, OR
- It said "Invalid email or password" but credentials are correct

If you can't tell, I'll just ship **all five** auth fixes in Part 1 plus pick **Tier 1 items 1–3** for Discovery.

