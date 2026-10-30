// Create (or re-send) a team or roster invite and email it.
// POST { email, kind?: "collaborator" | "roster", permissions?: string[], message? }
// → { invite_id, email_status: "queued" | "failed", error? }
import "../_shared/fetchTimeout.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { inviteUrl, parseInvite } from "./lib.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.thirtydarkzero.net";
const DAY = 86_400_000;

Deno.serve(async (req) => {
  const pre = handleCorsPreflightWithOrigin(req);
  if (pre) return pre;
  const cors = { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: cors });

  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });
  const auth = await requireUser(req);
  if (!auth.user) return reply(401, { error: "Your session expired. Sign in again." });

  const parsed = parseInvite(await req.json().catch(() => ({})), auth.user.email);
  if ("error" in parsed) return reply(400, { error: parsed.error });
  const inv = parsed.value;

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Limit abuse: at most 50 invites a day per sender.
  const { count } = await db.from("collaborator_invites").select("id", { count: "exact", head: true })
    .eq("artist_id", auth.user.id).gte("last_sent_at", new Date(Date.now() - DAY).toISOString());
  if ((count ?? 0) >= 50) return reply(429, { error: "Daily invite limit reached. Try again tomorrow." });

  const { data: profile } = await db.from("artist_profiles").select("artist_name").eq("user_id", auth.user.id).maybeSingle();
  const inviterName = profile?.artist_name || auth.user.email?.split("@")[0] || "A TDZ artist";
  const now = new Date();
  const fields = {
    permissions: inv.permissions, message: inv.message, inviter_name: inviterName,
    expires_at: new Date(now.getTime() + 7 * DAY).toISOString(), last_sent_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  // Re-sending refreshes the open invite instead of creating a duplicate.
  const { data: open } = await db.from("collaborator_invites").select("id, token")
    .eq("artist_id", auth.user.id).eq("kind", inv.kind).eq("status", "pending")
    .ilike("invited_email", inv.email).maybeSingle();

  const saved = open
    ? await db.from("collaborator_invites").update(fields).eq("id", open.id).select("id, token").single()
    : await db.from("collaborator_invites")
      .insert({ ...fields, artist_id: auth.user.id, invited_email: inv.email, kind: inv.kind, status: "pending" })
      .select("id, token").single();
  if (saved.error || !saved.data) {
    console.error("invite save failed", saved.error);
    return reply(500, { error: "Couldn't save the invite. Try again." });
  }
  const { id, token } = saved.data;

  // Queue the email through the shared sender (suppression list, unsubscribe, retries).
  let emailError: string | null = null;
  try {
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateName: "team-invite",
        recipientEmail: inv.email,
        idempotencyKey: `team-invite-${id}-${now.getTime()}`,
        templateData: { inviterName, kind: inv.kind, message: inv.message, inviteUrl: inviteUrl(SITE_URL, token), expiresInDays: 7 },
      }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) emailError = out?.error || `Email service returned ${res.status}`;
    else if (out?.reason === "email_suppressed") emailError = "This address has unsubscribed from TDZ emails.";
  } catch (e) {
    emailError = e instanceof Error ? e.message : String(e);
  }

  await db.from("collaborator_invites")
    .update({ email_status: emailError ? "failed" : "queued", email_error: emailError })
    .eq("id", id);

  return reply(200, {
    invite_id: id,
    invite_url: inviteUrl(SITE_URL, token),
    email_status: emailError ? "failed" : "queued",
    error: emailError ?? undefined,
  });
});
