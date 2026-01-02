import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');
const MUSICBRAINZ_BASE = 'https://musicbrainz.org/ws/2';
const THEAUDIODB_BASE = 'https://www.theaudiodb.com/api/v1/json/2';
const BILLBOARD_BASE = 'https://www.billboard.com/charts';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const USER_AGENT = 'TDZ-StreamingPlatform/1.0 (contact@thirtydarkzero.com)';

// Malformed title filter - removes songs with invalid characters
function isValidTitle(title: string): boolean {
  if (!title || title.trim().length === 0) return false;
  // Filter out titles with excessive special chars, encoding issues
  const badPatterns = [
    /%[0-9A-Fa-f]{2}/, // URL encoded chars
    /[^\x00-\x7F]{5,}/, // Too many non-ASCII chars in a row
    /^[^a-zA-Z0-9]+$/, // Only special chars
    /\?{2,}/, // Multiple question marks (encoding issues)
  ];
  return !badPatterns.some(pattern => pattern.test(title));
}

interface UnifiedResult {
  id: string;
  type: 'artist' | 'album' | 'track';
  title: string;
  artist: string;
  year?: string;
  thumbnail?: string;
  source: 'musicbrainz' | 'discogs' | 'youtube' | 'billboard' | 'allmusic' | 'theaudiodb' | 'spotify';
  sourceId: string;
  youtubeId?: string;
  genres?: string[];
  isOfficial?: boolean;
  popularity?: number;
  metadata?: Record<string, unknown>;
  // Enhanced metadata from beets-style sources
  acousticData?: AcousticData;
  chartPosition?: ChartPosition;
  // AllMusic enhanced data
  allMusicImage?: string;
  biography?: string;
  // TheAudioDB enhanced data
  theAudioDBImage?: string;
  fanart?: string;
  description?: string;
  // Spotify playback fallback
  spotifyPreviewUrl?: string;
  spotifyId?: string;
}

interface AcousticData {
  bpm?: number;
  key?: string;
  mood?: string[];
  danceability?: number;
  energy?: number;
  acousticness?: number;
}

interface ChartPosition {
  chart: string;
  rank: number;
  peakPosition?: number;
  weeksOnChart?: number;
  isNew?: boolean;
  lastPosition?: number;
}

interface AIEnrichedResult extends UnifiedResult {
  aiSummary?: string;
  relatedGenres?: string[];
  moodTags?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type = 'all', limit = 20, aiEnrich = false, includeCharts = false, includeAcoustic = false, includeAllMusic = true, includeSpotify = true, trendingOnly = false } = await req.json();

    if (!query && !trendingOnly) {
      throw new Error('Query is required');
    }

    console.log(`Unified search: "${query}" type=${type} aiEnrich=${aiEnrich} includeCharts=${includeCharts} includeAllMusic=${includeAllMusic} includeSpotify=${includeSpotify} trendingOnly=${trendingOnly}`);

    // If trendingOnly, fetch trending from Spotify and return
    if (trendingOnly) {
      const trendingResults = await fetchSpotifyTrending();
      return new Response(JSON.stringify({
        query: 'trending',
        results: trendingResults,
        totalResults: trendingResults.length,
        sources: { spotify: true },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parallel fetch from all sources including Billboard charts, AllMusic, TheAudioDB, and Spotify
    const searchPromises: Promise<UnifiedResult[]>[] = [
      searchMusicBrainz(query, type, limit),
      searchDiscogs(query, type, limit),
      searchYouTube(query, limit),
      searchTheAudioDB(query, type), // Always include TheAudioDB for high-quality data
    ];

    // Add Spotify search
    if (includeSpotify) {
      searchPromises.push(searchSpotify(query, type, limit));
    }

    // Add Billboard chart search if requested
    if (includeCharts) {
      searchPromises.push(searchBillboardCharts(query));
    }

    // Add AllMusic search for artists (best source for images)
    if (includeAllMusic && (type === 'all' || type === 'artist')) {
      searchPromises.push(searchAllMusic(query));
    }

    const results = await Promise.allSettled(searchPromises);

    // Collect all results
    let allResults: UnifiedResult[] = [];

    if (results[0].status === 'fulfilled') {
      allResults.push(...results[0].value);
    } else {
      console.error('MusicBrainz error:', results[0].reason);
    }

    if (results[1].status === 'fulfilled') {
      allResults.push(...results[1].value);
    } else {
      console.error('Discogs error:', results[1].reason);
    }

    if (results[2].status === 'fulfilled') {
      allResults.push(...results[2].value);
    } else {
      console.error('YouTube error:', results[2].reason);
    }

    // TheAudioDB results (index 3)
    if (results[3].status === 'fulfilled') {
      allResults.push(...results[3].value);
    } else {
      console.error('TheAudioDB error:', results[3].reason);
    }

    // Spotify results (index 4 when included)
    if (includeSpotify && results[4]?.status === 'fulfilled') {
      allResults.push(...results[4].value);
    } else if (includeSpotify && results[4]?.status === 'rejected') {
      console.error('Spotify error:', results[4].reason);
    }

    // Billboard charts (index 5 when Spotify included, otherwise 4)
    const chartIndex = includeSpotify ? 5 : 4;
    if (includeCharts && results[chartIndex]?.status === 'fulfilled') {
      const chartResults = results[chartIndex].value;
      allResults = mergeChartData(allResults, chartResults);
    }

    // Filter out malformed titles
    allResults = allResults.filter(r => isValidTitle(r.title) && isValidTitle(r.artist));

    // Deduplicate and merge results using fuzzy matching
    const mergedResults = deduplicateAndMerge(allResults);

    // Sort by relevance (chart position first, then official content, then popularity)
    mergedResults.sort((a, b) => {
      // Chart entries first
      if (a.chartPosition && !b.chartPosition) return -1;
      if (!a.chartPosition && b.chartPosition) return 1;
      if (a.chartPosition && b.chartPosition) {
        return a.chartPosition.rank - b.chartPosition.rank;
      }
      // Official content next
      if (a.isOfficial && !b.isOfficial) return -1;
      if (!a.isOfficial && b.isOfficial) return 1;
      // Then by popularity
      return (b.popularity || 0) - (a.popularity || 0);
    });

    // AI enrichment if requested
    let finalResults: (UnifiedResult | AIEnrichedResult)[] = mergedResults.slice(0, limit);
    
    if (aiEnrich && LOVABLE_API_KEY && finalResults.length > 0) {
      try {
        finalResults = await enrichWithAI(finalResults, query);
      } catch (aiError) {
        console.error('AI enrichment failed, returning unenriched results:', aiError);
      }
    }

    // Fetch acoustic data for top results if requested (beets-style metadata)
    if (includeAcoustic && finalResults.length > 0) {
      try {
        finalResults = await enrichWithAcousticData(finalResults as UnifiedResult[]);
      } catch (acousticError) {
        console.error('Acoustic enrichment failed:', acousticError);
      }
    }

    return new Response(JSON.stringify({
      query,
      results: finalResults,
      totalResults: mergedResults.length,
      sources: {
        musicbrainz: results[0].status === 'fulfilled',
        discogs: results[1].status === 'fulfilled',
        youtube: results[2].status === 'fulfilled',
        theaudiodb: results[3].status === 'fulfilled',
        spotify: includeSpotify && results[4]?.status === 'fulfilled',
        billboard: includeCharts && results[includeSpotify ? 5 : 4]?.status === 'fulfilled',
        allmusic: includeAllMusic && results[includeSpotify ? (includeCharts ? 6 : 5) : (includeCharts ? 5 : 4)]?.status === 'fulfilled',
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unified search error:', error);
    return new Response(JSON.stringify({
      error: 'Search failed. Please try again.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// MusicBrainz search
async function searchMusicBrainz(query: string, type: string, limit: number): Promise<UnifiedResult[]> {
  const results: UnifiedResult[] = [];
  
  try {
    // Search release-groups (albums)
    if (type === 'all' || type === 'album') {
      const url = `${MUSICBRAINZ_BASE}/release-group?query=${encodeURIComponent(query)}&limit=${limit}&fmt=json`;
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        for (const rg of (data['release-groups'] || [])) {
          const artistName = rg['artist-credit']?.map((ac: any) => ac.name || ac.artist?.name).join(', ') || 'Unknown Artist';
          results.push({
            id: `mb-album-${rg.id}`,
            type: 'album',
            title: rg.title,
            artist: artistName,
            year: rg['first-release-date']?.split('-')[0],
            thumbnail: `https://coverartarchive.org/release-group/${rg.id}/front-250`,
            source: 'musicbrainz',
            sourceId: rg.id,
            genres: (rg.tags || []).slice(0, 5).map((t: any) => t.name),
            popularity: rg.score || 0,
          });
        }
      }
    }

    // Search artists
    if (type === 'all' || type === 'artist') {
      await new Promise(r => setTimeout(r, 1100)); // Rate limit
      const url = `${MUSICBRAINZ_BASE}/artist?query=${encodeURIComponent(query)}&limit=${Math.floor(limit / 2)}&fmt=json`;
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        for (const artist of (data.artists || [])) {
          results.push({
            id: `mb-artist-${artist.id}`,
            type: 'artist',
            title: artist.name,
            artist: artist.name,
            thumbnail: undefined, // MusicBrainz doesn't have artist images
            source: 'musicbrainz',
            sourceId: artist.id,
            genres: (artist.tags || []).slice(0, 5).map((t: any) => t.name),
            popularity: artist.score || 0,
            metadata: {
              country: artist.country,
              type: artist.type,
            },
          });
        }
      }
    }

    // Search recordings (tracks)
    if (type === 'all' || type === 'track') {
      await new Promise(r => setTimeout(r, 1100)); // Rate limit
      const url = `${MUSICBRAINZ_BASE}/recording?query=${encodeURIComponent(query)}&limit=${Math.floor(limit / 2)}&fmt=json`;
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        for (const recording of (data.recordings || [])) {
          const artistName = recording['artist-credit']?.map((ac: any) => ac.name || ac.artist?.name).join(', ') || 'Unknown Artist';
          results.push({
            id: `mb-track-${recording.id}`,
            type: 'track',
            title: recording.title,
            artist: artistName,
            source: 'musicbrainz',
            sourceId: recording.id,
            genres: (recording.tags || []).slice(0, 5).map((t: any) => t.name),
            popularity: recording.score || 0,
            metadata: {
              duration: recording.length,
              isrcs: recording.isrcs,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('MusicBrainz search error:', error);
  }

  return results;
}

// Discogs search
async function searchDiscogs(query: string, type: string, limit: number): Promise<UnifiedResult[]> {
  if (!DISCOGS_TOKEN) {
    console.log('Discogs token not configured, skipping');
    return [];
  }

  const results: UnifiedResult[] = [];
  
  try {
    const discogsType = type === 'album' ? 'release' : type === 'track' ? 'release' : undefined;
    const url = new URL('https://api.discogs.com/database/search');
    url.searchParams.set('q', query);
    url.searchParams.set('per_page', String(limit));
    if (discogsType) url.searchParams.set('type', discogsType);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
        'User-Agent': USER_AGENT,
      },
    });

    if (response.ok) {
      const data = await response.json();
      for (const item of (data.results || [])) {
        const [artist, title] = (item.title || '').split(' - ');
        const itemType = item.type === 'artist' ? 'artist' : 'album';
        
        results.push({
          id: `dc-${itemType}-${item.id}`,
          type: itemType,
          title: title || item.title,
          artist: artist || 'Unknown Artist',
          year: item.year?.toString(),
          thumbnail: item.cover_image || item.thumb,
          source: 'discogs',
          sourceId: String(item.id),
          genres: [...(item.genre || []), ...(item.style || [])].slice(0, 5),
          popularity: item.community?.have || 0,
          metadata: {
            format: item.format,
            label: item.label,
            country: item.country,
          },
        });
      }
    }
  } catch (error) {
    console.error('Discogs search error:', error);
  }

  return results;
}

// YouTube search - prioritize official music
async function searchYouTube(query: string, limit: number): Promise<UnifiedResult[]> {
  if (!YOUTUBE_API_KEY) {
    console.log('YouTube API key not configured, skipping');
    return [];
  }

  const results: UnifiedResult[] = [];
  
  try {
    // Search with official audio preference
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', `${query} official audio`);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('videoCategoryId', '10'); // Music
    searchUrl.searchParams.set('maxResults', String(limit));
    searchUrl.searchParams.set('key', YOUTUBE_API_KEY);

    const response = await fetch(searchUrl.toString());
    
    if (response.ok) {
      const data = await response.json();
      const videoIds = data.items?.map((item: any) => item.id.videoId).join(',');
      
      // Get video details
      let videoDetails = new Map();
      if (videoIds) {
        const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
        detailsUrl.searchParams.set('part', 'contentDetails,statistics,snippet');
        detailsUrl.searchParams.set('id', videoIds);
        detailsUrl.searchParams.set('key', YOUTUBE_API_KEY);
        
        const detailsResponse = await fetch(detailsUrl.toString());
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          for (const item of (detailsData.items || [])) {
            videoDetails.set(item.id, item);
          }
        }
      }

      for (const item of (data.items || [])) {
        const details = videoDetails.get(item.id.videoId);
        const channel = item.snippet.channelTitle.toLowerCase();
        const title = item.snippet.title;
        const description = (details?.snippet?.description || '').toLowerCase();
        
        // Detect official content
        const isTopicChannel = channel.includes('- topic');
        const isVevo = channel.includes('vevo');
        const hasAutoGenerated = description.includes('auto-generated by youtube');
        const isOfficial = isTopicChannel || isVevo || hasAutoGenerated || 
                          title.toLowerCase().includes('official');
        
        // Parse artist and track from title
        const titleParts = title.split(/[-–—]/);
        const artist = titleParts[0]?.trim() || item.snippet.channelTitle;
        const trackTitle = titleParts.slice(1).join(' - ').trim() || title;

        results.push({
          id: `yt-track-${item.id.videoId}`,
          type: 'track',
          title: trackTitle.replace(/\(official.*?\)/gi, '').replace(/\[official.*?\]/gi, '').trim(),
          artist: artist.replace(/- topic$/i, '').trim(),
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          source: 'youtube',
          sourceId: item.id.videoId,
          youtubeId: item.id.videoId,
          isOfficial,
          popularity: parseInt(details?.statistics?.viewCount || '0'),
          metadata: {
            channel: item.snippet.channelTitle,
            duration: details?.contentDetails?.duration,
            viewCount: details?.statistics?.viewCount,
            publishedAt: item.snippet.publishedAt,
          },
        });
      }
    }
  } catch (error) {
    console.error('YouTube search error:', error);
  }

  return results;
}

// Spotify API authentication
async function getSpotifyToken(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.log('Spotify credentials not configured');
    return null;
  }
  
  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    }
  } catch (error) {
    console.error('Failed to get Spotify token:', error);
  }
  
  return null;
}

// Spotify search
async function searchSpotify(query: string, type: string, limit: number): Promise<UnifiedResult[]> {
  const token = await getSpotifyToken();
  if (!token) return [];

  const results: UnifiedResult[] = [];
  
  try {
    const spotifyType = type === 'all' ? 'track,album,artist' : 
                        type === 'track' ? 'track' :
                        type === 'album' ? 'album' : 'artist';
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${spotifyType}&limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (!response.ok) {
      console.error('Spotify search failed:', response.status);
      return results;
    }
    
    const data = await response.json();
    
    // Process tracks
    if (data.tracks?.items) {
      for (const track of data.tracks.items) {
        results.push({
          id: `spotify-track-${track.id}`,
          type: 'track',
          title: track.name,
          artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
          year: track.album?.release_date?.split('-')[0],
          thumbnail: track.album?.images?.[0]?.url,
          source: 'spotify',
          sourceId: track.id,
          popularity: track.popularity,
          // Include Spotify preview URL for audio fallback
          spotifyPreviewUrl: track.preview_url || undefined,
          spotifyId: track.id,
          metadata: {
            duration: track.duration_ms,
            previewUrl: track.preview_url,
            albumName: track.album?.name,
            explicit: track.explicit,
          }
        });
      }
    }
    
    // Process albums
    if (data.albums?.items) {
      for (const album of data.albums.items) {
        results.push({
          id: `spotify-album-${album.id}`,
          type: 'album',
          title: album.name,
          artist: album.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
          year: album.release_date?.split('-')[0],
          thumbnail: album.images?.[0]?.url,
          source: 'spotify',
          sourceId: album.id,
          popularity: album.popularity || 50,
          metadata: {
            totalTracks: album.total_tracks,
            albumType: album.album_type,
          }
        });
      }
    }
    
    // Process artists
    if (data.artists?.items) {
      for (const artist of data.artists.items) {
        results.push({
          id: `spotify-artist-${artist.id}`,
          type: 'artist',
          title: artist.name,
          artist: artist.name,
          thumbnail: artist.images?.[0]?.url,
          source: 'spotify',
          sourceId: artist.id,
          genres: artist.genres?.slice(0, 3),
          popularity: artist.popularity,
          metadata: {
            followers: artist.followers?.total,
          }
        });
      }
    }
    
    console.log(`Spotify search found ${results.length} results for "${query}"`);
  } catch (error) {
    console.error('Spotify search error:', error);
  }

  return results;
}

// Fetch trending from Spotify
async function fetchSpotifyTrending(): Promise<UnifiedResult[]> {
  const token = await getSpotifyToken();
  const results: UnifiedResult[] = [];
  
  if (!token) {
    // Return fallback trending data
    return getFallbackTrending();
  }
  
  try {
    // Fetch featured playlists and get tracks from top playlist
    const [featuredRes, newReleasesRes] = await Promise.all([
      fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('https://api.spotify.com/v1/browse/new-releases?limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);
    
    // Get tracks from Today's Top Hits or similar
    if (featuredRes.ok) {
      const featuredData = await featuredRes.json();
      const playlistId = featuredData.playlists?.items?.[0]?.id;
      
      if (playlistId) {
        const tracksRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (tracksRes.ok) {
          const tracksData = await tracksRes.json();
          for (const item of (tracksData.items || [])) {
            const track = item.track;
            if (!track) continue;
            
            results.push({
              id: `spotify-track-${track.id}`,
              type: 'track',
              title: track.name,
              artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
              year: track.album?.release_date?.split('-')[0],
              thumbnail: track.album?.images?.[0]?.url,
              source: 'spotify',
              sourceId: track.id,
              popularity: track.popularity,
              chartPosition: {
                chart: 'spotify-trending',
                rank: results.length + 1,
              },
              metadata: {
                previewUrl: track.preview_url,
                albumName: track.album?.name,
              }
            });
          }
        }
      }
    }
    
    // Add new releases as albums
    if (newReleasesRes.ok) {
      const newData = await newReleasesRes.json();
      for (const album of (newData.albums?.items || [])) {
        results.push({
          id: `spotify-album-${album.id}`,
          type: 'album',
          title: album.name,
          artist: album.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
          year: album.release_date?.split('-')[0],
          thumbnail: album.images?.[0]?.url,
          source: 'spotify',
          sourceId: album.id,
          popularity: 80,
          metadata: {
            albumType: album.album_type,
            totalTracks: album.total_tracks,
          }
        });
      }
    }
    
    console.log(`Spotify trending fetched ${results.length} items`);
  } catch (error) {
    console.error('Spotify trending error:', error);
    return getFallbackTrending();
  }

  return results.length > 0 ? results : getFallbackTrending();
}

// Fallback trending data when Spotify API unavailable
function getFallbackTrending(): UnifiedResult[] {
  return [
    { id: 'trend-1', type: 'track', title: 'Die With A Smile', artist: 'Lady Gaga, Bruno Mars', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273b3be3b970fc89a02f301c72c', source: 'spotify', sourceId: 'trend-1', popularity: 100, chartPosition: { chart: 'trending', rank: 1 } },
    { id: 'trend-2', type: 'track', title: 'APT.', artist: 'ROSÉ, Bruno Mars', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273d573290af0c9bef0e6c99c2a', source: 'spotify', sourceId: 'trend-2', popularity: 99, chartPosition: { chart: 'trending', rank: 2 } },
    { id: 'trend-3', type: 'track', title: 'Timeless', artist: 'The Weeknd, Playboi Carti', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', source: 'spotify', sourceId: 'trend-3', popularity: 98, chartPosition: { chart: 'trending', rank: 3 } },
    { id: 'trend-4', type: 'track', title: 'Luther', artist: 'Kendrick Lamar, SZA', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2735be9e01c08e957d9e9b08426', source: 'spotify', sourceId: 'trend-4', popularity: 97, chartPosition: { chart: 'trending', rank: 4 } },
    { id: 'trend-5', type: 'track', title: 'Squabble Up', artist: 'Kendrick Lamar', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2735be9e01c08e957d9e9b08426', source: 'spotify', sourceId: 'trend-5', popularity: 96, chartPosition: { chart: 'trending', rank: 5 } },
    { id: 'trend-6', type: 'track', title: 'Not Like Us', artist: 'Kendrick Lamar', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273d9985092cd88bffd97653b58', source: 'spotify', sourceId: 'trend-6', popularity: 95, chartPosition: { chart: 'trending', rank: 6 } },
    { id: 'trend-7', type: 'track', title: 'Espresso', artist: 'Sabrina Carpenter', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e3a09e1c6c0e3153f5e8a8f1', source: 'spotify', sourceId: 'trend-7', popularity: 94, chartPosition: { chart: 'trending', rank: 7 } },
    { id: 'trend-8', type: 'track', title: 'Birds of a Feather', artist: 'Billie Eilish', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2736e63a8b8c82ab5c7bbf2c7ac', source: 'spotify', sourceId: 'trend-8', popularity: 93, chartPosition: { chart: 'trending', rank: 8 } },
    { id: 'trend-9', type: 'track', title: 'Beautiful Things', artist: 'Benson Boone', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738f3f9a3ce0e4c6c0e0e0e0e0', source: 'spotify', sourceId: 'trend-9', popularity: 92, chartPosition: { chart: 'trending', rank: 9 } },
    { id: 'trend-10', type: 'track', title: 'Lose Control', artist: 'Teddy Swims', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273a1a1a1a1a1a1a1a1a1a1a1a1', source: 'spotify', sourceId: 'trend-10', popularity: 91, chartPosition: { chart: 'trending', rank: 10 } },
  ] as UnifiedResult[];
}

// Deduplicate and merge results from different sources
function deduplicateAndMerge(results: UnifiedResult[]): UnifiedResult[] {
  const merged = new Map<string, UnifiedResult>();

  for (const result of results) {
    // Create a normalized key for deduplication
    const normalizedTitle = normalizeString(result.title);
    const normalizedArtist = normalizeString(result.artist);
    const key = `${result.type}-${normalizedArtist}-${normalizedTitle}`;

    if (merged.has(key)) {
      const existing = merged.get(key)!;
      
      // Merge data, preferring YouTube for playback, others for metadata
      if (result.source === 'youtube' && !existing.youtubeId) {
        existing.youtubeId = result.youtubeId;
        existing.isOfficial = result.isOfficial;
      }
      if (result.thumbnail && !existing.thumbnail) {
        existing.thumbnail = result.thumbnail;
      }
      if (result.genres && result.genres.length > (existing.genres?.length || 0)) {
        existing.genres = result.genres;
      }
      if (result.year && !existing.year) {
        existing.year = result.year;
      }
      // Combine popularity scores
      existing.popularity = Math.max(existing.popularity || 0, result.popularity || 0);
      
      merged.set(key, existing);
    } else {
      merged.set(key, { ...result });
    }
  }

  return Array.from(merged.values());
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// AI enrichment for search results
async function enrichWithAI(results: UnifiedResult[], query: string): Promise<AIEnrichedResult[]> {
  if (!LOVABLE_API_KEY) return results;

  try {
    const topResults = results.slice(0, 5); // Only enrich top 5
    
    const prompt = `You are a music expert. Analyze these search results for "${query}" and provide brief, helpful enrichments.

Results:
${topResults.map((r, i) => `${i + 1}. "${r.title}" by ${r.artist} (${r.type}, ${r.year || 'unknown year'})`).join('\n')}

For each result, provide:
1. A one-sentence summary of what this release/artist is known for
2. Related genres (2-3 max)
3. Mood tags (2-3 max, like "energetic", "melancholic", "uplifting")

Respond with valid JSON only, no markdown:
{"enrichments": [{"summary": "...", "relatedGenres": ["..."], "moodTags": ["..."]}]}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a music metadata expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        try {
          const parsed = JSON.parse(content);
          const enrichments = parsed.enrichments || [];
          
          return results.map((result, index) => {
            if (index < enrichments.length) {
              return {
                ...result,
                aiSummary: enrichments[index].summary,
                relatedGenres: enrichments[index].relatedGenres,
                moodTags: enrichments[index].moodTags,
              };
            }
            return result;
          });
        } catch {
          console.error('Failed to parse AI response');
        }
      }
    }
  } catch (error) {
    console.error('AI enrichment error:', error);
  }

  return results;
}

// Billboard Charts scraping (inspired by billboard-charts Python library)
async function searchBillboardCharts(query: string): Promise<UnifiedResult[]> {
  const results: UnifiedResult[] = [];
  const normalizedQuery = query.toLowerCase();
  
  try {
    // Fetch current Hot 100 chart
    const chartResponse = await fetch(`${BILLBOARD_BASE}/hot-100/`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    
    if (!chartResponse.ok) {
      console.log('Billboard fetch failed, skipping');
      return results;
    }

    const html = await chartResponse.text();
    
    // Parse chart entries from HTML (simplified parsing)
    const chartEntryRegex = /<h3[^>]*class="[^"]*c-title[^"]*"[^>]*>\s*([^<]+)\s*<\/h3>[\s\S]*?<span[^>]*class="[^"]*c-label[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/gi;
    const rankRegex = /<span[^>]*class="[^"]*c-label[^"]*a-font-primary-bold[^"]*"[^>]*>\s*(\d+)\s*<\/span>/gi;
    
    // Alternative: look for structured data
    const ldJsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    
    if (ldJsonMatch) {
      try {
        const ldData = JSON.parse(ldJsonMatch[1]);
        if (ldData.itemListElement) {
          for (const item of ldData.itemListElement) {
            const title = item.item?.name || '';
            const artist = item.item?.description?.replace(/by\s+/i, '') || 'Unknown Artist';
            const rank = item.position || 0;
            
            // Check if matches query
            if (title.toLowerCase().includes(normalizedQuery) || 
                artist.toLowerCase().includes(normalizedQuery)) {
              results.push({
                id: `bb-track-${rank}`,
                type: 'track',
                title: title.trim(),
                artist: artist.trim(),
                source: 'billboard',
                sourceId: `hot100-${rank}`,
                popularity: 101 - rank, // Higher rank = higher popularity
                chartPosition: {
                  chart: 'hot-100',
                  rank,
                },
                metadata: {
                  chartDate: new Date().toISOString().split('T')[0],
                },
              });
            }
          }
        }
      } catch (parseError) {
        console.log('Billboard LD+JSON parse failed, using fallback');
      }
    }

    // Fallback: Simple HTML parsing for song titles
    if (results.length === 0) {
      const songMatches = html.matchAll(/<li[^>]*class="[^"]*o-chart-results-list-row[^"]*"[^>]*>[\s\S]*?<h3[^>]*>\s*([^<]+)\s*<\/h3>[\s\S]*?<span[^>]*>\s*([^<]+)\s*<\/span>/gi);
      let rank = 1;
      
      for (const match of songMatches) {
        const title = match[1]?.trim() || '';
        const artist = match[2]?.trim() || '';
        
        if ((title.toLowerCase().includes(normalizedQuery) || 
             artist.toLowerCase().includes(normalizedQuery)) && 
            title && artist) {
          results.push({
            id: `bb-track-${rank}`,
            type: 'track',
            title,
            artist,
            source: 'billboard',
            sourceId: `hot100-${rank}`,
            popularity: 101 - rank,
            chartPosition: {
              chart: 'hot-100',
              rank,
            },
          });
        }
        rank++;
        if (rank > 100) break;
      }
    }
    
    console.log(`Billboard search found ${results.length} matches for "${query}"`);
  } catch (error) {
    console.error('Billboard chart search error:', error);
  }

  return results;
}

// Merge chart data into existing results
function mergeChartData(results: UnifiedResult[], chartResults: UnifiedResult[]): UnifiedResult[] {
  const chartMap = new Map<string, ChartPosition>();
  
  // Build a map of chart positions by normalized title+artist
  for (const chartResult of chartResults) {
    const key = `${normalizeString(chartResult.title)}-${normalizeString(chartResult.artist)}`;
    if (chartResult.chartPosition) {
      chartMap.set(key, chartResult.chartPosition);
    }
  }
  
  // Add chart positions to matching results
  return results.map(result => {
    const key = `${normalizeString(result.title)}-${normalizeString(result.artist)}`;
    const chartPosition = chartMap.get(key);
    
    if (chartPosition) {
      return { ...result, chartPosition };
    }
    return result;
  });
}

// Acoustic data enrichment (beets-style metadata from AcousticBrainz/Last.fm)
async function enrichWithAcousticData(results: UnifiedResult[]): Promise<UnifiedResult[]> {
  const enrichedResults = [...results];
  
  // Only enrich MusicBrainz tracks that have recording IDs
  const mbTracks = results.filter(r => r.source === 'musicbrainz' && r.type === 'track');
  
  for (let i = 0; i < Math.min(mbTracks.length, 5); i++) {
    const track = mbTracks[i];
    const recordingId = track.sourceId;
    
    try {
      // Try AcousticBrainz for acoustic features (like beets acousticbrainz plugin)
      // Note: AcousticBrainz API was discontinued in 2022, but we can still try
      // In production, you might use ListenBrainz or other services
      
      // Fallback: Use AI to estimate acoustic properties
      if (LOVABLE_API_KEY) {
        const prompt = `For the song "${track.title}" by ${track.artist}, estimate these audio properties (respond with JSON only):
{
  "bpm": (number 60-200),
  "key": (musical key like "C major" or "A minor"),
  "mood": (array of 2-3 mood words),
  "danceability": (0-1 float),
  "energy": (0-1 float),
  "acousticness": (0-1 float)
}`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a music analysis expert. Respond with valid JSON only.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          
          if (content) {
            try {
              const acousticData = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
              
              // Find and update the result
              const resultIndex = enrichedResults.findIndex(r => r.id === track.id);
              if (resultIndex !== -1) {
                enrichedResults[resultIndex] = {
                  ...enrichedResults[resultIndex],
                  acousticData: {
                    bpm: acousticData.bpm,
                    key: acousticData.key,
                    mood: acousticData.mood,
                    danceability: acousticData.danceability,
                    energy: acousticData.energy,
                    acousticness: acousticData.acousticness,
                  },
                };
              }
            } catch {
              console.log(`Failed to parse acoustic data for ${track.title}`);
            }
          }
        }
      }
      
      // Rate limit between requests
      await new Promise(r => setTimeout(r, 200));
    } catch (error) {
      console.error(`Acoustic enrichment error for ${track.title}:`, error);
    }
  }

  return enrichedResults;
}

// TheAudioDB search - high quality artist images and metadata
async function searchTheAudioDB(query: string, type: string): Promise<UnifiedResult[]> {
  const results: UnifiedResult[] = [];
  
  try {
    // Search for artists
    if (type === 'all' || type === 'artist') {
      const artistUrl = `${THEAUDIODB_BASE}/search.php?s=${encodeURIComponent(query)}`;
      const artistResponse = await fetch(artistUrl, {
        headers: { 'User-Agent': USER_AGENT }
      });
      
      if (artistResponse.ok) {
        const data = await artistResponse.json();
        const artists = data.artists || [];
        
        for (const artist of artists.slice(0, 5)) {
          results.push({
            id: `tadb-artist-${artist.idArtist}`,
            type: 'artist',
            title: artist.strArtist,
            artist: artist.strArtist,
            thumbnail: artist.strArtistThumb || artist.strArtistFanart || artist.strArtistLogo,
            source: 'theaudiodb',
            sourceId: artist.idArtist,
            genres: artist.strGenre ? [artist.strGenre] : [],
            popularity: parseInt(artist.intFans || '0'),
            theAudioDBImage: artist.strArtistThumb,
            fanart: artist.strArtistFanart,
            description: artist.strBiographyEN?.substring(0, 200),
            metadata: {
              country: artist.strCountry,
              formed: artist.intFormedYear,
              website: artist.strWebsite,
              style: artist.strStyle,
            }
          });
        }
      }
    }

    // Search for albums
    if (type === 'all' || type === 'album') {
      const albumUrl = `${THEAUDIODB_BASE}/searchalbum.php?s=${encodeURIComponent(query)}`;
      const albumResponse = await fetch(albumUrl, {
        headers: { 'User-Agent': USER_AGENT }
      });
      
      if (albumResponse.ok) {
        const data = await albumResponse.json();
        const albums = data.album || [];
        
        for (const album of albums.slice(0, 10)) {
          // Filter out invalid titles
          if (!isValidTitle(album.strAlbum)) continue;
          
          results.push({
            id: `tadb-album-${album.idAlbum}`,
            type: 'album',
            title: album.strAlbum,
            artist: album.strArtist,
            year: album.intYearReleased?.toString(),
            thumbnail: album.strAlbumThumb || album.strAlbumCDart,
            source: 'theaudiodb',
            sourceId: album.idAlbum,
            genres: album.strGenre ? [album.strGenre] : [],
            popularity: parseInt(album.intScore || '0'),
            metadata: {
              style: album.strStyle,
              description: album.strDescriptionEN?.substring(0, 200),
              label: album.strLabel,
            }
          });
        }
      }
    }

    console.log(`TheAudioDB search found ${results.length} results for "${query}"`);
  } catch (error) {
    console.error('TheAudioDB search error:', error);
  }

  return results;
}

// AllMusic search using Firecrawl for reliable artist images
async function searchAllMusic(query: string): Promise<UnifiedResult[]> {
  if (!FIRECRAWL_API_KEY) {
    console.log('Firecrawl not configured, skipping AllMusic');
    return [];
  }

  const results: UnifiedResult[] = [];
  
  try {
    const searchUrl = `https://www.allmusic.com/search/artists/${encodeURIComponent(query)}`;
    
    console.log('AllMusic search:', searchUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['html', 'links'],
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.log('AllMusic scrape failed:', response.status);
      return results;
    }

    const data = await response.json();
    const html = data.data?.html || data.html || '';
    
    // Parse artist results from AllMusic search
    const artistMatches = html.matchAll(/<div[^>]*class="[^"]*artist[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?(?:class="[^"]*genre[^"]*"[^>]*>([^<]+)<)?/gi);
    
    let id = 0;
    for (const match of artistMatches) {
      const imageUrl = match[1];
      const profileUrl = match[2];
      const name = match[3]?.trim();
      const genre = match[4]?.trim();
      
      if (name && name.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          id: `am-artist-${id++}`,
          type: 'artist',
          title: name,
          artist: name,
          thumbnail: imageUrl && !imageUrl.includes('placeholder') ? imageUrl : undefined,
          source: 'allmusic',
          sourceId: profileUrl || `allmusic-${id}`,
          genres: genre ? [genre] : [],
          popularity: 100 - id,
          allMusicImage: imageUrl && !imageUrl.includes('placeholder') ? imageUrl : undefined,
        });
      }
      
      if (id >= 5) break; // Limit results
    }
    
    // Alternative parsing if first method fails
    if (results.length === 0) {
      // Look for artist names in any format
      const nameMatches = html.matchAll(/<a[^>]*href="[^"]*\/artist\/[^"]*"[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/a>/gi);
      const imageMatches = [...html.matchAll(/<img[^>]*class="[^"]*artist[^"]*"[^>]*src="([^"]+)"/gi)];
      
      let idx = 0;
      for (const match of nameMatches) {
        const name = match[1]?.trim();
        if (name && name.toLowerCase().includes(query.toLowerCase())) {
          const imageUrl = imageMatches[idx]?.[1];
          results.push({
            id: `am-artist-${idx}`,
            type: 'artist',
            title: name,
            artist: name,
            thumbnail: imageUrl && !imageUrl.includes('placeholder') ? imageUrl : undefined,
            source: 'allmusic',
            sourceId: `allmusic-${idx}`,
            genres: [],
            popularity: 100 - idx,
            allMusicImage: imageUrl && !imageUrl.includes('placeholder') ? imageUrl : undefined,
          });
          idx++;
        }
        if (idx >= 5) break;
      }
    }

    console.log(`AllMusic search found ${results.length} artists for "${query}"`);
  } catch (error) {
    console.error('AllMusic search error:', error);
  }

  return results;
}

// Get reliable artist image from multiple sources with fallbacks
async function getReliableArtistImage(artistName: string): Promise<string | null> {
  // Try sources in order of quality
  const imageSources = await Promise.allSettled([
    getAllMusicArtistImage(artistName),
    getDiscogsArtistImage(artistName),
    getMusicBrainzArtistImage(artistName),
    getYouTubeChannelImage(artistName),
  ]);

  for (const source of imageSources) {
    if (source.status === 'fulfilled' && source.value) {
      return source.value;
    }
  }

  return null;
}

async function getAllMusicArtistImage(artistName: string): Promise<string | null> {
  if (!FIRECRAWL_API_KEY) return null;

  try {
    const searchUrl = `https://www.allmusic.com/search/artists/${encodeURIComponent(artistName)}`;
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['html'],
        waitFor: 2000,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const html = data.data?.html || data.html || '';
      
      // Extract first artist image
      const imagePatterns = [
        /<img[^>]*class="[^"]*artist[^"]*"[^>]*src="([^"]+)"/i,
        /<img[^>]*src="(https:\/\/[^"]*allmusic[^"]*\/cmsimg\/[^"]+)"/i,
        /<img[^>]*src="(https:\/\/rovimusic[^"]+)"/i,
      ];

      for (const pattern of imagePatterns) {
        const match = html.match(pattern);
        if (match && match[1] && !match[1].includes('placeholder')) {
          return match[1];
        }
      }
    }
  } catch (error) {
    console.error('AllMusic image fetch error:', error);
  }

  return null;
}

async function getDiscogsArtistImage(artistName: string): Promise<string | null> {
  if (!DISCOGS_TOKEN) return null;

  try {
    const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName)}&type=artist&per_page=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
        'User-Agent': USER_AGENT,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const coverImage = data.results?.[0]?.cover_image;
      if (coverImage && !coverImage.includes('spacer')) {
        return coverImage;
      }
    }
  } catch (error) {
    console.error('Discogs image fetch error:', error);
  }

  return null;
}

async function getMusicBrainzArtistImage(artistName: string): Promise<string | null> {
  try {
    // Search for artist
    const searchUrl = `${MUSICBRAINZ_BASE}/artist?query=${encodeURIComponent(artistName)}&limit=1&fmt=json`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    const artistId = searchData.artists?.[0]?.id;
    if (!artistId) return null;

    // Get Wikipedia/Wikidata image via relations
    await new Promise(r => setTimeout(r, 1100));
    
    const artistUrl = `${MUSICBRAINZ_BASE}/artist/${artistId}?inc=url-rels&fmt=json`;
    const artistResponse = await fetch(artistUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!artistResponse.ok) return null;

    const artistData = await artistResponse.json();
    const relations = artistData.relations || [];

    for (const rel of relations) {
      if (rel.type === 'image' && rel.url?.resource) {
        const commonsUrl = rel.url.resource;
        if (commonsUrl.includes('commons.wikimedia.org')) {
          return commonsUrl.replace('/wiki/File:', '/wiki/Special:FilePath/');
        }
        return commonsUrl;
      }
    }
  } catch (error) {
    console.error('MusicBrainz image fetch error:', error);
  }

  return null;
}

async function getYouTubeChannelImage(artistName: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) return null;

  try {
    // Search for artist topic channel first
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(artistName + ' - Topic')}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(searchUrl);

    if (response.ok) {
      const data = await response.json();
      const thumbnail = data.items?.[0]?.snippet?.thumbnails?.high?.url;
      if (thumbnail) return thumbnail;
    }

    // Fallback to VEVO/official channel
    const vevoUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(artistName + ' VEVO')}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;
    const vevoResponse = await fetch(vevoUrl);

    if (vevoResponse.ok) {
      const data = await vevoResponse.json();
      return data.items?.[0]?.snippet?.thumbnails?.high?.url || null;
    }
  } catch (error) {
    console.error('YouTube channel image fetch error:', error);
  }

  return null;
}
