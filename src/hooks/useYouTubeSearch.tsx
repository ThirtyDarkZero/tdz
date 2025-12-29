import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { YouTubeVideo } from './useYouTubePlayer';

interface SearchResult {
  results: YouTubeVideo[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalResults?: number;
}

export function useYouTubeSearch() {
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [prevPageToken, setPrevPageToken] = useState<string | null>(null);

  const search = useCallback(async (query: string, pageToken?: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('youtube-search', {
        body: { 
          query, 
          type: 'search',
          pageToken,
          maxResults: 20,
        },
      });

      if (fnError) throw fnError;

      const searchResult = data as SearchResult;
      setResults(searchResult.results || []);
      setNextPageToken(searchResult.nextPageToken || null);
      setPrevPageToken(searchResult.prevPageToken || null);
    } catch (err: any) {
      console.error('YouTube search error:', err);
      setError(err.message || 'Failed to search');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTrending = useCallback(async (pageToken?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('youtube-search', {
        body: { 
          type: 'trending',
          pageToken,
          maxResults: 20,
        },
      });

      if (fnError) throw fnError;

      const searchResult = data as SearchResult;
      setResults(searchResult.results || []);
      setNextPageToken(searchResult.nextPageToken || null);
      setPrevPageToken(searchResult.prevPageToken || null);
    } catch (err: any) {
      console.error('YouTube trending error:', err);
      setError(err.message || 'Failed to get trending');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRelated = useCallback(async (videoId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('youtube-search', {
        body: { 
          type: 'related',
          videoId,
          maxResults: 10,
        },
      });

      if (fnError) throw fnError;

      return (data as SearchResult).results || [];
    } catch (err: any) {
      console.error('YouTube related error:', err);
      setError(err.message || 'Failed to get related');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadNextPage = useCallback(() => {
    if (nextPageToken) {
      // This will be called with the current search query
      // The component should track the current query
    }
  }, [nextPageToken]);

  const clearResults = useCallback(() => {
    setResults([]);
    setNextPageToken(null);
    setPrevPageToken(null);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    nextPageToken,
    prevPageToken,
    search,
    getTrending,
    getRelated,
    clearResults,
  };
}
