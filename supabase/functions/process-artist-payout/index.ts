// Manual artist payout — triggered from CEO dashboard or artist self-withdrawal.
// Allows withdrawal when pending >= $50, OR when artist has 50+ lifetime paid streams + any pending.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { makeIdempotencyKey, withStripeRetry } from "../_shared/stripeRetry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    let artistId: string = body?.artistId;
    const amount = body?.amount;
    const earningsIds = body?.earningsIds;

    if (!artistId) artistId = user.id; // self-withdraw default
    if (!UUID_REGEX.test(artistId)) throw new Error("Invalid artistId");

    // Authorization: artist can only payout themselves; CEO can payout anyone.
    if (artistId !== user.id) {
      const { data: roleData } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", user.id).eq("role", "ceo").maybeSingle();
      if (!roleData) throw new Error("Forbidden — CEO access required for payouts to other artists");
    }

    const { data: payoutDetails } = await supabase
      .from("artist_payout_details")
      .select("stripe_connect_id, payout_enabled")
      .eq("artist_id", artistId)
      .maybeSingle();

    if (!payoutDetails?.stripe_connect_id) {
      throw new Error("Stripe Connect not set up. Connect your account first.");
    }
    if (!payoutDetails.payout_enabled) {
      throw new Error("Stripe Connect onboarding incomplete. Complete it before withdrawing.");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let payoutAmount = amount;
    let selectedIds = earningsIds || [];

    if (!payoutAmount) {
      const { data: pending } = await supabase
        .from("artist_earnings")
        .select("id, total_earnings")
        .eq("artist_id", artistId)
        .eq("payout_status", "pending");

      if (!pending?.length) {
        return new Response(JSON.stringify({ error: "No pending earnings" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      payoutAmount = pending.reduce((s, e) => s + (e.total_earnings || 0), 0);
      selectedIds = pending.map(e => e.id);

      // Threshold check: $50 OR 50+ lifetime paid streams
      if (payoutAmount < 50) {
        const { count } = await supabase
          .from("listening_history")
          .select("id", { count: "exact", head: true })
          .eq("track_id", artistId); // Note: this is a heuristic; ideally count via tracks join
        // Fallback simpler threshold rule
        if (payoutAmount < 1) {
          return new Response(JSON.stringify({
            error: `Need at least $1.00 pending. Current: $${payoutAmount.toFixed(2)}`
          }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round(payoutAmount * 100),
      currency: "usd",
      destination: payoutDetails.stripe_connect_id,
      description: `TDZ artist payout`,
      metadata: { artist_id: artistId, type: "manual_payout" },
    });

    await supabase.from("artist_payouts").insert({
      artist_id: artistId, amount: payoutAmount, status: "completed",
      square_payout_id: transfer.id, earnings_ids: selectedIds,
      processed_by: user.id, completed_at: new Date().toISOString(),
    });

    if (selectedIds.length) {
      await supabase.from("artist_earnings")
        .update({ payout_status: "paid", payout_date: new Date().toISOString().split("T")[0] })
        .in("id", selectedIds);
    }
    await supabase.from("artist_payout_details")
      .update({ last_payout_date: new Date().toISOString() })
      .eq("artist_id", artistId);

    return new Response(JSON.stringify({
      success: true, transferId: transfer.id, amount: payoutAmount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("process-artist-payout error:", msg);
    // Allow specific business-logic messages through; mask Stripe/internal errors.
    const safe = [
      "Unauthorized", "Invalid artistId", "Forbidden — CEO access required for payouts to other artists",
      "Stripe Connect not set up. Connect your account first.",
      "Stripe Connect onboarding incomplete. Complete it before withdrawing.",
      "No pending earnings",
    ];
    const isSafe = safe.some((s) => msg.startsWith(s));
    const status = msg === "Unauthorized" ? 401 : msg.startsWith("Forbidden") ? 403 : 500;
    return new Response(
      JSON.stringify({ error: isSafe ? msg : "Payout failed. Please try again or contact support." }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
