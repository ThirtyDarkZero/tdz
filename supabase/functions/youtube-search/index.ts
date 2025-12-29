import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

interface YouTubeSearchResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
  viewCount?: string;
  publishedAt: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type = 'search', videoId, maxResults = 20, pageToken } = await req.json();

    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    // Different endpoints based on type
    if (type === 'search') {
      // Search for videos
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('q', query);
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('videoCategoryId', '10'); // Music category
      searchUrl.searchParams.set('maxResults', String(maxResults));
      searchUrl.searchParams.set('key', YOUTUBE_API_KEY);
      if (pageToken) {
        searchUrl.searchParams.set('pageToken', pageToken);
      }

      console.log(`Searching YouTube for: ${query}`);
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
        // Fetch video details (duration, view count)
        const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
        detailsUrl.searchParams.set('part', 'contentDetails,statistics');
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
          });
        });

        // Combine search results with details
        const results: YouTubeSearchResult[] = searchData.items?.map((item: any) => {
          const details = detailsMap.get(item.id.videoId) || {};
          return {
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            duration: parseDuration(details.duration),
            viewCount: formatViewCount(details.viewCount),
            publishedAt: item.snippet.publishedAt,
          };
        }) || [];

        return new Response(JSON.stringify({
          results,
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
