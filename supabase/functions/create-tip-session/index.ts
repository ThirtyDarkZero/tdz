import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

import { getCorsHeaders, handleCorsPreflightWithOrigin } from '../_shared/cors.ts';

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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { artistId, amount, message } = await req.json();

    if (!artistId || !amount || typeof amount !== "number" || amount < 1 || amount > 500) {
      return new Response(JSON.stringify({ error: "Invalid tip amount (must be $1-$500)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify artist exists
    const { data: artist } = await supabase
      .from("artist_profiles")
      .select("artist_name, user_id")
      .eq("user_id", artistId)
      .maybeSingle();

    if (!artist) {
      return new Response(JSON.stringify({ error: "Artist not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (user.id === artistId) {
      return new Response(JSON.stringify({ error: "Cannot tip yourself" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create tip record
    const { data: tip, error: tipError } = await supabase
      .from("artist_tips")
      .insert({
        artist_id: artistId,
        tipper_id: user.id,
        amount,
        message: message?.slice(0, 500) || null,
        status: "pending",
      })
      .select()
      .single();

    if (tipError) {
      console.error("Tip insert error:", tipError);
      return new Response(JSON.stringify({ error: "Failed to create tip" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Stripe Checkout session for the tip
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      await supabase.from("artist_tips").update({ status: "completed" }).eq("id", tip.id);
      return new Response(JSON.stringify({
        success: true,
        tipId: tip.id,
        message: "Tip recorded (payment processing not configured)",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://tdz.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email!,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `Tip for ${artist.artist_name}` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/artist/${artistId}?tip=success&tipId=${tip.id}`,
      cancel_url: `${origin}/artist/${artistId}`,
      metadata: { tip_id: tip.id, artist_id: artistId, tipper_id: user.id },
    });

    return new Response(JSON.stringify({
      checkoutUrl: session.url,
      tipId: tip.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-tip-session error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
