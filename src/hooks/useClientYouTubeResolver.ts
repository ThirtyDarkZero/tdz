import { useCallback, useRef } from 'react';

interface ResolvedTrack {
  youtubeId: string;
  source: 'client-resolved';
}

// Client-side YouTube resolution using the YouTube embed search
// This works in the browser where there are no DNS restrictions
export function useClientYouTubeResolver() {
  const cacheRef = useRef<Map<string, string>>(new Map());

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

    const searchQuery = `${artist} ${title} official audio`;
    
    try {
      // Method 1: Use Piped API (works in browser)
      const pipedInstances = [
        'https://pipedapi.kavin.rocks',
        'https://pipedapi.moomoo.me',
        'https://api.piped.yt',
      ];

      for (const instance of pipedInstances) {
        try {
          const response = await fetch(
            `${instance}/search?q=${encodeURIComponent(searchQuery)}&filter=videos`,
            {
              headers: {
                'Accept': 'application/json',
              },
            }
          );

          if (!response.ok) continue;

          const data = await response.json();
          const items = data?.items || [];

          if (items.length > 0) {
            // Find the best match - prefer official audio/video
            const bestMatch = items.find((item: any) => {
              const itemTitle = (item.title || '').toLowerCase();
              return itemTitle.includes('official') || 
                     itemTitle.includes('audio') ||
                     itemTitle.includes(artist.toLowerCase());
            }) || items[0];

            // Extract video ID from URL
            const videoId = bestMatch.url?.replace('/watch?v=', '') || '';
            
            if (videoId) {
              cacheRef.current.set(cacheKey, videoId);
              console.log(`[ClientResolver] Resolved "${title}" by ${artist} to ${videoId}`);
              return { youtubeId: videoId, source: 'client-resolved' };
            }
          }
        } catch (e) {
          console.log(`[ClientResolver] Piped instance ${instance} failed:`, e);
        }
      }

      // Method 2: Use Invidious API (works in browser)
      const invidiousInstances = [
        'https://invidious.fdn.fr',
        'https://yewtu.be',
        'https://inv.nadeko.net',
      ];

      for (const instance of invidiousInstances) {
        try {
          const response = await fetch(
            `${instance}/api/v1/search?q=${encodeURIComponent(searchQuery)}&type=video`,
            {
              headers: {
                'Accept': 'application/json',
              },
            }
          );

          if (!response.ok) continue;

          const data = await response.json();
          
          if (Array.isArray(data) && data.length > 0) {
            const bestMatch = data.find((item: any) => {
              const itemTitle = (item.title || '').toLowerCase();
              return itemTitle.includes('official') || 
                     itemTitle.includes('audio') ||
                     itemTitle.includes(artist.toLowerCase());
            }) || data[0];

            const videoId = bestMatch.videoId;
            
            if (videoId) {
              cacheRef.current.set(cacheKey, videoId);
              console.log(`[ClientResolver] Resolved "${title}" by ${artist} to ${videoId} via Invidious`);
              return { youtubeId: videoId, source: 'client-resolved' };
            }
          }
        } catch (e) {
          console.log(`[ClientResolver] Invidious instance ${instance} failed:`, e);
        }
      }

      console.warn(`[ClientResolver] Could not resolve "${title}" by ${artist}`);
      return null;
    } catch (error) {
      console.error('[ClientResolver] Resolution failed:', error);
      return null;
    }
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    resolveTrack,
    clearCache,
  };
}
