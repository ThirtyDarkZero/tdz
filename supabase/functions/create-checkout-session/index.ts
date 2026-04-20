import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

import { getCorsHeaders, handleCorsPreflightWithOrigin } from '../_shared/cors.ts';

// Live Stripe Price IDs (subscriptions)
const PLAN_PRICES: Record<string, { priceId: string; name: string }> = {
  starter:    { priceId: "price_1TMbKeGLQEZqkO65adCcqiRT", name: "TDZ Starter" },
  pro:        { priceId: "price_1TMbQGGLQEZqkO65HKj9j9CP", name: "TDZ Pro" },
  enterprise: { priceId: "price_1TMbTkGLQEZqkO65DlF54NhG", name: "TDZ Enterprise" },
  fan:        { priceId: "price_1TMbY5GLQEZqkO65XMRXlj9c", name: "TDZ Fan" },
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  const preflight = handleCorsPreflightWithOrigin(req);
  if (preflight) return preflight;

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { plan } = await req.json();
    if (!plan || !PLAN_PRICES[plan]) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planConfig = PLAN_PRICES[plan];
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://tdz.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/pricing`,
      metadata: { user_id: user.id, plan, type: "subscription" },
      subscription_data: {
        metadata: { user_id: user.id, plan, type: "subscription" },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Checkout error:", msg);
    // Only surface known user-facing errors; mask internals.
    const safeMessages = ["Invalid plan", "User not authenticated", "No authorization header"];
    const clientMsg = safeMessages.includes(msg) ? msg : "Unable to start checkout. Please try again.";
    const status = msg === "User not authenticated" || msg === "No authorization header" ? 401 : 500;
    return new Response(JSON.stringify({ error: clientMsg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
