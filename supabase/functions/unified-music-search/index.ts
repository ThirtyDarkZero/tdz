import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const MUSICBRAINZ_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'TDZ-StreamingPlatform/1.0 (contact@thirtydarkyear.com)';

interface UnifiedResult {
  id: string;
  type: 'artist' | 'album' | 'track';
  title: string;
  artist: string;
  year?: string;
  thumbnail?: string;
  source: 'musicbrainz' | 'discogs' | 'youtube';
  sourceId: string;
  youtubeId?: string;
  genres?: string[];
  isOfficial?: boolean;
  popularity?: number;
  metadata?: Record<string, any>;
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
    const { query, type = 'all', limit = 20, aiEnrich = false } = await req.json();

    if (!query) {
      throw new Error('Query is required');
    }

    console.log(`Unified search: "${query}" type=${type} aiEnrich=${aiEnrich}`);

    // Parallel fetch from all sources
    const [musicBrainzResults, discogsResults, youtubeResults] = await Promise.allSettled([
      searchMusicBrainz(query, type, limit),
      searchDiscogs(query, type, limit),
      searchYouTube(query, limit),
    ]);

    // Collect all results
    let allResults: UnifiedResult[] = [];

    if (musicBrainzResults.status === 'fulfilled') {
      allResults.push(...musicBrainzResults.value);
    } else {
      console.error('MusicBrainz error:', musicBrainzResults.reason);
    }

    if (discogsResults.status === 'fulfilled') {
      allResults.push(...discogsResults.value);
    } else {
      console.error('Discogs error:', discogsResults.reason);
    }

    if (youtubeResults.status === 'fulfilled') {
      allResults.push(...youtubeResults.value);
    } else {
      console.error('YouTube error:', youtubeResults.reason);
    }

    // Deduplicate and merge results using fuzzy matching
    const mergedResults = deduplicateAndMerge(allResults);

    // Sort by relevance (official content first, then by popularity)
    mergedResults.sort((a, b) => {
      // Official content first
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

    return new Response(JSON.stringify({
      query,
      results: finalResults,
      totalResults: mergedResults.length,
      sources: {
        musicbrainz: musicBrainzResults.status === 'fulfilled',
        discogs: discogsResults.status === 'fulfilled',
        youtube: youtubeResults.status === 'fulfilled',
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unified search error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
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
