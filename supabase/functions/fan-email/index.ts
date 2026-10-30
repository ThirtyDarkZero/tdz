// Fan email campaigns via Resend.
//
// POST { action: "send", campaign_id }   — artist/manager: send now
// POST { action: "test", campaign_id }   — artist/manager: send a test to themselves
// POST { action: "dispatch" }            — cron: start due scheduled campaigns, continue in-progress ones
// POST ?unsub=<token>                    — one-click unsubscribe (List-Unsubscribe-Post)
import "../_shared/fetchTimeout.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";
import { chunk, htmlToText, personalize, wrapEmail } from "./lib.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.thirtydarkzero.net";
const FROM_ADDRESS = Deno.env.get("RESEND_FROM") ?? "fans@news.thirtydarkzero.net";
const BATCH = 100;
const PER_RUN = 2000;          // emails per invocation; the cron picks up the rest
const PAUSE_MS = 600;          // stay under Resend's default 2 requests/second

type Campaign = {
  id: string; artist_id: string; subject: string; preview_text: string | null; body_html: string;
  audience_tags: string[]; status: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function artistInfo(db: SupabaseClient, artistId: string) {
  const [{ data: p }, { data: u }] = await Promise.all([
    db.from("artist_profiles").select("artist_name").eq("user_id", artistId).maybeSingle(),
    db.auth.admin.getUserById(artistId),
  ]);
  return { name: p?.artist_name || "Your favorite artist", email: u?.user?.email ?? null };
}

function fromHeader(name: string) {
  return `${name.replace(/["<>]/g, "")} <${FROM_ADDRESS}>`;
}

async function resendBatch(emails: unknown[]): Promise<{ ids: (string | null)[]; error?: string }> {
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify(emails),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) return { ids: emails.map(() => null), error: out?.message || `Resend returned ${res.status}` };
  return { ids: (out?.data ?? []).map((d: { id?: string }) => d?.id ?? null) };
}

/** Freeze the audience into send rows (idempotent), then mark the campaign sending. */
async function start(db: SupabaseClient, c: Campaign) {
  let q = db.from("artist_contacts").select("id, email").eq("artist_id", c.artist_id)
    .or("subscribed.is.null,subscribed.eq.true").is("unsubscribed_at", null).is("bounced_at", null);
  if (c.audience_tags?.length) q = q.overlaps("tags", c.audience_tags);
  const { data: contacts } = await q.limit(50_000);
  const { data: suppressed } = await db.from("suppressed_emails").select("email");
  const blocked = new Set((suppressed ?? []).map((s) => s.email.toLowerCase()));
  const rows = (contacts ?? [])
    .filter((ct) => !blocked.has(ct.email.toLowerCase()))
    .map((ct) => ({ campaign_id: c.id, contact_id: ct.id, email: ct.email.toLowerCase() }));
  for (const part of chunk(rows, 1000)) {
    await db.from("email_campaign_sends").upsert(part, { onConflict: "campaign_id,email", ignoreDuplicates: true });
  }
  await db.from("email_campaigns").update({
    status: "sending", started_at: new Date().toISOString(), recipients: rows.length,
  }).eq("id", c.id);
}

/** Send queued messages for one campaign, up to PER_RUN. */
async function pump(db: SupabaseClient, c: Campaign): Promise<number> {
  const artist = await artistInfo(db, c.artist_id);
  let sent = 0;
  while (sent < PER_RUN) {
    const { data: queue } = await db.from("email_campaign_sends")
      .select("id, email, contact_id, artist_contacts(first_name, unsubscribe_token)")
      .eq("campaign_id", c.id).eq("status", "queued").limit(BATCH);
    if (!queue?.length) break;
    const emails = queue.map((s) => {
      const ct = (s as unknown as { artist_contacts: { first_name: string | null; unsubscribe_token: string } | null }).artist_contacts;
      const vars = { first_name: ct?.first_name ?? null, artist_name: artist.name };
      const unsub = `${SITE_URL}/fan-unsubscribe?t=${ct?.unsubscribe_token}`;
      const oneClick = `${Deno.env.get("SUPABASE_URL")}/functions/v1/fan-email?unsub=${ct?.unsubscribe_token}`;
      const html = wrapEmail(personalize(c.body_html, vars), { artistName: artist.name, previewText: c.preview_text, unsubscribeUrl: unsub });
      return {
        from: fromHeader(artist.name),
        to: [s.email],
        reply_to: artist.email ?? undefined,
        subject: personalize(c.subject, vars, false),
        html,
        text: htmlToText(html),
        headers: { "List-Unsubscribe": `<${oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        tags: [{ name: "campaign", value: c.id }],
      };
    });
    const { ids, error } = await resendBatch(emails);
    for (let i = 0; i < queue.length; i++) {
      await db.from("email_campaign_sends").update(
        ids[i] ? { status: "sent", provider_id: ids[i] } : { status: "failed", error: error ?? "No id returned" },
      ).eq("id", queue[i].id);
    }
    if (error && ids.every((x) => !x)) {
      // Provider rejected the whole batch (bad key, unverified domain...): stop and report.
      await db.from("email_campaigns").update({ status: "failed", error }).eq("id", c.id);
      return sent;
    }
    sent += queue.length;
    await sleep(PAUSE_MS);
  }
  const { count } = await db.from("email_campaign_sends").select("id", { count: "exact", head: true })
    .eq("campaign_id", c.id).eq("status", "queued");
  if (!count) await db.from("email_campaigns").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", c.id);
  return sent;
}

Deno.serve(async (req) => {
  const pre = handleCorsPreflightWithOrigin(req);
  if (pre) return pre;
  const headers = { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // One-click unsubscribe from mail apps (no login).
  const unsub = new URL(req.url).searchParams.get("unsub");
  if (unsub) {
    if (!/^[0-9a-f-]{36}$/i.test(unsub)) return reply(400, { error: "Bad link" });
    const { data: ct } = await db.from("artist_contacts").select("id, unsubscribed_at").eq("unsubscribe_token", unsub).maybeSingle();
    if (ct && !ct.unsubscribed_at) {
      await db.from("artist_contacts").update({ subscribed: false, unsubscribed_at: new Date().toISOString() }).eq("id", ct.id);
    }
    return reply(200, { ok: true });
  }

  if (!Deno.env.get("RESEND_API_KEY")) return reply(503, { error: "Fan email isn't set up yet (RESEND_API_KEY missing)." });
  const body = await req.json().catch(() => ({}));
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const isServer = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    (!!Deno.env.get("CRON_SECRET") && req.headers.get("x-cron-secret") === Deno.env.get("CRON_SECRET"));

  if (body?.action === "dispatch") {
    if (!isServer) return reply(401, { error: "Unauthorized" });
    const now = new Date().toISOString();
    const { data: due } = await db.from("email_campaigns").select("*").eq("status", "scheduled").lte("scheduled_at", now).limit(5);
    for (const c of (due ?? []) as Campaign[]) await start(db, c);
    const { data: active } = await db.from("email_campaigns").select("*").eq("status", "sending").limit(3);
    let total = 0;
    for (const c of (active ?? []) as Campaign[]) total += await pump(db, c);
    return reply(200, { started: due?.length ?? 0, sent: total });
  }

  // Artist actions
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return reply(401, { error: "Sign in again." });
  const { data: c } = await db.from("email_campaigns").select("*").eq("id", String(body?.campaign_id ?? "")).maybeSingle();
  if (!c) return reply(404, { error: "Campaign not found" });
  if (c.artist_id !== user.id) {
    const { data: mgr } = await db.from("manager_artists").select("id").eq("manager_id", user.id).eq("artist_id", c.artist_id).maybeSingle();
    if (!mgr) return reply(403, { error: "Not your campaign" });
  }

  if (body?.action === "test") {
    const artist = await artistInfo(db, c.artist_id);
    const vars = { first_name: "Test", artist_name: artist.name };
    const html = wrapEmail(personalize(c.body_html, vars), { artistName: artist.name, previewText: c.preview_text, unsubscribeUrl: `${SITE_URL}/fan-unsubscribe` });
    const { ids, error } = await resendBatch([{
      from: fromHeader(artist.name), to: [user.email], subject: `[Test] ${personalize(c.subject, vars, false)}`, html, text: htmlToText(html),
    }]);
    return ids[0] ? reply(200, { ok: true, to: user.email }) : reply(502, { error: error ?? "Test failed" });
  }

  if (body?.action === "send") {
    if (!["draft", "scheduled", "failed"].includes(c.status)) return reply(409, { error: `This campaign is already ${c.status}.` });
    // Daily cap per artist protects sender reputation while lists are new.
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { data: recent } = await db.from("email_campaigns").select("recipients").eq("artist_id", c.artist_id).gte("started_at", since);
    if ((recent ?? []).length >= 3) return reply(429, { error: "You've sent 3 campaigns in the last 24 hours. Try again tomorrow." });
    await start(db, c as Campaign);
    const sent = await pump(db, { ...(c as Campaign), status: "sending" });
    const { data: after } = await db.from("email_campaigns").select("status, recipients, error").eq("id", c.id).single();
    return reply(200, { sent, ...after });
  }

  return reply(400, { error: "Unknown action" });
});
