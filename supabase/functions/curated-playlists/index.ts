import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CURATED_PLAYLISTS = [
  { name: "90s Hip Hop", youtubePlaylistId: "RDCLAK5uy_mpx6f-Md6iPbWSaizatzQIHfcF33fmT7E", genre: "Hip-Hop", coverEmoji: "🎤" },
  { name: "90s Rock", youtubePlaylistId: "RDCLAK5uy_m_h-nx7OCFaq9AlyXv78lG0AuloqW_NUA", genre: "Rock", coverEmoji: "🎸" },
  { name: "80s Hits", youtubePlaylistId: "RDCLAK5uy_lMzHW51iFg1Kx0d_2EHpzbOgCrwtu8cgI", genre: "Pop", coverEmoji: "🕺" },
  { name: "Phonk", youtubePlaylistId: "RDCLAK5uy_ljyDz8FJv4xec1TEdCPzYAHasU-OgXTeU", genre: "Phonk", coverEmoji: "👻" },
  { name: "Country", youtubePlaylistId: "RDCLAK5uy_l1BnI_Z1w4u9RWuZEXSBHJg7EMM_5IDsk", genre: "Country", coverEmoji: "🤠" },
];

async function fetchPlaylistTracks(playlistId: string, maxResults = 50): Promise<any[]> {
  if (!YOUTUBE_API_KEY) return [];
  
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('key', YOUTUBE_API_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`Playlist ${playlistId} fetch failed: ${res.status}`);
      return [];
    }
    const data = await res.json();

    return (data.items || []).map((item: any) => ({
      id: item.contentDetails?.videoId,
      title: (item.snippet?.title || '').replace(/\(Official.*?\)/gi, '').replace(/\[Official.*?\]/gi, '').trim(),
      artist: (item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || '').replace(' - Topic', ''),
      thumbnail: item.snippet?.thumbnails?.high?.url || `https://i.ytimg.com/vi/${item.contentDetails?.videoId}/hqdefault.jpg`,
      youtubeId: item.contentDetails?.videoId,
    })).filter((t: any) => t.id);
  } catch (e) {
    console.error(`Error fetching playlist ${playlistId}:`, e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const results: any[] = [];

    // Fetch all playlists in parallel
    const playlistPromises = CURATED_PLAYLISTS.map(async (playlist) => {
      const tracks = await fetchPlaylistTracks(playlist.youtubePlaylistId);
      const coverUrl = tracks[0]?.thumbnail || null;
      
      // Upsert into DB
      await supabase.from('curated_playlists').upsert({
        name: playlist.name,
        youtube_playlist_id: playlist.youtubePlaylistId,
        genre: playlist.genre,
        cover_url: coverUrl,
        tracks: tracks,
        track_count: tracks.length,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'youtube_playlist_id' });

      return {
        name: playlist.name,
        genre: playlist.genre,
        trackCount: tracks.length,
        coverUrl,
        tracks: tracks.slice(0, 5), // Preview
      };
    });

    const playlistResults = await Promise.all(playlistPromises);

    return new Response(JSON.stringify({ playlists: playlistResults, updated: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('curated-playlists error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
