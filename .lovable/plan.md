# Comprehensive Platform Upgrade Plan

This plan covers all requested features organized into 8 implementation phases. Each phase is self-contained and builds on the previous. one straight through upgrade do all 8 phases in one don't keep asking for approval or to continue just upgrade all 8 phases. 

---

## Phase 1: Global Artist Profile Deep Agent System

**Goal**: Every searchable artist gets a fully populated, clickable profile with discography from YouTube Music.

**Changes**:

- **Upgrade `artist-discography-agent` edge function** to also fetch: artist bio (from YouTube channel "About"), album tracklists (via YouTube Music topic playlists), artist thumbnail, and subscriber count
- **Refactor `GlobalArtistProfile.tsx**` to become the single source of truth for any global artist — auto-populates albums, singles, bio, videos from YouTube Music on load
- **Add artist name click navigation in `OrbPlayerBar.tsx**`: When playing a YouTube/global track, clicking artist name navigates to `/artist/global/{encodedArtistName}` instead of requiring a `user_id`
- **Add route** in `App.tsx`: `/artist/global/:artistName` that renders `GlobalArtistProfile` as a full page (not overlay)
- **Enable "Add to Playlist" from global tracks**: Wire `onAddToPlaylist` through `useGlobalLibrary.addGlobalTrackToPlaylist` in `GlobalArtistProfile`, `UniversalSearchResults`, and the player's 3-dot menu

---

## Phase 2: Search Results — Albums, Artists, Songs Categories + Play Fix

**Goal**: Search results properly categorized with working single-click playback.

**Changes**:

- **Fix double-click play bug** in `UniversalSearchResults.tsx`: The `handlePlayGlobal` function creates a track without resolving a YouTube ID first. Add YouTube ID resolution (via `youtube-search` edge function) before calling `playTrack`, and auto-play once resolved
- **Enhance global search results**: When clicking a global artist in search, navigate to `/artist/global/{name}` (the new route). When clicking a global album, open a `GlobalAlbumDetail` overlay that fetches tracklist from YouTube Music
- **Add "Add to Playlist" button** on each global search result row (songs, albums)

---

## Phase 3: Orb Player Fixes — Progress Ring, Repeat, 3-Dot Menu

**Goal**: Fix non-moving progress ring for YouTube tracks, add repeat, add sharing to 3-dot menu.

**Changes**:

- **Fix progress ring**: In `OrbPlayerBar.tsx`, the `pct` calculation uses `currentTrack?.duration` which is `0` for YouTube tracks. Instead, use `youtubeState.duration` from `PlayerContext` when source is YouTube: `const dur = (currentTrack?.source === 'youtube' ? youtubeState.duration : currentTrack?.duration) || 0; const time = currentTrack?.source === 'youtube' ? youtubeState.currentTime : currentTime;`
- **Add Repeat button**: Add repeat state (`off` | `all` | `one`) to `PlayerContext`. Add `Repeat` icon to the full-screen transport controls (between Skip buttons and the ring). Wire `handleTrackEnd` in `GlobalMusicPlayer.tsx` to respect repeat mode
- **3-dot menu actions**: Replace the empty `<MoreHorizontal>` button in the full-screen view with a `DropdownMenu` containing: Share (copy link, share to social), Add to Playlist, Add to Queue, View Artist, Sleep Timer

---

## Phase 4: Library = User's Collection Only

**Goal**: Library tab shows only user's liked songs, playlists, and listening history.

**Changes**:

- **Refactor Library tab** in `Discover.tsx` (`case "library"`): Show only user-created playlists, liked songs count card, and recent listening history (from `listening_history` table)
- **Remove native platform albums/artists/songs** from the library view — those belong in Discovery/Explore
- **Add "Liked Songs" card** at top that navigates to `/liked-songs`
- **Add "Recently Played" section** querying `listening_history` for the current user

---

## Phase 5: YouTube Music New Releases Agent + Album Pages

**Goal**: Pull new release albums/singles from YouTube Music, create browsable album pages.

**Changes**:

- **Create `youtube-new-releases` edge function**: Scrapes/fetches new album releases from YouTube Music's new releases section (using YouTube Data API to query official topic channels for recent uploads, or curated playlist IDs for new music)
- **Create `GlobalAlbumPage` component** (or enhance existing `GlobalAlbumDetail`): Full album page with cover art, tracklist, play-all button, individual track play — matching the existing TDZ album detail layout
- **Add "NEW RELEASES" section** to Discovery that shows YouTube Music new releases alongside TDZ releases
- **Add route** `/album/global/:albumId` for global album pages
- **Artist name clickable** in the album page, navigating to the global artist profile

---

## Phase 6: Curated Playlists Agent

**Goal**: Auto-populate and daily-update curated genre playlists in Explore.

**Changes**:

- **Create `curated-playlists` edge function**: Takes YouTube Music playlist IDs (90s Hip Hop, 90s Rock, 80s Hits, Phonk, Country) and fetches their tracks via YouTube Data API `playlistItems` endpoint
- **Create `curated_playlists` DB table**: Stores playlist metadata (name, youtube_playlist_id, tracks JSON, last_updated)
- **Create daily cron job** via `pg_cron` + `pg_net` to invoke the edge function and refresh playlist data
- **Add "CURATED FOR YOU" section** in Explore tab with glassmorphic playlist cards for each genre
- **Playlist detail view**: Clicking a curated playlist opens a tracklist view where all songs are playable via YouTube and can be added to user playlists

---

## Phase 7: Fan Onboarding Demographics + Artist Insights

**Goal**: Collect gender and more demographic data from fans, report to artists in real-time.

**Changes**:

- **Enhance `RoleSelection.tsx**` for listener role: Add fields for gender (select), age range (select), preferred genres (multi-select), country, and how they discovered TDZ
- **Add columns to `listener_profiles` table** via migration: `gender`, `age_range`, `discovery_source`
- **Create `discovery-insights-reporter` edge function**: Aggregates demographic data from `listener_demographics`, `listening_history`, `stream_events` and pushes summary to artist insights
- **Ensure `StudioInsights.tsx**` displays real demographic breakdowns (gender distribution, age ranges, geographic data) from actual DB data, not mocked

---

## Phase 8: Artist Profile Interactive Cards + Scrolling Effects

**Goal**: Make Tour Dates, Videos, Newsletters, Events cards interactive; rename Events to Merch; fix artwork display; add scroll effects.

**Changes**:

- **In `UnifiedArtistProfile.tsx**`:
  - **Tour Dates card**: Artists can post tour dates (form with venue, date, ticket link); fans see upcoming dates
  - **Videos card**: Embed YouTube videos from the artist's channel
  - **Newsletters card**: Artists can compose and post updates/newsletters
  - **Rename "Events" to "Merch"**: Connect to artist's Shopify store or show uploaded merch items
  - **Tracks section**: Show artwork next to each song; only display standalone singles (no album tracks)
  - **Releases section**: Show only albums and EPs (not singles)
- **Apply `useScrollAnimations**` hooks (ScreenPopReveal, Reveal) to artist profile sections for the same dramatic scroll effects used on Landing/Investors pages

---

## Technical Details

### New Files

- `supabase/functions/youtube-new-releases/index.ts`
- `supabase/functions/curated-playlists/index.ts`
- `supabase/functions/discovery-insights-reporter/index.ts`

### Modified Files

- `src/App.tsx` — new routes for global artists/albums
- `src/components/discovery/OrbPlayerBar.tsx` — progress ring fix, repeat button, 3-dot menu
- `src/contexts/PlayerContext.tsx` — repeat mode state
- `src/components/GlobalMusicPlayer.tsx` — repeat mode logic
- `src/components/discovery/GlobalArtistProfile.tsx` — full-page mode, enhanced agent integration
- `src/components/discovery/UniversalSearchResults.tsx` — play fix, add-to-playlist, artist navigation
- `src/pages/Discover.tsx` — library refactor, new releases, curated playlists
- `src/pages/RoleSelection.tsx` — demographic fields
- `src/pages/UnifiedArtistProfile.tsx` — interactive cards, merch rename, scroll effects
- `src/hooks/useGlobalLibrary.ts` — playlist add integration
- `supabase/functions/artist-discography-agent/index.ts` — bio, album tracklists

### Database Migrations

1. `curated_playlists` table (id, name, youtube_playlist_id, tracks JSONB, cover_url, last_updated)
2. Add `gender`, `age_range`, `discovery_source` columns to `listener_profiles`

### Cron Job

- Daily refresh of curated playlists via `pg_cron`