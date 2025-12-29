import { useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface AudioSource {
  type: 'primary' | 'fallback' | 'external';
  url: string;
  quality?: 'standard' | 'hd' | 'hq' | 'lq';
  provider?: 'supabase' | 'cdn' | 'youtube' | 'soundcloud';
  priority: number;
}

interface UseMultiSourceAudioOptions {
  filePath: string;
  fileBucket?: string;
  trackId: string;
  enableFallback?: boolean;
}

/**
 * Hook for multi-source audio fallback - inspired by RKHM's YouTube/Piped/SoundCloud chain
 * Tries primary source first, then falls back to alternatives if needed
 */
export function useMultiSourceAudio(options: UseMultiSourceAudioOptions) {
  const { filePath, fileBucket = 'track-files', trackId, enableFallback = true } = options;
  
  const [currentSource, setCurrentSource] = useState<AudioSource | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const sourcesRef = useRef<AudioSource[]>([]);
  const retryCountRef = useRef(0);

  // Build list of available sources
  const buildSources = useCallback(async (): Promise<AudioSource[]> => {
    const sources: AudioSource[] = [];

    // Primary source: Supabase storage
    try {
      const { data: signedUrlData } = await supabase.storage
        .from(fileBucket)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlData?.signedUrl) {
        sources.push({
          type: 'primary',
          url: signedUrlData.signedUrl,
          quality: 'hd',
          provider: 'supabase',
          priority: 1,
        });
      }
    } catch (err) {
      console.warn('Primary source failed:', err);
    }

    // Fallback 1: Public URL (if bucket is public)
    if (enableFallback) {
      const { data: publicUrlData } = supabase.storage
        .from(fileBucket)
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl && publicUrlData.publicUrl !== sources[0]?.url) {
        sources.push({
          type: 'fallback',
          url: publicUrlData.publicUrl,
          quality: 'hd',
          provider: 'cdn',
          priority: 2,
        });
      }
    }

    // Fallback 2: Try alternative audio bucket
    if (enableFallback && fileBucket !== 'audio-files') {
      try {
        const { data: altSignedUrl } = await supabase.storage
          .from('audio-files')
          .createSignedUrl(filePath, 3600);

        if (altSignedUrl?.signedUrl) {
          sources.push({
            type: 'fallback',
            url: altSignedUrl.signedUrl,
            quality: 'standard',
            provider: 'supabase',
            priority: 3,
          });
        }
      } catch {
        // Alternative bucket not available
      }
    }

    return sources.sort((a, b) => a.priority - b.priority);
  }, [filePath, fileBucket, enableFallback]);

  // Initialize and get first source
  const initializeSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    retryCountRef.current = 0;

    try {
      const sources = await buildSources();
      sourcesRef.current = sources;

      if (sources.length > 0) {
        setSourceIndex(0);
        setCurrentSource(sources[0]);
      } else {
        throw new Error('No audio sources available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audio sources');
    } finally {
      setIsLoading(false);
    }
  }, [buildSources]);

  // Try next source on error
  const tryNextSource = useCallback(async () => {
    const sources = sourcesRef.current;
    const nextIndex = sourceIndex + 1;

    if (nextIndex < sources.length) {
      console.log(`Trying fallback source ${nextIndex + 1}/${sources.length}...`);
      setSourceIndex(nextIndex);
      setCurrentSource(sources[nextIndex]);
      return true;
    }

    // All sources exhausted - try refreshing sources if retries left
    if (retryCountRef.current < 2) {
      retryCountRef.current++;
      console.log(`Refreshing sources (attempt ${retryCountRef.current})...`);
      await initializeSources();
      return true;
    }

    setError('All audio sources failed. Please try again later.');
    return false;
  }, [sourceIndex, initializeSources]);

  // Handle source error
  const handleSourceError = useCallback(async (errorEvent?: Event) => {
    console.warn('Audio source error:', errorEvent);
    
    const hasNextSource = await tryNextSource();
    if (!hasNextSource) {
      console.error('All audio sources exhausted');
    }

    return hasNextSource;
  }, [tryNextSource]);

  // Get source info for debugging
  const getSourceInfo = useCallback(() => {
    return {
      currentSource: currentSource?.type,
      currentProvider: currentSource?.provider,
      currentQuality: currentSource?.quality,
      sourceIndex,
      totalSources: sourcesRef.current.length,
      retryCount: retryCountRef.current,
    };
  }, [currentSource, sourceIndex]);

  // Refresh current source (for expired URLs)
  const refreshCurrentSource = useCallback(async () => {
    if (!currentSource) {
      await initializeSources();
      return;
    }

    // Regenerate signed URL
    try {
      const { data: newSignedUrl } = await supabase.storage
        .from(fileBucket)
        .createSignedUrl(filePath, 3600);

      if (newSignedUrl?.signedUrl) {
        setCurrentSource(prev => prev ? {
          ...prev,
          url: newSignedUrl.signedUrl,
        } : null);
      }
    } catch (err) {
      console.warn('Failed to refresh source:', err);
      await handleSourceError();
    }
  }, [currentSource, fileBucket, filePath, initializeSources, handleSourceError]);

  return {
    currentSource,
    audioUrl: currentSource?.url || null,
    isLoading,
    error,
    sourceInfo: getSourceInfo(),
    initializeSources,
    tryNextSource,
    handleSourceError,
    refreshCurrentSource,
  };
}
