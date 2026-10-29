// Auto-payout sweep — runs hourly via pg_cron (see migration *_schedule_artist_payouts.sql).
// Pays every artist who has:
//   • at least $50 in pending earnings, AND
//   • at least 50 lifetime paid streams, AND
//   • a Stripe Connect account that can receive transfers.
// Idempotency keys + row claiming guarantee at-most-once transfers.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";
import { withStripeRetry } from "../_shared/stripeRetry.ts";
import {
  MIN_PAID_STREAMS, PAYOUT_THRESHOLD_USD, claimPendingEarnings, lifetimePaidStreams,
  markPaid, payoutIdempotencyKey, releaseClaim, syncConnectStatus,
} from "../_shared/payoutRules.ts";
import { recordOutcome } from "../_shared/outcomes.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  const preflight = handleCorsPreflightWithOrigin(req);
  if (preflight) return preflight;
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Caller check: the cron job (shared secret) or a CEO. If CRON_SECRET isn't
    // configured yet, the sweep stays callable so payouts keep flowing.
    const cronSecret = Deno.env.get("CRON_SECRET");
    const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const isServiceRole = token !== "" && token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (cronSecret && !isServiceRole && req.headers.get("x-cron-secret") !== cronSecret) {
      const { data: { user } } = await supabase.auth.getUser(token);
      const { data: ceo } = user
        ? await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "ceo").maybeSingle()
        : { data: null };
      if (!ceo) return json({ error: "Unauthorized" }, 401);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    console.log("[auto-payout] sweep starting…");

    const { data: pendingEarnings, error: earningsErr } = await supabase
      .from("artist_earnings")
      .select("artist_id, total_earnings")
      .eq("payout_status", "pending");
    if (earningsErr) throw earningsErr;

    const pendingByArtist: Record<string, number> = {};
    for (const e of pendingEarnings ?? []) {
      pendingByArtist[e.artist_id] = (pendingByArtist[e.artist_id] ?? 0) + (Number(e.total_earnings) || 0);
    }

    // Transfers come out of the platform's AVAILABLE Stripe balance. Subscription
    // money sits as "pending" for a few days first, so check before sending.
    const balance: Stripe.Balance = await withStripeRetry<Stripe.Balance>(
      () => stripe.balance.retrieve(), { label: "balance.retrieve" }
    );
    let availableCents = (balance.available ?? [])
      .filter((b: Stripe.Balance.Available) => b.currency === "usd")
      .reduce((s: number, b: Stripe.Balance.Available) => s + b.amount, 0);

    const results: Array<Record<string, unknown>> = [];

    for (const [artistId, pendingTotal] of Object.entries(pendingByArtist)) {
      if (pendingTotal < PAYOUT_THRESHOLD_USD) {
        results.push({ artistId, status: "skipped", reason: "below_threshold", amount: pendingTotal });
        continue;
      }

      let claimedIds: string[] = [];
      try {
        const streams = await lifetimePaidStreams(supabase, artistId);
        if (streams < MIN_PAID_STREAMS) {
          results.push({ artistId, status: "skipped", reason: "below_min_streams", streams });
          continue;
        }

        const { data: payoutDetails } = await supabase
          .from("artist_payout_details")
          .select("stripe_connect_id")
          .eq("artist_id", artistId)
          .maybeSingle();
        if (!payoutDetails?.stripe_connect_id) {
          results.push({ artistId, status: "skipped", reason: "stripe_not_connected" });
          continue;
        }

        // Check Stripe directly instead of trusting the stored flag.
        const ready = await withStripeRetry(
          () => syncConnectStatus(supabase, stripe, artistId, payoutDetails.stripe_connect_id as string),
          { label: "accounts.retrieve" }
        );
        if (!ready) {
          results.push({ artistId, status: "skipped", reason: "stripe_onboarding_incomplete" });
          continue;
        }

        const claim = await claimPendingEarnings(supabase, artistId);
        claimedIds = claim.ids;
        const amountCents = Math.round(claim.total * 100);
        if (claim.total < PAYOUT_THRESHOLD_USD) {
          await releaseClaim(supabase, claimedIds);
          results.push({ artistId, status: "skipped", reason: "below_threshold", amount: claim.total });
          continue;
        }
        if (amountCents > availableCents) {
          await releaseClaim(supabase, claimedIds);
          results.push({ artistId, status: "skipped", reason: "platform_balance_low", amount: claim.total, availableUsd: availableCents / 100 });
          await recordOutcome({ ctq: "payout", ok: false, reason: "platform_balance_low", artistId, detail: { amount: claim.total } });
          continue;
        }

        const transfer = await withStripeRetry(
          async () => stripe.transfers.create(
            {
              amount: amountCents,
              currency: "usd",
              destination: payoutDetails.stripe_connect_id as string,
              description: "TDZ automatic artist payout",
              metadata: { artist_id: artistId, type: "auto_threshold_payout" },
            },
            { idempotencyKey: await payoutIdempotencyKey("auto_payout", artistId, amountCents, claimedIds) }
          ),
          { label: "transfers.create" }
        );
        availableCents -= amountCents;

        await supabase.from("artist_payouts").insert({
          artist_id: artistId,
          amount: claim.total,
          status: "completed",
          earnings_ids: claimedIds,
          square_payout_id: transfer.id,
          completed_at: new Date().toISOString(),
        });
        await markPaid(supabase, claimedIds);
        await supabase
          .from("artist_payout_details")
          .update({ last_payout_date: new Date().toISOString() })
          .eq("artist_id", artistId);
        // notifications has no title/metadata columns; the old insert always failed.
        const { error: notifyErr } = await supabase.from("notifications").insert({
          user_id: artistId,
          notification_type: "payout",
          message: `Payout sent: $${claim.total.toFixed(2)} is on its way to your connected bank account.`,
        });
        if (notifyErr) console.error(`[auto-payout] notify ${artistId} failed:`, notifyErr.message);

        results.push({ artistId, status: "processed", amount: claim.total, transferId: transfer.id });
        await recordOutcome({ ctq: "payout", ok: true, subjectId: transfer.id, artistId, detail: { amount: claim.total, mode: "auto" } });
        console.log(`[auto-payout] paid ${artistId}: $${claim.total} (${transfer.id})`);
      } catch (err: any) {
        await releaseClaim(supabase, claimedIds).catch(() => {});
        console.error(`[auto-payout] failed for ${artistId}:`, err?.message || err);
        results.push({ artistId, status: "error", error: err?.message || String(err) });
        await recordOutcome({ ctq: "payout", ok: false, reason: "transfer_error", artistId, detail: { error: String(err?.message || err).slice(0, 200) } });
      }
    }

    const processed = results.filter((r) => r.status === "processed").length;
    const errors = results.filter((r) => r.status === "error").length;
    const skippedReasons: Record<string, number> = {};
    for (const r of results) if (r.status === "skipped") skippedReasons[r.reason as string] = (skippedReasons[r.reason as string] ?? 0) + 1;

    await supabase.from("system_health_log").insert({
      check_type: "scheduled_payouts",
      status: errors > 0 || skippedReasons.platform_balance_low ? "degraded" : "healthy",
      details: {
        processed,
        errors,
        skipped: skippedReasons,
        total_paid: results.filter((r) => r.status === "processed").reduce((s, r) => s + (Number(r.amount) || 0), 0),
        platform_available_usd: availableCents / 100,
      },
    });

    return json({ success: true, processed, errors, skipped: skippedReasons, results });
  } catch (error) {
    console.error("[auto-payout] sweep error:", error);
    return json({ error: error instanceof Error ? error.message : "error" }, 500);
  }
});
