

## Problem Analysis

Users cannot upload photo covers when uploading singles and albums through the MultiTrackUploader component. This is because **the album cover upload functionality is completely missing** from the upload flow.

### Root Cause

The `MultiTrackUploader.tsx` component (which is the main upload interface accessed via Studio → Upload Dialog) does not include the `AlbumCoverUploader` component. While the cover uploader exists and works in `CreateAlbumDialog` and `EditAlbumDialog`, it was never integrated into the primary upload workflow.

### Current State

| Component | Has Cover Upload? |
|-----------|------------------|
| MultiTrackUploader (main upload) | No |
| CreateAlbumDialog | Yes |
| EditAlbumDialog | Yes |
| TrackMetadataForm Assets tab | Only placeholder UI (not functional) |

---

## Implementation Plan

### Step 1: Add Album Cover Uploader to MultiTrackUploader

**File:** `src/components/MultiTrackUploader.tsx`

**Changes:**
- Import the `AlbumCoverUploader` component
- Add state for `coverArtPath` to store the uploaded cover path
- Add the `AlbumCoverUploader` UI element prominently positioned (after release type selection or before the track list)
- Make cover art required for EP and Album release types (optional for singles)
- Pass the cover art path to the album creation logic during upload

### Step 2: Update Album Creation to Include Cover Art

**File:** `src/components/MultiTrackUploader.tsx`

**Changes in `handleUpload` function:**
- Include `cover_art_path` when creating the album record in the database
- For singles, optionally store cover art on the track or skip

### Step 3: Update the TrackMetadataForm Assets Tab (Optional Enhancement)

**File:** `src/components/TrackMetadataForm.tsx`

**Changes:**
- Replace placeholder upload areas with functional `AlbumCoverUploader` components
- Wire up the motion artwork uploads if needed for Apple Music distribution
- Add state management and callbacks to parent component

### Step 4: Add Validation for Required Cover Art

**File:** `src/components/MultiTrackUploader.tsx`

**Changes:**
- For EPs and Albums, prevent upload submission if no cover art is provided
- Show validation message indicating cover art is required
- Add visual indicator on the cover upload area showing it's required

---

## Technical Details

### State Additions (MultiTrackUploader)
```typescript
const [coverArtPath, setCoverArtPath] = useState<string | null>(null);
const [coverArtUrl, setCoverArtUrl] = useState<string | null>(null);
```

### Handler Function
```typescript
const handleCoverUpload = (path: string, publicUrl: string) => {
  setCoverArtPath(path);
  setCoverArtUrl(publicUrl);
};
```

### UI Position
The cover uploader will be placed:
1. After the release type selection cards
2. Before the audio file upload area
3. Prominently displayed with clear visual hierarchy

### Validation Logic
```typescript
// In handleUpload
if (releaseType !== 'single' && !coverArtPath) {
  toast({ 
    title: "Cover art required", 
    description: "Please upload album artwork for EPs and Albums",
    variant: "destructive" 
  });
  return;
}
```

### Album Insert Update
```typescript
const { data: albumData, error: albumError } = await supabase
  .from('albums')
  .insert({
    user_id: user.id,
    title: releaseTitle.trim(),
    artist_name: artistName.trim(),
    genre: genre?.trim() || null,
    description: description?.trim() || null,
    cover_art_path: coverArtPath, // ADD THIS
    is_published: false,
    total_tracks: tracks.length
  })
  .select()
  .single();
```

---

## Expected Outcome

After implementation:
- Users will see a prominent album cover upload section in the MultiTrackUploader
- Cover art will be required for EPs and Albums
- Cover art will be optional but available for singles
- The uploaded cover will be saved with the album/tracks in the database
- Covers will display correctly in the music library and discovery sections

