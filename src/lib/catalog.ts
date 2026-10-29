// Client for the global music catalog (supabase/functions/catalog).
import { supabase } from "@/integrations/supabase/client";
import type { Track } from "@/contexts/PlayerContext";

export type ReleaseType = "album" | "single" | "ep" | "compilation" | "live" | "other";

export interface CatalogArtist {
  id: string;
  name: string;
  mbid: string | null;
  image_url: string | null;
  country: string | null;
  disambiguation: string | null;
  artist_type: string | null;
  genres: string[];
  tdz_user_id: string | null;
  status: "pending" | "syncing" | "ready" | "partial" | "failed";
  sync_error: string | null;
}

export interface CatalogRelease {
  id: string;
  mbid: string | null;
  title: string;
  release_type: ReleaseType;
  release_date: string | null;
  year: number | null;
  cover_url: string | null;
  fallback_cover: string | null;
  playable_tracks: number;
}

export interface CatalogTrack {
  id: string;
  title: string;
  position?: number | null;
  duration_sec: number | null;
  youtube_id: string | null;
  view_count: number | null;
  thumbnail: string | null;
  lookup_failed?: boolean;
  release_id?: string;
}

export interface ArtistPayload {
  artist: CatalogArtist;
  releases: CatalogRelease[];
  topTracks: CatalogTrack[];
  syncing: boolean;
}

export interface ReleasePayload {
  release: CatalogRelease & { artist: { id: string; name: string; image_url: string | null } };
  tracks: CatalogTrack[];
}

export interface CatalogSearchResult {
  catalog: Array<Pick<CatalogArtist, "id" | "name" | "image_url" | "genres" | "country" | "disambiguation" | "mbid">>;
  tdz: Array<{ user_id: string; artist_name: string; profile_image_path: string | null; genre: string | null; verified: boolean | null }>;
  suggestions: Array<{ mbid: string; name: string; country: string | null; disambiguation: string | null }>;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("catalog", { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const detail = ctx ? await ctx.json().catch(() => null) : null;
    throw new Error(detail?.error || error.message);
  }
  return data as T;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Accepts a catalog id, "mbid:<id>", or an artist name. */
export function artistRef(ref: string, mbid?: string): Record<string, string> {
  if (mbid && UUID.test(mbid)) return { mbid };
  if (ref.startsWith("mbid:")) return { mbid: ref.slice(5) };
  if (ref.startsWith("id:")) return { id: ref.slice(3) };
  return { name: ref };
}

export const fetchArtist = (ref: Record<string, string>) => call<ArtistPayload>({ action: "artist", ...ref });
export const fetchRelease = (id: string) => call<ReleasePayload>({ action: "release", id });
export const resolvePlayable = (trackId: string) =>
  call<{ id: string; youtube_id: string | null; playable: boolean; thumbnail: string | null }>({ action: "play", trackId });
export const searchCatalog = (query: string) => call<CatalogSearchResult>({ action: "search", query });

export function toPlayerTrack(
  t: CatalogTrack,
  artistName: string,
  albumTitle?: string,
): Track {
  return {
    id: `catalog-${t.id}`,
    title: t.title,
    artist_name: artistName,
    duration: t.duration_sec ?? 0,
    file_path: "",
    play_count: 0,
    source: "youtube",
    youtubeId: t.youtube_id ?? undefined,
    thumbnail: t.thumbnail ?? (t.youtube_id ? `https://i.ytimg.com/vi/${t.youtube_id}/hqdefault.jpg` : undefined),
    album_title: albumTitle,
  };
}

export function formatDuration(sec: number | null | undefined): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function formatViews(n: number | null | undefined): string {
  if (!n) return "";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B plays`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M plays`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K plays`;
  return `${n} plays`;
}

export const RELEASE_LABEL: Record<ReleaseType, string> = {
  album: "Album", single: "Single", ep: "EP", compilation: "Compilation", live: "Live", other: "Release",
};

/** Same rule as the server: ignore deluxe/remaster/edition qualifiers. */
export function normRelease(s: string): string {
  return s
    .replace(/\s*[([](?:[^)\]]*\b(?:deluxe|expanded|remaster(?:ed)?|edition|version|anniversary|bonus|explicit|clean)\b[^)\]]*)[)\]]/gi, "")
    .replace(/\s+-\s+(single|ep)$/i, "")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
