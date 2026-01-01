import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

// Public Invidious/Piped instances used as fallback when YouTube Data API quota is exceeded
// (or when no API key is configured). This keeps playback working.
// Using more reliable instances that work from edge function environment
const INVIDIOUS_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.moomoo.me',
  'https://piped-api.garuber.com',
  'https://api.piped.yt',
];

// Alternative: Use a direct scraping approach as ultimate fallback
async function pipedSearch(query: string, maxResults: number): Promise<YouTubeSearchResult[]> {
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const url = `${base}/search?q=${encodeURIComponent(query)}&filter=videos`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      if (!res.ok) {
        console.log(`Piped instance ${base} returned ${res.status}`);
        continue;
      }
      
      const data = await res.json();
      const items = data?.items || [];
      
      if (!Array.isArray(items) || items.length === 0) continue;
      
      const results: YouTubeSearchResult[] = items.slice(0, maxResults).map((item: any) => {
        const title = String(item?.title ?? '');
        const lowerTitle = title.toLowerCase();
        
        // Extract video ID from URL
        let videoId = item?.url?.replace('/watch?v=', '') || '';
        
        return {
          id: videoId,
          title,
          channel: String(item?.uploaderName ?? item?.uploader ?? ''),
          channelId: undefined,
          thumbnail: item?.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          duration: formatDurationFromSeconds(item?.duration),
          viewCount: formatViewCount(String(item?.views ?? '')),
          publishedAt: new Date().toISOString(),
          isOfficialAudio: lowerTitle.includes('official audio') || lowerTitle.includes('audio'),
          isOfficialMusicVideo: lowerTitle.includes('official video') || lowerTitle.includes('music video'),
          description: item?.shortDescription,
        };
      }).filter((r) => Boolean(r.id));
      
      if (results.length > 0) {
        console.log(`Piped search successful via ${base}: ${results.length} results`);
        return results;
      }
    } catch (e) {
      console.error(`Piped search failed for ${base}:`, e);
    }
  }
  return [];
}

function formatDurationFromSeconds(totalSeconds: number | undefined): string {
  if (!totalSeconds || !Number.isFinite(totalSeconds)) return '';
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function pickInvidiousThumbnail(videoThumbnails: any[] | undefined): string {
  if (!Array.isArray(videoThumbnails) || videoThumbnails.length === 0) return '';
  const sorted = [...videoThumbnails].sort((a, b) => (a?.width ?? 0) - (b?.width ?? 0));
  return sorted[sorted.length - 1]?.url || sorted[0]?.url || '';
}

async function invidiousSearch(query: string, maxResults: number): Promise<YouTubeSearchResult[]> {
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const url = new URL(`${base}/api/v1/search`);
      url.searchParams.set('q', query);
      url.searchParams.set('type', 'video');

      const res = await fetch(url.toString(), {
        headers: {
          // Some instances behave better with an explicit UA
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
      });

      if (!res.ok) continue;
      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) continue;

      const results: YouTubeSearchResult[] = items.slice(0, maxResults).map((item: any) => {
        const title = String(item?.title ?? '');
        const channel = String(item?.author ?? '');
        const published = typeof item?.published === 'number' ? item.published : undefined;
        const publishedAt = published ? new Date(published * 1000).toISOString() : new Date().toISOString();
        const lowerTitle = title.toLowerCase();

        return {
          id: String(item?.videoId ?? ''),
          title,
          channel,
          channelId: item?.authorId ? String(item.authorId) : undefined,
          thumbnail: pickInvidiousThumbnail(item?.videoThumbnails) || String(item?.thumbnail ?? ''),
          duration: formatDurationFromSeconds(Number(item?.lengthSeconds ?? 0)),
          viewCount: formatViewCount(String(item?.viewCount ?? '')),
          publishedAt,
          isOfficialAudio: lowerTitle.includes('official audio') || lowerTitle.includes('audio'),
          isOfficialMusicVideo: lowerTitle.includes('official video') || lowerTitle.includes('music video'),
          description: undefined,
        };
      }).filter((r) => Boolean(r.id));

      if (results.length > 0) return results;
    } catch (e) {
      console.error('Invidious fallback search failed:', e);
    }
  }

  return [];
}

interface YouTubeSearchResult {
  id: string;
  title: string;
  channel: string;
  channelId?: string;
  thumbnail: string;
  duration?: string;
  viewCount?: string;
  publishedAt: string;
  isOfficialAudio?: boolean;
  isOfficialMusicVideo?: boolean;
  description?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type = 'search', videoId, channelId, channelUrl, maxResults = 20, pageToken, officialOnly = false } = await req.json();

    const hasYouTubeKey = Boolean(YOUTUBE_API_KEY);

    // Handle channel URL parsing - extract channel ID from various formats
    let resolvedChannelId = channelId;
    if (channelUrl && !resolvedChannelId) {
      // Parse different YouTube Music URL formats:
      // https://music.youtube.com/channel/UCROfm3osAKDZXB9KccNMBsA?si=...
      // https://www.youtube.com/channel/UCROfm3osAKDZXB9KccNMBsA
      // https://youtube.com/c/ChannelName
      // https://youtube.com/@handle
      const urlPatterns = [
        /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
        /music\.youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      ];

      for (const pattern of urlPatterns) {
        const match = channelUrl.match(pattern);
        if (match) {
          resolvedChannelId = match[1];
          console.log(`Extracted channel ID: ${resolvedChannelId} from URL: ${channelUrl}`);
          break;
        }
      }
    }

    // Handle channel video fetching
    if (type === 'channel' && resolvedChannelId) {
      if (!hasYouTubeKey) {
        return new Response(JSON.stringify({
          results: [],
          error: 'YouTube API key not configured (channel lookup requires Data API)',
          channelId: resolvedChannelId,
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Fetching videos for channel: ${resolvedChannelId}`);

      // First, get channel details to get the uploads playlist
      const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
      channelUrl.searchParams.set('part', 'snippet,contentDetails');
      channelUrl.searchParams.set('id', resolvedChannelId);
      channelUrl.searchParams.set('key', YOUTUBE_API_KEY!);

      const channelResponse = await fetch(channelUrl.toString());
      if (!channelResponse.ok) {
        console.error('Channel fetch failed:', await channelResponse.text());
        throw new Error('Failed to fetch channel details');
      }

      const channelData = await channelResponse.json();
      const channel = channelData.items?.[0];

      if (!channel) {
        console.log('No channel found for ID:', resolvedChannelId);
        return new Response(JSON.stringify({
          results: [],
          error: 'Channel not found',
          channelId: resolvedChannelId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
      const channelTitle = channel.snippet?.title;
      const channelThumbnail = channel.snippet?.thumbnails?.high?.url;

      console.log(`Channel: ${channelTitle}, Uploads Playlist: ${uploadsPlaylistId}`);

      if (uploadsPlaylistId) {
        // Fetch videos from uploads playlist
        const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        playlistUrl.searchParams.set('part', 'snippet,contentDetails');
        playlistUrl.searchParams.set('playlistId', uploadsPlaylistId);
        playlistUrl.searchParams.set('maxResults', String(Math.min(maxResults, 50)));
        playlistUrl.searchParams.set('key', YOUTUBE_API_KEY!);
        if (pageToken) {
          playlistUrl.searchParams.set('pageToken', pageToken);
        }

        const playlistResponse = await fetch(playlistUrl.toString());
        const playlistData = await playlistResponse.json();

        // Get video details for duration and view counts
        const videoIds = playlistData.items?.map((item: any) => item.contentDetails.videoId).join(',');
        let videoDetailsMap = new Map();

        if (videoIds) {
          const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
          detailsUrl.searchParams.set('part', 'contentDetails,statistics');
          detailsUrl.searchParams.set('id', videoIds);
          detailsUrl.searchParams.set('key', YOUTUBE_API_KEY!);

          const detailsResponse = await fetch(detailsUrl.toString());
          const detailsData = await detailsResponse.json();

          detailsData.items?.forEach((item: any) => {
            videoDetailsMap.set(item.id, {
              duration: item.contentDetails?.duration,
              viewCount: item.statistics?.viewCount,
            });
          });
        }

        const results = playlistData.items?.map((item: any) => {
          const videoId = item.contentDetails.videoId;
          const details = videoDetailsMap.get(videoId) || {};

          return {
            id: videoId,
            title: item.snippet.title,
            channel: channelTitle,
            channelId: resolvedChannelId,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            duration: parseDuration(details.duration),
            viewCount: formatViewCount(details.viewCount),
            publishedAt: item.snippet.publishedAt,
            isOfficialAudio: true, // From artist's channel
            isOfficialMusicVideo: true,
          };
        }) || [];

        return new Response(JSON.stringify({
          results,
          channelInfo: {
            id: resolvedChannelId,
            title: channelTitle,
            thumbnail: channelThumbnail,
          },
          nextPageToken: playlistData.nextPageToken,
          totalResults: playlistData.pageInfo?.totalResults,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ results: [], channelInfo: { id: resolvedChannelId, title: channelTitle } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Different endpoints based on type
    if (type === 'search') {
      // Search for videos - prioritize official audio/music
      let searchQuery = query;

      // If officialOnly flag is set, append terms to find official releases
      if (officialOnly) {
        if (!query.toLowerCase().includes('topic') && !query.toLowerCase().includes('official')) {
          searchQuery = `${query} official audio`;
        }
      }

      // If no key, or if quota is exceeded, use Piped/Invidious fallback.
      if (!hasYouTubeKey) {
        // Try Piped first, then Invidious
        let results = await pipedSearch(searchQuery, Math.min(maxResults, 50));
        if (results.length === 0) {
          results = await invidiousSearch(searchQuery, Math.min(maxResults, 50));
        }
        return new Response(JSON.stringify({
          results,
          nextPageToken: undefined,
          prevPageToken: undefined,
          totalResults: results.length,
          source: 'piped',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('q', searchQuery);
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('videoCategoryId', '10'); // Music category
      searchUrl.searchParams.set('maxResults', String(Math.min(maxResults * 2, 50)));
      searchUrl.searchParams.set('key', YOUTUBE_API_KEY!);
      if (pageToken) {
        searchUrl.searchParams.set('pageToken', pageToken);
      }

      console.log(`Searching YouTube for: ${searchQuery} (officialOnly: ${officialOnly})`);
      const searchResponse = await fetch(searchUrl.toString());

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('YouTube API error:', errorText);

        if (searchResponse.status === 403 || searchResponse.status === 429) {
          // Try Piped first, then Invidious
          let results = await pipedSearch(searchQuery, Math.min(maxResults, 50));
          if (results.length === 0) {
            results = await invidiousSearch(searchQuery, Math.min(maxResults, 50));
          }
          return new Response(JSON.stringify({
            results,
            nextPageToken: undefined,
            prevPageToken: undefined,
            totalResults: results.length,
            source: 'piped',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        throw new Error(`YouTube API error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();

      // Get video IDs for duration info
      const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');

      if (videoIds) {
        // Fetch video details (duration, view count, description for metadata)
        const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
        detailsUrl.searchParams.set('part', 'contentDetails,statistics,snippet');
        detailsUrl.searchParams.set('id', videoIds);
        detailsUrl.searchParams.set('key', YOUTUBE_API_KEY!);

        const detailsResponse = await fetch(detailsUrl.toString());
        const detailsData = await detailsResponse.json();

        // Create a map of video details
        const detailsMap = new Map();
        detailsData.items?.forEach((item: any) => {
          detailsMap.set(item.id, {
            duration: item.contentDetails?.duration,
            viewCount: item.statistics?.viewCount,
            description: item.snippet?.description,
            tags: item.snippet?.tags || [],
          });
        });

        // Combine search results with details and detect official content
        let results: any[] = searchData.items?.map((item: any) => {
          const details = detailsMap.get(item.id.videoId) || {};
          const title = item.snippet.title.toLowerCase();
          const channel = item.snippet.channelTitle.toLowerCase();
          const description = (details.description || '').toLowerCase();

          // Detect if this is official content
          const isTopicChannel = channel.includes('- topic') || channel.endsWith(' - topic');
          const hasOfficialInTitle = title.includes('official audio') ||
            title.includes('official music video') ||
            title.includes('official video');
          const isVevoChannel = channel.includes('vevo');
          const hasAutoGenerated = description.includes('auto-generated by youtube');

          // Score for sorting - higher = more official
          const officialScore = (isTopicChannel ? 100 : 0) +
            (hasAutoGenerated ? 80 : 0) +
            (isVevoChannel ? 60 : 0) +
            (hasOfficialInTitle ? 40 : 0);

          return {
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            channelId: item.snippet.channelId,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            duration: parseDuration(details.duration),
            viewCount: formatViewCount(details.viewCount),
            publishedAt: item.snippet.publishedAt,
            isOfficialAudio: isTopicChannel || hasAutoGenerated,
            isOfficialMusicVideo: hasOfficialInTitle || isVevoChannel,
            description: details.description?.substring(0, 500),
            _officialScore: officialScore,
            _viewCountRaw: parseInt(details.viewCount || '0'),
          };
        }) || [];

        // Sort by official score first, then by view count
        results.sort((a: any, b: any) => {
          if (b._officialScore !== a._officialScore) {
            return b._officialScore - a._officialScore;
          }
          return b._viewCountRaw - a._viewCountRaw;
        });

        // If officialOnly, filter to only official content
        if (officialOnly) {
          const officialResults = results.filter((r: any) => r._officialScore > 0);
          if (officialResults.length > 0) {
            results = officialResults;
          }
        }

        // Clean up internal scoring fields and limit results
        const cleanResults: YouTubeSearchResult[] = results.slice(0, maxResults).map((r: any) => {
          const { _officialScore, _viewCountRaw, ...clean } = r;
          return clean;
        });

        return new Response(JSON.stringify({
          results: cleanResults,
          nextPageToken: searchData.nextPageToken,
          prevPageToken: searchData.prevPageToken,
          totalResults: searchData.pageInfo?.totalResults,
          source: 'youtube',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (type === 'trending') {
      // Get trending music videos
      const trendingUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      trendingUrl.searchParams.set('part', 'snippet,contentDetails,statistics');
      trendingUrl.searchParams.set('chart', 'mostPopular');
      trendingUrl.searchParams.set('videoCategoryId', '10'); // Music
      trendingUrl.searchParams.set('maxResults', String(maxResults));
      trendingUrl.searchParams.set('regionCode', 'US');
      trendingUrl.searchParams.set('key', YOUTUBE_API_KEY!);
      if (pageToken) {
        trendingUrl.searchParams.set('pageToken', pageToken);
      }

      console.log('Fetching trending music videos');
      const trendingResponse = await fetch(trendingUrl.toString());

      if (!trendingResponse.ok) {
        const errorText = await trendingResponse.text();
        console.error('YouTube API error:', errorText);
        throw new Error(`YouTube API error: ${trendingResponse.status}`);
      }

      const trendingData = await trendingResponse.json();

      const results: YouTubeSearchResult[] = trendingData.items?.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        duration: parseDuration(item.contentDetails?.duration),
        viewCount: formatViewCount(item.statistics?.viewCount),
        publishedAt: item.snippet.publishedAt,
      })) || [];

      return new Response(JSON.stringify({
        results,
        nextPageToken: trendingData.nextPageToken,
        prevPageToken: trendingData.prevPageToken,
        totalResults: trendingData.pageInfo?.totalResults,
        source: 'youtube',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (type === 'related' && videoId) {
      // Get related videos
      const relatedUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      relatedUrl.searchParams.set('part', 'snippet');
      relatedUrl.searchParams.set('relatedToVideoId', videoId);
      relatedUrl.searchParams.set('type', 'video');
      relatedUrl.searchParams.set('maxResults', String(maxResults));
      relatedUrl.searchParams.set('key', YOUTUBE_API_KEY!);

      console.log(`Fetching related videos for: ${videoId}`);
      const relatedResponse = await fetch(relatedUrl.toString());

      if (!relatedResponse.ok) {
        const errorText = await relatedResponse.text();
        console.error('YouTube API error:', errorText);
        throw new Error(`YouTube API error: ${relatedResponse.status}`);
      }

      const relatedData = await relatedResponse.json();

      const results: YouTubeSearchResult[] = relatedData.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
      })) || [];

      return new Response(JSON.stringify({ results, source: 'youtube' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in youtube-search function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

interface YouTubeSearchResult {
  id: string;
  title: string;
  channel: string;
  channelId?: string;
  thumbnail: string;
  duration?: string;
  viewCount?: string;
  publishedAt: string;
  isOfficialAudio?: boolean;
  isOfficialMusicVideo?: boolean;
  description?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type = 'search', videoId, channelId, channelUrl, maxResults = 20, pageToken, officialOnly = false } = await req.json();

    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    // Handle channel URL parsing - extract channel ID from various formats
    let resolvedChannelId = channelId;
    if (channelUrl && !resolvedChannelId) {
      // Parse different YouTube Music URL formats:
      // https://music.youtube.com/channel/UCROfm3osAKDZXB9KccNMBsA?si=...
      // https://www.youtube.com/channel/UCROfm3osAKDZXB9KccNMBsA
      // https://youtube.com/c/ChannelName
      // https://youtube.com/@handle
      const urlPatterns = [
        /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
        /music\.youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      ];
      
      for (const pattern of urlPatterns) {
        const match = channelUrl.match(pattern);
        if (match) {
          resolvedChannelId = match[1];
          console.log(`Extracted channel ID: ${resolvedChannelId} from URL: ${channelUrl}`);
          break;
        }
      }
    }

    // Handle channel video fetching
    if (type === 'channel' && resolvedChannelId) {
      console.log(`Fetching videos for channel: ${resolvedChannelId}`);
      
      // First, get channel details to get the uploads playlist
      const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
      channelUrl.searchParams.set('part', 'snippet,contentDetails');
      channelUrl.searchParams.set('id', resolvedChannelId);
      channelUrl.searchParams.set('key', YOUTUBE_API_KEY);
      
      const channelResponse = await fetch(channelUrl.toString());
      if (!channelResponse.ok) {
        console.error('Channel fetch failed:', await channelResponse.text());
        throw new Error('Failed to fetch channel details');
      }
      
      const channelData = await channelResponse.json();
      const channel = channelData.items?.[0];
      
      if (!channel) {
        console.log('No channel found for ID:', resolvedChannelId);
        return new Response(JSON.stringify({ 
          results: [], 
          error: 'Channel not found',
          channelId: resolvedChannelId 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
      const channelTitle = channel.snippet?.title;
      const channelThumbnail = channel.snippet?.thumbnails?.high?.url;
      
      console.log(`Channel: ${channelTitle}, Uploads Playlist: ${uploadsPlaylistId}`);
      
      if (uploadsPlaylistId) {
        // Fetch videos from uploads playlist
        const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        playlistUrl.searchParams.set('part', 'snippet,contentDetails');
        playlistUrl.searchParams.set('playlistId', uploadsPlaylistId);
        playlistUrl.searchParams.set('maxResults', String(Math.min(maxResults, 50)));
        playlistUrl.searchParams.set('key', YOUTUBE_API_KEY);
        if (pageToken) {
          playlistUrl.searchParams.set('pageToken', pageToken);
        }
        
        const playlistResponse = await fetch(playlistUrl.toString());
        const playlistData = await playlistResponse.json();
        
        // Get video details for duration and view counts
        const videoIds = playlistData.items?.map((item: any) => item.contentDetails.videoId).join(',');
        let videoDetailsMap = new Map();
        
        if (videoIds) {
          const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
          detailsUrl.searchParams.set('part', 'contentDetails,statistics');
          detailsUrl.searchParams.set('id', videoIds);
          detailsUrl.searchParams.set('key', YOUTUBE_API_KEY);
          
          const detailsResponse = await fetch(detailsUrl.toString());
          const detailsData = await detailsResponse.json();
          
          detailsData.items?.forEach((item: any) => {
            videoDetailsMap.set(item.id, {
              duration: item.contentDetails?.duration,
              viewCount: item.statistics?.viewCount,
            });
          });
        }
        
        const results = playlistData.items?.map((item: any) => {
          const videoId = item.contentDetails.videoId;
          const details = videoDetailsMap.get(videoId) || {};
          
          return {
            id: videoId,
            title: item.snippet.title,
            channel: channelTitle,
            channelId: resolvedChannelId,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            duration: parseDuration(details.duration),
            viewCount: formatViewCount(details.viewCount),
            publishedAt: item.snippet.publishedAt,
            isOfficialAudio: true, // From artist's channel
            isOfficialMusicVideo: true,
          };
        }) || [];
        
        return new Response(JSON.stringify({
          results,
          channelInfo: {
            id: resolvedChannelId,
            title: channelTitle,
            thumbnail: channelThumbnail,
          },
          nextPageToken: playlistData.nextPageToken,
          totalResults: playlistData.pageInfo?.totalResults,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ results: [], channelInfo: { id: resolvedChannelId, title: channelTitle } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Different endpoints based on type
    if (type === 'search') {
      // Search for videos - prioritize official audio/music
      let searchQuery = query;
      
      // If officialOnly flag is set, append terms to find official releases
      if (officialOnly) {
        if (!query.toLowerCase().includes('topic') && !query.toLowerCase().includes('official')) {
          searchQuery = `${query} official audio`;
        }
      }
      
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('q', searchQuery);
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('videoCategoryId', '10'); // Music category
      searchUrl.searchParams.set('maxResults', String(Math.min(maxResults * 2, 50)));
      searchUrl.searchParams.set('key', YOUTUBE_API_KEY);
      if (pageToken) {
        searchUrl.searchParams.set('pageToken', pageToken);
      }

      console.log(`Searching YouTube for: ${searchQuery} (officialOnly: ${officialOnly})`);
      const searchResponse = await fetch(searchUrl.toString());
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('YouTube API error:', errorText);
        throw new Error(`YouTube API error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      
      // Get video IDs for duration info
      const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');
      
      if (videoIds) {
        // Fetch video details (duration, view count, description for metadata)
        const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
        detailsUrl.searchParams.set('part', 'contentDetails,statistics,snippet');
        detailsUrl.searchParams.set('id', videoIds);
        detailsUrl.searchParams.set('key', YOUTUBE_API_KEY);
        
        const detailsResponse = await fetch(detailsUrl.toString());
        const detailsData = await detailsResponse.json();
        
        // Create a map of video details
        const detailsMap = new Map();
        detailsData.items?.forEach((item: any) => {
          detailsMap.set(item.id, {
            duration: item.contentDetails?.duration,
            viewCount: item.statistics?.viewCount,
            description: item.snippet?.description,
            tags: item.snippet?.tags || [],
          });
        });

        // Combine search results with details and detect official content
        let results: any[] = searchData.items?.map((item: any) => {
          const details = detailsMap.get(item.id.videoId) || {};
          const title = item.snippet.title.toLowerCase();
          const channel = item.snippet.channelTitle.toLowerCase();
          const description = (details.description || '').toLowerCase();
          
          // Detect if this is official content
          const isTopicChannel = channel.includes('- topic') || channel.endsWith(' - topic');
          const hasOfficialInTitle = title.includes('official audio') || 
                                     title.includes('official music video') ||
                                     title.includes('official video');
          const isVevoChannel = channel.includes('vevo');
          const hasAutoGenerated = description.includes('auto-generated by youtube');
          
          // Score for sorting - higher = more official
          const officialScore = (isTopicChannel ? 100 : 0) + 
                               (hasAutoGenerated ? 80 : 0) + 
                               (isVevoChannel ? 60 : 0) + 
                               (hasOfficialInTitle ? 40 : 0);
          
          return {
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            channelId: item.snippet.channelId,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            duration: parseDuration(details.duration),
            viewCount: formatViewCount(details.viewCount),
            publishedAt: item.snippet.publishedAt,
            isOfficialAudio: isTopicChannel || hasAutoGenerated,
            isOfficialMusicVideo: hasOfficialInTitle || isVevoChannel,
            description: details.description?.substring(0, 500),
            _officialScore: officialScore,
            _viewCountRaw: parseInt(details.viewCount || '0'),
          };
        }) || [];

        // Sort by official score first, then by view count
        results.sort((a: any, b: any) => {
          if (b._officialScore !== a._officialScore) {
            return b._officialScore - a._officialScore;
          }
          return b._viewCountRaw - a._viewCountRaw;
        });

        // If officialOnly, filter to only official content
        if (officialOnly) {
          const officialResults = results.filter((r: any) => r._officialScore > 0);
          if (officialResults.length > 0) {
            results = officialResults;
          }
        }

        // Clean up internal scoring fields and limit results
        const cleanResults: YouTubeSearchResult[] = results.slice(0, maxResults).map((r: any) => {
          const { _officialScore, _viewCountRaw, ...clean } = r;
          return clean;
        });

        return new Response(JSON.stringify({
          results: cleanResults,
          nextPageToken: searchData.nextPageToken,
          prevPageToken: searchData.prevPageToken,
          totalResults: searchData.pageInfo?.totalResults,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (type === 'trending') {
      // Get trending music videos
      const trendingUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      trendingUrl.searchParams.set('part', 'snippet,contentDetails,statistics');
      trendingUrl.searchParams.set('chart', 'mostPopular');
      trendingUrl.searchParams.set('videoCategoryId', '10'); // Music
      trendingUrl.searchParams.set('maxResults', String(maxResults));
      trendingUrl.searchParams.set('regionCode', 'US');
      trendingUrl.searchParams.set('key', YOUTUBE_API_KEY);
      if (pageToken) {
        trendingUrl.searchParams.set('pageToken', pageToken);
      }

      console.log('Fetching trending music videos');
      const trendingResponse = await fetch(trendingUrl.toString());
      
      if (!trendingResponse.ok) {
        const errorText = await trendingResponse.text();
        console.error('YouTube API error:', errorText);
        throw new Error(`YouTube API error: ${trendingResponse.status}`);
      }

      const trendingData = await trendingResponse.json();
      
      const results: YouTubeSearchResult[] = trendingData.items?.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        duration: parseDuration(item.contentDetails?.duration),
        viewCount: formatViewCount(item.statistics?.viewCount),
        publishedAt: item.snippet.publishedAt,
      })) || [];

      return new Response(JSON.stringify({
        results,
        nextPageToken: trendingData.nextPageToken,
        prevPageToken: trendingData.prevPageToken,
        totalResults: trendingData.pageInfo?.totalResults,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (type === 'related' && videoId) {
      // Get related videos
      const relatedUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      relatedUrl.searchParams.set('part', 'snippet');
      relatedUrl.searchParams.set('relatedToVideoId', videoId);
      relatedUrl.searchParams.set('type', 'video');
      relatedUrl.searchParams.set('maxResults', String(maxResults));
      relatedUrl.searchParams.set('key', YOUTUBE_API_KEY);

      console.log(`Fetching related videos for: ${videoId}`);
      const relatedResponse = await fetch(relatedUrl.toString());
      
      if (!relatedResponse.ok) {
        const errorText = await relatedResponse.text();
        console.error('YouTube API error:', errorText);
        throw new Error(`YouTube API error: ${relatedResponse.status}`);
      }

      const relatedData = await relatedResponse.json();
      
      const results: YouTubeSearchResult[] = relatedData.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
      })) || [];

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in youtube-search function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Parse ISO 8601 duration to readable format
function parseDuration(isoDuration: string | undefined): string {
  if (!isoDuration) return '';
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Format view count
function formatViewCount(count: string | undefined): string {
  if (!count) return '';
  
  const num = parseInt(count);
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B views`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M views`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K views`;
  }
  return `${num} views`;
}
