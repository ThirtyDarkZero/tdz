import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DiscographyTrack {
  id: string;
  title: string;
  youtubeId: string;
  thumbnail: string;
  duration?: string;
  viewCount?: string;
  album?: string;
  isOfficialAudio?: boolean;
}

interface DiscographyAlbum {
  id: string;
  title: string;
  year?: string;
  thumbnail?: string;
  trackCount?: number;
  tracks: DiscographyTrack[];
  type: 'album' | 'single' | 'ep' | 'compilation';
}

export interface DiscographyResult {
  artist: {
    name: string;
    channelId?: string;
    thumbnail?: string;
  };
  albums: DiscographyAlbum[];
  singles: DiscographyAlbum[];
  topTracks: DiscographyTrack[];
  totalTracks: number;
}

export function useDiscographyAgent() {
  const [result, setResult] = useState<DiscographyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, DiscographyResult>>(new Map());

  const fetchDiscography = useCallback(async (artistName: string, mode: 'quick' | 'full' = 'full') => {
    if (!artistName?.trim()) return null;

    const cacheKey = `${artistName.toLowerCase()}:${mode}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setResult(cached);
      return cached;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('artist-discography-agent', {
        body: { artistName: artistName.trim(), mode },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const discography = data as DiscographyResult;
      cacheRef.current.set(cacheKey, discography);
      setResult(discography);
      return discography;
    } catch (err: any) {
      console.error('Discography agent error:', err);
      setError(err.message || 'Failed to fetch discography');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setResult(null);
  }, []);

  return { result, loading, error, fetchDiscography, clearCache };
}
