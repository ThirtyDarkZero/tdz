// Manual artist payout — artist self-withdrawal or CEO dashboard.
// Artists: need $50+ pending AND 50+ lifetime paid streams (same rule as the auto sweep).
// CEO: may pay any artist's full pending balance early, bypassing the threshold.
// Always pays exactly the pending earnings rows and marks them paid, so the
// auto sweep can never pay the same money twice.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { withStripeRetry } from "../_shared/stripeRetry.ts";
import {
import { recordOutcome } from "../_shared/outcomes.ts";
  MIN_PAID_STREAMS, PAYOUT_THRESHOLD_USD, claimPendingEarnings, lifetimePaidStreams,
  markPaid, payoutIdempotencyKey, releaseClaim, syncConnectStatus,
} from "../_shared/payoutRules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class UserError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let claimedIds: string[] = [];
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new UserError("Unauthorized", 401);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new UserError("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const artistId: string = body?.artistId || user.id;
    if (!UUID_REGEX.test(artistId)) throw new UserError("Invalid artistId");

    const { data: roleData } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "ceo").maybeSingle();
    const isCeo = !!roleData;
    if (artistId !== user.id && !isCeo) {
      throw new UserError("Forbidden — CEO access required for payouts to other artists", 403);
    }

    const { data: payoutDetails } = await supabase
      .from("artist_payout_details")
      .select("stripe_connect_id")
      .eq("artist_id", artistId)
      .maybeSingle();
    if (!payoutDetails?.stripe_connect_id) {
      throw new UserError("Stripe Connect not set up. Connect your account first.");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const ready = await withStripeRetry(
      () => syncConnectStatus(supabase, stripe, artistId, payoutDetails.stripe_connect_id as string),
      { label: "accounts.retrieve" }
    );
    if (!ready) throw new UserError("Stripe Connect onboarding incomplete. Complete it before withdrawing.");

    if (!isCeo) {
      const streams = await lifetimePaidStreams(supabase, artistId);
      if (streams < MIN_PAID_STREAMS) {
        throw new UserError(`You need ${MIN_PAID_STREAMS} paid streams before your first payout. Current: ${streams}.`);
      }
    }

    const claim = await claimPendingEarnings(supabase, artistId);
    claimedIds = claim.ids;
    if (!claimedIds.length || claim.total <= 0) throw new UserError("No pending earnings");

    if (!isCeo && claim.total < PAYOUT_THRESHOLD_USD) {
      throw new UserError(`Minimum payout is $${PAYOUT_THRESHOLD_USD}. Current: $${claim.total.toFixed(2)}.`);
    }
    // CEO dashboard sends the amount it displayed; refuse if the balance moved.
    if (typeof body?.amount === "number" && Math.abs(body.amount - claim.total) >= 0.01) {
      throw new UserError(`Pending balance is $${claim.total.toFixed(2)}. Payouts send the full pending balance — refresh and try again.`);
    }

    const amountCents = Math.round(claim.total * 100);
    const transfer = await withStripeRetry(
      async () => stripe.transfers.create({
        amount: amountCents,
        currency: "usd",
        destination: payoutDetails.stripe_connect_id as string,
        description: "TDZ artist payout",
        metadata: { artist_id: artistId, type: isCeo && artistId !== user.id ? "ceo_payout" : "manual_payout" },
      }, { idempotencyKey: await payoutIdempotencyKey("transfer", artistId, amountCents, claimedIds) }),
      { label: "transfers.create" }
    );

    await supabase.from("artist_payouts").insert({
      artist_id: artistId, amount: claim.total, status: "completed",
      square_payout_id: transfer.id, earnings_ids: claimedIds,
      processed_by: user.id, completed_at: new Date().toISOString(),
    });
    await markPaid(supabase, claimedIds);
    await supabase.from("artist_payout_details")
      .update({ last_payout_date: new Date().toISOString() })
      .eq("artist_id", artistId);

    await recordOutcome({ ctq: "payout", ok: true, subjectId: transfer.id, artistId, detail: { amount: claim.total, mode: "manual" } });
    return json({ success: true, transferId: transfer.id, amount: claim.total });
  } catch (error) {
    await releaseClaim(supabase, claimedIds).catch(() => {});
    const msg = error instanceof Error ? error.message : String(error);
    console.error("process-artist-payout error:", msg);
    if (error instanceof UserError) return json({ error: msg }, error.status);
    // Rule refusals above aren't defects; system failures below are.
    await recordOutcome({ ctq: "payout", ok: false, reason: /insufficient/i.test(msg) ? "platform_balance_low" : "transfer_error", detail: { mode: "manual" } });
    if (/insufficient/i.test(msg)) {
      return json({ error: "Payout is temporarily delayed while platform funds settle. It will be retried automatically." }, 503);
    }
    return json({ error: "Payout failed. Please try again or contact support." }, 500);
  }
});
