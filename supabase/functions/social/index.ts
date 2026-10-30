// Social posting through Ayrshare (one profile per artist).
//
// POST { action: "link", artist_id? }     → { url }  open it to connect Instagram, TikTok…
// POST { action: "refresh", artist_id? }  → { platforms }
// POST { action: "post", artist_id?, body, platforms, media_urls, scheduled_at? } → { post }
// POST { action: "cancel", post_id }      → { ok }
// POST { action: "sync", artist_id? }     → refresh statuses of posts whose time has passed
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { ayrshareDate, overallStatus, PLATFORMS, postProblems } from "./lib.ts";

const API = "https://api.ayrshare.com/api";

async function ayr(path: string, init: RequestInit & { profileKey?: string } = {}) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${Deno.env.get("AYRSHARE_API_KEY")}`,
    "Content-Type": "application/json",
  };
  if (init.profileKey) headers["Profile-Key"] = init.profileKey;
  const res = await fetch(`${API}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function profileFor(db: SupabaseClient, artistId: string, create: boolean): Promise<string | null> {
  const { data } = await db.from("social_profiles").select("profile_key").eq("artist_id", artistId).maybeSingle();
  if (data?.profile_key) return data.profile_key;
  if (!create) return null;
  const { data: p } = await db.from("artist_profiles").select("artist_name").eq("user_id", artistId).maybeSingle();
  // Titles must be unique in Ayrshare; the artist id guarantees that.
  const r = await ayr("/profiles", { method: "POST", body: JSON.stringify({ title: `${p?.artist_name ?? "TDZ artist"} (${artistId.slice(0, 8)})` }) });
  const key = r.body?.profileKey;
  if (!r.ok || !key) throw new Error(r.body?.message ?? "Couldn't create the social profile");
  await db.from("social_profiles").insert({ artist_id: artistId, profile_key: key });
  return key;
}

Deno.serve(async (req) => {
  const pre = handleCorsPreflightWithOrigin(req);
  if (pre) return pre;
  const headers = { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });

  if (!Deno.env.get("AYRSHARE_API_KEY")) return reply(503, { error: "Social posting isn't set up yet (AYRSHARE_API_KEY missing)." });
  const auth = await requireUser(req);
  if (!auth.user) return reply(401, { error: "Sign in again." });
  const body = await req.json().catch(() => ({}));
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Act for yourself, or for an artist you manage.
  let artistId = auth.user.id;
  if (body.artist_id && body.artist_id !== auth.user.id) {
    const { data: mgr } = await db.from("manager_artists").select("id").eq("manager_id", auth.user.id).eq("artist_id", body.artist_id).maybeSingle();
    if (!mgr) return reply(403, { error: "You don't manage this artist." });
    artistId = body.artist_id;
  }

  try {
    if (body.action === "link") {
      const key = await profileFor(db, artistId, true);
      const r = await ayr("/profiles/generateJWT", { method: "POST", body: JSON.stringify({ profileKey: key, expiresIn: 30 }) });
      if (!r.ok || !r.body?.url) return reply(502, { error: r.body?.message ?? "Couldn't open the linking page" });
      return reply(200, { url: r.body.url });
    }

    if (body.action === "refresh") {
      const key = await profileFor(db, artistId, false);
      if (!key) return reply(200, { platforms: [] });
      const r = await ayr("/user", { method: "GET", profileKey: key });
      const platforms: string[] = Array.isArray(r.body?.activeSocialAccounts) ? r.body.activeSocialAccounts : [];
      await db.from("social_profiles").update({ platforms, updated_at: new Date().toISOString() }).eq("artist_id", artistId);
      return reply(200, { platforms });
    }

    if (body.action === "post") {
      const key = await profileFor(db, artistId, false);
      if (!key) return reply(400, { error: "Connect your social accounts first." });
      const input = {
        body: String(body.body ?? "").slice(0, 70_000),
        platforms: (Array.isArray(body.platforms) ? body.platforms : []).map(String).filter((p: string) => (PLATFORMS as readonly string[]).includes(p)),
        mediaUrls: (Array.isArray(body.media_urls) ? body.media_urls : []).map(String).slice(0, 10),
        scheduledAt: body.scheduled_at ? String(body.scheduled_at) : null,
      };
      const problems = postProblems(input);
      if (problems.length) return reply(400, { error: problems.join(" ") });

      const { data: row } = await db.from("social_posts").insert({
        artist_id: artistId, created_by: auth.user.id, body: input.body, media_urls: input.mediaUrls,
        platforms: input.platforms, scheduled_at: input.scheduledAt, status: "pending",
      }).select("id").single();

      const r = await ayr("/post", {
        method: "POST", profileKey: key,
        body: JSON.stringify({
          post: input.body, platforms: input.platforms, mediaUrls: input.mediaUrls.length ? input.mediaUrls : undefined,
          scheduleDate: input.scheduledAt ? ayrshareDate(input.scheduledAt) : undefined,
        }),
      });
      const results = Array.isArray(r.body?.postIds) ? r.body.postIds : [];
      const errors = Array.isArray(r.body?.errors) ? r.body.errors : r.ok ? [] : [r.body];
      const status = r.ok || results.length ? overallStatus(!!input.scheduledAt, results, errors) : "failed";
      const error = errors.length ? errors.map((e: { platform?: string; message?: string }) => `${e.platform ?? ""} ${e.message ?? "error"}`.trim()).join("; ") : null;
      const { data: post } = await db.from("social_posts").update({
        status, provider_id: r.body?.id ?? null, results, error, updated_at: new Date().toISOString(),
      }).eq("id", row!.id).select("*").single();
      return reply(status === "failed" ? 502 : 200, { post, error: status === "failed" ? error ?? "Posting failed" : undefined });
    }

    if (body.action === "cancel") {
      const { data: post } = await db.from("social_posts").select("id, artist_id, provider_id, status").eq("id", String(body.post_id ?? "")).maybeSingle();
      if (!post || post.artist_id !== artistId) return reply(404, { error: "Post not found" });
      if (post.status !== "scheduled") return reply(409, { error: "Only scheduled posts can be canceled." });
      const key = await profileFor(db, artistId, false);
      const r = await ayr("/post", { method: "DELETE", profileKey: key!, body: JSON.stringify({ id: post.provider_id }) });
      if (!r.ok) return reply(502, { error: r.body?.message ?? "Couldn't cancel" });
      await db.from("social_posts").update({ status: "canceled", updated_at: new Date().toISOString() }).eq("id", post.id);
      return reply(200, { ok: true });
    }

    if (body.action === "sync") {
      const key = await profileFor(db, artistId, false);
      if (!key) return reply(200, { updated: 0 });
      const { data: due } = await db.from("social_posts").select("id, provider_id")
        .eq("artist_id", artistId).eq("status", "scheduled").lte("scheduled_at", new Date().toISOString()).limit(20);
      let updated = 0;
      for (const p of due ?? []) {
        const r = await ayr(`/post/${p.provider_id}`, { method: "GET", profileKey: key });
        if (!r.ok) continue;
        const results = Array.isArray(r.body?.postIds) ? r.body.postIds : [];
        if (!results.length && r.body?.status === "pending") continue;
        await db.from("social_posts").update({
          status: overallStatus(false, results, Array.isArray(r.body?.errors) ? r.body.errors : []), results,
          updated_at: new Date().toISOString(),
        }).eq("id", p.id);
        updated++;
      }
      return reply(200, { updated });
    }

    return reply(400, { error: "Unknown action" });
  } catch (e) {
    console.error("social", e);
    return reply(500, { error: e instanceof Error ? e.message : "Something went wrong" });
  }
});
