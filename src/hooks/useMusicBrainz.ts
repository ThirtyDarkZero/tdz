import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types for MusicBrainz entities
export interface MBArtist {
  id: string;
  name: string;
  sortName?: string;
  type?: string;
  country?: string;
  area?: string;
  beginDate?: string;
  endDate?: string;
  tags?: string[];
  genres?: { name: string; count: number }[];
  releaseGroups?: MBReleaseGroup[];
  score?: number;
}

export interface MBRelease {
  id: string;
  title: string;
  status?: string;
  date?: string;
  country?: string;
  artistId?: string;
  artistName: string;
  releaseGroupId?: string;
  releaseGroupType?: string;
  label?: string;
  catalogNumber?: string;
  coverArt: string;
  tracks?: MBTrack[];
  trackCount?: number;
  tags?: string[];
  score?: number;
}

export interface MBReleaseGroup {
  id: string;
  title: string;
  primaryType?: string;
  secondaryTypes?: string[];
  firstReleaseDate?: string;
  artistId?: string;
  artistName: string;
  releases?: MBRelease[];
  tags?: string[];
  coverArt: string;
  score?: number;
}

export interface MBRecording {
  id: string;
  title: string;
  length?: number;
  lengthFormatted?: string;
  artistName: string;
  artistId?: string;
  isrcs?: string[];
  releases?: MBRelease[];
  tags?: string[];
  score?: number;
}

export interface MBTrack {
  id: string;
  position: number;
  number?: string;
  title: string;
  length?: number;
  lengthFormatted?: string;
  disc?: number;
}

type SearchType = 'artist' | 'release' | 'release-group' | 'recording';

export function useMusicBrainz() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAPI = useCallback(async (action: string, params: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('musicbrainz-api', {
        body: { action, ...params },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch from MusicBrainz';
      setError(message);
      console.error('MusicBrainz API error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search across MusicBrainz
  const search = useCallback(async (
    query: string,
    type: SearchType = 'release-group',
    limit = 25,
    offset = 0
  ) => {
    const data = await callAPI('search', { query, type, limit, offset });
    return data;
  }, [callAPI]);

  // Get full artist details
  const getArtist = useCallback(async (id: string): Promise<MBArtist | null> => {
    const data = await callAPI('get_artist', { id });
    return data;
  }, [callAPI]);

  // Get release (album) with tracks
  const getRelease = useCallback(async (id: string): Promise<MBRelease | null> => {
    const data = await callAPI('get_release', { id });
    return data;
  }, [callAPI]);

  // Get release group (album grouping)
  const getReleaseGroup = useCallback(async (id: string): Promise<MBReleaseGroup | null> => {
    const data = await callAPI('get_release_group', { id });
    return data;
  }, [callAPI]);

  // Get recording (song) details
  const getRecording = useCallback(async (id: string): Promise<MBRecording | null> => {
    const data = await callAPI('get_recording', { id });
    return data;
  }, [callAPI]);

  // Browse releases by artist
  const browseReleasesByArtist = useCallback(async (
    artistId: string,
    limit = 25,
    offset = 0
  ) => {
    const data = await callAPI('browse_releases', { id: artistId, type: 'artist', limit, offset });
    return data;
  }, [callAPI]);

  // Search by genre/tag
  const searchByGenre = useCallback(async (
    genre: string,
    type: SearchType = 'release-group',
    limit = 25,
    offset = 0
  ) => {
    const data = await callAPI('search_by_genre', { query: genre, type, limit, offset });
    return data;
  }, [callAPI]);

  // Get cover art for a release
  const getCoverArt = useCallback(async (releaseId: string) => {
    const data = await callAPI('get_cover_art', { id: releaseId });
    return data;
  }, [callAPI]);

  // Helper to merge with YouTube for playback
  const findYouTubeMatch = useCallback(async (
    track: MBTrack | MBRecording,
    artistName: string
  ): Promise<string | null> => {
    try {
      const searchQuery = `${track.title} ${artistName}`;
      const { data, error: fnError } = await supabase.functions.invoke('youtube-search', {
        body: { query: searchQuery, maxResults: 1 },
      });

      if (fnError || !data?.items?.length) return null;
      return data.items[0].id;
    } catch {
      return null;
    }
  }, []);

  return {
    loading,
    error,
    search,
    getArtist,
    getRelease,
    getReleaseGroup,
    getRecording,
    browseReleasesByArtist,
    searchByGenre,
    getCoverArt,
    findYouTubeMatch,
  };
}
