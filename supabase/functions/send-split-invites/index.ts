// Email everyone on a track's splits who hasn't confirmed yet.
// POST { track_id } → { sent, skipped_no_email, failed }
import "../_shared/fetchTimeout.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.thirtydarkzero.net";

Deno.serve(async (req) => {
  const pre = handleCorsPreflightWithOrigin(req);
  if (pre) return pre;
  const headers = { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });

  const auth = await requireUser(req);
  if (!auth.user) return reply(401, { error: "Sign in again." });
  const { track_id } = await req.json().catch(() => ({}));
  if (!/^[0-9a-f-]{36}$/i.test(String(track_id ?? ""))) return reply(400, { error: "track_id is required" });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: track } = await db.from("tracks").select("id, title, artist_name, user_id").eq("id", track_id).maybeSingle();
  if (!track) return reply(404, { error: "Track not found" });
  if (track.user_id !== auth.user.id) {
    const { data: mgr } = await db.from("manager_artists").select("id").eq("manager_id", auth.user.id).eq("artist_id", track.user_id).maybeSingle();
    if (!mgr) return reply(403, { error: "Not your track" });
  }

  // Shares must add to 100% before anyone is asked to confirm.
  const { data: rows } = await db.from("track_rights_splits")
    .select("id, rights_type, holder_name, holder_email, split_percentage, status, token").eq("track_id", track_id);
  const totals: Record<string, number> = {};
  for (const r of rows ?? []) totals[r.rights_type] = (totals[r.rights_type] ?? 0) + Number(r.split_percentage);
  const off = Object.entries(totals).filter(([, t]) => Math.abs(t - 100) > 0.01);
  if (off.length) {
    return reply(400, { error: `Shares must add up to 100% first (${off.map(([k, t]) => `${k}: ${t}%`).join(", ")}).` });
  }

  let sent = 0, noEmail = 0, failed = 0;
  for (const r of rows ?? []) {
    if (r.status === "confirmed") continue;
    // The artist's own share is confirmed by sending.
    const isOwner = r.holder_email
      ? r.holder_email.toLowerCase() === auth.user.email?.toLowerCase()
      : r.holder_name.trim().toLowerCase() === String(track.artist_name ?? "").trim().toLowerCase();
    if (isOwner) {
      await db.from("track_rights_splits").update({ status: "confirmed", is_verified: true, responded_at: new Date().toISOString() }).eq("id", r.id);
      continue;
    }
    if (!r.holder_email) { noEmail++; continue; }
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        templateName: "split-confirm",
        recipientEmail: r.holder_email,
        idempotencyKey: `split-${r.id}-${r.token}`,
        templateData: {
          holderName: r.holder_name, artistName: track.artist_name, trackTitle: track.title,
          rightsType: r.rights_type, share: Number(r.split_percentage), confirmUrl: `${SITE_URL}/split/${r.token}`,
        },
      }),
    }).catch(() => null);
    if (res?.ok) {
      sent++;
      await db.from("track_rights_splits").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", r.id);
    } else failed++;
  }
  return reply(200, { sent, skipped_no_email: noEmail, failed });
});
