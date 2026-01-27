
# Comprehensive Fix Plan: Multiple Discovery and Player Issues

## Overview

This plan addresses 16 distinct issues affecting the Discovery experience, player functionality, and content organization across the TDZ platform.

---

## Issues Summary

| # | Issue | Component | Priority |
|---|-------|-----------|----------|
| 1 | Singles need individual cover art | MultiTrackUploader | High |
| 2 | Profile photos not showing on artist/fan cards | MinimalArtistCard, Discovery | High |
| 3 | YouTube player time doesn't move | YouTubePlayerEnhanced | High |
| 4 | TDZ artist cards need profile photos | MinimalArtistCard | High |
| 5 | Album artwork not showing in player bar | MusicPlayer, PlayerContext | High |
| 6 | Fans can't upload playlist cover art | PlaylistManager | Medium |
| 7 | No way to get back to Studio from Discover | PersistentLayout | Medium |
| 8 | Singles showing as albums (wrong categorization) | ArtistProfile, Discovery | High |
| 9 | New TDZ releases need artwork | PremiumTrackList, Discovery | High |
| 10 | Artist cards show 0 listeners | MinimalArtistCard, data sync | High |
| 11 | Artist profile release categorization wrong | ArtistProfile | High |
| 12 | Photo gallery missing in artist profile | ArtistProfile | Medium |
| 13 | Downloads allowed without account | MusicPlayer | High (Security) |
| 14 | Global library search shows wrong artists | UnifiedMusicEngine | Medium |

---

## Technical Implementation Details

### 1. Singles Need Individual Track Cover Art

**Files to modify:**
- `src/components/MultiTrackUploader.tsx`

**Changes:**
- Add `trackCoverPath` state for each track in the tracks array
- When release type is "single", show `AlbumCoverUploader` per-track instead of album-level
- Update the database insert to store `album_cover_path` directly on the track record
- The `tracks` table already has `album_cover_path` and `album_cover_bucket` columns

**Implementation:**
```typescript
// Add to TrackFile interface
interface TrackFile {
  id: string;
  file: File;
  title: string;
  duration: number;
  coverPath?: string; // NEW: Individual track cover
  coverUrl?: string;  // NEW: Preview URL
}

// In handleUpload for singles:
// Store cover_art_path on track record, not album
```

---

### 2 & 4. Profile Photos Not Showing on Artist/Fan Cards

**Files to modify:**
- `src/components/discovery/MinimalArtistCard.tsx`
- `src/hooks/useDiscoveryData.ts`

**Root cause:** The `profile_image_path` from `artist_profiles` may not be loading correctly or the bucket fallback isn't working.

**Changes:**
- Verify `artist_profiles` data includes `profile_image_path` in the query
- Add `avatar-uploads` to the IMAGE_BUCKETS fallback list (users may upload there)
- Log image loading failures for debugging

---

### 3. YouTube Player Time Doesn't Move

**Files to modify:**
- `src/components/youtube/YouTubePlayerEnhanced.tsx`

**Root cause:** The time tracking interval (line 203-225) updates `currentTime` state, but this may not be triggering re-renders properly, or the slider value binding is incorrect.

**Changes:**
- Verify the interval is running (add debug logging)
- Ensure the Slider component is receiving updated values
- Check if `duration` is being set correctly (line 187)
- Confirm `setCurrentTime` is being called with valid numbers

---

### 5. Album Artwork Not Showing in Player Bar

**Files to modify:**
- `src/contexts/PlayerContext.tsx`
- `src/components/GlobalMusicPlayer.tsx`
- `src/components/MusicPlayer.tsx`

**Root cause:** When tracks are loaded, the `album_cover_path` and `album_cover_bucket` may not be passed through the context.

**Changes:**
- Ensure `playTrack` in PlayerContext preserves all cover art fields
- In MusicPlayer, the `getCoverUrl` function (line 545-554) looks correct but may receive tracks without the paths
- Add fallback to check `track.album?.cover_art_path` if direct path is missing
- For YouTube tracks, use `thumbnail` field as cover

---

### 6. Fans Can't Upload Playlist Cover Art

**Files to modify:**
- `src/components/PlaylistManager.tsx`

**Current state:** The PlaylistManager already has cover upload functionality (lines 119-189), but it may be restricted to artists only.

**Changes:**
- Remove the artist-only restriction for cover uploads
- Allow fans to upload static covers (motion covers can remain artist-only)
- Ensure the upload UI is visible in the create/edit dialogs for all users

---

### 7. No Way to Get Back to Studio from Discover (for Artists)

**Files to modify:**
- `src/components/discovery/PersistentLayout.tsx`

**Current state:** There's already a Studio link in the sidebar (lines 145-158) that shows when `isArtist` is true.

**Investigation needed:**
- Check if the `isArtist` check is working correctly
- Ensure the Studio button is visible on both desktop and mobile
- Verify `useUserRole` is returning the correct role

**Changes:**
- Make Studio link more prominent in the sidebar
- Add Studio icon to the mobile header for quick access

---

### 8 & 11. Singles Showing as Albums / Release Categorization Wrong

**Files to modify:**
- `src/pages/ArtistProfile.tsx`
- `src/hooks/useDiscoveryData.ts`
- Database migration may be needed

**Root cause:** The current categorization (lines 393, 463 in ArtistProfile.tsx) filters by title containing "single" or "ep", which is unreliable.

**Changes:**
- Add `release_type` column to `albums` table (single, ep, album)
- When creating albums in MultiTrackUploader, store the selected release type
- Update ArtistProfile to filter by `release_type` field, not title
- Update Discovery views to respect release types

**Database migration needed:**
```sql
ALTER TABLE albums ADD COLUMN release_type text DEFAULT 'album';
```

---

### 9. New TDZ Releases Need Artwork

**Files to modify:**
- `src/pages/Discover.tsx`
- `src/components/discovery/PremiumTrackList.tsx`

**Root cause:** The `tdzReleases` memo (lines 125-162) filters for tracks with covers, but the track grid may not be displaying covers.

**Changes:**
- In PremiumTrackList, ensure each track card shows the `album_cover_path` image
- Add cover art display to MinimalTrackCard if not already present
- Prioritize tracks with artwork in the display order

---

### 10. Artist Cards Show 0 Listeners

**Root cause:** The `monthly_listeners` column in `artist_profiles` is 0 for all artists (confirmed by database query).

**Files to modify:**
- Edge function: `supabase/functions/record-stream/index.ts`
- Create new function or trigger to update listener counts

**Changes:**
- Create a database trigger or scheduled function to calculate monthly listeners from `streams` table
- Query: Count distinct user_ids who streamed artist's tracks in last 30 days
- Update `artist_profiles.monthly_listeners` accordingly

**Database function:**
```sql
-- Create a function to update monthly listeners
CREATE OR REPLACE FUNCTION update_monthly_listeners()
RETURNS void AS $$
BEGIN
  UPDATE artist_profiles ap
  SET monthly_listeners = (
    SELECT COUNT(DISTINCT s.user_id)
    FROM streams s
    JOIN tracks t ON t.id = s.track_id
    WHERE t.user_id = ap.user_id
    AND s.created_at > NOW() - INTERVAL '30 days'
  );
END;
$$ LANGUAGE plpgsql;
```

---

### 12. Photo Gallery Missing in Artist Profile

**Files to modify:**
- `src/pages/ArtistProfile.tsx`

**Current state:** UnifiedArtistProfile.tsx loads from `artist_gallery` table (line 148-152), but ArtistProfile.tsx doesn't.

**Changes:**
- Add gallery loading to ArtistProfile.tsx (similar to UnifiedArtistProfile)
- Add a Gallery section below the About section
- Display photos in a responsive grid

---

### 13. Downloads Allowed Without Account (Security Issue)

**Files to modify:**
- `src/components/MusicPlayer.tsx` (lines 460-508)

**Current state:** The downloadTrack function checks for user authentication for paid downloads but allows free downloads without checking.

**Changes:**
- Add authentication check at the start of downloadTrack
- Require sign-in for all downloads, not just paid ones
- Show toast prompting user to sign in if not authenticated

```typescript
const downloadTrack = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast({ 
      title: "Sign in Required", 
      description: "Please sign in to download tracks.",
      variant: "destructive" 
    });
    return;
  }
  // ... rest of download logic
};
```

---

### 14. Global Library Search Shows Wrong Artists

**Files to modify:**
- `src/components/discovery/UnifiedMusicEngine.tsx`
- `supabase/functions/unified-music-search/index.ts`

**Changes:**
- When searching for an artist, filter results to only show that exact artist (or very close matches)
- Add stricter matching in the search function
- Use exact match for artist searches vs fuzzy for general searches

---

## Implementation Order

1. **Security First:** Fix download authentication (#13)
2. **Core Display Issues:** Album artwork in player (#5), YouTube time (#3)
3. **Content Organization:** Release type categorization (#8, #11)
4. **Profile Issues:** Artist photos (#2, #4), gallery (#12)
5. **Data Issues:** Monthly listeners (#10)
6. **Features:** Single cover art (#1), playlist covers (#6), Studio link (#7)
7. **Search:** Global library filtering (#14)

---

## Database Changes Required

```sql
-- 1. Add release_type to albums table
ALTER TABLE albums ADD COLUMN IF NOT EXISTS release_type text DEFAULT 'album'
CHECK (release_type IN ('single', 'ep', 'album'));

-- 2. Create function to update monthly listeners
CREATE OR REPLACE FUNCTION update_artist_monthly_listeners()
RETURNS void AS $$
BEGIN
  UPDATE artist_profiles ap
  SET monthly_listeners = COALESCE((
    SELECT COUNT(DISTINCT s.user_id)
    FROM streams s
    JOIN tracks t ON t.id = s.track_id
    WHERE t.user_id = ap.user_id
    AND s.created_at > NOW() - INTERVAL '30 days'
  ), 0);
END;
$$ LANGUAGE plpgsql;
```

---

## Testing Checklist

- [ ] Singles can upload individual cover art
- [ ] Artist cards display profile photos
- [ ] YouTube player time slider moves during playback
- [ ] Album/track artwork appears in player bar
- [ ] Fans can upload playlist covers
- [ ] Artists see Studio link in Discover sidebar
- [ ] Singles, EPs, and Albums are properly categorized
- [ ] New TDZ releases show artwork in carousel/grid
- [ ] Artist cards show real listener counts
- [ ] Artist profile shows photo gallery section
- [ ] Downloads require authentication
- [ ] Artist search returns only that artist's content
