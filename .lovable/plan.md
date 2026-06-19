# Discovery Leap: 5 Upgrades

Ship five new Discovery features that differentiate TDZ from Spotify/Apple Music. All build on existing infra (Orb Player, listening_history, listener_demographics, generate-mood-mix, Three.js, Listen Together).

## 1. "Why This Track?" Transparency Badges
Every recommended track row/card gets a small tappable badge revealing the recommendation reason.
- Reasons computed client-side from existing data: `track_likes`, `artist_follows`, `listening_history`, `listener_demographics` (city match), BPM/genre similarity to last played.
- Badge examples: *"3 Participants in your city resonated this week"*, *"Similar mood to your last play"*, *"Rising 240% on TDZ"*.
- New component: `src/components/discovery/WhyThisTrackBadge.tsx` + `src/hooks/useRecommendationReasons.ts`.
- Wired into `SongRow`, `ForYouCard`, `MinimalTrackCard`.

## 2. Live "Pulse" Rail — Real-Time City Heatmap
Horizontal rail at top of Discovery showing what's playing *right now* across cities.
- Pulls last 5 min of `listening_history` joined with `listener_demographics.city`.
- Animated 3D globe thumbnail (Three.js, reuses `Scene3D`) with pulsing dots per city.
- Tap city → filters Discovery feed to that city's top resonating tracks.
- New: `src/components/discovery/PulseRail.tsx`, `src/components/discovery/PulseGlobe.tsx`, `src/hooks/useLivePulse.ts` (5s polling, no Realtime per privacy memory).

## 3. AI Mood Mix Quick-Cast
One-tap natural-language playlist generator surfaced as a hero pill above the feed.
- Reuses existing `generate-mood-mix` edge function.
- Input row of mood pills (Chill, Hype, Focus, Heartbreak, Drive) + free-text "Tell me a vibe…".
- Streams generated tracks straight into the Orb Player queue with crossfade.
- New: `src/components/discovery/MoodCastBar.tsx`. Hook: `src/hooks/useMoodCast.ts`.

## 4. Resonance Graph — Propagation Visualizer
Tap any track → modal shows a Three.js node graph of how it spread Participant-to-Participant.
- Data: `user_shares`, `artist_follows`, `track_likes` ordered by time → builds parent/child chain.
- Renders animated force-directed graph (lightweight, no extra deps; uses existing three.js).
- New: `src/components/discovery/ResonanceGraphModal.tsx`, `src/hooks/useResonanceGraph.ts`.

## 5. Momentum Spotlight Row
Replaces a generic "Trending" row with **Momentum** — tracks with the highest 24h growth velocity, not raw plays.
- Computes delta from `listening_history` counts (last 24h vs prior 24h) per track, top 20.
- Each card shows velocity arrow + % growth + "Rising in [city]" microcopy.
- New: `src/components/discovery/MomentumRow.tsx`, `src/hooks/useMomentumTracks.ts`.
- Slotted near top of `src/pages/Discover.tsx` above existing "For You".

## Integration
All five mount inside `src/pages/Discover.tsx` in this top-down order:
1. PulseRail (sticky-ish top)
2. MoodCastBar
3. MomentumRow
4. Existing "For You" + sections — now with WhyThisTrackBadge on every row
5. ResonanceGraphModal triggered globally from track rows (long-press / menu item)

## Technical Notes
- No schema changes; all five read from existing tables.
- Polling intervals: Pulse 5s, Momentum 60s (cached).
- Respects Listener PII Anonymization memory — city only, never user IDs in public UI.
- Honors Glassmorphic UI Standard (80px blur), Six Caps headings, Raleway body, Coral #FF6347 accents.
- Mobile: Pulse globe collapses to flat horizontal city chips; Resonance graph becomes vertical timeline.

## Out of Scope
- No backend/edge function changes (mood-mix already exists).
- No changes to Studio, Player internals, or auth.
- No new dependencies.

Ready to build all 5 in sequence per your sprint preference.
