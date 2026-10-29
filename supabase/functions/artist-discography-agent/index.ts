import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser, unauthorized } from "../_shared/auth.ts";
import { publicError } from "../_shared/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

interface DiscographyResult {
  artist: {
    name: string;
    channelId?: string;
    thumbnail?: string;
    subscriberCount?: string;
  };
  albums: Album[];
  singles: Album[];
  topTracks: Track[];
  totalTracks: number;
}

interface Album {
  id: string;
  title: string;
  year?: string;
  thumbnail?: string;
  trackCount?: number;
  tracks: Track[];
  type: 'album' | 'single' | 'ep' | 'compilation';
}

interface Track {
  id: string;
  title: string;
  youtubeId: string;
  thumbnail: string;
  duration?: string;
  viewCount?: string;
  album?: string;
  isOfficialAudio?: boolean;
}

// Sub-agent 1: Find the artist's official YouTube channel/topic
async function findArtistChannel(artistName: string): Promise<{ channelId?: string; thumbnail?: string; name: string }> {
  if (!YOUTUBE_API_KEY) return { name: artistName };

  // Search for the "- Topic" auto-generated channel first (best for music)
  const topicQuery = `${artistName} - Topic`;
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', topicQuery);
  url.searchParams.set('type', 'channel');
  url.searchParams.set('maxResults', '3');
  url.searchParams.set('key', YOUTUBE_API_KEY);

  try {
    const res = await fetch(url.toString());
    if (res.ok) {
      const data = await res.json();
      const topicChannel = data.items?.find((ch: any) =>
        ch.snippet?.title?.toLowerCase().includes('topic') ||
        ch.snippet?.title?.toLowerCase().includes(artistName.toLowerCase())
      );
      if (topicChannel) {
        return {
          channelId: topicChannel.id?.channelId || topicChannel.snippet?.channelId,
          thumbnail: topicChannel.snippet?.thumbnails?.high?.url,
          name: topicChannel.snippet?.title?.replace(' - Topic', '') || artistName,
        };
      }
      // Fallback to first result
      if (data.items?.[0]) {
        return {
          channelId: data.items[0].id?.channelId,
          thumbnail: data.items[0].snippet?.thumbnails?.high?.url,
          name: data.items[0].snippet?.title || artistName,
        };
      }
    }
  } catch (e) {
    console.error('[Channel Agent] Error:', e);
  }
  return { name: artistName };
}

// Sub-agent 2: Fetch all music from channel using playlist approach
async function fetchChannelMusic(channelId: string, maxVideos = 50): Promise<Track[]> {
  if (!YOUTUBE_API_KEY || !channelId) return [];

  try {
    // Get uploads playlist
    const chUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
    chUrl.searchParams.set('part', 'contentDetails');
    chUrl.searchParams.set('id', channelId);
    chUrl.searchParams.set('key', YOUTUBE_API_KEY);

    const chRes = await fetch(chUrl.toString());
    if (!chRes.ok) return [];
    const chData = await chRes.json();
    const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return [];

    // Fetch playlist items (paginated)
    const allTracks: Track[] = [];
    let pageToken: string | undefined;
    let pages = 0;
    const maxPages = Math.ceil(maxVideos / 50);

    while (pages < maxPages) {
      const plUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      plUrl.searchParams.set('part', 'snippet,contentDetails');
      plUrl.searchParams.set('playlistId', uploadsId);
      plUrl.searchParams.set('maxResults', '50');
      plUrl.searchParams.set('key', YOUTUBE_API_KEY);
      if (pageToken) plUrl.searchParams.set('pageToken', pageToken);

      const plRes = await fetch(plUrl.toString());
      if (!plRes.ok) break;
      const plData = await plRes.json();

      const videoIds = plData.items?.map((i: any) => i.contentDetails?.videoId).filter(Boolean).join(',');
      if (!videoIds) break;

      // Get durations + view counts
      const dtUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      dtUrl.searchParams.set('part', 'contentDetails,statistics');
      dtUrl.searchParams.set('id', videoIds);
      dtUrl.searchParams.set('key', YOUTUBE_API_KEY);
      const dtRes = await fetch(dtUrl.toString());
      const dtData = dtRes.ok ? await dtRes.json() : { items: [] };

      const detailsMap = new Map<string, any>();
      dtData.items?.forEach((v: any) => detailsMap.set(v.id, v));

      for (const item of plData.items || []) {
        const vid = item.contentDetails?.videoId;
        if (!vid) continue;
        const details = detailsMap.get(vid);
        const title = item.snippet?.title || '';
        const lowerTitle = title.toLowerCase();

        allTracks.push({
          id: vid,
          title,
          youtubeId: vid,
          thumbnail: item.snippet?.thumbnails?.high?.url || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
          duration: parseDuration(details?.contentDetails?.duration),
          viewCount: details?.statistics?.viewCount,
          isOfficialAudio: lowerTitle.includes('official audio') || lowerTitle.includes('audio'),
        });
      }

      pageToken = plData.nextPageToken;
      if (!pageToken) break;
      pages++;
    }

    return allTracks;
  } catch (e) {
    console.error('[Channel Music Agent] Error:', e);
    return [];
  }
}

// Sub-agent 3: Search-based discovery for comprehensive results
async function searchArtistMusic(artistName: string, searchQueries: string[], maxPerQuery = 20): Promise<Track[]> {
  if (!YOUTUBE_API_KEY) return [];
  const allTracks: Track[] = [];
  const seenIds = new Set<string>();

  for (const query of searchQueries) {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('q', query);
      url.searchParams.set('type', 'video');
      url.searchParams.set('videoCategoryId', '10');
      url.searchParams.set('maxResults', String(maxPerQuery));
      url.searchParams.set('key', YOUTUBE_API_KEY);

      const res = await fetch(url.toString());
      if (!res.ok) continue;
      const data = await res.json();

      const videoIds = data.items?.map((i: any) => i.id?.videoId).filter(Boolean);
      if (!videoIds?.length) continue;

      // Get details
      const dtUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      dtUrl.searchParams.set('part', 'contentDetails,statistics');
      dtUrl.searchParams.set('id', videoIds.join(','));
      dtUrl.searchParams.set('key', YOUTUBE_API_KEY);
      const dtRes = await fetch(dtUrl.toString());
      const dtData = dtRes.ok ? await dtRes.json() : { items: [] };
      const detailsMap = new Map<string, any>();
      dtData.items?.forEach((v: any) => detailsMap.set(v.id, v));

      for (const item of data.items || []) {
        const vid = item.id?.videoId;
        if (!vid || seenIds.has(vid)) continue;
        seenIds.add(vid);
        const details = detailsMap.get(vid);
        const title = item.snippet?.title || '';

        allTracks.push({
          id: vid,
          title,
          youtubeId: vid,
          thumbnail: item.snippet?.thumbnails?.high?.url || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
          duration: parseDuration(details?.contentDetails?.duration),
          viewCount: details?.statistics?.viewCount,
          isOfficialAudio: title.toLowerCase().includes('official audio'),
        });
      }
    } catch (e) {
      console.error(`[Search Agent] Query "${query}" failed:`, e);
    }
  }
  return allTracks;
}

// Sub-agent 4: Organize tracks into albums/singles/top tracks
function organizeDiscography(tracks: Track[], artistName: string): { albums: Album[]; singles: Album[]; topTracks: Track[] } {
  // Deduplicate by title similarity
  const uniqueTracks: Track[] = [];
  const titleSet = new Set<string>();

  for (const track of tracks) {
    const normalizedTitle = track.title
      .toLowerCase()
      .replace(/\(official.*?\)/gi, '')
      .replace(/\[official.*?\]/gi, '')
      .replace(/official (audio|video|music video)/gi, '')
      .replace(/\(lyrics?\)/gi, '')
      .replace(/\[lyrics?\]/gi, '')
      .replace(artistName.toLowerCase(), '')
      .replace(/[-–—|]/g, '')
      .trim();

    if (normalizedTitle.length > 2 && !titleSet.has(normalizedTitle)) {
      titleSet.add(normalizedTitle);
      uniqueTracks.push(track);
    }
  }

  // Sort by view count (highest first) for top tracks
  const sorted = [...uniqueTracks].sort((a, b) => {
    const aViews = parseInt(a.viewCount || '0');
    const bViews = parseInt(b.viewCount || '0');
    return bViews - aViews;
  });

  const topTracks = sorted.slice(0, 20);

  // Group remaining tracks as singles
  const singles: Album[] = sorted.slice(20).map((track, i) => ({
    id: `single-${track.youtubeId}`,
    title: cleanTrackTitle(track.title, artistName),
    thumbnail: track.thumbnail,
    trackCount: 1,
    tracks: [track],
    type: 'single' as const,
  }));

  return { albums: [], singles, topTracks };
}

function cleanTrackTitle(title: string, artistName: string): string {
  return title
    .replace(new RegExp(artistName, 'gi'), '')
    .replace(/\(official.*?\)/gi, '')
    .replace(/\[official.*?\]/gi, '')
    .replace(/official (audio|video|music video)/gi, '')
    .replace(/\(lyrics?\)/gi, '')
    .replace(/\[lyrics?\]/gi, '')
    .replace(/[-–—|]\s*$/g, '')
    .replace(/^\s*[-–—|]/g, '')
    .trim() || title;
}

function parseDuration(iso: string | undefined): string {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated user
  {
    const __auth = await requireUser(req);
    if (!__auth.user) return unauthorized(corsHeaders);
  }

  try {
    const { artistName, mode = 'full' } = await req.json().catch(() => ({}));

    if (!artistName || typeof artistName !== 'string' || artistName.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'artistName is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const name = artistName.trim();
    console.log(`[Discography Agent] Starting for "${name}", mode=${mode}`);

    // Run sub-agents in parallel for maximum speed
    const [channelInfo, searchTracks] = await Promise.all([
      findArtistChannel(name),
      searchArtistMusic(name, [
        `${name} official audio`,
        `${name} official music video`,
        `${name} full album`,
        `${name} latest songs`,
      ], mode === 'quick' ? 10 : 20),
    ]);

    console.log(`[Discography Agent] Channel: ${channelInfo.channelId || 'none'}, Search tracks: ${searchTracks.length}`);

    // If we got a channel, also fetch channel music in parallel
    let channelTracks: Track[] = [];
    if (channelInfo.channelId) {
      channelTracks = await fetchChannelMusic(channelInfo.channelId, mode === 'quick' ? 30 : 100);
      console.log(`[Discography Agent] Channel tracks: ${channelTracks.length}`);
    }

    // Merge all tracks (channel + search), preferring channel tracks
    const allTracks = [...channelTracks, ...searchTracks];
    const seenIds = new Set<string>();
    const dedupedTracks = allTracks.filter(t => {
      if (seenIds.has(t.youtubeId)) return false;
      seenIds.add(t.youtubeId);
      return true;
    });

    // Organize into structured discography
    const { albums, singles, topTracks } = organizeDiscography(dedupedTracks, name);

    const result: DiscographyResult = {
      artist: {
        name: channelInfo.name || name,
        channelId: channelInfo.channelId,
        thumbnail: channelInfo.thumbnail,
      },
      albums,
      singles,
      topTracks,
      totalTracks: dedupedTracks.length,
    };

    console.log(`[Discography Agent] Complete: ${topTracks.length} top, ${singles.length} singles, ${albums.length} albums, ${dedupedTracks.length} total`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[Discography Agent] Error:', error);
    return new Response(JSON.stringify({ error: publicError(error, 'Internal error') }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
