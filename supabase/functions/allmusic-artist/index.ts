import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser, unauthorized } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const USER_AGENT = 'TDZ-StreamingPlatform/1.0 (contact@thirtydarkzero.com)';

interface AllMusicArtist {
  name: string;
  imageUrl: string | null;
  biography: string | null;
  genres: string[];
  styles: string[];
  activeYears: string | null;
  discography: AllMusicAlbum[];
  relatedArtists: string[];
}

interface AllMusicAlbum {
  id: string;
  title: string;
  year: string | null;
  coverArt: string | null;
  rating: number | null;
  type: string;
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
    const { artistName, includeDiscography = true } = await req.json().catch(() => ({}));

    if (!artistName) {
      throw new Error('Artist name is required');
    }

    console.log(`AllMusic lookup for: "${artistName}"`);

    // Check if Firecrawl is available
    if (!FIRECRAWL_API_KEY) {
      console.log('Firecrawl not configured, using fallback sources');
      return new Response(JSON.stringify({
        success: true,
        artist: await getFallbackArtistData(artistName),
        source: 'fallback',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Search AllMusic for the artist
    const searchUrl = `https://www.allmusic.com/search/artists/${encodeURIComponent(artistName)}`;
    
    console.log('Scraping AllMusic search:', searchUrl);

    const searchResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
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

    if (!searchResponse.ok) {
      console.error('AllMusic search scrape failed:', searchResponse.status);
      return new Response(JSON.stringify({
        success: true,
        artist: await getFallbackArtistData(artistName),
        source: 'fallback',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchData = await searchResponse.json();
    const html = searchData.data?.html || searchData.html || '';
    const links = searchData.data?.links || searchData.links || [];

    // Find artist profile URL from search results
    let artistUrl = '';
    
    // Look for artist links in the results
    for (const link of links) {
      if (typeof link === 'string' && link.includes('/artist/')) {
        artistUrl = link;
        break;
      } else if (link?.href && link.href.includes('/artist/')) {
        artistUrl = link.href;
        break;
      }
    }

    // Alternative: Parse from HTML
    if (!artistUrl) {
      const artistLinkMatch = html.match(/href="(https?:\/\/www\.allmusic\.com\/artist\/[^"]+)"/i);
      if (artistLinkMatch) {
        artistUrl = artistLinkMatch[1];
      }
    }

    // If we found an artist URL, scrape the profile
    if (artistUrl) {
      console.log('Scraping artist profile:', artistUrl);
      
      const profileResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: artistUrl,
          formats: ['html', 'markdown'],
          waitFor: 2000,
        }),
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const profileHtml = profileData.data?.html || profileData.html || '';
        const profileMarkdown = profileData.data?.markdown || profileData.markdown || '';
        
        const artist = parseArtistProfile(profileHtml, profileMarkdown, artistName);
        
        // Get discography if requested
        if (includeDiscography && artist) {
          const discographyUrl = artistUrl + '/discography';
          
          try {
            const discogResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: discographyUrl,
                formats: ['html'],
                waitFor: 2000,
              }),
            });

            if (discogResponse.ok) {
              const discogData = await discogResponse.json();
              const discogHtml = discogData.data?.html || discogData.html || '';
              artist.discography = parseDiscography(discogHtml);
            }
          } catch (discogError) {
            console.error('Discography scrape failed:', discogError);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          artist,
          source: 'allmusic',
          profileUrl: artistUrl,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fallback to other sources if AllMusic fails
    console.log('AllMusic scrape failed, using fallback');
    return new Response(JSON.stringify({
      success: true,
      artist: await getFallbackArtistData(artistName),
      source: 'fallback',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AllMusic API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseArtistProfile(html: string, markdown: string, artistName: string): AllMusicArtist {
  const artist: AllMusicArtist = {
    name: artistName,
    imageUrl: null,
    biography: null,
    genres: [],
    styles: [],
    activeYears: null,
    discography: [],
    relatedArtists: [],
  };

  try {
    // Extract artist image (multiple patterns)
    const imagePatterns = [
      /class="[^"]*artist-image[^"]*"[^>]*>\s*<img[^>]*src="([^"]+)"/i,
      /<img[^>]*class="[^"]*artist-image[^"]*"[^>]*src="([^"]+)"/i,
      /class="[^"]*image-container[^"]*"[^>]*>\s*<img[^>]*src="([^"]+)"/i,
      /<div[^>]*class="[^"]*artist-photo[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i,
      /<img[^>]*src="(https:\/\/[^"]*allmusic[^"]*\/cmsimg\/[^"]+)"/i,
      /<img[^>]*src="(https:\/\/rovimusic[^"]+)"/i,
      /og:image"[^>]*content="([^"]+)"/i,
    ];

    for (const pattern of imagePatterns) {
      const match = html.match(pattern);
      if (match && match[1] && !match[1].includes('placeholder')) {
        artist.imageUrl = match[1];
        break;
      }
    }

    // Extract biography
    const bioPatterns = [
      /<div[^>]*class="[^"]*biography[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*class="[^"]*bio[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
      /<p[^>]*class="[^"]*text[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
    ];

    for (const pattern of bioPatterns) {
      const match = html.match(pattern);
      if (match) {
        artist.biography = match[1].replace(/<[^>]+>/g, ' ').trim().slice(0, 500);
        break;
      }
    }

    // Extract from markdown if HTML failed
    if (!artist.biography && markdown) {
      const lines = markdown.split('\n').filter(l => l.length > 100);
      if (lines.length > 0) {
        artist.biography = lines[0].slice(0, 500);
      }
    }

    // Extract genres
    const genrePatterns = [
      /class="[^"]*genre[^"]*"[^>]*>([^<]+)</gi,
      /Genre[^<]*<[^>]*>([^<]+)</gi,
    ];

    for (const pattern of genrePatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !artist.genres.includes(match[1].trim())) {
          artist.genres.push(match[1].trim());
        }
      }
      if (artist.genres.length > 0) break;
    }

    // Extract styles
    const styleMatches = html.matchAll(/class="[^"]*style[^"]*"[^>]*>([^<]+)</gi);
    for (const match of styleMatches) {
      if (match[1] && !artist.styles.includes(match[1].trim())) {
        artist.styles.push(match[1].trim());
      }
    }

    // Extract active years
    const yearsMatch = html.match(/Active\s*:?\s*(\d{4})\s*[-–—]\s*(\d{4}|present)/i);
    if (yearsMatch) {
      artist.activeYears = `${yearsMatch[1]} - ${yearsMatch[2]}`;
    }

  } catch (error) {
    console.error('Error parsing artist profile:', error);
  }

  return artist;
}

function parseDiscography(html: string): AllMusicAlbum[] {
  const albums: AllMusicAlbum[] = [];

  try {
    // Multiple album extraction patterns
    const albumPatterns = [
      /<tr[^>]*class="[^"]*album[^"]*"[^>]*>[\s\S]*?<td[^>]*class="[^"]*title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?<td[^>]*class="[^"]*year[^"]*"[^>]*>(\d{4})?<\/td>/gi,
      /<div[^>]*class="[^"]*album[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?(\d{4})?/gi,
    ];

    // Try first pattern
    const albumMatches = html.matchAll(/<div[^>]*class="[^"]*discography-item[^"]*"[^>]*>[\s\S]*?(?:<img[^>]*src="([^"]+)")?[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?(\d{4})?/gi);
    
    let id = 0;
    for (const match of albumMatches) {
      albums.push({
        id: `am-album-${id++}`,
        title: match[3]?.trim() || 'Unknown Album',
        year: match[4] || null,
        coverArt: match[1] || null,
        rating: null,
        type: 'Album',
      });
    }

    // Alternative pattern if first fails
    if (albums.length === 0) {
      const altMatches = html.matchAll(/<a[^>]*class="[^"]*title[^"]*"[^>]*href="[^"]*\/album\/[^"]*"[^>]*>([^<]+)<\/a>[\s\S]*?(?:<td[^>]*>(\d{4})<\/td>)?/gi);
      
      for (const match of altMatches) {
        albums.push({
          id: `am-album-${id++}`,
          title: match[1]?.trim() || 'Unknown Album',
          year: match[2] || null,
          coverArt: null,
          rating: null,
          type: 'Album',
        });
      }
    }

  } catch (error) {
    console.error('Error parsing discography:', error);
  }

  return albums;
}

// Fallback using multiple sources when AllMusic/Firecrawl unavailable
async function getFallbackArtistData(artistName: string): Promise<AllMusicArtist> {
  const artist: AllMusicArtist = {
    name: artistName,
    imageUrl: null,
    biography: null,
    genres: [],
    styles: [],
    activeYears: null,
    discography: [],
    relatedArtists: [],
  };

  // Try multiple image sources in order of priority
  const imageSources = await Promise.allSettled([
    getDiscogsArtistImage(artistName),
    getMusicBrainzArtistImage(artistName),
    getYouTubeArtistImage(artistName),
    getWikipediaArtistImage(artistName),
  ]);

  // Use first successful image
  for (const source of imageSources) {
    if (source.status === 'fulfilled' && source.value) {
      artist.imageUrl = source.value;
      break;
    }
  }

  return artist;
}

async function getDiscogsArtistImage(artistName: string): Promise<string | null> {
  const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');
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
      if (data.results?.[0]?.cover_image && !data.results[0].cover_image.includes('spacer')) {
        return data.results[0].cover_image;
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
    const searchUrl = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(artistName)}&limit=1&fmt=json`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    const artistId = searchData.artists?.[0]?.id;

    if (!artistId) return null;

    // Try to get image from Wikimedia Commons via MusicBrainz relations
    await new Promise(r => setTimeout(r, 1100)); // Rate limit
    
    const artistUrl = `https://musicbrainz.org/ws/2/artist/${artistId}?inc=url-rels&fmt=json`;
    const artistResponse = await fetch(artistUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!artistResponse.ok) return null;

    const artistData = await artistResponse.json();
    const relations = artistData.relations || [];

    // Look for image relationship
    for (const rel of relations) {
      if (rel.type === 'image' && rel.url?.resource) {
        // Convert Commons URL to direct image
        const commonsUrl = rel.url.resource;
        if (commonsUrl.includes('commons.wikimedia.org')) {
          return commonsUrl.replace('/wiki/File:', '/wiki/Special:FilePath/');
        }
        return commonsUrl;
      }
    }

    // Fallback: look for official site with image or wikidata
    for (const rel of relations) {
      if (rel.type === 'wikidata') {
        const wikidataId = rel.url?.resource?.split('/').pop();
        if (wikidataId) {
          return await getWikidataImage(wikidataId);
        }
      }
    }

  } catch (error) {
    console.error('MusicBrainz image fetch error:', error);
  }

  return null;
}

async function getYouTubeArtistImage(artistName: string): Promise<string | null> {
  const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
  if (!YOUTUBE_API_KEY) return null;

  try {
    // Search for artist topic channel
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(artistName + ' - Topic')}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(searchUrl);

    if (response.ok) {
      const data = await response.json();
      const thumbnail = data.items?.[0]?.snippet?.thumbnails?.high?.url;
      if (thumbnail) return thumbnail;
    }

    // Fallback: search for official channel
    const fallbackUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(artistName + ' official')}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;
    const fallbackResponse = await fetch(fallbackUrl);

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      return data.items?.[0]?.snippet?.thumbnails?.high?.url || null;
    }
  } catch (error) {
    console.error('YouTube image fetch error:', error);
  }

  return null;
}

async function getWikipediaArtistImage(artistName: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artistName.replace(/ /g, '_'))}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (response.ok) {
      const data = await response.json();
      return data.originalimage?.source || data.thumbnail?.source || null;
    }
  } catch (error) {
    console.error('Wikipedia image fetch error:', error);
  }

  return null;
}

async function getWikidataImage(wikidataId: string): Promise<string | null> {
  try {
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (response.ok) {
      const data = await response.json();
      const entity = data.entities?.[wikidataId];
      const imageClaim = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;

      if (imageClaim) {
        // Convert to Commons URL
        const fileName = imageClaim.replace(/ /g, '_');
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
      }
    }
  } catch (error) {
    console.error('Wikidata image fetch error:', error);
  }

  return null;
}
