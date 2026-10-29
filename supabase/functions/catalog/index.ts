// Global music catalog.
//
// One saved profile per artist with real albums, singles and EPs, every track
// playable through YouTube. Artist identity and discography come from
// MusicBrainz (free); playable videos come from the artist's YouTube Music
// "Topic" channel, read once per artist for about 100-120 quota units instead
// of ~600 units on every page view. Results are stored and refreshed weekly.
//
// POST { action: "artist",  id? | mbid? | name? }  profile + releases + top tracks
// POST { action: "release", id }                   release + ordered tracklist
// POST { action: "play",    trackId }              playable YouTube id for a track
// POST { action: "search",  query }                artists (catalog, TDZ, MusicBrainz)
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import {
  bestVideoForTitle, cleanVideoTitle, isoDurationToSeconds, isTopicChannelFor, type MBArtistHit,
  normName, normRelease, normTrack, parseTopicDescription, pickMBArtist, releaseTypeFromCount,
  releaseTypeFromMB,
} from "./lib.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const MB = "https://musicbrainz.org/ws/2";
const UA = "TDZ-Catalog/1.0 (info@thirtydarkzero.com)";
const YT = "https://www.googleapis.com/youtube/v3";
const YT_KEY = Deno.env.get("YOUTUBE_API_KEY");
const YT_BUDGET = Number(Deno.env.get("CATALOG_YT_DAILY_BUDGET") ?? 6000);   // of the 10,000/day default
const FRESH_DAYS = 7;
const MAX_UPLOAD_PAGES = 10;                                                  // 500 tracks per artist
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// ---------- per-IP limits (best effort, per instance) ----------
const hits = new Map<string, { n: number; reset: number }>();
function limited(req: Request, scope: string, max: number): boolean {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "?";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + 3600_000 }); return false; }
  return ++h.n > max;
}

// ---------- outside services ----------
let mbNext = 0;
// deno-lint-ignore no-explicit-any
async function mb(path: string): Promise<any | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const wait = mbNext - Date.now();          // MusicBrainz allows 1 request/second
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    mbNext = Date.now() + 1100;
    try {
      const res = await fetch(`${MB}${path}${path.includes("?") ? "&" : "?"}fmt=json`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
      if (res.status === 503 || res.status === 429) { await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn("[catalog] musicbrainz", path, (e as Error).message);
    }
  }
  return null;
}

let ytQuotaHit = false;
// deno-lint-ignore no-explicit-any
async function yt(endpoint: string, params: Record<string, string>, units: number): Promise<any | null> {
  if (!YT_KEY || ytQuotaHit) return null;
  const { data: ok } = await db.rpc("catalog_spend_youtube_units", { p_units: units, p_budget: YT_BUDGET });
  if (!ok) { ytQuotaHit = true; return null; }
  const url = new URL(`${YT}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", YT_KEY);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (res.status === 403) { ytQuotaHit = true; return null; }
    return res.ok ? await res.json() : null;
  } catch (e) {
    console.warn("[catalog] youtube", endpoint, (e as Error).message);
    return null;
  }
}

const thumb = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
const coverFor = (rgid: string) => `https://coverartarchive.org/release-group/${rgid}/front-250`;

// ---------- artist identity ----------
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

async function artistFromMB(hit: MBArtistHit): Promise<Row> {
  const { data: existing } = await db.from("catalog_artists").select("*").eq("mbid", hit.id).maybeSingle();
  if (existing) return existing;
  const genres = (hit.tags ?? []).sort((a, b) => b.count - a.count).slice(0, 5).map((t) => t.name);
  const { data, error } = await db.from("catalog_artists").insert({
    name: hit.name, norm_name: normName(hit.name), mbid: hit.id, country: hit.country ?? null,
    artist_type: hit.type ?? null, disambiguation: hit.disambiguation ?? null, genres,
  }).select("*").single();
  if (error) {   // created concurrently
    const { data: again } = await db.from("catalog_artists").select("*").eq("mbid", hit.id).maybeSingle();
    if (again) return again;
    throw error;
  }
  return data;
}

async function resolveArtist(q: { id?: string; mbid?: string; name?: string }): Promise<Row | null> {
  if (q.id && UUID.test(q.id)) {
    const { data } = await db.from("catalog_artists").select("*").eq("id", q.id).maybeSingle();
    return data;
  }
  if (q.mbid && UUID.test(q.mbid)) {
    const { data } = await db.from("catalog_artists").select("*").eq("mbid", q.mbid).maybeSingle();
    if (data) return data;
    const a = await mb(`/artist/${q.mbid}?inc=tags+aliases`);
    return a?.id ? artistFromMB({ ...a, score: 100 }) : null;
  }
  const name = (q.name ?? "").trim().slice(0, 200);
  if (!name) return null;
  const { data: local } = await db.from("catalog_artists").select("*").eq("norm_name", normName(name))
    .order("synced_at", { ascending: false, nullsFirst: false }).limit(1);
  if (local?.[0]) return local[0];

  const found = await mb(`/artist?query=${encodeURIComponent(`artist:"${name}" OR alias:"${name}"`)}&limit=10`);
  const hit = pickMBArtist(found?.artists ?? [], name);
  if (hit) return artistFromMB(hit);

  // Not in MusicBrainz (e.g. very new or independent): YouTube-only profile.
  const { data, error } = await db.from("catalog_artists")
    .insert({ name, norm_name: normName(name) }).select("*").single();
  if (error) throw error;
  return data;
}

// ---------- sync: discography + playable tracks ----------
async function syncArtist(artist: Row): Promise<void> {
  const { data: claimed } = await db.rpc("catalog_claim_sync", { p_artist: artist.id });
  if (!claimed) return;   // someone else is syncing this artist right now

  let youtubeOk = false;
  try {
    // 1. Official discography from MusicBrainz.
    if (artist.mbid) {
      const groups: Row[] = [];
      for (let offset = 0; offset < 300; offset += 100) {
        const page = await mb(`/release-group?artist=${artist.mbid}&type=album|single|ep&limit=100&offset=${offset}`);
        groups.push(...(page?.["release-groups"] ?? []));
        if (!page || offset + 100 >= (page["release-group-count"] ?? 0)) break;
      }
      // One release per title+type (earliest wins), and none that already exist.
      const { data: existing } = await db.from("catalog_releases").select("norm_title, release_type, mbid")
        .eq("artist_id", artist.id);
      const taken = new Set((existing ?? []).map((r) => `${r.norm_title}|${r.release_type}`));
      const knownMbids = new Set((existing ?? []).map((r) => r.mbid).filter(Boolean));
      const rows: Row[] = [];
      groups.sort((a, b) => String(a["first-release-date"] || "9999").localeCompare(String(b["first-release-date"] || "9999")));
      for (const g of groups) {
        const type = releaseTypeFromMB(g["primary-type"], g["secondary-types"] ?? []);
        const key = `${normRelease(g.title)}|${type}`;
        if (taken.has(key) || knownMbids.has(g.id)) continue;
        taken.add(key);
        const date = /^\d{4}-\d{2}-\d{2}$/.test(g["first-release-date"] ?? "") ? g["first-release-date"] : null;
        rows.push({
          artist_id: artist.id, mbid: g.id, title: g.title, norm_title: normRelease(g.title), release_type: type,
          release_date: date, year: Number((g["first-release-date"] ?? "").slice(0, 4)) || null,
          cover_url: coverFor(g.id),
        });
      }
      for (let i = 0; i < rows.length; i += 100) {
        const { error } = await db.from("catalog_releases").upsert(rows.slice(i, i + 100), { onConflict: "mbid", ignoreDuplicates: true });
        if (error) console.warn("[catalog] releases", artist.name, error.message);
      }
    }

    // 2. The artist's YouTube Music "Topic" channel: every official track, auto-uploaded.
    let channelId: string | null = artist.youtube_channel_id;
    if (!channelId) {
      const ch = await yt("search", { part: "snippet", type: "channel", q: `${artist.name} - Topic`, maxResults: "5" }, 100);
      channelId = (ch?.items ?? []).find((i: Row) => isTopicChannelFor(i.snippet?.title ?? "", artist.name))
        ?.id?.channelId ?? null;
      if (!channelId && ch) {
        const v = await yt("search", { part: "snippet", type: "video", videoCategoryId: "10", q: artist.name, maxResults: "25" }, 100);
        channelId = (v?.items ?? []).find((i: Row) => isTopicChannelFor(i.snippet?.channelTitle ?? "", artist.name))
          ?.snippet?.channelId ?? null;
      }
    }

    if (channelId) {
      const info = await yt("channels", { part: "snippet,contentDetails", id: channelId }, 1);
      const chan = info?.items?.[0];
      const uploads = chan?.contentDetails?.relatedPlaylists?.uploads;
      const image = chan?.snippet?.thumbnails?.high?.url ?? chan?.snippet?.thumbnails?.default?.url ?? null;
      await db.from("catalog_artists").update({
        youtube_channel_id: channelId, ...(image && !artist.image_url ? { image_url: image } : {}),
      }).eq("id", artist.id);

      if (uploads) {
        const videos: Row[] = [];
        let pageToken = "";
        for (let p = 0; p < MAX_UPLOAD_PAGES; p++) {
          const page = await yt("playlistItems", {
            part: "snippet", playlistId: uploads, maxResults: "50", ...(pageToken ? { pageToken } : {}),
          }, 1);
          if (!page) break;
          for (const it of page.items ?? []) {
            const id = it.snippet?.resourceId?.videoId;
            if (id) videos.push({ id, title: it.snippet.title as string, description: it.snippet.description as string });
          }
          pageToken = page.nextPageToken ?? "";
          if (!pageToken) break;
        }

        // Durations and view counts, 50 videos per unit.
        const stats = new Map<string, Row>();
        for (let i = 0; i < videos.length; i += 50) {
          const ids = videos.slice(i, i + 50).map((v) => v.id).join(",");
          const d = await yt("videos", { part: "contentDetails,statistics", id: ids }, 1);
          for (const it of d?.items ?? []) stats.set(it.id, it);
        }

        // Group videos by the album named in their auto-generated description.
        const byAlbum = new Map<string, { title: string; date: string | null; vids: Row[] }>();
        for (const v of videos) {
          const parsed = parseTopicDescription(v.description);
          const title = parsed?.title ?? cleanVideoTitle(v.title, artist.name);
          const album = parsed?.album ?? title;
          const key = normRelease(album);
          if (!byAlbum.has(key)) byAlbum.set(key, { title: album, date: parsed?.releaseDate ?? null, vids: [] });
          byAlbum.get(key)!.vids.push({ ...v, trackTitle: title });
        }

        const { data: releases } = await db.from("catalog_releases").select("id, norm_title, release_type")
          .eq("artist_id", artist.id);
        const relByTitle = new Map<string, string>();
        for (const r of releases ?? []) if (!relByTitle.has(r.norm_title)) relByTitle.set(r.norm_title, r.id);

        const trackRows: Row[] = [];
        for (const [key, group] of byAlbum) {
          let releaseId = relByTitle.get(key);
          if (!releaseId) {   // on YouTube but not in MusicBrainz
            const { data: created } = await db.from("catalog_releases").upsert({
              artist_id: artist.id, title: group.title, norm_title: key,
              release_type: releaseTypeFromCount(group.vids.length),
              release_date: group.date, year: group.date ? Number(group.date.slice(0, 4)) : null,
              cover_url: thumb(group.vids[0].id), tracklist_synced: true,
            }, { onConflict: "artist_id,norm_title,release_type" }).select("id").single();
            releaseId = created?.id;
            if (releaseId) relByTitle.set(key, releaseId);
          }
          if (!releaseId) continue;
          for (const v of group.vids) {
            const s = stats.get(v.id);
            trackRows.push({
              artist_id: artist.id, release_id: releaseId, title: v.trackTitle, norm_title: normTrack(v.trackTitle),
              youtube_id: v.id, duration_sec: isoDurationToSeconds(s?.contentDetails?.duration),
              view_count: s?.statistics?.viewCount ? Number(s.statistics.viewCount) : null,
            });
          }
        }
        for (let i = 0; i < trackRows.length; i += 200) {
          await db.rpc("catalog_upsert_tracks", { p_rows: trackRows.slice(i, i + 200) });
        }
        youtubeOk = videos.length > 0;
      }
    }

    // 3. Link a TDZ Distribution artist with the same name.
    const { data: tdz } = await db.from("artist_profiles").select("user_id").ilike("artist_name", artist.name).limit(1);

    await db.from("catalog_artists").update({
      status: youtubeOk ? "ready" : "partial",
      sync_error: youtubeOk ? null : (ytQuotaHit ? "youtube_quota" : YT_KEY ? "no_topic_channel" : "no_youtube_key"),
      synced_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      ...(tdz?.[0]?.user_id ? { tdz_user_id: tdz[0].user_id } : {}),
    }).eq("id", artist.id);
  } catch (e) {
    console.error("[catalog] sync failed", artist.name, e);
    await db.from("catalog_artists").update({
      status: "failed", sync_error: String((e as Error)?.message ?? e).slice(0, 200), updated_at: new Date().toISOString(),
    }).eq("id", artist.id);
  }
}

// ---------- read models ----------
async function artistPayload(id: string) {
  const [{ data: artist }, { data: releases }, { data: tracks }] = await Promise.all([
    db.from("catalog_artists").select("*").eq("id", id).single(),
    db.from("catalog_releases").select("id, mbid, title, release_type, release_date, year, cover_url")
      .eq("artist_id", id).order("release_date", { ascending: false, nullsFirst: false }),
    db.from("catalog_tracks").select("id, release_id, title, youtube_id, duration_sec, view_count")
      .eq("artist_id", id).not("youtube_id", "is", null).order("view_count", { ascending: false, nullsFirst: false })
      .limit(2000),
  ]);
  const playable = new Map<string, number>();
  const fallbackCover = new Map<string, string>();
  for (const t of tracks ?? []) {
    playable.set(t.release_id, (playable.get(t.release_id) ?? 0) + 1);
    if (!fallbackCover.has(t.release_id)) fallbackCover.set(t.release_id, thumb(t.youtube_id));
  }
  const seen = new Set<string>();
  const topTracks = (tracks ?? []).filter((t) => !seen.has(t.youtube_id) && seen.add(t.youtube_id)).slice(0, 10)
    .map((t) => ({ ...t, thumbnail: thumb(t.youtube_id) }));
  return {
    artist,
    releases: (releases ?? []).map((r) => ({
      ...r, playable_tracks: playable.get(r.id) ?? 0, fallback_cover: fallbackCover.get(r.id) ?? null,
    })),
    topTracks,
  };
}

async function releasePayload(id: string) {
  const { data: release } = await db.from("catalog_releases")
    .select("*, artist:catalog_artists(id, name, image_url)").eq("id", id).maybeSingle();
  if (!release) return null;

  if (!release.tracklist_synced && release.mbid) {
    const rel = await mb(`/release?release-group=${release.mbid}&inc=recordings&status=official&limit=10`);
    const candidates: Row[] = rel?.releases ?? [];
    // Prefer the digital edition; otherwise the first official release.
    const chosen = candidates.find((r) => (r.media ?? []).some((m: Row) => /digital/i.test(m.format ?? ""))) ?? candidates[0];
    if (chosen) {
      const { data: vids } = await db.from("catalog_tracks").select("youtube_id, norm_title, view_count")
        .eq("artist_id", release.artist_id).not("youtube_id", "is", null);
      const used = new Set<string>();
      const rows: Row[] = [];
      let pos = 0;
      for (const medium of chosen.media ?? []) {
        for (const t of medium.tracks ?? []) {
          pos++;
          const title = t.title ?? t.recording?.title ?? `Track ${pos}`;
          const match = bestVideoForTitle((vids ?? []).filter((v) => !used.has(v.youtube_id)), title);
          if (match) used.add(match.youtube_id);
          rows.push({
            title, norm_title: normTrack(title), position: pos,
            duration_sec: t.length ? Math.round(t.length / 1000) : null,
            youtube_id: match?.youtube_id ?? null, view_count: match?.view_count ?? null,
            mb_recording: t.recording?.id ?? null,
          });
        }
      }
      if (rows.length) await db.rpc("catalog_apply_tracklist", { p_release: id, p_rows: rows });
    } else {
      await db.from("catalog_releases").update({ tracklist_synced: true }).eq("id", id);
    }
  }

  const { data: tracks } = await db.from("catalog_tracks")
    .select("id, title, position, duration_sec, youtube_id, view_count, lookup_failed")
    .eq("release_id", id).order("position", { ascending: true, nullsFirst: false }).order("created_at");
  return {
    release,
    tracks: (tracks ?? []).map((t) => ({ ...t, thumbnail: t.youtube_id ? thumb(t.youtube_id) : null })),
  };
}

async function playableTrack(trackId: string) {
  const { data: t } = await db.from("catalog_tracks")
    .select("*, artist:catalog_artists(name, youtube_channel_id)").eq("id", trackId).maybeSingle();
  if (!t) return null;
  if (t.youtube_id || t.lookup_failed) return t;

  // Same song already playable elsewhere in the catalog (e.g. on the single)?
  const { data: same } = await db.from("catalog_tracks").select("youtube_id, view_count")
    .eq("artist_id", t.artist_id).eq("norm_title", t.norm_title).not("youtube_id", "is", null)
    .order("view_count", { ascending: false, nullsFirst: false }).limit(1);
  let videoId: string | null = same?.[0]?.youtube_id ?? null;

  if (!videoId) {
    const res = await yt("search", {
      part: "snippet", type: "video", videoCategoryId: "10", maxResults: "8",
      q: `${t.artist.name} ${t.title}`,
    }, 100);
    const items: Row[] = res?.items ?? [];
    const want = normTrack(t.title);
    const fits = (i: Row) => normTrack(cleanVideoTitle(i.snippet?.title ?? "", t.artist.name)) === want;
    const best = items.find((i) => isTopicChannelFor(i.snippet?.channelTitle ?? "", t.artist.name) && fits(i))
      ?? items.find((i) => fits(i) && normName(i.snippet?.channelTitle ?? "").includes(normName(t.artist.name)))
      ?? items.find(fits);
    videoId = best?.id?.videoId ?? null;
    if (!res) return t;   // quota/network: try again later rather than marking as missing
  }

  const { error } = await db.from("catalog_tracks")
    .update(videoId ? { youtube_id: videoId } : { lookup_failed: true }).eq("id", t.id);
  if (error) console.warn("[catalog] save video", error.message);
  return { ...t, youtube_id: videoId, lookup_failed: !videoId };
}

async function search(query: string) {
  const q = query.trim().slice(0, 100);
  if (q.length < 2) return { catalog: [], tdz: [], suggestions: [] };
  const n = normName(q);
  const safe = q.replace(/[%_,()]/g, " ");
  const [{ data: catalog }, { data: tdz }] = await Promise.all([
    db.from("catalog_artists").select("id, name, image_url, genres, country, disambiguation, mbid")
      .ilike("norm_name", `%${n}%`).neq("status", "failed").limit(10),
    db.from("artist_profiles").select("user_id, artist_name, profile_image_path, genre, verified")
      .ilike("artist_name", `%${safe}%`).limit(5),
  ]);
  let suggestions: Row[] = [];
  if ((catalog?.length ?? 0) < 5) {
    const found = await mb(`/artist?query=${encodeURIComponent(q)}&limit=8`);
    const known = new Set((catalog ?? []).map((a) => a.mbid));
    suggestions = (found?.artists ?? []).filter((a: Row) => (a.score ?? 0) >= 60 && !known.has(a.id))
      .map((a: Row) => ({ mbid: a.id, name: a.name, country: a.country ?? null, disambiguation: a.disambiguation ?? null }));
  }
  return { catalog: catalog ?? [], tdz: tdz ?? [], suggestions };
}

// ---------- handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);
  const body = await req.json().catch(() => ({}));
  ytQuotaHit = false;

  try {
    switch (body?.action) {
      case "artist": {
        if (limited(req, "artist", 240)) return json({ error: "Too many requests. Please slow down." }, 429);
        const artist = await resolveArtist({ id: body.id, mbid: body.mbid, name: body.name });
        if (!artist) return json({ error: "Artist not found" }, 404);

        const age = artist.synced_at ? Date.now() - new Date(artist.synced_at).getTime() : Infinity;
        const neverSynced = !artist.synced_at;
        const stale = age > FRESH_DAYS * 86400_000 || artist.status === "failed" ||
          (artist.status === "partial" && age > 86400_000);
        if (neverSynced) {
          if (limited(req, "sync", 30)) return json({ error: "Too many new artists. Try again shortly." }, 429);
          await syncArtist(artist);                  // first visit waits for the profile to be built
        } else if (stale) {
          // deno-lint-ignore no-explicit-any
          const rt = (globalThis as any).EdgeRuntime;
          const job = syncArtist(artist);
          if (rt?.waitUntil) rt.waitUntil(job); else await job;   // refresh in the background
        }
        const payload = await artistPayload(artist.id);
        return json({ ...payload, syncing: payload.artist?.status === "syncing" });
      }
      case "release": {
        if (!UUID.test(body?.id ?? "")) return json({ error: "Invalid release id" }, 400);
        const r = await releasePayload(body.id);
        return r ? json(r) : json({ error: "Release not found" }, 404);
      }
      case "play": {
        if (!UUID.test(body?.trackId ?? "")) return json({ error: "Invalid track id" }, 400);
        if (limited(req, "play", 120)) return json({ error: "Too many requests. Please slow down." }, 429);
        const t = await playableTrack(body.trackId);
        if (!t) return json({ error: "Track not found" }, 404);
        return json({ id: t.id, youtube_id: t.youtube_id, playable: !!t.youtube_id, thumbnail: t.youtube_id ? thumb(t.youtube_id) : null });
      }
      case "search": {
        if (limited(req, "search", 600)) return json({ error: "Too many requests. Please slow down." }, 429);
        return json(await search(String(body?.query ?? "")));
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("[catalog] error", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
