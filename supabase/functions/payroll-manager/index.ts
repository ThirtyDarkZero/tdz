// Payroll Manager agent — audits the whole payout pipeline every 30 minutes.
// Safe auto-fixes only (release stale claims). Never sends money itself;
// money movement stays in scheduled-artist-payouts. Everything else is flagged.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";
import { requireAdminOrCron } from "../_shared/auth.ts";
import { withStripeRetry } from "../_shared/stripeRetry.ts";
import { PAYOUT_THRESHOLD_USD } from "../_shared/payoutRules.ts";

type Finding = { severity: "critical" | "warning" | "info"; code: string; message: string; artist_id?: string; detail?: unknown };

serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get("origin"));
  const pre = handleCorsPreflightWithOrigin(req);
  if (pre) return pre;
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

  const gate = await requireAdminOrCron(req);
  if (!gate.ok) return json({ error: gate.error }, gate.status);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const findings: Finding[] = [];
  const fixes: unknown[] = [];
  const totals: Record<string, number> = {};

  try {
    // 1. Ledger vs unpaid earnings
    const { data: recon, error: reconErr } = await db.rpc("reconcile_ledger");
    if (reconErr) findings.push({ severity: "warning", code: "ledger_check_failed", message: reconErr.message });
    for (const r of recon ?? []) {
      if (Math.abs(Number(r.difference)) >= 0.01) {
        findings.push({ severity: "critical", code: "ledger_mismatch", artist_id: r.artist_id,
          message: `Ledger balance $${Number(r.ledger_balance).toFixed(2)} ≠ unpaid earnings $${Number(r.unpaid_earnings).toFixed(2)}`, detail: r });
      }
    }

    // 2. Earnings stuck in "processing" > 2h with no matching payout → release
    const cutoff = new Date(Date.now() - 2 * 3600_000).toISOString();
    const { data: stuck } = await db.from("artist_earnings").select("id, artist_id, total_earnings")
      .eq("payout_status", "processing").lt("updated_at", cutoff);
    if (stuck?.length) {
      const { data: recent } = await db.from("artist_payouts").select("earnings_ids").in("status", ["completed", "processing", "pending"]);
      const covered = new Set((recent ?? []).flatMap((p: any) => p.earnings_ids ?? []));
      const release = stuck.filter((e: any) => !covered.has(e.id)).map((e: any) => e.id);
      if (release.length) {
        await db.from("artist_earnings").update({ payout_status: "pending" }).in("id", release);
        fixes.push({ action: "released_stale_claims", count: release.length });
      }
    }

    // 3. Duplicate payment of the same earnings row
    const { data: done } = await db.from("artist_payouts").select("id, artist_id, amount, earnings_ids, square_payout_id, status, created_at")
      .eq("status", "completed");
    const seen = new Map<string, string>();
    for (const p of done ?? []) for (const eid of p.earnings_ids ?? []) {
      if (seen.has(eid)) findings.push({ severity: "critical", code: "double_paid", artist_id: p.artist_id,
        message: `Earnings row paid twice (payouts ${seen.get(eid)} and ${p.id})` });
      else seen.set(eid, p.id);
    }

    // 4. Failed payouts awaiting attention
    const { data: failed } = await db.from("artist_payouts").select("id, artist_id, amount, error_message").eq("status", "failed")
      .gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString());
    for (const f of failed ?? []) findings.push({ severity: "warning", code: "payout_failed", artist_id: f.artist_id,
      message: `$${Number(f.amount).toFixed(2)} payout failed: ${f.error_message ?? "unknown"}` });

    // 5. Stripe checks
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    let owed = 0;
    const { data: pending } = await db.from("artist_earnings").select("artist_id, total_earnings").eq("payout_status", "pending");
    const byArtist: Record<string, number> = {};
    for (const e of pending ?? []) { byArtist[e.artist_id] = (byArtist[e.artist_id] ?? 0) + Number(e.total_earnings || 0); owed += Number(e.total_earnings || 0); }
    totals.owed_usd = Math.round(owed * 100) / 100;
    totals.artists_owed = Object.keys(byArtist).length;

    if (!key) {
      findings.push({ severity: "critical", code: "stripe_key_missing", message: "Stripe key is not configured" });
    } else {
      const stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });
      const bal = await withStripeRetry(() => stripe.balance.retrieve(), { label: "balance" });
      const avail = (bal.available ?? []).filter((b) => b.currency === "usd").reduce((s, b) => s + b.amount, 0) / 100;
      const pend = (bal.pending ?? []).filter((b) => b.currency === "usd").reduce((s, b) => s + b.amount, 0) / 100;
      totals.stripe_available_usd = avail; totals.stripe_pending_usd = pend;
      const due = Object.values(byArtist).filter((v) => v >= PAYOUT_THRESHOLD_USD).reduce((s, v) => s + v, 0);
      totals.due_now_usd = Math.round(due * 100) / 100;
      if (due > avail) findings.push({ severity: due > avail + pend ? "critical" : "warning", code: "balance_shortfall",
        message: `$${due.toFixed(2)} due to artists but only $${avail.toFixed(2)} available in Stripe ($${pend.toFixed(2)} pending)` });

      // Verify recent completed transfers really exist and weren't reversed
      const since = Date.now() - 30 * 86400_000;
      for (const p of (done ?? []).filter((p: any) => new Date(p.created_at).getTime() > since && p.square_payout_id?.startsWith("tr_")).slice(0, 25)) {
        try {
          const t = await withStripeRetry(() => stripe.transfers.retrieve(p.square_payout_id), { label: "transfer" });
          if (t.amount !== Math.round(Number(p.amount) * 100)) findings.push({ severity: "critical", code: "transfer_amount_mismatch", artist_id: p.artist_id,
            message: `Transfer ${t.id} is $${(t.amount / 100).toFixed(2)} but record says $${Number(p.amount).toFixed(2)}` });
          if (t.reversed || t.amount_reversed > 0) findings.push({ severity: "critical", code: "transfer_reversed", artist_id: p.artist_id, message: `Transfer ${t.id} was reversed` });
        } catch (e) {
          findings.push({ severity: "critical", code: "transfer_missing", artist_id: p.artist_id, message: `Transfer ${p.square_payout_id} not found in Stripe: ${(e as Error).message}` });
        }
      }

      // Artists over threshold who can't be paid yet
      const due_ids = Object.entries(byArtist).filter(([, v]) => v >= PAYOUT_THRESHOLD_USD).map(([k]) => k);
      if (due_ids.length) {
        const { data: det } = await db.from("artist_payout_details").select("artist_id, stripe_connect_id, payout_enabled").in("artist_id", due_ids);
        const m = new Map((det ?? []).map((d: any) => [d.artist_id, d]));
        for (const id of due_ids) {
          const d: any = m.get(id);
          if (!d?.stripe_connect_id) findings.push({ severity: "warning", code: "artist_not_connected", artist_id: id, message: `Owed $${byArtist[id].toFixed(2)} but hasn't connected Stripe` });
          else if (!d.payout_enabled) findings.push({ severity: "warning", code: "artist_onboarding_incomplete", artist_id: id, message: `Owed $${byArtist[id].toFixed(2)} but Stripe onboarding isn't finished` });
        }
      }
    }

    const status = findings.some((f) => f.severity === "critical") ? "critical" : findings.some((f) => f.severity === "warning") ? "attention" : "healthy";
    const summary = status === "healthy"
      ? `All clear. $${totals.owed_usd ?? 0} owed across ${totals.artists_owed ?? 0} artists; ledger reconciled.`
      : `${findings.filter((f) => f.severity === "critical").length} critical, ${findings.filter((f) => f.severity === "warning").length} warnings. ${findings[0]?.message ?? ""}`;

    const { data: run } = await db.from("payroll_runs").insert({ status, findings, auto_fixes: fixes, totals, summary }).select().single();

    if (status === "critical") {
      const { data: ceos } = await db.from("user_roles").select("user_id").eq("role", "ceo");
      for (const c of ceos ?? []) await db.from("notifications").insert({ user_id: c.user_id, notification_type: "system", message: `Payroll Manager: ${summary}` });
    }
    return json({ ok: true, run });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("payroll-manager failed:", msg);
    await db.from("payroll_runs").insert({ status: "critical", findings: [...findings, { severity: "critical", code: "agent_error", message: msg }], auto_fixes: fixes, totals, summary: `Audit failed: ${msg}` });
    return json({ ok: false, error: msg }, 500);
  }
});
