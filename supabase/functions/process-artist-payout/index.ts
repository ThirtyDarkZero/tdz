import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// UUID validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    // Verify CEO role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "ceo")
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized - CEO access required");

    const body = await req.json();
    const artistId = body?.artistId;
    const amount = body?.amount;
    const earningsIds = body?.earningsIds;

    if (!artistId || !UUID_REGEX.test(artistId)) throw new Error("Invalid artistId");
    if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) throw new Error("Invalid amount");

    // Get artist's Stripe Connect account
    const { data: payoutDetails } = await supabase
      .from("artist_payout_details")
      .select("square_merchant_id, payout_enabled")
      .eq("artist_id", artistId)
      .maybeSingle();

    if (!payoutDetails?.square_merchant_id) {
      throw new Error("Artist has not set up Stripe Connect");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Determine payout amount from pending earnings if not specified
    let payoutAmount = amount;
    let selectedEarningsIds = earningsIds || [];

    if (!payoutAmount) {
      const { data: pendingEarnings } = await supabase
        .from("artist_earnings")
        .select("id, total_earnings")
        .eq("artist_id", artistId)
        .eq("payout_status", "pending");

      if (!pendingEarnings?.length) {
        return new Response(JSON.stringify({ error: "No pending earnings" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      payoutAmount = pendingEarnings.reduce((sum, e) => sum + (e.total_earnings || 0), 0);
      selectedEarningsIds = pendingEarnings.map(e => e.id);

      if (payoutAmount < 50) {
        return new Response(JSON.stringify({ error: `Minimum payout is $50. Current: $${payoutAmount.toFixed(2)}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create a transfer to the artist's Connect account
    const transfer = await stripe.transfers.create({
      amount: Math.round(payoutAmount * 100),
      currency: "usd",
      destination: payoutDetails.square_merchant_id,
      description: `TDZ artist payout for ${artistId}`,
      metadata: { artist_id: artistId },
    });

    // Record payout
    await supabase.from("artist_payouts").insert({
      artist_id: artistId,
      amount: payoutAmount,
      status: "completed",
      square_payout_id: transfer.id,
      earnings_ids: selectedEarningsIds,
      processed_by: user.id,
      completed_at: new Date().toISOString(),
    });

    // Update earnings records
    if (selectedEarningsIds.length) {
      await supabase.from("artist_earnings")
        .update({ payout_status: "paid", payout_date: new Date().toISOString().split("T")[0] })
        .in("id", selectedEarningsIds);
    }

    // Update payout details
    await supabase.from("artist_payout_details")
      .update({ last_payout_date: new Date().toISOString(), payout_enabled: true })
      .eq("artist_id", artistId);

    return new Response(JSON.stringify({
      success: true,
      transferId: transfer.id,
      amount: payoutAmount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("process-artist-payout error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
