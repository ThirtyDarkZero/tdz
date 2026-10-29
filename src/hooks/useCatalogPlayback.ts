import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { usePlayer } from "@/contexts/PlayerContext";
import { useGlobalLibrary } from "@/hooks/useGlobalLibrary";
import { resolvePlayable, toPlayerTrack, type CatalogTrack } from "@/lib/catalog";

type AddToPlaylist = (track: { id: string; title: string; artist_name: string; youtubeId?: string; thumbnail?: string; album_title?: string }) => void;

// Play, queue, like and add-to-playlist for catalog tracks. Songs without a
// video yet are looked up once on first play, then remembered by the catalog.
export function useCatalogPlayback(artistName: string, onAddToPlaylist?: AddToPlaylist) {
  const { playTrack, currentTrack } = usePlayer();
  const { toggleGlobalLike, isGlobalTrackLiked, loadLikedGlobalTracks } = useGlobalLibrary();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Record<string, string | null>>({});

  useEffect(() => { loadLikedGlobalTracks(); }, [loadLikedGlobalTracks]);

  const withVideo = useCallback(
    (t: CatalogTrack): CatalogTrack => (t.id in resolved ? { ...t, youtube_id: resolved[t.id] ?? t.youtube_id } : t),
    [resolved],
  );

  const play = useCallback(async (track: CatalogTrack, list: CatalogTrack[], albumTitle?: string) => {
    let current = withVideo(track);
    if (!current.youtube_id) {
      setLoadingId(track.id);
      try {
        const r = await resolvePlayable(track.id);
        setResolved((m) => ({ ...m, [track.id]: r.youtube_id }));
        if (!r.youtube_id) {
          toast.error(`"${track.title}" isn't available to stream yet.`);
          return;
        }
        current = { ...current, youtube_id: r.youtube_id, thumbnail: r.thumbnail };
      } catch (e) {
        toast.error((e as Error).message || "Couldn't start playback");
        return;
      } finally {
        setLoadingId(null);
      }
    }
    // Queue the playable songs from this list; others are looked up when reached.
    const queue = list.map(withVideo).map((t) => (t.id === track.id ? current : t)).filter((t) => t.youtube_id)
      .map((t) => toPlayerTrack(t, artistName, albumTitle));
    playTrack(toPlayerTrack(current, artistName, albumTitle), queue);
  }, [artistName, playTrack, withVideo]);

  const asLibraryTrack = useCallback((t: CatalogTrack, albumTitle?: string) => {
    const v = withVideo(t);
    return {
      id: `catalog-${t.id}`, title: t.title, artist_name: artistName, youtubeId: v.youtube_id ?? undefined,
      thumbnail: v.thumbnail ?? undefined, source: "youtube" as const, album_title: albumTitle,
      duration: t.duration_sec ?? undefined,
    };
  }, [artistName, withVideo]);

  const like = useCallback((t: CatalogTrack, albumTitle?: string) => {
    if (!withVideo(t).youtube_id) { toast.info("Play this song once before liking it."); return; }
    toggleGlobalLike(asLibraryTrack(t, albumTitle));
  }, [asLibraryTrack, toggleGlobalLike, withVideo]);

  const liked = useCallback((t: CatalogTrack) => isGlobalTrackLiked(asLibraryTrack(t)), [asLibraryTrack, isGlobalTrackLiked]);

  const addToPlaylist = useCallback((t: CatalogTrack, albumTitle?: string) => {
    if (!onAddToPlaylist) { toast.info("Open this artist from Discover to add songs to playlists."); return; }
    onAddToPlaylist(asLibraryTrack(t, albumTitle));
  }, [asLibraryTrack, onAddToPlaylist]);

  const isCurrent = useCallback((t: CatalogTrack) => currentTrack?.id === `catalog-${t.id}`, [currentTrack]);

  return { play, like, liked, addToPlaylist, isCurrent, loadingId, withVideo };
}
