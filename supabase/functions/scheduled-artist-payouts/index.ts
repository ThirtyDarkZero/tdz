// Auto-payout sweep — runs hourly via pg_cron.
// Pays every artist whose pending earnings have crossed the $50 threshold and
// whose Stripe Connect account is onboarded + transfer-enabled.
// Idempotency keys guarantee at-most-once transfers even if the sweep overlaps.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";
import { makeIdempotencyKey, withStripeRetry } from "../_shared/stripeRetry.ts";

const PAYOUT_THRESHOLD = 50;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  const preflight = handleCorsPreflightWithOrigin(req);
  if (preflight) return preflight;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    console.log("[auto-payout] sweep starting…");

    const { data: pendingEarnings, error: earningsErr } = await supabase
      .from("artist_earnings")
      .select("id, artist_id, total_earnings")
      .eq("payout_status", "pending");
    if (earningsErr) throw earningsErr;

    const byArtist: Record<string, { total: number; ids: string[] }> = {};
    for (const e of pendingEarnings ?? []) {
      if (!byArtist[e.artist_id]) byArtist[e.artist_id] = { total: 0, ids: [] };
      byArtist[e.artist_id].total += Number(e.total_earnings) || 0;
      byArtist[e.artist_id].ids.push(e.id);
    }

    const results: Array<Record<string, unknown>> = [];

    for (const [artistId, { total, ids }] of Object.entries(byArtist)) {
      const amountCents = Math.round(total * 100);

      if (total < PAYOUT_THRESHOLD) {
        results.push({ artistId, status: "skipped", reason: "below_threshold", amount: total });
        continue;
      }

      try {
        const { data: payoutDetails } = await supabase
          .from("artist_payout_details")
          .select("stripe_connect_id, payout_enabled")
          .eq("artist_id", artistId)
          .maybeSingle();

        if (!payoutDetails?.stripe_connect_id || !payoutDetails.payout_enabled) {
          results.push({ artistId, status: "skipped", reason: "connect_not_ready" });
          continue;
        }

        // Confirm the destination can actually receive transfers before attempting.
        const acct = await withStripeRetry(
          () => stripe.accounts.retrieve(payoutDetails.stripe_connect_id as string),
          { label: "accounts.retrieve" }
        );
        if (!(acct as any)?.payouts_enabled || (acct as any)?.capabilities?.transfers !== "active") {
          await supabase
            .from("artist_payout_details")
            .update({ payout_enabled: false, updated_at: new Date().toISOString() })
            .eq("artist_id", artistId);
          results.push({ artistId, status: "skipped", reason: "transfers_not_active" });
          continue;
        }

        // Deterministic key: same artist + same earnings set + same amount can only
        // ever produce one Stripe transfer, no matter how often the sweep runs.
        const idemKey = makeIdempotencyKey(
          "auto_payout",
          artistId,
          amountCents,
          ids.slice().sort().join(",")
        );

        const transfer = await withStripeRetry(
          () =>
            stripe.transfers.create(
              {
                amount: amountCents,
                currency: "usd",
                destination: payoutDetails.stripe_connect_id as string,
                description: "TDZ automatic artist payout ($50 threshold)",
                metadata: { artist_id: artistId, type: "auto_threshold_payout" },
              },
              { idempotencyKey: idemKey }
            ),
          { label: "transfers.create" }
        );

        await supabase.from("artist_payouts").insert({
          artist_id: artistId,
          amount: total,
          status: "completed",
          earnings_ids: ids,
          square_payout_id: transfer.id,
          completed_at: new Date().toISOString(),
        });

        await supabase
          .from("artist_earnings")
          .update({ payout_status: "paid", payout_date: new Date().toISOString().split("T")[0] })
          .in("id", ids)
          .eq("payout_status", "pending");

        await supabase
          .from("artist_payout_details")
          .update({ last_payout_date: new Date().toISOString() })
          .eq("artist_id", artistId);

        await supabase.from("notifications").insert({
          user_id: artistId,
          notification_type: "payout",
          title: "Payout sent",
          message: `$${total.toFixed(2)} is on its way to your connected bank account.`,
          metadata: { transfer_id: transfer.id, amount: total },
        });

        results.push({ artistId, status: "processed", amount: total, transferId: transfer.id });
        console.log(`[auto-payout] paid ${artistId}: $${total} (${transfer.id})`);
      } catch (err: any) {
        console.error(`[auto-payout] failed for ${artistId}:`, err?.message || err);
        results.push({ artistId, status: "error", error: err?.message || String(err) });
      }
    }

    const processed = results.filter((r) => r.status === "processed").length;
    const errors = results.filter((r) => r.status === "error").length;

    await supabase.from("system_health_log").insert({
      check_type: "scheduled_payouts",
      status: errors > 0 ? "degraded" : "healthy",
      details: {
        processed,
        skipped: results.filter((r) => r.status === "skipped").length,
        errors,
        total_paid: results
          .filter((r) => r.status === "processed")
          .reduce((s, r) => s + (Number(r.amount) || 0), 0),
      },
    });

    return new Response(JSON.stringify({ success: true, processed, errors, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[auto-payout] sweep error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
