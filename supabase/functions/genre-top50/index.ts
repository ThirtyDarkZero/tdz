import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { rateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

// BPM Supreme-style genre categories mapped to Spotify genre seeds
const GENRE_MAPPINGS: Record<string, { spotifyGenre: string; searchTerms: string[] }> = {
  'hip-hop': { spotifyGenre: 'hip-hop', searchTerms: ['hip hop', 'rap', 'trap'] },
  'rnb': { spotifyGenre: 'r-n-b', searchTerms: ['r&b', 'rnb', 'soul'] },
  'dance': { spotifyGenre: 'dance', searchTerms: ['dance', 'edm', 'house', 'techno'] },
  'pop': { spotifyGenre: 'pop', searchTerms: ['pop', 'mainstream'] },
  'rock': { spotifyGenre: 'rock', searchTerms: ['rock', 'alternative', 'indie'] },
  'country': { spotifyGenre: 'country', searchTerms: ['country', 'americana'] },
  'latin': { spotifyGenre: 'latin', searchTerms: ['latin', 'reggaeton', 'bachata'] },
  'electronic': { spotifyGenre: 'electronic', searchTerms: ['electronic', 'edm', 'dubstep'] },
  '00s': { spotifyGenre: 'pop', searchTerms: ['2000s hits', 'throwback 2000s'] },
  '90s': { spotifyGenre: 'pop', searchTerms: ['90s hits', 'throwback 90s'] },
  '80s': { spotifyGenre: 'pop', searchTerms: ['80s hits', 'throwback 80s'] },
  'exclusives': { spotifyGenre: 'pop', searchTerms: ['new music friday', 'latest releases'] },
};

interface TopTrack {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  bpm?: number;
  key?: string;
  genre: string;
  youtubeId?: string;
  position: number;
  addedDate?: string;
}

async function getSpotifyToken(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.log('Spotify credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Failed to get Spotify token:', error);
    return null;
  }
}

async function searchYouTubeForTrack(title: string, artist: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) return null;

  try {
    const query = `${artist} ${title} official audio`;
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoCategoryId', '10'); // Music
    url.searchParams.set('maxResults', '1');
    url.searchParams.set('key', YOUTUBE_API_KEY);

    const response = await fetch(url.toString());
    if (response.ok) {
      const data = await response.json();
      return data.items?.[0]?.id?.videoId || null;
    }
  } catch (error) {
    console.error('YouTube search failed:', error);
  }
  return null;
}

async function fetchGenreTopTracks(token: string, genre: string, limit: number = 50): Promise<TopTrack[]> {
  const genreConfig = GENRE_MAPPINGS[genre] || GENRE_MAPPINGS['pop'];
  const results: TopTrack[] = [];

  try {
    // Search for top tracks in this genre
    for (const searchTerm of genreConfig.searchTerms.slice(0, 2)) {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=genre:${genreConfig.spotifyGenre}%20${encodeURIComponent(searchTerm)}&type=track&market=US&limit=25`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        for (const track of (data.tracks?.items || [])) {
          // Avoid duplicates
          if (!results.find(r => r.title.toLowerCase() === track.name.toLowerCase() && 
              r.artist.toLowerCase() === track.artists[0]?.name.toLowerCase())) {
            results.push({
              id: track.id,
              title: track.name,
              artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
              thumbnail: track.album?.images?.[0]?.url || '',
              genre: genre,
              position: results.length + 1,
              addedDate: track.album?.release_date,
            });
          }
        }
      }

      // Small delay to respect rate limits
      await new Promise(r => setTimeout(r, 100));
    }

    // Sort by popularity (implicit from Spotify order) and limit
    return results.slice(0, limit);
  } catch (error) {
    console.error(`Error fetching ${genre} tracks:`, error);
    return [];
  }
}

// Fallback data when APIs aren't configured
function getGenreFallbackData(genre: string): TopTrack[] {
  const fallbacksByGenre: Record<string, TopTrack[]> = {
    'hip-hop': [
      { id: '1', title: 'Not Like Us', artist: 'Kendrick Lamar', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2735be9e01c08e957d9e9b08426', genre: 'hip-hop', position: 1 },
      { id: '2', title: 'Luther', artist: 'Kendrick Lamar & SZA', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2735be9e01c08e957d9e9b08426', genre: 'hip-hop', position: 2 },
      { id: '3', title: 'Squabble Up', artist: 'Kendrick Lamar', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2735be9e01c08e957d9e9b08426', genre: 'hip-hop', position: 3 },
      { id: '4', title: 'HUMBLE.', artist: 'Kendrick Lamar', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273d6e9c9bf2f3e1e2f3e1e2f3e', genre: 'hip-hop', position: 4 },
      { id: '5', title: 'March', artist: 'GloRilla', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273d6e9c9bf2f3e1e2f3e1e2f3e', genre: 'hip-hop', position: 5 },
    ],
    'pop': [
      { id: '1', title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273b3be3b970fc89a02f301c72c', genre: 'pop', position: 1 },
      { id: '2', title: 'APT.', artist: 'ROSÉ & Bruno Mars', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273d573290af0c9bef0e6c99c2a', genre: 'pop', position: 2 },
      { id: '3', title: 'Espresso', artist: 'Sabrina Carpenter', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'pop', position: 3 },
      { id: '4', title: 'Good Luck, Babe!', artist: 'Chappell Roan', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'pop', position: 4 },
      { id: '5', title: 'Birds of a Feather', artist: 'Billie Eilish', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'pop', position: 5 },
    ],
    'dance': [
      { id: '1', title: 'Beautiful Things', artist: 'Benson Boone', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'dance', position: 1 },
      { id: '2', title: 'Lose Control', artist: 'Teddy Swims', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'dance', position: 2 },
      { id: '3', title: 'Stargazing', artist: 'Myles Smith', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'dance', position: 3 },
      { id: '4', title: 'Kamikaze', artist: 'Future & Metro Boomin', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'dance', position: 4 },
      { id: '5', title: 'Houdini', artist: 'Eminem', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'dance', position: 5 },
    ],
    'rnb': [
      { id: '1', title: 'Timeless', artist: 'The Weeknd & Playboi Carti', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', genre: 'rnb', position: 1 },
      { id: '2', title: 'Snooze', artist: 'SZA', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'rnb', position: 2 },
      { id: '3', title: 'Shirt', artist: 'SZA', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'rnb', position: 3 },
      { id: '4', title: 'Kill Bill', artist: 'SZA', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'rnb', position: 4 },
      { id: '5', title: 'On My Mama', artist: 'Victoria Monét', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'rnb', position: 5 },
    ],
    'country': [
      { id: '1', title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'country', position: 1 },
      { id: '2', title: 'I Had Some Help', artist: 'Post Malone & Morgan Wallen', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'country', position: 2 },
      { id: '3', title: 'Cowgirls', artist: 'Morgan Wallen', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'country', position: 3 },
      { id: '4', title: 'Fast Car', artist: 'Luke Combs', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'country', position: 4 },
      { id: '5', title: 'Last Night', artist: 'Morgan Wallen', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'country', position: 5 },
    ],
    'latin': [
      { id: '1', title: 'La Bebe', artist: 'Peso Pluma & Yng Lvcas', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'latin', position: 1 },
      { id: '2', title: 'Ella Baila Sola', artist: 'Eslabon Armado & Peso Pluma', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'latin', position: 2 },
      { id: '3', title: 'Titi Me Pregunto', artist: 'Bad Bunny', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'latin', position: 3 },
      { id: '4', title: 'Me Porto Bonito', artist: 'Bad Bunny & Chencho Corleone', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'latin', position: 4 },
      { id: '5', title: 'Cupido', artist: 'Rauw Alejandro', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'latin', position: 5 },
    ],
    'rock': [
      { id: '1', title: 'Too Sweet', artist: 'Hozier', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'rock', position: 1 },
      { id: '2', title: 'Stick Season', artist: 'Noah Kahan', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'rock', position: 2 },
      { id: '3', title: 'Circles', artist: 'Post Malone', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'rock', position: 3 },
      { id: '4', title: 'Believer', artist: 'Imagine Dragons', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'rock', position: 4 },
      { id: '5', title: 'Thunder', artist: 'Imagine Dragons', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'rock', position: 5 },
    ],
    'electronic': [
      { id: '1', title: 'Clarity', artist: 'Zedd ft. Foxes', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'electronic', position: 1 },
      { id: '2', title: 'Titanium', artist: 'David Guetta ft. Sia', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'electronic', position: 2 },
      { id: '3', title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'electronic', position: 3 },
      { id: '4', title: 'Don\'t Start Now', artist: 'Dua Lipa', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e5a8e7b3e5a8e7b3e5a8e7b3', genre: 'electronic', position: 4 },
      { id: '5', title: 'Blinding Lights', artist: 'The Weeknd', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', genre: 'electronic', position: 5 },
    ],
  };

  return fallbacksByGenre[genre] || fallbacksByGenre['pop'];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Public endpoint: cap requests per IP so scripts can't drain API quota.
  const limited = rateLimit(req, 'genre-top50', corsHeaders, 20);
  if (limited) return limited;

  try {
    const { genre = 'hip-hop', limit = 50, withYouTube = false } = await req.json().catch(() => ({}));
    
    console.log(`Genre Top 50 request: genre=${genre} limit=${limit} withYouTube=${withYouTube}`);

    const token = await getSpotifyToken();
    let tracks: TopTrack[] = [];

    if (token) {
      tracks = await fetchGenreTopTracks(token, genre, limit);
    }

    // Use fallback if no results
    if (tracks.length === 0) {
      console.log(`Using fallback data for ${genre}`);
      tracks = getGenreFallbackData(genre);
    }

    // Optionally resolve YouTube IDs for playback
    if (withYouTube && tracks.length > 0) {
      const tracksWithYouTube = await Promise.all(
        tracks.slice(0, 10).map(async (track) => {
          const youtubeId = await searchYouTubeForTrack(track.title, track.artist);
          return { ...track, youtubeId: youtubeId || undefined };
        })
      );
      // Only update the ones we searched
      tracks = [...tracksWithYouTube, ...tracks.slice(10)];
    }

    return new Response(JSON.stringify({
      success: true,
      genre,
      tracks,
      totalTracks: tracks.length,
      availableGenres: Object.keys(GENRE_MAPPINGS),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Genre Top 50 error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch genre tracks',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
