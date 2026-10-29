// Financial reconciliation agent — runs every 6h via pg_cron.
// Pulls last 24h of Stripe charges/transfers and matches them to internal records.
// Writes unmatched_transactions for CEO review.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { requireAdminOrCron } from "../_shared/auth.ts";
import { recordOutcome } from "../_shared/outcomes.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Restrict to cron scheduler or admin users
  const gate = await requireAdminOrCron(req);
  if (!gate.ok) {
    return new Response(JSON.stringify({ error: gate.error ?? "Unauthorized" }), {
      status: gate.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const since = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  const transferSince = Math.floor((Date.now() - 48 * 60 * 60 * 1000) / 1000);
  const summary = {
    charges: 0, matched: 0, unmatched: 0,
    transfers: 0, transfers_matched: 0, transfers_unmatched: 0,
    ledger_artists_off: 0, ledger_difference_usd: 0,
    errors: 0,
  };

  const flag = (row: Record<string, unknown>) =>
    supabase.from("unmatched_transactions").upsert({ status: "pending", ...row }, { onConflict: "stripe_object_id" });

  try {
    // 1. Every charge (all pages) must match a subscription, download or merch record.
    for await (const ch of stripe.charges.list({ created: { gte: since }, limit: 100 })) {
      summary.charges++;
      try {
        const meta = ch.metadata || {};
        const type = meta.type;
        let matched = false;

        if (type === "subscription" && meta.user_id) {
          const { data } = await supabase.from("user_subscriptions")
            .select("id").eq("user_id", meta.user_id).maybeSingle();
          matched = !!data;
        } else if (type === "download" && meta.track_id && meta.buyer_id) {
          const { data } = await supabase.from("download_purchases")
            .select("id").eq("track_id", meta.track_id).eq("buyer_id", meta.buyer_id).limit(1);
          matched = (data?.length || 0) > 0;
        } else if (type === "merch" && meta.buyer_id) {
          const { data } = await supabase.from("merch_purchases")
            .select("id").eq("buyer_id", meta.buyer_id).eq("stripe_payment_intent_id", ch.payment_intent as string).limit(1);
          matched = (data?.length || 0) > 0;
        } else if (type === "tip" && meta.artist_id) {
          const { data } = await supabase.from("artist_tips")
            .select("id").eq("square_payment_id", ch.payment_intent as string).limit(1);
          matched = (data?.length || 0) > 0;
        }

        await recordOutcome({ ctq: "stripe_match", ok: matched, reason: matched ? undefined : `charge_unmatched_${type ?? "unknown"}`, subjectId: ch.id });
        if (matched) {
          summary.matched++;
        } else {
          summary.unmatched++;
          await flag({
            stripe_object_id: ch.id,
            stripe_object_type: "charge",
            amount: ch.amount / 100,
            currency: ch.currency,
            customer_email: ch.billing_details?.email || null,
            metadata: meta,
            suggested_match_table: type === "subscription" ? "user_subscriptions"
                                  : type === "download" ? "download_purchases"
                                  : type === "merch" ? "merch_purchases"
                                  : type === "tip" ? "artist_tips" : null,
          });
        }
      } catch (e) {
        summary.errors++;
        console.error("reconcile charge", ch.id, e);
      }
    }

    // 2. Every transfer to an artist must match a completed payout of the same amount.
    for await (const tr of stripe.transfers.list({ created: { gte: transferSince }, limit: 100 })) {
      summary.transfers++;
      try {
        const { data: payout } = await supabase.from("artist_payouts")
          .select("id, amount, status").eq("square_payout_id", tr.id).maybeSingle();
        const amountOk = payout && Math.round(Number(payout.amount) * 100) === tr.amount;
        const statusOk = payout && (tr.reversed ? payout.status === "reversed" : payout.status === "completed");
        const ok = !!(amountOk && statusOk);
        await recordOutcome({
          ctq: "stripe_match", ok,
          reason: ok ? undefined : !payout ? "transfer_no_payout_record" : !amountOk ? "transfer_amount_mismatch" : "transfer_status_mismatch",
          subjectId: tr.id, artistId: (tr.metadata?.artist_id as string) || null,
        });
        if (ok) {
          summary.transfers_matched++;
        } else {
          summary.transfers_unmatched++;
          await flag({
            stripe_object_id: tr.id,
            stripe_object_type: "transfer",
            amount: tr.amount / 100,
            currency: tr.currency,
            metadata: { ...tr.metadata, payout_status: payout?.status ?? null, payout_amount: payout?.amount ?? null },
            suggested_match_table: "artist_payouts",
            suggested_match_id: payout?.id ?? null,
          });
        }
      } catch (e) {
        summary.errors++;
        console.error("reconcile transfer", tr.id, e);
      }
    }

    // 3. Ledger: what each artist is owed must equal their unpaid earnings.
    const { data: offBalance, error: ledgerErr } = await supabase.rpc("reconcile_ledger");
    if (ledgerErr) {
      summary.errors++;
      console.error("reconcile_ledger failed:", ledgerErr.message);
    } else {
      const off = (offBalance ?? []) as Array<{ artist_id: string; difference: number }>;
      summary.ledger_artists_off = off.length;
      summary.ledger_difference_usd = Math.round(off.reduce((s, r) => s + Number(r.difference), 0) * 100) / 100;
      const { count: artistCount } = await supabase.from("artist_payout_details").select("artist_id", { count: "exact", head: true });
      const checked = Math.max(artistCount ?? 0, off.length);
      for (const r of off) {
        await recordOutcome({ ctq: "ledger_match", ok: false, reason: Number(r.difference) > 0 ? "artist_owed_more_than_unpaid" : "unpaid_exceeds_ledger", artistId: r.artist_id, detail: { difference: r.difference } });
      }
      for (let i = 0; i < checked - off.length; i++) {
        await recordOutcome({ ctq: "ledger_match", ok: true });
      }
    }

    await supabase.from("system_health_log").insert({
      check_type: "financial_reconciliation",
      status: summary.errors > 0 || summary.unmatched > 0 || summary.transfers_unmatched > 0 || summary.ledger_artists_off > 0
        ? "degraded" : "healthy",
      details: summary,
    });

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("reconciliation error:", err);
    await supabase.from("system_health_log").insert({
      check_type: "financial_reconciliation",
      status: "error",
      error_message: err instanceof Error ? err.message : String(err),
    });
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
