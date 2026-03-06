

# TDZ Master Build v3 — Implementation Plan

This is a large multi-part update covering: Landing page fixes, Discovery complete space rebuild, Global Library uniformity, universal search/result components, and Fan Settings page.

---

## Part 1: Landing Page Fixes (Quick Wins)

**Files:** `src/pages/Landing.tsx`

1. **Fix subscription plan text colors** — In `Section7ArtistPlans` and `Section10FanPlan`, plan name labels and prices use `#BBB`/`#FFF` which blends into the gradient cards. Change plan names at top (dark area) to `#FFFFFF`, and ensure any text at the bright bottom uses `#111111`.

2. **Add floating crystal diamonds to hero aurora** — In `Section1Hero`, scatter 8-12 small diamond shapes (CSS `clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)`) with `floatDiamond` animation in the aurora gradient area.

3. **Add subtle nebula/star backgrounds to sections** — Apply faint radial-gradient nebula overlays + tiny star dots to:
   - Section 8 (Latest Releases): purple/blue nebula wisps behind black bg
   - Section 9 (TDZ Discovery): already has nebula, enhance it
   - Remove word "COSMIC" from Section 9 subtitle

---

## Part 2: Discovery Complete Space Rebuild

This is the core overhaul. All Discovery pages get the deep space environment.

### 2A: SpaceBackground Component
**File:** `src/components/discovery/SpaceBackground.tsx` (new, replaces CosmicBackground)

- Fixed position, z-index 0, pointer-events none
- Layer 1: Deep space base gradient (`#0A0A2E` → `#050510` → `#000`)
- Layer 2: 4 nebula clouds with `nebulaDrift` animation (purple, blue, teal)
- Layer 3: 150 star dots (random positions, sizes 1-3px, twinkle animation)
- Layer 4: 6-10 floating crystal diamonds with `crystalFloat` animation

### 2B: Discovery Navigation Bar
**File:** `src/components/discovery/CosmicTopBar.tsx` (rewrite)

- Fixed top, 64px, glass blur background
- Layout: `[TDZ Logo] HOME EXPLORE LIBRARY RADIO [Search Bar] [Avatar]`
- Active link: white text + 2px cyan underline
- Search bar: pill-shaped, expands on focus from 220px → 300px

### 2C: Discovery Home Tab
**File:** `src/pages/Discover.tsx` — rewrite `discover` case

- **Hero:** Swiper coverflow carousel (actual album art from DB), center slide has glow, side slides dimmed. Right side shows artist name + play button.
- **Moodscapes:** 5 bubble sphere clusters (CHILL/HYPE/FOCUS/VIBES/LATE NIGHT) with SVG connecting lines
- **Genre Pathways:** Constellation node map (8 genres as connected nodes)
- **Artist Portals:** Glowing circular rings with profile photos (use ArtistAvatar fallback), horizontal scroll
- **New This Week:** Horizontal scroll release cards (180px wide)
- **Editorial Picks:** Grid of editorial cards with overlay text

### 2D: Discovery Library Tab ("YOUR COLLECTION")
**File:** `src/pages/Discover.tsx` — rewrite `library` case

- Remove ALL "cosmic" wording → "YOUR COLLECTION"
- Hexagonal grid layout for albums/playlists
- Filter tabs: PLAYLISTS | ALBUMS | ARTISTS | SONGS | DOWNLOADED | RECENTLY ADDED
- Smart Library sidebar (280px right) with recommendation cards

### 2E: Discovery Explore Tab
**File:** `src/pages/Discover.tsx` — rewrite `trending` case

- "EXPLORE TDZ" header with chrome gradient
- Category grid (3 cols desktop, responsive)
- Glass morphism category cards

### 2F: Player Bar
**File:** `src/components/discovery/CosmicPlayerBar.tsx` (rewrite)

- 80px height, 3-column grid layout
- Left: track art (48px, rounded-8) + title/artist
- Center: transport controls + progress bar (cyan→purple gradient fill)
- Right: volume + extra controls

### 2G: Remove "Cosmic" Language Everywhere
Search-and-replace across all Discovery components:
- "Your Cosmic Collection" → "Your Collection"
- "New Galaxies This Week" → "New This Week"
- "Editorial Constellations" → "Editorial Picks"
- "Cosmic Orbital Navigation" → remove label
- "Artist Portals" → keep (it's descriptive, not "cosmic")

### 2H: Artist Profile Image Fix
**File:** `src/components/discovery/ArtistAvatar.tsx` (new)

Universal avatar component with:
- `src` field mapping: tries `profileImageUrl`, `image`, `avatarUrl`, `profile_image_path`
- `onError` fallback to gradient + initials
- Used everywhere: cards, rows, playlists, search results

---

## Part 3: Universal Search & Result Components

### 3A: SongRow Component
**File:** `src/components/discovery/SongRow.tsx` (new)

- 6-column grid: # | art(44px) | title+artist | album | duration | actions
- Hover: show play button over index, show like/more actions
- Playing state: cyan background tint
- Used consistently for ALL track displays across the platform

### 3B: ArtistCard Component  
**File:** `src/components/discovery/ArtistCard.tsx` (new)

- 160px wide card with ArtistAvatar (120px), name, follower count, follow button
- Cyan orbital ring around image
- Follow button toggles state (green when following)

### 3C: AlbumCard Component
**File:** `src/components/discovery/AlbumCard.tsx` (new)

- 180px wide, square art with rounded corners
- Hover: dim art + show white play circle overlay
- Below: title, artist, year + track count

### 3D: Universal Search Results Panel
**File:** `src/components/discovery/UniversalSearchResults.tsx` (new)

- Floating panel below search bar (glass, blurred, z-300)
- Filter tabs: ALL | SONGS | ARTISTS | ALBUMS | PLAYLISTS
- "TOP RESULT" featured card + sectioned results using SongRow/ArtistCard/AlbumCard
- Empty state: telescope emoji + "No results found"

---

## Part 4: Fan Settings Page

**File:** `src/pages/FanSettings.tsx` (new) + route in `App.tsx`

- Space background, glass card panel layout
- Left sidebar (220px): category nav with sections (ACCOUNT, SUBSCRIPTION, LISTENING, PRIVACY, CONNECTED APPS, SUPPORT, DANGER ZONE)
- Right panel: renders selected settings category
- Panels: Profile (avatar + fields), Password & Security (2FA toggle), My Plan (current subscription card), Audio Quality (radio buttons + sliders), Privacy (toggles), Delete Account (red danger zone)
- All inputs use space-themed glass styling

---

## Part 5: PersistentLayout Update
**File:** `src/components/discovery/PersistentLayout.tsx`

- Replace CosmicBackground with SpaceBackground
- Sidebar uses space glass colors (#050510 bg, purple border accents)

---

## Part 6: Global Rules

- Create `/public/placeholder-album.jpg` and `/public/placeholder-artist.jpg` (dark gradient placeholders)
- Add custom scrollbar CSS to `src/index.css` for Discovery
- All Discovery content at z-index 1+, SpaceBackground at z-index 0
- Responsive: single column on mobile, horizontals become scrollable rows

---

## Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | Create SpaceBackground + ArtistAvatar components | 2 new files |
| 2 | Create SongRow, ArtistCard, AlbumCard universal components | 3 new files |
| 3 | Rewrite CosmicTopBar as Discovery nav bar | 1 file |
| 4 | Rewrite CosmicPlayerBar | 1 file |
| 5 | Rewrite Discover.tsx (all tabs: Home, Explore, Library) | 1 file |
| 6 | Update PersistentLayout with SpaceBackground | 1 file |
| 7 | Create UniversalSearchResults | 1 new file |
| 8 | Create FanSettings page + route | 2 files |
| 9 | Fix Landing.tsx (plan text colors, crystals, nebula bgs, remove "cosmic") | 1 file |
| 10 | Remove "cosmic" wording from all components | Multiple files |
| 11 | Create placeholder images | 2 assets |
| 12 | Test Discovery functionality end-to-end | Browser tools |

---

## Technical Notes

- No database migrations needed — all changes are frontend visual/UX
- Swiper.js already installed for coverflow carousel
- All existing Discovery functionality (playback, likes, queue, search, library sources) is preserved — only the visual presentation changes
- The CosmicNav orbital navigation is replaced by the Moodscapes bubble clusters + Genre Pathways constellation
- PremiumTrackList is replaced by the universal SongRow component for consistency

