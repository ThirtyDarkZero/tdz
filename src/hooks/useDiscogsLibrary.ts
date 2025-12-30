import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DiscogsTrack {
  id: string;
  source: "discogs";
  source_id: string;
  title: string;
  artist: string;
  cover_art_url: string;
  thumb_url?: string;
  year?: number;
  genre: string[];
  style: string[];
  format: string[];
  release_type: "album" | "single" | "ep" | "compilation";
  country?: string;
  label: string[];
  search_query: string;
  // For YouTube merge
  youtube_id?: string;
  youtube_url?: string;
}

export interface DiscogsRelease {
  id: string;
  source: "discogs";
  source_id: string;
  title: string;
  artist_name: string;
  artists?: { id: number; name: string }[];
  year?: number;
  released?: string;
  country?: string;
  genres: string[];
  styles: string[];
  formats: any[];
  release_type: string;
  labels: any[];
  cover_art_url: string;
  thumb_url?: string;
  images: any[];
  tracklist: {
    position: string;
    title: string;
    duration?: string;
    search_query: string;
    youtube_id?: string;
    youtube_url?: string;
    youtube_title?: string;
    youtube_thumbnail?: string;
  }[];
  videos?: any[];
  notes?: string;
  community?: any;
}

export interface DiscogsArtist {
  id: string;
  source: "discogs";
  source_id: string;
  name: string;
  profile?: string;
  cover_art_url?: string;
  images: any[];
  urls: string[];
  members?: any[];
}

export interface DiscogsPagination {
  page: number;
  pages: number;
  items: number;
  per_page: number;
}

export function useDiscogsLibrary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callDiscogsAPI = useCallback(async (params: Record<string, any>) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("discogs-api", {
        body: params,
      });

      if (fnError) throw fnError;
      return data;
    } catch (err: any) {
      console.error("Discogs API error:", err);
      setError(err.message || "Failed to fetch from Discogs");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(
    async (query: string, options?: { type?: string; genre?: string; style?: string; year?: string; page?: number; per_page?: number }) => {
      return callDiscogsAPI({
        action: "search",
        query,
        ...options,
      });
    },
    [callDiscogsAPI]
  );

  const browseReleases = useCallback(
    async (options: { genre?: string; style?: string; year?: string; page?: number; per_page?: number }) => {
      return callDiscogsAPI({
        action: "browse_releases",
        ...options,
      });
    },
    [callDiscogsAPI]
  );

  const browseMasters = useCallback(
    async (options: { genre?: string; style?: string; year?: string; query?: string; page?: number; per_page?: number }) => {
      return callDiscogsAPI({
        action: "browse_masters",
        ...options,
      });
    },
    [callDiscogsAPI]
  );

  const browseArtists = useCallback(
    async (query: string, options?: { page?: number; per_page?: number }) => {
      return callDiscogsAPI({
        action: "browse_artists",
        query,
        ...options,
      });
    },
    [callDiscogsAPI]
  );

  const getTrending = useCallback(
    async (options?: { genre?: string; page?: number; per_page?: number }) => {
      return callDiscogsAPI({
        action: "trending",
        ...options,
      });
    },
    [callDiscogsAPI]
  );

  const getArtist = useCallback(
    async (artistId: string) => {
      return callDiscogsAPI({
        action: "get_artist",
        artist_id: artistId,
      });
    },
    [callDiscogsAPI]
  );

  const getArtistReleases = useCallback(
    async (artistId: string, options?: { page?: number; per_page?: number }) => {
      return callDiscogsAPI({
        action: "get_artist_releases",
        artist_id: artistId,
        ...options,
      });
    },
    [callDiscogsAPI]
  );

  const getRelease = useCallback(
    async (releaseId: string) => {
      return callDiscogsAPI({
        action: "get_release",
        release_id: releaseId,
      });
    },
    [callDiscogsAPI]
  );

  const getMaster = useCallback(
    async (masterId: string) => {
      return callDiscogsAPI({
        action: "get_master",
        master_id: masterId,
      });
    },
    [callDiscogsAPI]
  );

  const getMasterVersions = useCallback(
    async (masterId: string, options?: { page?: number; per_page?: number }) => {
      return callDiscogsAPI({
        action: "get_master_versions",
        master_id: masterId,
        ...options,
      });
    },
    [callDiscogsAPI]
  );

  // Merge Discogs release with YouTube for playback
  const mergeWithYouTube = useCallback(
    async (release: DiscogsRelease): Promise<DiscogsRelease> => {
      try {
        // Get YouTube videos for each track
        const tracksWithYouTube = await Promise.all(
          release.tracklist.map(async (track) => {
            try {
              const { data } = await supabase.functions.invoke("youtube-search", {
                body: { query: track.search_query, maxResults: 1 },
              });

              const video = data?.items?.[0];
              return {
                ...track,
                youtube_id: video?.id?.videoId,
                youtube_url: video?.id?.videoId ? `https://www.youtube.com/watch?v=${video.id.videoId}` : undefined,
                youtube_title: video?.snippet?.title,
                youtube_thumbnail: video?.snippet?.thumbnails?.high?.url,
              };
            } catch {
              return track;
            }
          })
        );

        return {
          ...release,
          tracklist: tracksWithYouTube,
        };
      } catch (err) {
        console.error("Failed to merge with YouTube:", err);
        return release;
      }
    },
    []
  );

  return {
    loading,
    error,
    search,
    browseReleases,
    browseMasters,
    browseArtists,
    getTrending,
    getArtist,
    getArtistReleases,
    getRelease,
    getMaster,
    getMasterVersions,
    mergeWithYouTube,
  };
}

// Genre constants for browsing
export const DISCOGS_GENRES = [
  "Rock",
  "Electronic",
  "Pop",
  "Hip Hop",
  "Jazz",
  "Classical",
  "Funk / Soul",
  "Reggae",
  "Latin",
  "Blues",
  "Folk, World, & Country",
  "Stage & Screen",
  "Non-Music",
  "Children's",
  "Brass & Military",
] as const;

export const DISCOGS_STYLES = {
  "Electronic": ["House", "Techno", "Trance", "Drum n Bass", "Ambient", "Electro", "IDM", "Dubstep", "Synth-pop"],
  "Rock": ["Alternative Rock", "Punk", "Indie Rock", "Hard Rock", "Progressive Rock", "Grunge", "Post-Punk"],
  "Hip Hop": ["Trap", "Conscious", "Gangsta", "Boom Bap", "Experimental", "Pop Rap"],
  "Jazz": ["Smooth Jazz", "Bebop", "Free Jazz", "Fusion", "Cool Jazz", "Swing"],
  "Pop": ["Synth-pop", "Dance-pop", "Disco", "Europop", "K-pop", "J-pop"],
} as const;
