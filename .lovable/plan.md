## Fix: Singles vs Album Tracks Categorization + Discovery Competitive Advantages

### Problem

When an album is released, each song on that album shows up individually in Discovery as if it were a standalone single. The platform needs to distinguish:

- **True singles**: tracks with `release_type = 'single'` OR tracks with no `album_id` (not part of any album)
- **Album tracks**: tracks with an `album_id` — these should NOT appear as individual items in "New Releases" lists; the album itself should represent them

### Fix 1: Categorization Logic in `useDiscoveryData.ts`

**File: `src/hooks/useDiscoveryData.ts**`

- After loading tracks, split them into two sets:
  - `singles`: tracks where `album_id IS NULL` (true standalone singles)
  - `albumTracks`: tracks where `album_id IS NOT NULL` (belong to an album, shown only via album cards)
- The `tracks` array returned to consumers will only include singles for the main track list
- Export a new `albumTracks` map keyed by album_id for album detail views

**File: `src/pages/Discover.tsx**`

- "New TDZ Releases" (`PremiumTrackList`) will only show singles (no album_id)
- "TDZ Albums" section already shows albums correctly — no change needed
- The 3D carousel should show albums AND singles with cover art (already works)

**File: `src/pages/ArtistProfile.tsx**`

- Fix the singles filter: instead of `total_tracks === 1`, use `release_type === 'single'` only
- Albums with 1 track that are release_type `album` should stay in albums section

**File: `src/pages/Landing.tsx**`

- "Latest Releases" carousel: show albums + singles, not individual album tracks

### Fix 2: Discovery Competitive Advantages

Add features that Spotify and Apple Music don't offer:

#### A. **$1/Stream Earnings Transparency Badge** (unique differentiator)

- Show a small "$1 earned" counter on each track card — fans see exactly how much their play contributes
- File: `src/components/discovery/PremiumTrackList.tsx` — add earnings indicator per track

#### B. **Direct Artist Tipping from Discovery** (no competitor has this inline)

- Add a "Tip" button on track cards in Discovery so fans can tip artists without leaving the feed
- File: `src/components/discovery/PremiumTrackList.tsx` — add tip icon button

#### C. **Fan Impact Score** (totally unique)

- Show listeners their personal impact: "You've supported 12 artists, contributed $47 in streams"
- New component: `src/components/discovery/FanImpactCard.tsx`
- Displayed at top of Discovery for logged-in fans

#### D. **Artist Story Cards** (context Spotify lacks)

- Between track rows, show "story cards" — short artist-written notes about their latest release
- New component: `src/components/discovery/ArtistStoryCard.tsx`
- Pulls from `artist_profiles.bio` or a new story field

#### E. **Collaborative Queue** (social listening)

- Allow friends to add to a shared queue — "Listen Together" feature
- New component: `src/components/discovery/ListenTogetherBanner.tsx`
- Uses Supabase Realtime for shared queue state

#### F. **Mood-Based Discovery with AI** (already partially built via MoodMixGenerator)

- Surface the existing `MoodMixGenerator` more prominently on the main Discover tab as a "How are you feeling?" prompt
- No new component needed — just layout integration
  &nbsp;
- G. **In global library make sure albums and artists appear and are catagorized in all database searches just like they do in discogs search. fix the global library make the feature more visually pleasing.**

### Implementation Order

1. Fix track categorization in `useDiscoveryData.ts` (filter out album tracks from singles list)
2. Update `Discover.tsx` to use filtered singles for track lists
3. Fix `ArtistProfile.tsx` singles filter logic
4. Fix `Landing.tsx` latest releases to show albums + true singles only
5. Add earnings transparency badge to `PremiumTrackList`
6. Add `FanImpactCard` component to Discovery
7. Add Artist Story Cards between track rows
8. Surface MoodMixGenerator on main Discover tab
9. **In global library make sure albums and artists appear and are catagorized in all database searches just like they do in discogs search. fix the global library** 

### Technical Details

**Categorization filter (core fix):**

```text
// In useDiscoveryData loadTracks:
const singles = enhancedTracks.filter(t => !t.album_id);
const albumTracks = enhancedTracks.filter(t => t.album_id);
// Return singles as main track list, keep albumTracks for detail views
```

**No database migrations needed** — `album_id` and `release_type` columns already exist on both `tracks` and `albums` tables.

**New components:**

- `src/components/discovery/FanImpactCard.tsx` — queries `listening_history` + `artist_earnings` to compute fan's total contribution
- `src/components/discovery/ArtistStoryCard.tsx` — displays artist bio snippet with album art as contextual cards
- &nbsp;