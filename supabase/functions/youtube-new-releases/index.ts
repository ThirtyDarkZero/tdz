import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!YOUTUBE_API_KEY) {
      return new Response(JSON.stringify({ error: 'YOUTUBE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch from YouTube "New Music" playlists
    const newMusicPlaylists = [
      { id: 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf', name: 'New Music This Week' },
      { id: 'RDCLAK5uy_n9Fbg-wSBnprMmnn7GR2GFHIF1EVntPA', name: 'New Releases Mix' },
    ];

    const releases: any[] = [];

    for (const playlist of newMusicPlaylists) {
      try {
        const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        url.searchParams.set('part', 'snippet,contentDetails');
        url.searchParams.set('playlistId', playlist.id);
        url.searchParams.set('maxResults', '25');
        url.searchParams.set('key', YOUTUBE_API_KEY);

        const res = await fetch(url.toString());
        if (!res.ok) continue;
        const data = await res.json();

        for (const item of data.items || []) {
          const title = item.snippet?.title || '';
          const channel = item.snippet?.videoOwnerChannelTitle?.replace(' - Topic', '') || item.snippet?.channelTitle || '';
          const videoId = item.contentDetails?.videoId;
          if (!videoId) continue;

          releases.push({
            id: videoId,
            title: title.replace(/\(Official.*?\)/gi, '').replace(/\[Official.*?\]/gi, '').trim(),
            artist: channel,
            thumbnail: item.snippet?.thumbnails?.high?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            youtubeId: videoId,
            publishedAt: item.snippet?.publishedAt,
            type: 'single',
          });
        }
      } catch (e) {
        console.error(`Failed to fetch playlist ${playlist.name}:`, e);
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = releases.filter(r => {
      if (seen.has(r.youtubeId)) return false;
      seen.add(r.youtubeId);
      return true;
    });

    // Sort by publish date
    unique.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

    return new Response(JSON.stringify({ releases: unique.slice(0, 50), total: unique.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('youtube-new-releases error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
