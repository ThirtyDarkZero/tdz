import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

type PlaylistTrack = {
  id: string;
  youtubeId: string;
  title: string;
  artist_name: string;
  thumbnail: string;
  source: "youtube";
  duration: number;
  file_path: string;
  play_count: number;
  position: number;
};

const extractRunsText = (value: any): string => {
  if (!value) return "";
  if (typeof value.simpleText === "string") return value.simpleText;
  if (Array.isArray(value.runs)) {
    return value.runs.map((r: any) => r?.text || "").join("").trim();
  }
  return "";
};

const normalizeTrackTitle = (rawTitle: string, rawArtist: string) => {
  let title = rawTitle?.trim() || "";
  let artist = rawArtist?.trim() || "Unknown Artist";

  const dashSplit = title.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashSplit) {
    artist = dashSplit[1].trim();
    title = dashSplit[2].trim();
  }

  return { title, artist };
};

const mapTrack = (videoId: string, title: string, artist: string, thumbnail: string, position: number): PlaylistTrack => ({
  id: `yt-${videoId}`,
  youtubeId: videoId,
  title,
  artist_name: artist,
  thumbnail,
  source: "youtube",
  duration: 0,
  file_path: "",
  play_count: 0,
  position,
});

const fetchWithYouTubeApi = async (playlistId: string, apiKey: string): Promise<PlaylistTrack[]> => {
  const tracks: PlaylistTrack[] = [];
  const seen = new Set<string>();
  let nextPageToken: string | undefined;

  while (tracks.length < 50) {
    const remaining = 50 - tracks.length;
    const maxResults = Math.min(50, remaining);
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("key", apiKey);
    if (nextPageToken) url.searchParams.set("pageToken", nextPageToken);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`youtube_api_${response.status}: ${errText}`);
    }

    const data = await response.json();
    const items = data?.items || [];

    for (const item of items) {
      const snippet = item?.snippet;
      if (!snippet || snippet.title === "Private video" || snippet.title === "Deleted video") continue;

      const videoId = snippet?.resourceId?.videoId;
      if (!videoId || seen.has(videoId)) continue;

      const rawTitle = snippet.title || "";
      const rawArtist = (snippet.videoOwnerChannelTitle || "Unknown Artist").replace(/ - Topic$/, "");
      const { title, artist } = normalizeTrackTitle(rawTitle, rawArtist);
      const thumbnail =
        snippet?.thumbnails?.high?.url ||
        snippet?.thumbnails?.medium?.url ||
        snippet?.thumbnails?.default?.url ||
        "";

      seen.add(videoId);
      tracks.push(mapTrack(videoId, title, artist, thumbnail, tracks.length));
      if (tracks.length >= 50) break;
    }

    nextPageToken = data?.nextPageToken;
    if (!nextPageToken) break;
  }

  return tracks;
};

const fetchFromPlaylistPage = async (playlistId: string): Promise<PlaylistTrack[]> => {
  const response = await fetch(`https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`playlist_page_${response.status}`);
  }

  const html = await response.text();
  const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!match?.[1]) {
    throw new Error("playlist_page_no_initial_data");
  }

  let initialData: any;
  try {
    initialData = JSON.parse(match[1]);
  } catch {
    throw new Error("playlist_page_parse_failed");
  }

  const renderers: any[] = [];
  const visit = (node: any) => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (typeof node !== "object") return;

    if (node.playlistVideoRenderer) {
      renderers.push(node.playlistVideoRenderer);
    }

    for (const value of Object.values(node)) visit(value);
  };
  visit(initialData);

  const tracks: PlaylistTrack[] = [];
  const seen = new Set<string>();

  for (const renderer of renderers) {
    const videoId = renderer?.videoId;
    if (!videoId || seen.has(videoId)) continue;

    const rawTitle = extractRunsText(renderer?.title) || "Untitled";
    const rawArtist = extractRunsText(renderer?.shortBylineText) || "Unknown Artist";
    const { title, artist } = normalizeTrackTitle(rawTitle, rawArtist);
    const thumb =
      renderer?.thumbnail?.thumbnails?.[renderer?.thumbnail?.thumbnails?.length - 1]?.url ||
      renderer?.thumbnail?.thumbnails?.[0]?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    seen.add(videoId);
    tracks.push(mapTrack(videoId, title, artist, thumb, tracks.length));
    if (tracks.length >= 50) break;
  }

  return tracks;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { genre } = await req.json().catch(() => ({}));

    if (!genre || typeof genre !== "string") {
      return new Response(JSON.stringify({ error: "genre is required", tracks: [] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const genreKey = genre.toLowerCase();
    const playlistId = GENRE_PLAYLISTS[genreKey];

    if (!playlistId) {
      return new Response(JSON.stringify({ error: `Unknown genre: ${genre}`, tracks: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    let tracks: PlaylistTrack[] = [];
    let source: "youtube-api" | "playlist-page" = "playlist-page";
    let apiError: string | null = null;

    if (YOUTUBE_API_KEY) {
      try {
        tracks = await fetchWithYouTubeApi(playlistId, YOUTUBE_API_KEY);
        source = "youtube-api";
      } catch (error) {
        apiError = error instanceof Error ? error.message : String(error);
        console.error("genre-playlist youtube api failed", apiError);
      }
    } else {
      apiError = "youtube_api_key_missing";
    }

    if (tracks.length === 0) {
      tracks = await fetchFromPlaylistPage(playlistId);
      source = "playlist-page";
    }

    return new Response(
      JSON.stringify({
        genre: genreKey,
        playlistId,
        source,
        apiError,
        tracks,
        total: tracks.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Genre playlist error:", message);
    return new Response(JSON.stringify({ error: message, tracks: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
