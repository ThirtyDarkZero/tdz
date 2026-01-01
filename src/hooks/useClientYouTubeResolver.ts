import { useCallback, useRef } from 'react';

interface ResolvedTrack {
  youtubeId: string;
  source: 'client-resolved';
}

// Updated Piped instances - most reliable ones first
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.moomoo.me',
  'https://api.piped.yt',
  'https://pipedapi.r4fo.com',
];

// Updated Invidious instances - most reliable ones first
const INVIDIOUS_INSTANCES = [
  'https://invidious.fdn.fr',
  'https://yewtu.be',
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
];

// Client-side YouTube resolution with robust multi-source fallback
export function useClientYouTubeResolver() {
  const cacheRef = useRef<Map<string, string>>(new Map());
  const failedInstancesRef = useRef<Set<string>>(new Set());

  // Try Piped API with timeout
  const tryPiped = useCallback(async (searchQuery: string): Promise<string | null> => {
    for (const instance of PIPED_INSTANCES) {
      // Skip recently failed instances (reset after 5 minutes)
      if (failedInstancesRef.current.has(instance)) continue;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(
          `${instance}/search?q=${encodeURIComponent(searchQuery)}&filter=videos`,
          {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
          }
        );

        clearTimeout(timeout);

        if (!response.ok) {
          console.log(`[ClientResolver] Piped ${instance} returned ${response.status}`);
          continue;
        }

        const data = await response.json();
        const items = data?.items || [];

        if (items.length > 0) {
          // Find the best match - prefer official audio/video
          const bestMatch = items.find((item: any) => {
            const itemTitle = (item.title || '').toLowerCase();
            return itemTitle.includes('official') || 
                   itemTitle.includes('audio') ||
                   itemTitle.includes('topic');
          }) || items[0];

          const videoId = bestMatch.url?.replace('/watch?v=', '') || '';
          
          if (videoId) {
            console.log(`[ClientResolver] Piped ${instance} found: ${videoId}`);
            return videoId;
          }
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          console.log(`[ClientResolver] Piped ${instance} timed out`);
          failedInstancesRef.current.add(instance);
          // Reset after 5 minutes
          setTimeout(() => failedInstancesRef.current.delete(instance), 5 * 60 * 1000);
        } else {
          console.log(`[ClientResolver] Piped ${instance} error:`, e.message || e);
        }
      }
    }
    return null;
  }, []);

  // Try Invidious API with timeout
  const tryInvidious = useCallback(async (searchQuery: string): Promise<string | null> => {
    for (const instance of INVIDIOUS_INSTANCES) {
      if (failedInstancesRef.current.has(instance)) continue;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(
          `${instance}/api/v1/search?q=${encodeURIComponent(searchQuery)}&type=video`,
          {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
          }
        );

        clearTimeout(timeout);

        if (!response.ok) {
          console.log(`[ClientResolver] Invidious ${instance} returned ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const bestMatch = data.find((item: any) => {
            const itemTitle = (item.title || '').toLowerCase();
            return itemTitle.includes('official') || 
                   itemTitle.includes('audio') ||
                   itemTitle.includes('topic');
          }) || data[0];

          const videoId = bestMatch.videoId;
          
          if (videoId) {
            console.log(`[ClientResolver] Invidious ${instance} found: ${videoId}`);
            return videoId;
          }
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          console.log(`[ClientResolver] Invidious ${instance} timed out`);
          failedInstancesRef.current.add(instance);
          setTimeout(() => failedInstancesRef.current.delete(instance), 5 * 60 * 1000);
        } else {
          console.log(`[ClientResolver] Invidious ${instance} error:`, e.message || e);
        }
      }
    }
    return null;
  }, []);

  const resolveTrack = useCallback(async (
    title: string,
    artist: string
  ): Promise<ResolvedTrack | null> => {
    const cacheKey = `${artist}-${title}`.toLowerCase();
    
    // Check cache first
    if (cacheRef.current.has(cacheKey)) {
      return {
        youtubeId: cacheRef.current.get(cacheKey)!,
        source: 'client-resolved'
      };
    }

    // Try multiple search query variations
    const searchQueries = [
      `${artist} ${title} official audio`,
      `${artist} - ${title}`,
      `${title} ${artist}`,
    ];
    
    for (const searchQuery of searchQueries) {
      try {
        console.log(`[ClientResolver] Trying: "${searchQuery}"`);
        
        // Try Piped first (generally faster)
        let videoId = await tryPiped(searchQuery);
        
        // If Piped fails, try Invidious
        if (!videoId) {
          videoId = await tryInvidious(searchQuery);
        }
        
        if (videoId) {
          cacheRef.current.set(cacheKey, videoId);
          console.log(`[ClientResolver] Resolved "${title}" by ${artist} to ${videoId}`);
          return { youtubeId: videoId, source: 'client-resolved' };
        }
      } catch (error) {
        console.error('[ClientResolver] Resolution attempt failed:', error);
      }
    }

    console.warn(`[ClientResolver] Could not resolve "${title}" by ${artist} after all attempts`);
    return null;
  }, [tryPiped, tryInvidious]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    failedInstancesRef.current.clear();
  }, []);

  return {
    resolveTrack,
    clearCache,
  };
}
