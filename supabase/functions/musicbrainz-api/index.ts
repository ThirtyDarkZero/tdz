import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MUSICBRAINZ_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'TDZ-StreamingPlatform/1.0 (contact@thirtydarkyear.com)';

// Rate limiting: MusicBrainz requires 1 request per second
let lastRequestTime = 0;
async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < 1100) {
    await new Promise(resolve => setTimeout(resolve, 1100 - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  return fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, id, type, limit = 25, offset = 0 } = await req.json();
    
    let url = '';
    let result: any = {};

    switch (action) {
      case 'search': {
        // Search across multiple entity types
        const searchType = type || 'release';
        const encodedQuery = encodeURIComponent(query);
        url = `${MUSICBRAINZ_BASE}/${searchType}?query=${encodedQuery}&limit=${limit}&offset=${offset}&fmt=json`;
        
        const response = await rateLimitedFetch(url);
        if (!response.ok) throw new Error(`MusicBrainz API error: ${response.status}`);
        
        const data = await response.json();
        result = transformSearchResults(data, searchType);
        break;
      }

      case 'get_artist': {
        url = `${MUSICBRAINZ_BASE}/artist/${id}?inc=releases+release-groups+tags+genres&fmt=json`;
        
        const response = await rateLimitedFetch(url);
        if (!response.ok) throw new Error(`MusicBrainz API error: ${response.status}`);
        
        const data = await response.json();
        result = transformArtist(data);
        break;
      }

      case 'get_release': {
        url = `${MUSICBRAINZ_BASE}/release/${id}?inc=recordings+artists+release-groups+labels+tags&fmt=json`;
        
        const response = await rateLimitedFetch(url);
        if (!response.ok) throw new Error(`MusicBrainz API error: ${response.status}`);
        
        const data = await response.json();
        result = transformRelease(data);
        break;
      }

      case 'get_release_group': {
        // Release groups are albums/EPs/singles grouped together
        url = `${MUSICBRAINZ_BASE}/release-group/${id}?inc=releases+artists+tags&fmt=json`;
        
        const response = await rateLimitedFetch(url);
        if (!response.ok) throw new Error(`MusicBrainz API error: ${response.status}`);
        
        const data = await response.json();
        result = transformReleaseGroup(data);
        break;
      }

      case 'get_recording': {
        url = `${MUSICBRAINZ_BASE}/recording/${id}?inc=artists+releases+tags+isrcs&fmt=json`;
        
        const response = await rateLimitedFetch(url);
        if (!response.ok) throw new Error(`MusicBrainz API error: ${response.status}`);
        
        const data = await response.json();
        result = transformRecording(data);
        break;
      }

      case 'browse_releases': {
        // Browse releases by artist, label, or release-group
        const browseBy = type || 'artist';
        url = `${MUSICBRAINZ_BASE}/release?${browseBy}=${id}&inc=recordings+artists+labels&limit=${limit}&offset=${offset}&fmt=json`;
        
        const response = await rateLimitedFetch(url);
        if (!response.ok) throw new Error(`MusicBrainz API error: ${response.status}`);
        
        const data = await response.json();
        result = {
          releases: (data.releases || []).map(transformRelease),
          total: data['release-count'] || 0,
          offset: data['release-offset'] || 0,
        };
        break;
      }

      case 'browse_artists': {
        // Browse top artists by area/genre
        const encodedQuery = encodeURIComponent(query || '*');
        url = `${MUSICBRAINZ_BASE}/artist?query=${encodedQuery}&limit=${limit}&offset=${offset}&fmt=json`;
        
        const response = await rateLimitedFetch(url);
        if (!response.ok) throw new Error(`MusicBrainz API error: ${response.status}`);
        
        const data = await response.json();
        result = {
          artists: (data.artists || []).map(transformArtistBrief),
          total: data.count || 0,
          offset: data.offset || 0,
        };
        break;
      }

      case 'search_by_genre': {
        // Search releases/artists by genre tag
        const encodedGenre = encodeURIComponent(`tag:${query}`);
        const searchType = type || 'release-group';
        url = `${MUSICBRAINZ_BASE}/${searchType}?query=${encodedGenre}&limit=${limit}&offset=${offset}&fmt=json`;
        
        const response = await rateLimitedFetch(url);
        if (!response.ok) throw new Error(`MusicBrainz API error: ${response.status}`);
        
        const data = await response.json();
        result = transformSearchResults(data, searchType);
        break;
      }

      case 'get_cover_art': {
        // Cover Art Archive integration
        const coverUrl = `https://coverartarchive.org/release/${id}`;
        
        try {
          const response = await fetch(coverUrl, {
            headers: { 'User-Agent': USER_AGENT },
          });
          
          if (response.ok) {
            const data = await response.json();
            result = {
              images: (data.images || []).map((img: any) => ({
                id: img.id,
                front: img.front,
                back: img.back,
                small: img.thumbnails?.small || img.thumbnails?.['250'],
                large: img.thumbnails?.large || img.thumbnails?.['500'],
                full: img.image,
              })),
            };
          } else {
            result = { images: [] };
          }
        } catch {
          result = { images: [] };
        }
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`MusicBrainz ${action} completed successfully`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('MusicBrainz API error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Transform functions for consistent output format
function transformSearchResults(data: any, type: string) {
  switch (type) {
    case 'artist':
      return {
        artists: (data.artists || []).map(transformArtistBrief),
        total: data.count || 0,
      };
    case 'release':
      return {
        releases: (data.releases || []).map(transformReleaseBrief),
        total: data.count || 0,
      };
    case 'release-group':
      return {
        releaseGroups: (data['release-groups'] || []).map(transformReleaseGroupBrief),
        total: data.count || 0,
      };
    case 'recording':
      return {
        recordings: (data.recordings || []).map(transformRecordingBrief),
        total: data.count || 0,
      };
    default:
      return data;
  }
}

function transformArtist(data: any) {
  return {
    id: data.id,
    name: data.name,
    sortName: data['sort-name'],
    type: data.type,
    country: data.country,
    area: data.area?.name,
    beginDate: data['life-span']?.begin,
    endDate: data['life-span']?.end,
    ended: data['life-span']?.ended,
    disambiguation: data.disambiguation,
    tags: (data.tags || []).map((t: any) => ({ name: t.name, count: t.count })),
    genres: (data.genres || []).map((g: any) => ({ name: g.name, count: g.count })),
    releaseGroups: (data['release-groups'] || []).slice(0, 20).map(transformReleaseGroupBrief),
  };
}

function transformArtistBrief(data: any) {
  return {
    id: data.id,
    name: data.name,
    sortName: data['sort-name'],
    type: data.type,
    country: data.country,
    score: data.score,
    tags: (data.tags || []).slice(0, 5).map((t: any) => t.name),
  };
}

function transformRelease(data: any) {
  const artistCredits = data['artist-credit'] || [];
  const primaryArtist = artistCredits[0]?.artist;
  
  return {
    id: data.id,
    title: data.title,
    status: data.status,
    date: data.date,
    country: data.country,
    barcode: data.barcode,
    artistId: primaryArtist?.id,
    artistName: artistCredits.map((ac: any) => ac.name || ac.artist?.name).join(', '),
    releaseGroupId: data['release-group']?.id,
    releaseGroupType: data['release-group']?.['primary-type'],
    label: data['label-info']?.[0]?.label?.name,
    catalogNumber: data['label-info']?.[0]?.['catalog-number'],
    coverArt: `https://coverartarchive.org/release/${data.id}/front-250`,
    tracks: (data.media || []).flatMap((medium: any, mediumIndex: number) =>
      (medium.tracks || []).map((track: any, trackIndex: number) => ({
        id: track.recording?.id || track.id,
        position: track.position || trackIndex + 1,
        number: track.number,
        title: track.title || track.recording?.title,
        length: track.length || track.recording?.length,
        lengthFormatted: formatDuration(track.length || track.recording?.length),
        disc: mediumIndex + 1,
      }))
    ),
    trackCount: data['track-count'],
    tags: (data.tags || []).map((t: any) => t.name),
  };
}

function transformReleaseBrief(data: any) {
  const artistCredits = data['artist-credit'] || [];
  
  return {
    id: data.id,
    title: data.title,
    status: data.status,
    date: data.date,
    country: data.country,
    artistName: artistCredits.map((ac: any) => ac.name || ac.artist?.name).join(', '),
    trackCount: data['track-count'],
    score: data.score,
    coverArt: `https://coverartarchive.org/release/${data.id}/front-250`,
  };
}

function transformReleaseGroup(data: any) {
  const artistCredits = data['artist-credit'] || [];
  const primaryArtist = artistCredits[0]?.artist;
  
  return {
    id: data.id,
    title: data.title,
    primaryType: data['primary-type'],
    secondaryTypes: data['secondary-types'] || [],
    firstReleaseDate: data['first-release-date'],
    artistId: primaryArtist?.id,
    artistName: artistCredits.map((ac: any) => ac.name || ac.artist?.name).join(', '),
    releases: (data.releases || []).map(transformReleaseBrief),
    tags: (data.tags || []).map((t: any) => t.name),
    coverArt: `https://coverartarchive.org/release-group/${data.id}/front-250`,
  };
}

function transformReleaseGroupBrief(data: any) {
  const artistCredits = data['artist-credit'] || [];
  
  return {
    id: data.id,
    title: data.title,
    primaryType: data['primary-type'],
    secondaryTypes: data['secondary-types'] || [],
    firstReleaseDate: data['first-release-date'],
    artistName: artistCredits.map((ac: any) => ac.name || ac.artist?.name).join(', '),
    score: data.score,
    coverArt: `https://coverartarchive.org/release-group/${data.id}/front-250`,
  };
}

function transformRecording(data: any) {
  const artistCredits = data['artist-credit'] || [];
  
  return {
    id: data.id,
    title: data.title,
    length: data.length,
    lengthFormatted: formatDuration(data.length),
    artistName: artistCredits.map((ac: any) => ac.name || ac.artist?.name).join(', '),
    artistId: artistCredits[0]?.artist?.id,
    isrcs: data.isrcs || [],
    releases: (data.releases || []).slice(0, 10).map(transformReleaseBrief),
    tags: (data.tags || []).map((t: any) => t.name),
  };
}

function transformRecordingBrief(data: any) {
  const artistCredits = data['artist-credit'] || [];
  
  return {
    id: data.id,
    title: data.title,
    length: data.length,
    lengthFormatted: formatDuration(data.length),
    artistName: artistCredits.map((ac: any) => ac.name || ac.artist?.name).join(', '),
    score: data.score,
  };
}

function formatDuration(ms?: number): string {
  if (!ms) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
