import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Spotify API endpoints (using public web API endpoints)
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  preview_url: string | null;
}

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

// Spotify's official Top 50 playlist IDs by country
const SPOTIFY_TOP50_PLAYLISTS: Record<string, string> = {
  'US': '37i9dQZEVXbLRQDuF5jeBp', // Top 50 USA
  'GB': '37i9dQZEVXbLnolsZ8PSNw', // Top 50 UK
  'DE': '37i9dQZEVXbJiZcmkrIHGU', // Top 50 Germany
  'JP': '37i9dQZEVXbKXQ4mDTEBXq', // Top 50 Japan
  'FR': '37i9dQZEVXbIPWwFssbupI', // Top 50 France
  'ES': '37i9dQZEVXbNFJfN1Vw8d9', // Top 50 Spain
  'MX': '37i9dQZEVXbO3qyFxbkOE1', // Top 50 Mexico
  'AE': '37i9dQZEVXbM4UZuIrvHvA', // Top 50 UAE
  'SG': '37i9dQZEVXbK4gjvS1FjPY', // Top 50 Singapore
};

async function fetchCityTopTracks(token: string, cityId: string): Promise<any[]> {
  const cityConfig = CITY_MARKETS[cityId] || CITY_MARKETS['nyc'];
  
  // Use search for trending tracks in the market - more reliable than playlist IDs
  const searchQueries = [
    `top hits ${cityConfig.market} 2024`,
    `trending ${cityConfig.playlistSearch}`,
    `popular songs ${cityConfig.market}`,
  ];
  
  try {
    // Search for trending tracks in the region
    const searchQuery = `top charts ${cityConfig.playlistSearch}`;
    console.log(`Searching Spotify for: ${searchQuery}`);
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&market=${cityConfig.market}&limit=10`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (!response.ok) {
      console.error(`Spotify search failed: ${response.status}`);
      // Try alternate search
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

// Fallback trending data when Spotify API is not configured
function getFallbackTrendingData() {
  return {
    featuredPlaylists: [
      { id: 'fp1', name: 'Today\'s Top Hits', description: 'The hottest tracks right now', image: 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc', tracks: 50, source: 'spotify' },
      { id: 'fp2', name: 'RapCaviar', description: 'New hip hop and R&B', image: 'https://i.scdn.co/image/ab67706f00000002b10f3d1cf5b0a2da7ab47bc4', tracks: 50, source: 'spotify' },
      { id: 'fp3', name: 'Hot Country', description: 'Country hits', image: 'https://i.scdn.co/image/ab67706f000000023e0130fcd5d106f1402b4707', tracks: 50, source: 'spotify' },
      { id: 'fp4', name: 'Viva Latino', description: 'Latin music vibes', image: 'https://i.scdn.co/image/ab67706f000000025af3ba9a50672e98c5c8ea9c', tracks: 50, source: 'spotify' },
      { id: 'fp5', name: 'Rock Classics', description: 'Rock legends', image: 'https://i.scdn.co/image/ab67706f00000002fe6d8d1019d5b302213e3730', tracks: 100, source: 'spotify' },
      { id: 'fp6', name: 'Chill Hits', description: 'Relaxing vibes', image: 'https://i.scdn.co/image/ab67706f00000002b60db5d1bcdd9c4fd1ebcffe', tracks: 75, source: 'spotify' },
    ],
    trendingTracks: [
      { id: 'tt1', title: 'Die With A Smile', artist: 'Lady Gaga, Bruno Mars', album: 'Die With A Smile', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273b3be3b970fc89a02f301c72c', source: 'spotify' },
      { id: 'tt2', title: 'APT.', artist: 'ROSÉ, Bruno Mars', album: 'APT.', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273d573290af0c9bef0e6c99c2a', source: 'spotify' },
      { id: 'tt3', title: 'Timeless', artist: 'The Weeknd, Playboi Carti', album: 'Hurry Up Tomorrow', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', source: 'spotify' },
      { id: 'tt4', title: 'Luther', artist: 'Kendrick Lamar, SZA', album: 'GNX', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2735be9e01c08e957d9e9b08426', source: 'spotify' },
      { id: 'tt5', title: 'Squabble Up', artist: 'Kendrick Lamar', album: 'GNX', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2735be9e01c08e957d9e9b08426', source: 'spotify' },
    ],
    newReleases: [
      { id: 'nr1', title: 'GNX', artist: 'Kendrick Lamar', image: 'https://i.scdn.co/image/ab67616d0000b2735be9e01c08e957d9e9b08426', source: 'spotify' },
      { id: 'nr2', title: 'Hurry Up Tomorrow', artist: 'The Weeknd', image: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', source: 'spotify' },
      { id: 'nr3', title: 'Wicked', artist: 'Various Artists', image: 'https://i.scdn.co/image/ab67616d0000b273e8b6c7bb4c8e4be4f893c0ca', source: 'spotify' },
    ],
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

  try {
    const { action, query, type, cityId } = await req.json();
    
    const token = await getSpotifyToken();
    
    if (!token) {
      // Return fallback data if no Spotify credentials
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
      
      case 'city-trending':
        // Fetch tracks from the city's regional Top 50 playlist
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
          }))
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
    
    // Return fallback on any error
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
