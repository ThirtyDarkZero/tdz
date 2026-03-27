import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// YouTube Music editorial playlist IDs mapped to genres
const GENRE_PLAYLISTS: Record<string, string> = {
  "hip-hop": "PL4fGSI1pDJn4fmCoF1vKHLtivI0f9yHiF",
  "r&b": "RDCLAK5uy_kEtrQFmd2q44rtlNH5ukTHmda2jzWkwO0",
  "pop": "PL4fGSI1pDJn77aK7sAW2AT0oOzo5inWY8",
  "rock": "PL4fGSI1pDJn5LOptOQixqnzXNGjNXAgYY",
  "latin": "PL4fGSI1pDJn5O8siDeZuI_4hbk6JWtTX1",
  "jazz": "PL4fGSI1pDJn7Wkr6Ll6ds1AhA42rT8uaU",
  "dance": "PL4fGSI1pDJn4rBU0RHnR6-b1_uE20CzRH",
  "afrobeats": "RDCLAK5uy_kmq8ZD0NbHbKkZZ6frtlEjd8khfeZrAd0",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { genre } = await req.json();
    
    if (!genre || typeof genre !== 'string') {
      return new Response(JSON.stringify({ error: 'genre is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const genreKey = genre.toLowerCase();
    const playlistId = GENRE_PLAYLISTS[genreKey];

    if (!playlistId) {
      return new Response(JSON.stringify({ error: `Unknown genre: ${genre}`, tracks: [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    if (!YOUTUBE_API_KEY) {
      return new Response(JSON.stringify({ error: 'YOUTUBE_API_KEY not configured', tracks: [] }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch up to 50 items from the playlist
    const tracks: any[] = [];
    let nextPageToken: string | undefined;
    let fetched = 0;

    while (fetched < 50) {
      const maxResults = Math.min(50, 50 - fetched);
      let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;
      if (nextPageToken) url += `&pageToken=${nextPageToken}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        const errText = await response.text();
        console.error(`YouTube API error [${response.status}]:`, errText);
        break;
      }

      const data = await response.json();
      const items = data.items || [];

      for (const item of items) {
        const snippet = item.snippet;
        if (!snippet || snippet.title === 'Private video' || snippet.title === 'Deleted video') continue;

        const videoId = snippet.resourceId?.videoId;
        if (!videoId) continue;

        // Parse artist and title from YouTube video title
        let title = snippet.title || '';
        let artist = snippet.videoOwnerChannelTitle?.replace(/ - Topic$/, '') || 'Unknown Artist';

        // Common YouTube Music pattern: "Artist - Title"
        const dashSplit = title.match(/^(.+?)\s*[-–—]\s*(.+)$/);
        if (dashSplit) {
          artist = dashSplit[1].trim();
          title = dashSplit[2].trim();
        }

        tracks.push({
          id: `yt-${videoId}`,
          youtubeId: videoId,
          title,
          artist_name: artist,
          thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
          source: 'youtube',
          duration: 0,
          file_path: '',
          play_count: 0,
          position: snippet.position ?? fetched,
        });

        fetched++;
        if (fetched >= 50) break;
      }

      nextPageToken = data.nextPageToken;
      if (!nextPageToken) break;
    }

    return new Response(JSON.stringify({ 
      genre: genreKey,
      playlistId,
      tracks,
      total: tracks.length,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Genre playlist error:', error);
    return new Response(JSON.stringify({ error: error.message, tracks: [] }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
