

## Phase 2: Smart AI Lyrics Sync + Interactive 3D Visualizer Themes

### Feature A: Smart Lyrics Sync Editor (Studio Tool)

A new **"Lyrics Sync"** tab will be added to the Studio Music section. Artists can:

1. **Paste or type lyrics** line by line
2. **Play their track** and tap a "Sync" button to stamp each line's timestamp in real-time
3. **Fine-tune** timestamps with +/- adjustment buttons
4. **Save & Publish** the synced lyrics to the `track_lyrics_sync` table (already created in Phase 1)

**Player Enhancement:** The existing `LyricsPanel` and `FloatingPlayer` lyrics sheet will be upgraded to:
- Load synced lyrics from `track_lyrics_sync` (falling back to the old `lyric_alignments` table)
- Display real-time highlighted, karaoke-style scrolling lyrics during playback
- Show a smooth gradient fade on past/future lines

#### Files to create/modify:
- **New:** `src/components/studio/LyricsSyncEditor.tsx` -- The tap-to-sync UI with audio playback, line editor, and timestamp controls
- **Modified:** `src/components/studio/StudioMusic.tsx` -- Add a "Lyrics Sync" tab alongside Releases, Library, Rights, Gallery
- **Modified:** `src/components/LyricsPanel.tsx` -- Load from `track_lyrics_sync` first, then fall back to `lyric_alignments`; improve the visual styling with karaoke-style highlighting
- **Modified:** `src/components/FloatingPlayer.tsx` -- Wire the Lyrics button to the upgraded `LyricsPanel` component instead of the placeholder sheet

---

### Feature B: Interactive 3D Visualizer Themes

The existing `AudioVisualizer3D` component (which has 5 modes: Aurora, Waves, Sphere, Terrain, Pulse) will be expanded with **3 genre-aware themes** that auto-select based on the track's metadata:

| Theme | Target Genres | Color Palette | Visual Style |
|-------|--------------|---------------|--------------|
| Neon City | Electronic, Pop, Dance | Magenta, Cyan, Hot Pink | Glowing grid lines, pulsing neon rings |
| Retro Vinyl | Hip-Hop, Lo-Fi, R&B | Warm amber, gold, sepia | Spinning vinyl disc with grooves that react to bass |
| Deep Space | Ambient, Classical, Atmospheric | Deep blue, violet, white | Nebula particles, slow-moving star field |

**Auto-Theme Logic:** When a track starts playing, the system reads `genre` and `mood` from the track's metadata. A mapping function selects the best theme. Users can still manually override.

#### Files to create/modify:
- **Modified:** `src/components/3D/AudioVisualizer3D.tsx` -- Add 3 new visualizer components (NeonCityVisualizer, RetroVinylVisualizer, DeepSpaceVisualizer) and an auto-theme selector
- **Modified:** `src/components/MusicPlayer.tsx` -- Pass current track genre/mood to the visualizer so it can auto-select themes
- **Modified:** `src/contexts/PlayerContext.tsx` -- No changes needed (genre/mood already available on Track interface via `ai_tags`)

---

### Technical Details

#### Lyrics Sync Editor Data Format
The `track_lyrics_sync.lyrics_data` JSONB column will store:
```text
{
  "lines": [
    { "time": 0.0, "text": "First line of the song" },
    { "time": 4.2, "text": "Second line of the song" },
    ...
  ],
  "version": 1
}
```

#### Auto-Theme Mapping Function
```text
genre contains "electronic|edm|pop|dance|synth" -> "neon"
genre contains "hip-hop|rap|lofi|r&b|soul"      -> "vinyl"  
genre contains "ambient|classical|chill|atmospheric" -> "space"
fallback -> current user-selected mode (aurora, waves, etc.)
```

#### No database changes needed
The `track_lyrics_sync` table was already created in Phase 1. No new migrations required.

#### No new edge functions needed
All lyrics sync operations use direct database reads/writes via the existing RLS policies (artist can write their own track lyrics, anyone can read published lyrics).

---

### Implementation Order
1. Create `LyricsSyncEditor.tsx` and integrate into Studio Music tabs
2. Upgrade `LyricsPanel.tsx` to load from `track_lyrics_sync` with karaoke styling
3. Wire `FloatingPlayer.tsx` lyrics button to the real `LyricsPanel`
4. Add 3 new 3D visualizer theme components to `AudioVisualizer3D.tsx`
5. Add auto-theme selection logic based on track genre/mood
6. Pass track metadata through `MusicPlayer.tsx` to the visualizer
