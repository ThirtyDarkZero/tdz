import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

import { getCorsHeaders, handleCorsPreflightWithOrigin } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  const preflight = handleCorsPreflightWithOrigin(req);
  if (preflight) return preflight;

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

    const { trackId } = await req.json();
    if (!trackId) {
      return new Response(JSON.stringify({ error: "Missing trackId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get track details
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("id, title, artist_name, user_id, download_price")
      .eq("id", trackId)
      .single();

    if (trackError || !track) {
      return new Response(JSON.stringify({ error: "Track not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already purchased
    const { data: existing } = await supabase
      .from("download_purchases")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("track_id", trackId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "You already own this track", alreadyOwned: true }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const downloadPrice = track.download_price || 0.99;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Payment system not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://tdz.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email!,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `Download: ${track.title} by ${track.artist_name}` },
          unit_amount: Math.round(downloadPrice * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/track/${trackId}?download=success`,
      cancel_url: `${origin}/track/${trackId}`,
      metadata: { track_id: trackId, buyer_id: user.id, artist_id: track.user_id },
    });

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-download-purchase error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
