// Automatic lyrics: transcribe each uploaded track with line timing and save
// it as the track's synced lyrics, ready for the artist to correct.
//
// POST { track_id }   — the track's owner (right after upload) or the server
// POST { sweep: true } — cron: works through pending/failed jobs
import "../_shared/aiFallback.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";
import { audioFormat, cleanLyrics, extractJson, PROMPT, toBase64 } from "./lib.ts";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";
const MAX_INLINE_BYTES = 18 * 1024 * 1024; // keep the request under the model's inline limit
const MAX_ATTEMPTS = 3;

type Job = { track_id: string; user_id: string; proxy_path: string | null; attempts: number };

async function processJob(db: SupabaseClient, job: Job, force = false): Promise<string> {
  const { data: track } = await db.from("tracks").select("id, user_id, file_path, duration").eq("id", job.track_id).maybeSingle();
  if (!track) {
    await db.from("lyrics_jobs").delete().eq("track_id", job.track_id);
    return "gone";
  }

  // Never overwrite lyrics the artist has written or corrected.
  const { data: existing } = await db.from("track_lyrics_sync").select("lyrics_data")
    .eq("track_id", track.id).eq("version", 1).maybeSingle();
  const src = (existing?.lyrics_data as { source?: string } | null)?.source;
  if (existing && src !== "auto" && !force) {
    await db.from("lyrics_jobs").update({ status: "skipped", error: null, updated_at: new Date().toISOString() }).eq("track_id", track.id);
    return "skipped";
  }

  const path = job.proxy_path || track.file_path;
  const { data: blob, error: dlErr } = await db.storage.from("track-files").download(path);
  if (dlErr || !blob) throw new Error(`Couldn't read the audio file (${dlErr?.message ?? "missing"})`);
  if (blob.size > MAX_INLINE_BYTES) {
    throw new Error("Audio too large to transcribe directly; re-upload from the Studio to create a lyrics copy");
  }
  const audio = toBase64(new Uint8Array(await blob.arrayBuffer()));

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "input_audio", input_audio: { data: audio, format: audioFormat(path) } },
        ],
      }],
    }),
  });
  if (!res.ok) throw new Error(`Transcription service returned ${res.status}`);
  const reply = (await res.json())?.choices?.[0]?.message?.content ?? "";
  const lyrics = cleanLyrics(extractJson(String(reply)), track.duration);

  const now = new Date().toISOString();
  if (lyrics.instrumental) {
    await db.from("lyrics_jobs").update({ status: "instrumental", error: null, updated_at: now }).eq("track_id", track.id);
    return "instrumental";
  }
  const { error: saveErr } = await db.from("track_lyrics_sync").upsert({
    track_id: track.id, user_id: track.user_id, version: 1, is_published: true,
    lyrics_data: { lines: lyrics.lines, version: 1, source: "auto", language: lyrics.language, model: MODEL, created_at: now },
    updated_at: now,
  }, { onConflict: "track_id,version" });
  if (saveErr) throw new Error(`Couldn't save lyrics: ${saveErr.message}`);
  await db.from("lyrics_jobs").update({ status: "done", error: null, updated_at: now }).eq("track_id", track.id);
  // Remove the temporary low-bitrate copy.
  if (job.proxy_path) await db.storage.from("track-files").remove([job.proxy_path]);
  return "done";
}

async function run(db: SupabaseClient, job: Job, force = false): Promise<string> {
  // Claim the job so two runs don't transcribe the same track.
  const { data: claimed } = await db.from("lyrics_jobs")
    .update({ status: "processing", attempts: job.attempts + 1, updated_at: new Date().toISOString() })
    .eq("track_id", job.track_id).in("status", ["pending", "failed"]).select("track_id").maybeSingle();
  if (!claimed) return "busy";
  try {
    return await processJob(db, job, force);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("auto-lyrics failed", job.track_id, msg);
    await db.from("lyrics_jobs").update({
      status: job.attempts + 1 >= MAX_ATTEMPTS ? "gave_up" : "failed", error: msg.slice(0, 500),
      updated_at: new Date().toISOString(),
    }).eq("track_id", job.track_id);
    return "failed";
  }
}

Deno.serve(async (req) => {
  const pre = handleCorsPreflightWithOrigin(req);
  if (pre) return pre;
  const headers = { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const isServer = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    (!!Deno.env.get("CRON_SECRET") && req.headers.get("x-cron-secret") === Deno.env.get("CRON_SECRET"));
  const body = await req.json().catch(() => ({}));

  if (body?.sweep) {
    if (!isServer) return reply(401, { error: "Unauthorized" });
    const { data: jobs } = await db.from("lyrics_jobs").select("track_id, user_id, proxy_path, attempts")
      .in("status", ["pending", "failed"]).lt("attempts", MAX_ATTEMPTS)
      .order("updated_at", { ascending: true }).limit(5);
    const results: Record<string, string> = {};
    for (const j of (jobs ?? []) as Job[]) results[j.track_id] = await run(db, j);
    return reply(200, { processed: Object.keys(results).length, results });
  }

  const trackId = String(body?.track_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(trackId)) return reply(400, { error: "track_id is required" });
  const { data: userRes } = isServer ? { data: { user: null } } : await db.auth.getUser(token);
  if (!isServer && !userRes.user) return reply(401, { error: "Sign in again." });

  const { data: job } = await db.from("lyrics_jobs").select("track_id, user_id, proxy_path, attempts, status")
    .eq("track_id", trackId).maybeSingle();
  if (!job) return reply(404, { error: "No lyrics job for this track" });
  if (!isServer && job.user_id !== userRes.user!.id) {
    // Managers acting for an artist may also start it.
    const { data: mgr } = await db.from("manager_artists").select("id")
      .eq("manager_id", userRes.user!.id).eq("artist_id", job.user_id).maybeSingle();
    if (!mgr) return reply(403, { error: "Not your track" });
  }
  // A retry from the editor resets attempts.
  if (body?.retry && ["failed", "gave_up", "skipped", "instrumental"].includes(job.status)) {
    await db.from("lyrics_jobs").update({ status: "pending", attempts: 0 }).eq("track_id", trackId);
    job.attempts = 0;
  }
  const status = await run(db, job as Job, body?.force === true);
  return reply(200, { status });
});
