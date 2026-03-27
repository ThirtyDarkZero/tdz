

# TDZ Discovery — Complete Mobile Redesign Plan

Based on the 50-page design specification document and the Loopster reference images, this is a full end-to-end rebuild of the Discovery mobile experience.

---

## What Gets Built

The entire Discovery experience is rebuilt with a living space environment, new navigation, immersive player, mood theming, and refined universal components. Every screen sits on an animated nebula background with stars and crystals.

---

## Phase 1: Foundation — Design Tokens + SpaceBackground

**`index.html`** — Add Google Fonts import for Six Caps + Raleway

**`src/index.css`** — Replace current CSS variables with the spec's token system:
- Space environment colors (`--bg-void: #03030F`, `--bg-deep: #07071A`, `--bg-surface: #0D0D26`, `--bg-elevated: #13132E`)
- Nebula colors (violet, indigo, teal, rose)
- Art-reactive dynamic colors (`--art-color-1`, `--art-color-2`, `--art-glow`)
- Glass morphism tokens (`--glass-1`, `--glass-2`, `--glass-border`, `--glass-blur`)
- Accent colors (`--cyan: #00CFFF`, `--green`, `--gold`, `--violet`, `--rose`)
- Text hierarchy (`--text-1` through `--text-4`)
- Radius tokens (`--radius-sm: 10px` through `--radius-pill: 999px`)
- Safe area and nav height variables
- Typography: Six Caps for all headings, Raleway for all body

**`src/components/discovery/SpaceBackground.tsx`** — Rewrite to match spec exactly:
- Base void gradient (`radial-gradient` with `#0A0A2E → #050510 → #000`)
- 4 nebula cloud layers with `blur(80px)` and `drift` animation (22s, 28s, 20s, 25s alternating)
- Art-reactive nebula layer that transitions color via `--art-color-1` / `--art-color-2` CSS vars (3s transition)
- 120 stars with randomized twinkle
- 6 floating crystal diamonds
- All GPU-accelerated with `will-change: transform`

---

## Phase 2: Navigation — 5-Tab Bottom Nav + Glassmorphic Top Bar

**`src/components/discovery/BottomNavBar.tsx`** — Rewrite:
- 5 tabs: HOME (house), EXPLORE (compass), LIBRARY (grid), FEED (chat), STORE (bag)
- Glassmorphic background: `rgba(3,3,15,0.88)`, `backdrop-filter: blur(32px)`
- Active state: cyan glow dot + `rgba(0,207,255,0.1)` pill background
- Raleway 10px uppercase labels, 24px icons
- Safe area bottom padding

**`src/components/discovery/CosmicTopBar.tsx`** — Rewrite:
- Fixed glassmorphic top bar (`rgba(3,3,15,0.7)`, blur 20px)
- Greeting text ("GOOD EVENING" etc.) in Raleway 12px uppercase
- Title in Six Caps 28px
- Circular glass search button (40px)
- Profile avatar right-aligned

**`src/components/discovery/PersistentLayout.tsx`** — Update:
- Render SpaceBackground as fixed base layer behind all content
- Pass through 5-tab navigation
- Account for safe areas

---

## Phase 3: Home Screen — Coverflow Carousel + Moodscapes + Sections

**`src/pages/Discover.tsx`** — Major rewrite of the `discover` tab:

- **Section A — Featured Coverflow Carousel**: Install `swiper` package. Use `effect: "coverflow"` with `rotate: 32, depth: 200`. 220x220px slides, center slide at full brightness with art-glow shadow, side slides dimmed (`brightness(0.5)`). Track name below in Six Caps 38px, artist in Raleway 15px. Play button + glass icon buttons.
- **Section B — Moodscapes**: 6 mood bubbles (CHILL, HYPE, FOCUS, VIBES, LATE NIGHT, SOUL). Tapping activates mood theme system.
- **Section C — New This Week**: Horizontal scroll of 150x150px AlbumCards.
- **Section D — Genre Pathways**: Simplified constellation SVG navigation.
- **Section E — Artist Portals**: Glowing cyan ring artist avatars, 90px, horizontal scroll.
- **Popular Tracks**: SongRow list with playing state (cyan title + cyan art glow).

---

## Phase 4: Now Playing Screen (Crown Jewel)

**`src/components/discovery/OrbPlayerBar.tsx`** — Complete rewrite:

**Full-screen mode:**
- Blurred album art background (`blur(60px)`, `saturate(1.4)`, `brightness(0.25)`) with dark vignette overlay
- Center album art: `calc(100vw - 80px)` max 340px, `border-radius: 24px`, art-glow pulsing shadow (`artPulse` 2s animation), scales 1.02 when playing / 0.98 when paused
- Track info: Six Caps 42px title, Raleway 16px artist
- Earnings badge: green `$0.00` counter (TDZ differentiator)
- **Waveform progress bar**: 60 bars of varying height, bars before playhead colored with `--art-color-1`/`--cyan`, bars after dimmed. White 14px draggable playhead dot. Time stamps in Raleway 12px.
- Controls: shuffle, skip back, play/pause (72px white circle with art-glow shadow), skip forward, repeat
- Artist mini portal (36px) + queue button at bottom

**Queue drawer**: Sheet slides up, glassmorphic background, Six Caps title, SongRow list

---

## Phase 5: 3-State Mini Player

Continue in **OrbPlayerBar.tsx**:

- **State 2 — Mini Bar**: Glassmorphic bar above bottom nav. 48px album art, Raleway track info, play/skip/close buttons. Gradient progress line (cyan→violet) along bottom edge. Art-glow box-shadow. Tap to expand to full.
- **State 3 — Floating Pill**: 56px circle, album art only, play/pause overlay on tap. Positioned bottom-right. Tap expands back to mini bar.
- CSS-based spring transitions between states (no GSAP to keep bundle small)

---

## Phase 6: Explore Screen

New tab content in **Discover.tsx** (replaces current "trending"):
- Title "EXPLORE" in Six Caps 56px
- 3 glassmorphic playlist launchers: TRENDING NOW, NEW RELEASES, TOP CHARTS (full-width, 110px, colored top border accent)
- Genre Charts Grid: 2-column glass cards, top 3 tracks per genre preview

---

## Phase 7: Library Screen (Hexagonal Collection)

New tab content in **Discover.tsx** (replaces current "library"):
- Title "YOUR COLLECTION" in Six Caps 44px
- Filter pills: PLAYLISTS, ALBUMS, ARTISTS, SONGS, DOWNLOADED, RECENT (horizontal scroll, glass active pill)
- Hexagonal grid: `clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)`, 3-column grid, 3px gap
- Each hex cell shows album art with label overlay

---

## Phase 8: Universal Components Refresh

**`src/components/discovery/SongRow.tsx`** — Update to spec:
- 52x52px art, `border-radius: 10px`, Raleway typography
- Playing state: cyan title + cyan box-shadow on art
- Duration + menu button right-aligned
- Active press: `background: var(--glass-1)`

**`src/components/discovery/AlbumCard.tsx`** — Update:
- 150x150px art, `border-radius: 16px`, play overlay on active
- Raleway 13px title, 11px artist

**New `src/components/discovery/ArtistPortal.tsx`**:
- Circular avatar with animated cyan glow ring (`portalPulse` keyframes)
- Real photo with mic icon fallback (never initials)
- Raleway 11px name label

---

## Phase 9: Mood Theme System

**`src/contexts/MoodContext.tsx`** — Update with full theme definitions:
- 6 themes (chill, hype, focus, vibes, late-night, soul) each with accent, nebula primary/secondary, art-glow
- `applyMoodTheme()` sets CSS custom properties on `document.documentElement`
- 1.4s transition across all elements
- Active mood badge shown in top bar

---

## Implementation Order

All phases implemented in a single pass across these files:
1. `index.html` — fonts
2. `src/index.css` — design tokens
3. `src/components/discovery/SpaceBackground.tsx` — living background
4. `src/components/discovery/BottomNavBar.tsx` — 5-tab nav
5. `src/components/discovery/CosmicTopBar.tsx` — glassmorphic top bar
6. `src/components/discovery/PersistentLayout.tsx` — layout wrapper
7. `src/components/discovery/ArtistPortal.tsx` — new component
8. `src/components/discovery/SongRow.tsx` — refresh
9. `src/components/discovery/AlbumCard.tsx` — refresh
10. `src/components/discovery/OrbPlayerBar.tsx` — full 3-state player
11. `src/pages/Discover.tsx` — all tabs (home, explore, library)
12. `src/contexts/MoodContext.tsx` — mood theming
13. Install `swiper` package for coverflow carousel

**No database changes needed.** All updates are purely frontend visual/UX.

---

## Technical Notes

- Swiper.js needed for coverflow carousel (`npm install swiper`)
- Art color extraction: lightweight canvas-based approach (no ColorThief dependency) — draw image to hidden canvas, sample pixels
- All animations GPU-accelerated via `transform` and `opacity` only
- SpaceBackground limited to ~130 DOM nodes for performance
- React.memo on SongRow, AlbumCard, ArtistPortal
- Six Caps for all headings/titles/numbers, Raleway for all body/labels

