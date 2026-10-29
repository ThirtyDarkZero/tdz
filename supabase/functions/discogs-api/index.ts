import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser, unauthorized } from "../_shared/auth.ts";
import { publicError } from "../_shared/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DISCOGS_BASE_URL = "https://api.discogs.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated user
  {
    const __auth = await requireUser(req);
    if (!__auth.user) return unauthorized(corsHeaders);
  }

  try {
    const discogsToken = Deno.env.get("DISCOGS_TOKEN");
    if (!discogsToken) {
      throw new Error("DISCOGS_TOKEN not configured");
    }

    const { action, query, type, genre, style, year, page, per_page, artist_id, release_id, master_id } = await req.json().catch(() => ({}));
    
    // Use personal access token format (not OAuth)
    const headers = {
      "Authorization": `Discogs token=${discogsToken}`,
      "User-Agent": "ThirtyDarkZeroApp/1.0 +https://thirtydarkzero.com",
    };

    let endpoint = "";
    let params = new URLSearchParams();
    
    // Set pagination
    params.set("page", String(page || 1));
    params.set("per_page", String(per_page || 50));

    switch (action) {
      case "search":
        endpoint = "/database/search";
        if (query) params.set("q", query);
        if (type) params.set("type", type);
        if (genre) params.set("genre", genre);
        if (style) params.set("style", style);
        if (year) params.set("year", year);
        break;

      case "get_artist":
        endpoint = `/artists/${artist_id}`;
        break;

      case "get_artist_releases":
        endpoint = `/artists/${artist_id}/releases`;
        break;

      case "get_release":
        endpoint = `/releases/${release_id}`;
        break;

      case "get_master":
        endpoint = `/masters/${master_id}`;
        break;

      case "get_master_versions":
        endpoint = `/masters/${master_id}/versions`;
        break;

      case "browse_releases":
        // Search for releases by genre/style
        endpoint = "/database/search";
        params.set("type", "release");
        if (genre) params.set("genre", genre);
        if (style) params.set("style", style);
        if (year) params.set("year", year);
        break;

      case "browse_artists":
        endpoint = "/database/search";
        params.set("type", "artist");
        if (query) params.set("q", query);
        break;

      case "browse_masters":
        // Get master releases (canonical versions)
        endpoint = "/database/search";
        params.set("type", "master");
        if (genre) params.set("genre", genre);
        if (style) params.set("style", style);
        if (year) params.set("year", year);
        if (query) params.set("q", query);
        break;

      case "trending":
        // Get popular releases
        endpoint = "/database/search";
        params.set("type", "release");
        params.set("sort", "have");
        params.set("sort_order", "desc");
        if (genre) params.set("genre", genre);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const url = `${DISCOGS_BASE_URL}${endpoint}?${params.toString()}`;
    console.log(`Discogs API request: ${url}`);

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Discogs API error: ${response.status} - ${errorText}`);
      throw new Error(`Discogs API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform data to unified format
    const transformedData = transformDiscogsResponse(action, data);

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Discogs API error:", message);
    return new Response(
      JSON.stringify({ error: publicError(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

function transformDiscogsResponse(action: string, data: any) {
  if (action === "search" || action === "browse_releases" || action === "browse_masters" || action === "browse_artists" || action === "trending") {
    return {
      pagination: data.pagination,
      results: (data.results || []).map((item: any) => transformSearchResult(item)),
    };
  }

  if (action === "get_artist") {
    return transformArtist(data);
  }

  if (action === "get_artist_releases") {
    return {
      pagination: data.pagination,
      releases: (data.releases || []).map((r: any) => transformRelease(r)),
    };
  }

  if (action === "get_release") {
    return transformFullRelease(data);
  }

  if (action === "get_master") {
    return transformMaster(data);
  }

  if (action === "get_master_versions") {
    return {
      pagination: data.pagination,
      versions: (data.versions || []).map((v: any) => transformVersion(v)),
    };
  }

  return data;
}

function transformSearchResult(item: any) {
  // Determine release type
  let releaseType = "album";
  const format = (item.format || []).join(" ").toLowerCase();
  const title = (item.title || "").toLowerCase();
  
  if (format.includes("single") || format.includes('7"') || format.includes("45 rpm")) {
    releaseType = "single";
  } else if (format.includes("ep") || title.includes(" ep")) {
    releaseType = "ep";
  } else if (format.includes("compilation")) {
    releaseType = "compilation";
  }

  return {
    id: item.id,
    source: "discogs",
    source_id: String(item.id),
    type: item.type, // 'release', 'master', 'artist', 'label'
    title: item.title,
    artist: extractArtistFromTitle(item.title),
    cover_art_url: item.cover_image || item.thumb,
    thumb_url: item.thumb,
    year: item.year,
    genre: item.genre || [],
    style: item.style || [],
    format: item.format || [],
    release_type: releaseType,
    country: item.country,
    label: item.label || [],
    catno: item.catno,
    resource_url: item.resource_url,
    community: item.community,
    // For YouTube matching
    search_query: `${extractArtistFromTitle(item.title)} ${item.title?.split(" - ")[1] || item.title}`,
  };
}

function extractArtistFromTitle(title: string) {
  if (!title) return "Unknown Artist";
  const parts = title.split(" - ");
  return parts[0]?.trim() || "Unknown Artist";
}

function transformArtist(data: any) {
  return {
    id: data.id,
    source: "discogs",
    source_id: String(data.id),
    name: data.name,
    profile: data.profile,
    images: data.images || [],
    cover_art_url: data.images?.[0]?.uri || data.images?.[0]?.uri150,
    urls: data.urls || [],
    members: data.members || [],
    groups: data.groups || [],
    namevariations: data.namevariations || [],
    releases_url: data.releases_url,
    resource_url: data.resource_url,
  };
}

function transformRelease(data: any) {
  return {
    id: data.id,
    source: "discogs",
    source_id: String(data.id),
    title: data.title,
    artist: data.artist,
    year: data.year,
    format: data.format,
    label: data.label,
    cover_art_url: data.thumb,
    role: data.role,
    type: data.type,
    resource_url: data.resource_url,
  };
}

function transformFullRelease(data: any) {
  // Determine format/type
  let releaseType = "album";
  const formats = data.formats || [];
  const formatDescriptions = formats.flatMap((f: any) => f.descriptions || []).join(" ").toLowerCase();
  
  if (formatDescriptions.includes("single") || formatDescriptions.includes('7"')) {
    releaseType = "single";
  } else if (formatDescriptions.includes("ep")) {
    releaseType = "ep";
  } else if (formatDescriptions.includes("compilation")) {
    releaseType = "compilation";
  }

  return {
    id: data.id,
    source: "discogs",
    source_id: String(data.id),
    title: data.title,
    artists: (data.artists || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      resource_url: a.resource_url,
    })),
    artist_name: data.artists?.[0]?.name || "Unknown Artist",
    year: data.year,
    released: data.released,
    country: data.country,
    genres: data.genres || [],
    styles: data.styles || [],
    formats: formats,
    release_type: releaseType,
    labels: data.labels || [],
    cover_art_url: data.images?.[0]?.uri || data.thumb,
    thumb_url: data.thumb,
    images: data.images || [],
    tracklist: (data.tracklist || []).map((t: any, index: number) => ({
      position: t.position || String(index + 1),
      title: t.title,
      duration: t.duration,
      type: t.type_,
      artists: t.artists || [],
      // YouTube search query for playback
      search_query: `${data.artists?.[0]?.name || ""} ${t.title}`,
    })),
    notes: data.notes,
    videos: data.videos || [],
    community: data.community,
    master_id: data.master_id,
    resource_url: data.resource_url,
    uri: data.uri,
  };
}

function transformMaster(data: any) {
  return {
    id: data.id,
    source: "discogs",
    source_id: String(data.id),
    title: data.title,
    artists: (data.artists || []).map((a: any) => ({
      id: a.id,
      name: a.name,
    })),
    artist_name: data.artists?.[0]?.name || "Unknown Artist",
    year: data.year,
    genres: data.genres || [],
    styles: data.styles || [],
    cover_art_url: data.images?.[0]?.uri || data.images?.[0]?.uri150,
    images: data.images || [],
    tracklist: (data.tracklist || []).map((t: any, index: number) => ({
      position: t.position || String(index + 1),
      title: t.title,
      duration: t.duration,
    })),
    main_release: data.main_release,
    versions_url: data.versions_url,
    resource_url: data.resource_url,
  };
}

function transformVersion(data: any) {
  return {
    id: data.id,
    title: data.title,
    format: data.format,
    label: data.label,
    country: data.country,
    released: data.released,
    catno: data.catno,
    cover_art_url: data.thumb,
    resource_url: data.resource_url,
  };
}
