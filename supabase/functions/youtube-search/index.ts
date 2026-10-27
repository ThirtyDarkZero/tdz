import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { rateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

// Updated Piped instances - prioritizing most reliable ones (Jan 2026)
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://api.piped.privacydev.net',
  'https://pipedapi.in.projectsegfau.lt',
  'https://pipedapi.moomoo.me',
];

// Updated Invidious instances - prioritizing most reliable ones (Jan 2026)
const INVIDIOUS_INSTANCES = [
  'https://iv.nboez.cc',
  'https://invidious.protokolla.fi',
  'https://invidious.privacydev.net',
  'https://yt.artemislena.eu',
  'https://invidious.lunar.icu',
];

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

// Helper functions
function formatDurationFromSeconds(totalSeconds: number | undefined): string {
  if (!totalSeconds || !Number.isFinite(totalSeconds)) return '';
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function parseDuration(isoDuration: string | undefined): string {
  if (!isoDuration) return '';
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatViewCount(count: string | undefined): string {
  if (!count) return '';
  const num = parseInt(count);
  if (isNaN(num)) return count;
  
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B views`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K views`;
  return `${num} views`;
}

function pickInvidiousThumbnail(videoThumbnails: any[] | undefined): string {
  if (!Array.isArray(videoThumbnails) || videoThumbnails.length === 0) return '';
  const sorted = [...videoThumbnails].sort((a, b) => (a?.width ?? 0) - (b?.width ?? 0));
  return sorted[sorted.length - 1]?.url || sorted[0]?.url || '';
}

// Piped search with timeout and retry
async function pipedSearch(query: string, maxResults: number): Promise<YouTubeSearchResult[]> {
  console.log(`[Piped] Searching for: "${query}"`);
  
  for (const base of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const url = `${base}/search?q=${encodeURIComponent(query)}&filter=videos`;
      console.log(`[Piped] Trying ${base}...`);
      
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      clearTimeout(timeout);
      
      if (!res.ok) {
        console.log(`[Piped] ${base} returned ${res.status}`);
        continue;
      }
      
      const data = await res.json();
      const items = data?.items || [];
      
      if (!Array.isArray(items) || items.length === 0) {
        console.log(`[Piped] ${base} returned no items`);
        continue;
      }
      
      const results: YouTubeSearchResult[] = items.slice(0, maxResults).map((item: any) => {
        const title = String(item?.title ?? '');
        const lowerTitle = title.toLowerCase();
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
        console.log(`[Piped] SUCCESS via ${base}: ${results.length} results`);
        return results;
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log(`[Piped] ${base} timed out`);
      } else {
        console.error(`[Piped] ${base} failed:`, e.message || e);
      }
    }
  }
  
  console.log('[Piped] All instances failed');
  return [];
}

// Invidious search with timeout and retry
async function invidiousSearch(query: string, maxResults: number): Promise<YouTubeSearchResult[]> {
  console.log(`[Invidious] Searching for: "${query}"`);
  
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const url = new URL(`${base}/api/v1/search`);
      url.searchParams.set('q', query);
      url.searchParams.set('type', 'video');
      
      console.log(`[Invidious] Trying ${base}...`);

      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeout);

      if (!res.ok) {
        console.log(`[Invidious] ${base} returned ${res.status}`);
        continue;
      }
      
      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) {
        console.log(`[Invidious] ${base} returned no items`);
        continue;
      }

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

      if (results.length > 0) {
        console.log(`[Invidious] SUCCESS via ${base}: ${results.length} results`);
        return results;
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log(`[Invidious] ${base} timed out`);
      } else {
        console.error(`[Invidious] ${base} failed:`, e.message || e);
      }
    }
  }
  
  console.log('[Invidious] All instances failed');
  return [];
}

// Unified fallback search: tries Piped first, then Invidious
async function fallbackSearch(query: string, maxResults: number): Promise<{ results: YouTubeSearchResult[], source: string }> {
  let results = await pipedSearch(query, maxResults);
  if (results.length > 0) {
    return { results, source: 'piped' };
  }
  
  results = await invidiousSearch(query, maxResults);
  if (results.length > 0) {
    return { results, source: 'invidious' };
  }
  
  return { results: [], source: 'none' };
}

// YouTube Data API search
async function youtubeApiSearch(
  searchQuery: string, 
  maxResults: number, 
  pageToken?: string, 
  officialOnly = false
): Promise<{ results: YouTubeSearchResult[], nextPageToken?: string, prevPageToken?: string, totalResults?: number, source: string } | null> {
  if (!YOUTUBE_API_KEY) return null;
  
  console.log(`[YouTube API] Searching for: "${searchQuery}"`);
  
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

  try {
    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`[YouTube API] Error ${searchResponse.status}:`, errorText);
      return null; // Return null to trigger fallback
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');

    if (!videoIds) {
      return { results: [], source: 'youtube' };
    }

    // Fetch video details (duration, view count)
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.set('part', 'contentDetails,statistics,snippet');
    detailsUrl.searchParams.set('id', videoIds);
    detailsUrl.searchParams.set('key', YOUTUBE_API_KEY);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    const detailsMap = new Map();
    detailsData.items?.forEach((item: any) => {
      detailsMap.set(item.id, {
        duration: item.contentDetails?.duration,
        viewCount: item.statistics?.viewCount,
        description: item.snippet?.description,
        tags: item.snippet?.tags || [],
      });
    });

    let results: any[] = searchData.items?.map((item: any) => {
      const details = detailsMap.get(item.id.videoId) || {};
      const title = item.snippet.title.toLowerCase();
      const channel = item.snippet.channelTitle.toLowerCase();
      const description = (details.description || '').toLowerCase();

      const isTopicChannel = channel.includes('- topic') || channel.endsWith(' - topic');
      const hasOfficialInTitle = title.includes('official audio') ||
        title.includes('official music video') ||
        title.includes('official video');
      const isVevoChannel = channel.includes('vevo');
      const hasAutoGenerated = description.includes('auto-generated by youtube');

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

    // Clean up internal scoring fields
    const cleanResults: YouTubeSearchResult[] = results.slice(0, maxResults).map((r: any) => {
      const { _officialScore, _viewCountRaw, ...clean } = r;
      return clean;
    });

    console.log(`[YouTube API] SUCCESS: ${cleanResults.length} results`);

    return {
      results: cleanResults,
      nextPageToken: searchData.nextPageToken,
      prevPageToken: searchData.prevPageToken,
      totalResults: searchData.pageInfo?.totalResults,
      source: 'youtube',
    };
  } catch (e: any) {
    console.error('[YouTube API] Exception:', e.message || e);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Public endpoint: cap requests per IP so scripts can't drain API quota.
  const limited = rateLimit(req, 'youtube-search', corsHeaders, 30);
  if (limited) return limited;

  try {
    const { query, type = 'search', videoId, channelId, channelUrl, maxResults = 20, pageToken, officialOnly = false } = await req.json().catch(() => ({}));

    const hasYouTubeKey = Boolean(YOUTUBE_API_KEY);
    console.log(`[youtube-search] type=${type}, query="${query}", hasKey=${hasYouTubeKey}`);

    // Handle channel URL parsing
    let resolvedChannelId = channelId;
    if (channelUrl && !resolvedChannelId) {
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
          error: 'YouTube API key required for channel lookup',
          channelId: resolvedChannelId,
        }), {
          status: 200, // Return 200 with empty results
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Fetching videos for channel: ${resolvedChannelId}`);

      const channelApiUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
      channelApiUrl.searchParams.set('part', 'snippet,contentDetails');
      channelApiUrl.searchParams.set('id', resolvedChannelId);
      channelApiUrl.searchParams.set('key', YOUTUBE_API_KEY!);

      const channelResponse = await fetch(channelApiUrl.toString());
      if (!channelResponse.ok) {
        console.error('Channel fetch failed:', await channelResponse.text());
        throw new Error('Failed to fetch channel details');
      }

      const channelData = await channelResponse.json();
      const channel = channelData.items?.[0];

      if (!channel) {
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

      if (uploadsPlaylistId) {
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
          const vid = item.contentDetails.videoId;
          const details = videoDetailsMap.get(vid) || {};

          return {
            id: vid,
            title: item.snippet.title,
            channel: channelTitle,
            channelId: resolvedChannelId,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            duration: parseDuration(details.duration),
            viewCount: formatViewCount(details.viewCount),
            publishedAt: item.snippet.publishedAt,
            isOfficialAudio: true,
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

    // SEARCH - Main search logic with fallback
    if (type === 'search') {
      let searchQuery = query;
      if (officialOnly && !query.toLowerCase().includes('topic') && !query.toLowerCase().includes('official')) {
        searchQuery = `${query} official audio`;
      }

      // Try YouTube API first
      if (hasYouTubeKey) {
        const youtubeResult = await youtubeApiSearch(searchQuery, maxResults, pageToken, officialOnly);
        
        if (youtubeResult && youtubeResult.results.length > 0) {
          return new Response(JSON.stringify(youtubeResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // YouTube API failed or returned empty, use fallback
        console.log('[youtube-search] YouTube API failed or empty, using fallback');
      }

      // Fallback to Piped/Invidious
      const fallbackResult = await fallbackSearch(searchQuery, maxResults);
      
      return new Response(JSON.stringify({
        results: fallbackResult.results,
        nextPageToken: undefined,
        prevPageToken: undefined,
        totalResults: fallbackResult.results.length,
        source: fallbackResult.source,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (type === 'trending') {
      // Trending requires YouTube API
      if (!hasYouTubeKey) {
        // Fallback: search for trending music
        const fallbackResult = await fallbackSearch('top music hits 2024', maxResults);
        return new Response(JSON.stringify({
          results: fallbackResult.results,
          source: fallbackResult.source,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const trendingUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      trendingUrl.searchParams.set('part', 'snippet,contentDetails,statistics');
      trendingUrl.searchParams.set('chart', 'mostPopular');
      trendingUrl.searchParams.set('videoCategoryId', '10');
      trendingUrl.searchParams.set('maxResults', String(maxResults));
      trendingUrl.searchParams.set('regionCode', 'US');
      trendingUrl.searchParams.set('key', YOUTUBE_API_KEY!);
      if (pageToken) {
        trendingUrl.searchParams.set('pageToken', pageToken);
      }

      const trendingResponse = await fetch(trendingUrl.toString());

      if (!trendingResponse.ok) {
        // Fallback on error
        const fallbackResult = await fallbackSearch('trending music', maxResults);
        return new Response(JSON.stringify({
          results: fallbackResult.results,
          source: fallbackResult.source,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
      if (!hasYouTubeKey) {
        // Can't do related without API, return empty
        return new Response(JSON.stringify({ results: [], source: 'none' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const relatedUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      relatedUrl.searchParams.set('part', 'snippet');
      relatedUrl.searchParams.set('relatedToVideoId', videoId);
      relatedUrl.searchParams.set('type', 'video');
      relatedUrl.searchParams.set('maxResults', String(maxResults));
      relatedUrl.searchParams.set('key', YOUTUBE_API_KEY!);

      const relatedResponse = await fetch(relatedUrl.toString());

      if (!relatedResponse.ok) {
        return new Response(JSON.stringify({ results: [], source: 'none' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
    console.error('[youtube-search] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Even on error, try fallback search if we have a query
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.query) {
        console.log('[youtube-search] Attempting fallback after error...');
        const fallbackResult = await fallbackSearch(body.query, body.maxResults || 20);
        if (fallbackResult.results.length > 0) {
          return new Response(JSON.stringify({
            results: fallbackResult.results,
            source: fallbackResult.source,
            warning: `Primary API error: ${errorMessage}`,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e) {
      console.error('[youtube-search] Fallback also failed:', e);
    }
    
    return new Response(JSON.stringify({ error: errorMessage, results: [] }), {
      status: 200, // Return 200 with empty results instead of 500
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
