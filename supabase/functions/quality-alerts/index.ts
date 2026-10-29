// Hourly quality alerts (Six Sigma "Control").
// Compares real outcomes with targets (current_quality_alerts), then notifies
// CEO/admin users in-app and, if ALERT_WEBHOOK_URL is set (e.g. a Slack
// incoming webhook), posts there too. Each problem is re-sent at most every
// 6 hours while it persists, and marked resolved when it clears.
import "../_shared/fetchTimeout.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { requireAdminOrCron } from "../_shared/auth.ts";

const RESEND_HOURS = 6;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const gate = await requireAdminOrCron(req);
  if (!gate.ok) return json({ error: gate.error ?? "Unauthorized" }, gate.status);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    const { data: current, error } = await supabase.rpc("current_quality_alerts");
    if (error) throw error;
    const active = (current ?? []) as Array<{ alert_key: string; severity: string; message: string }>;
    const now = new Date();

    type AlertRow = { alert_key: string; last_sent: string | null };
    const { data: known } = await supabase.from("quality_alerts").select("alert_key, last_sent").is("resolved_at", null);
    const open = new Map<string, AlertRow>(((known ?? []) as AlertRow[]).map((a) => [a.alert_key, a]));

    const toSend: typeof active = [];
    for (const a of active) {
      const prev = open.get(a.alert_key);
      const due = !prev?.last_sent ||
        now.getTime() - new Date(prev.last_sent).getTime() >= RESEND_HOURS * 3600_000;
      if (due) toSend.push(a);
      await supabase.from("quality_alerts").upsert({
        alert_key: a.alert_key, severity: a.severity, message: a.message,
        last_seen: now.toISOString(), resolved_at: null,
        ...(prev ? {} : { first_seen: now.toISOString() }),
        ...(due ? { last_sent: now.toISOString() } : {}),
      }, { onConflict: "alert_key" });
      open.delete(a.alert_key);
    }

    // Anything open that is no longer active has cleared.
    const resolved = [...open.keys()];
    if (resolved.length) {
      await supabase.from("quality_alerts").update({ resolved_at: now.toISOString() }).in("alert_key", resolved);
    }

    if (toSend.length) {
      const { data: admins } = await supabase.from("user_roles").select("user_id").in("role", ["ceo", "admin"]);
      const recipients = [...new Set((admins ?? []).map((r: { user_id: string }) => r.user_id))];
      const rows = recipients.flatMap((user_id) =>
        toSend.map((a) => ({
          user_id,
          notification_type: "system_alert",
          message: `${a.severity === "critical" ? "🔴" : "🟡"} ${a.message}`.slice(0, 500),
        }))
      );
      if (rows.length) {
        const { error: nErr } = await supabase.from("notifications").insert(rows);
        if (nErr) console.error("[quality-alerts] notification insert failed:", nErr.message);
      }

      const hook = Deno.env.get("ALERT_WEBHOOK_URL");
      if (hook) {
        const text = ["*TDZ quality alerts*", ...toSend.map((a) => `• [${a.severity}] ${a.message}`)].join("\n");
        const res = await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }).catch((e) => {
          console.error("[quality-alerts] webhook failed:", e?.message ?? e);
          return null;
        });
        if (res && !res.ok) console.error("[quality-alerts] webhook status", res.status);
      }
    }

    await supabase.from("system_health_log").insert({
      check_type: "quality_alerts",
      status: active.some((a) => a.severity === "critical") ? "degraded" : active.length ? "warning" : "healthy",
      details: { active: active.length, sent: toSend.length, resolved: resolved.length, keys: active.map((a) => a.alert_key) },
    });

    return json({ success: true, active: active.length, sent: toSend.length, resolved: resolved.length });
  } catch (e) {
    console.error("[quality-alerts] failed:", e);
    return json({ error: "Alert check failed" }, 500);
  }
});
