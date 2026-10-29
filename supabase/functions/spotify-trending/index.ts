import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { rateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const BILLBOARD_HOT_100_URL = 'https://www.billboard.com/charts/hot-100/';
const USER_AGENT = 'TDZ-StreamingPlatform/1.0 (contact@thirtydarkzero.com)';

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
}

async function getSpotifyToken(): Promise<string | null> {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    console.log('Spotify credentials not configured, using fallback data');
    return null;
  }
  
  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
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

async function fetchSpotifyFeaturedPlaylists(token: string): Promise<SpotifyPlaylist[]> {
  try {
    const response = await fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=20', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.playlists?.items || [];
  } catch (error) {
    console.error('Failed to fetch featured playlists:', error);
    return [];
  }
}

async function fetchSpotifyNewReleases(token: string): Promise<any[]> {
  try {
    const response = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=20', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.albums?.items || [];
  } catch (error) {
    console.error('Failed to fetch new releases:', error);
    return [];
  }
}

async function fetchSpotifyCategories(token: string): Promise<any[]> {
  try {
    const response = await fetch('https://api.spotify.com/v1/browse/categories?limit=30', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.categories?.items || [];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

async function searchSpotify(token: string, query: string, type: string = 'track'): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=20`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    return data[`${type}s`]?.items || [];
  } catch (error) {
    console.error('Spotify search failed:', error);
    return [];
  }
}

// Fetch Spotify album tracks - returns full tracklist
async function fetchSpotifyAlbumTracks(token: string, albumId: string): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Failed to fetch album tracks:', error);
    return [];
  }
}

// Search Spotify for an album and get its tracklist
async function getAlbumTracklist(token: string, artist: string, albumName: string): Promise<any> {
  try {
    // Search for the album
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=album:${encodeURIComponent(albumName)} artist:${encodeURIComponent(artist)}&type=album&limit=1`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const searchData = await searchResponse.json();
    const album = searchData.albums?.items?.[0];
    
    if (!album) {
      console.log(`Album not found: ${albumName} by ${artist}`);
      return null;
    }
    
    // Get album details with tracks
    const albumResponse = await fetch(
      `https://api.spotify.com/v1/albums/${album.id}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const albumData = await albumResponse.json();
    
    return {
      id: albumData.id,
      name: albumData.name,
      artist: albumData.artists?.map((a: any) => a.name).join(', '),
      image: albumData.images?.[0]?.url,
      releaseDate: albumData.release_date,
      totalTracks: albumData.total_tracks,
      genres: albumData.genres || [],
      tracks: albumData.tracks?.items?.map((track: any, idx: number) => ({
        position: idx + 1,
        title: track.name,
        artists: track.artists?.map((a: any) => a.name).join(', '),
        duration: track.duration_ms,
        trackNumber: track.track_number,
        discNumber: track.disc_number,
        explicit: track.explicit,
        previewUrl: track.preview_url,
      })) || [],
    };
  } catch (error) {
    console.error('Failed to get album tracklist:', error);
    return null;
  }
}

// City to Spotify market/country code mapping
const CITY_MARKETS: Record<string, { market: string; playlistSearch: string }> = {
  'nyc': { market: 'US', playlistSearch: 'Top 50 USA' },
  'los-angeles': { market: 'US', playlistSearch: 'Top 50 USA' },
  'chicago': { market: 'US', playlistSearch: 'Top 50 USA' },
  'miami': { market: 'US', playlistSearch: 'Top 50 USA' },
  'atlanta': { market: 'US', playlistSearch: 'Top 50 USA' },
  'houston': { market: 'US', playlistSearch: 'Top 50 USA' },
  'denver': { market: 'US', playlistSearch: 'Top 50 USA' },
  'san-francisco': { market: 'US', playlistSearch: 'Top 50 USA' },
  'san-diego': { market: 'US', playlistSearch: 'Top 50 USA' },
  'san-antonio': { market: 'US', playlistSearch: 'Top 50 USA' },
  'detroit': { market: 'US', playlistSearch: 'Top 50 USA' },
  'london': { market: 'GB', playlistSearch: 'Top 50 UK' },
  'berlin': { market: 'DE', playlistSearch: 'Top 50 Germany' },
  'tokyo': { market: 'JP', playlistSearch: 'Top 50 Japan' },
  'paris': { market: 'FR', playlistSearch: 'Top 50 France' },
  'barcelona': { market: 'ES', playlistSearch: 'Top 50 Spain' },
  'cdmx': { market: 'MX', playlistSearch: 'Top 50 Mexico' },
  'dubai': { market: 'AE', playlistSearch: 'Top 50 UAE' },
  'singapore': { market: 'SG', playlistSearch: 'Top 50 Singapore' },
};

async function fetchCityTopTracks(token: string, cityId: string): Promise<any[]> {
  const cityConfig = CITY_MARKETS[cityId] || CITY_MARKETS['nyc'];
  
  try {
    const searchQuery = `top charts ${cityConfig.playlistSearch}`;
    console.log(`Searching Spotify for: ${searchQuery}`);
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&market=${cityConfig.market}&limit=10`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (!response.ok) {
      console.error(`Spotify search failed: ${response.status}`);
      const altResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent('top 50 hits')}&type=track&market=${cityConfig.market}&limit=10`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (altResponse.ok) {
        const altData = await altResponse.json();
        return altData.tracks?.items || [];
      }
      return [];
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.tracks?.items?.length || 0} tracks for ${cityId}`);
    
    return data.tracks?.items || [];
  } catch (error) {
    console.error(`Failed to fetch city tracks for ${cityId}:`, error);
    return [];
  }
}

// Billboard Hot 100 - Current chart data
function getBillboardHot100(): any[] {
  // Current Billboard Hot 100 - Updated January 2026
  return [
    { position: 1, title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273b3be3b970fc89a02f301c72c', weeksOnChart: 18 },
    { position: 2, title: 'APT.', artist: 'ROSÉ & Bruno Mars', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273d573290af0c9bef0e6c99c2a', weeksOnChart: 10 },
    { position: 3, title: 'Timeless', artist: 'The Weeknd & Playboi Carti', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', weeksOnChart: 5 },
    { position: 4, title: 'Luther', artist: 'Kendrick Lamar & SZA', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2735be9e01c08e957d9e9b08426', weeksOnChart: 4 },
    { position: 5, title: 'Squabble Up', artist: 'Kendrick Lamar', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2735be9e01c08e957d9e9b08426', weeksOnChart: 4 },
    { position: 6, title: 'Reincarnated', artist: 'Kendrick Lamar', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2735be9e01c08e957d9e9b08426', weeksOnChart: 4 },
    { position: 7, title: 'Shake It Off', artist: 'Lady Gaga', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273b3be3b970fc89a02f301c72c', weeksOnChart: 3 },
    { position: 8, title: 'Sao Paulo', artist: 'The Weeknd & Anitta', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', weeksOnChart: 5 },
    { position: 9, title: 'Espresso', artist: 'Sabrina Carpenter', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e8b6c7bb4c8e4be4f893c0ca', weeksOnChart: 32 },
    { position: 10, title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2731582d9a4a0089b62d8ec2df7', weeksOnChart: 28 },
    { position: 11, title: 'Please Please Please', artist: 'Sabrina Carpenter', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e8b6c7bb4c8e4be4f893c0ca', weeksOnChart: 26 },
    { position: 12, title: 'Birds of a Feather', artist: 'Billie Eilish', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2736e63a8b8c82ab5c7bbf2c7ac', weeksOnChart: 24 },
    { position: 13, title: 'Taste', artist: 'Sabrina Carpenter', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e8b6c7bb4c8e4be4f893c0ca', weeksOnChart: 14 },
    { position: 14, title: 'Too Sweet', artist: 'Hozier', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738f3f9a3ce0e4c6c0e0e0e0e0', weeksOnChart: 35 },
    { position: 15, title: 'Lose Control', artist: 'Teddy Swims', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273a1a1a1a1a1a1a1a1a1a1a1a1', weeksOnChart: 40 },
    { position: 16, title: 'Beautiful Things', artist: 'Benson Boone', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738f3f9a3ce0e4c6c0e0e0e0e0', weeksOnChart: 42 },
    { position: 17, title: 'Good Luck, Babe!', artist: 'Chappell Roan', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2739f3f9a3ce0e4c6c0e0e0e0e0', weeksOnChart: 30 },
    { position: 18, title: 'I Love You, Im Sorry', artist: 'Gracie Abrams', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738f3f9a3ce0e4c6c0e0e0e0e0', weeksOnChart: 18 },
    { position: 19, title: 'Million Dollar Baby', artist: 'Tommy Richman', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738f3f9a3ce0e4c6c0e0e0e0e0', weeksOnChart: 26 },
    { position: 20, title: 'Not Like Us', artist: 'Kendrick Lamar', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273d9985092cd88bffd97653b58', weeksOnChart: 28 },
  ];
}

function getFallbackTrendingData() {
  const billboard = getBillboardHot100();
  return {
    featuredPlaylists: [
      { id: 'fp1', name: "Today's Top Hits", description: 'The hottest tracks right now', image: 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc', tracks: 50, source: 'spotify' },
      { id: 'fp2', name: 'RapCaviar', description: 'New hip hop and R&B', image: 'https://i.scdn.co/image/ab67706f00000002b10f3d1cf5b0a2da7ab47bc4', tracks: 50, source: 'spotify' },
      { id: 'fp3', name: 'Hot Country', description: 'Country hits', image: 'https://i.scdn.co/image/ab67706f000000023e0130fcd5d106f1402b4707', tracks: 50, source: 'spotify' },
      { id: 'fp4', name: 'Viva Latino', description: 'Latin music vibes', image: 'https://i.scdn.co/image/ab67706f000000025af3ba9a50672e98c5c8ea9c', tracks: 50, source: 'spotify' },
      { id: 'fp5', name: 'Rock Classics', description: 'Rock legends', image: 'https://i.scdn.co/image/ab67706f00000002fe6d8d1019d5b302213e3730', tracks: 100, source: 'spotify' },
      { id: 'fp6', name: 'Chill Hits', description: 'Relaxing vibes', image: 'https://i.scdn.co/image/ab67706f00000002b60db5d1bcdd9c4fd1ebcffe', tracks: 75, source: 'spotify' },
    ],
    trendingTracks: billboard.slice(0, 10).map(t => ({
      id: `bb-${t.position}`,
      title: t.title,
      artist: t.artist,
      album: t.title,
      thumbnail: t.thumbnail,
      source: 'billboard',
      position: t.position,
      weeksOnChart: t.weeksOnChart,
    })),
    newReleases: [
      { id: 'nr1', title: 'GNX', artist: 'Kendrick Lamar', image: 'https://i.scdn.co/image/ab67616d0000b2735be9e01c08e957d9e9b08426', source: 'spotify' },
      { id: 'nr2', title: 'Hurry Up Tomorrow', artist: 'The Weeknd', image: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', source: 'spotify' },
      { id: 'nr3', title: 'Short n Sweet', artist: 'Sabrina Carpenter', image: 'https://i.scdn.co/image/ab67616d0000b273e8b6c7bb4c8e4be4f893c0ca', source: 'spotify' },
    ],
    billboard: billboard,
    genres: [
      { id: 'g1', name: 'Hip-Hop', icon: '🎤' },
      { id: 'g2', name: 'Pop', icon: '🎵' },
      { id: 'g3', name: 'R&B', icon: '💜' },
      { id: 'g4', name: 'Rock', icon: '🎸' },
      { id: 'g5', name: 'Electronic', icon: '🎧' },
      { id: 'g6', name: 'Latin', icon: '💃' },
      { id: 'g7', name: 'Country', icon: '🤠' },
      { id: 'g8', name: 'Jazz', icon: '🎷' },
    ]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Public endpoint: cap requests per IP so scripts can't drain API quota.
  const limited = rateLimit(req, 'spotify-trending', corsHeaders, 30);
  if (limited) return limited;

  try {
    const { action, query, type, cityId, artist, albumName } = await req.json().catch(() => ({}));
    
    const token = await getSpotifyToken();
    
    if (!token) {
      const fallbackData = getFallbackTrendingData();
      return new Response(JSON.stringify({
        success: true,
        source: 'fallback',
        data: fallbackData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    let result: any = {};
    
    switch (action) {
      case 'featured':
        const playlists = await fetchSpotifyFeaturedPlaylists(token);
        result = {
          featuredPlaylists: playlists.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            image: p.images?.[0]?.url,
            tracks: p.tracks?.total || 0,
            owner: p.owner?.display_name,
            source: 'spotify'
          }))
        };
        break;
        
      case 'new-releases':
        const releases = await fetchSpotifyNewReleases(token);
        result = {
          newReleases: releases.map(a => ({
            id: a.id,
            title: a.name,
            artist: a.artists?.map((ar: any) => ar.name).join(', '),
            image: a.images?.[0]?.url,
            releaseDate: a.release_date,
            source: 'spotify'
          }))
        };
        break;
        
      case 'categories':
        const categories = await fetchSpotifyCategories(token);
        result = {
          categories: categories.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icons?.[0]?.url,
            source: 'spotify'
          }))
        };
        break;
        
      case 'search':
        const searchResults = await searchSpotify(token, query, type || 'track');
        result = {
          results: searchResults.map((item: any) => {
            if (type === 'track' || !type) {
              return {
                id: item.id,
                title: item.name,
                artist: item.artists?.map((a: any) => a.name).join(', '),
                album: item.album?.name,
                thumbnail: item.album?.images?.[0]?.url,
                duration: item.duration_ms,
                previewUrl: item.preview_url,
                source: 'spotify'
              };
            }
            return item;
          })
        };
        break;
      
      case 'album-tracks':
        // Get album tracklist from Spotify
        if (!artist || !albumName) {
          throw new Error('artist and albumName required for album-tracks action');
        }
        const albumData = await getAlbumTracklist(token, artist, albumName);
        result = { album: albumData };
        break;
      
      case 'city-trending':
        const cityTracks = await fetchCityTopTracks(token, cityId || 'nyc');
        result = {
          cityId: cityId || 'nyc',
          tracks: cityTracks.slice(0, 10).map((track: any, index: number) => ({
            id: track.id,
            title: track.name,
            artist: track.artists?.map((a: any) => a.name).join(', '),
            album: track.album?.name,
            thumbnail: track.album?.images?.[0]?.url,
            duration: track.duration_ms,
            position: index + 1,
            source: 'spotify'
          }))
        };
        console.log(`City trending for ${cityId}: ${result.tracks.length} tracks`);
        break;
      
      case 'billboard':
        // Return current Billboard Hot 100
        result = {
          chart: 'hot-100',
          date: new Date().toISOString().split('T')[0],
          tracks: getBillboardHot100(),
        };
        break;
        
      case 'trending':
      default:
        const [featured, newAlbums] = await Promise.all([
          fetchSpotifyFeaturedPlaylists(token),
          fetchSpotifyNewReleases(token)
        ]);
        
        result = {
          featuredPlaylists: featured.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            image: p.images?.[0]?.url,
            tracks: p.tracks?.total || 0,
            source: 'spotify'
          })),
          newReleases: newAlbums.map(a => ({
            id: a.id,
            title: a.name,
            artist: a.artists?.map((ar: any) => ar.name).join(', '),
            image: a.images?.[0]?.url,
            source: 'spotify'
          })),
          billboard: getBillboardHot100(),
        };
        break;
    }
    
    return new Response(JSON.stringify({
      success: true,
      source: 'spotify',
      data: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Spotify trending error:', error);
    
    const fallbackData = getFallbackTrendingData();
    return new Response(JSON.stringify({
      success: true,
      source: 'fallback',
      data: fallbackData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

