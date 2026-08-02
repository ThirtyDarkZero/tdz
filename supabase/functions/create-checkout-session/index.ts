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

  // Always return 200 with structured body so the client can read errors.
  const respond = (body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  let stage = "init";
  try {
    stage = "auth";
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return respond({ ok: false, error: "Not authenticated", stage });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseClient.auth.getUser(token);
    if (userErr || !userData?.user?.email) {
      console.error("auth error", userErr);
      return respond({ ok: false, error: "Not authenticated", stage });
    }
    const user = userData.user;

    stage = "parse";
    const body = await req.json().catch(() => ({} as any));
    const plan = body?.plan ?? null;
    const rawReturn = typeof body?.returnTo === "string" ? body.returnTo : "";
    // Only allow same-origin relative paths.
    const returnTo = /^\/[A-Za-z0-9\-_/?=&.]*$/.test(rawReturn) ? rawReturn : "";
    if (!plan || !PLAN_PRICES[plan]) {
      return respond({ ok: false, error: "Invalid plan", stage });
    }
    const planConfig = PLAN_PRICES[plan];

    stage = "stripe_init";
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY missing");
      return respond({ ok: false, error: "Stripe not configured", stage });
    }
    // Use account default API version (avoids version-pin incompatibilities).
    const stripe = new Stripe(stripeKey, {
      httpClient: Stripe.createFetchHttpClient(),
      maxNetworkRetries: 1,
      timeout: 15000,
    });

    // Skip the extra price-validation round trip: session_create surfaces a bad
    // price anyway, and every saved round trip is ~300-600ms of user wait.
    stage = "customer_lookup";
    let customerId: string | undefined;
    try {
      const customers = await Promise.race([
        stripe.customers.list({ email: user.email, limit: 1 }),
        new Promise<null>((r) => setTimeout(() => r(null), 2500)),
      ]);
      if (customers && (customers as any).data?.length > 0) customerId = (customers as any).data[0].id;
    } catch (e) {
      console.warn("customer lookup failed (non-fatal):", e);
    }

    stage = "session_create";
    const origin = req.headers.get("origin") || "https://tdz.lovable.app";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      mode: "subscription",
      success_url: returnTo
        ? `${origin}${returnTo}${returnTo.includes("?") ? "&" : "?"}checkout=success&plan=${plan}`
        : `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: returnTo
        ? `${origin}${returnTo}${returnTo.includes("?") ? "&" : "?"}checkout=cancelled`
        : `${origin}/pricing`,
      metadata: { user_id: user.id, plan, type: "subscription" },
      subscription_data: {
        metadata: { user_id: user.id, plan, type: "subscription" },
      },
    });

    if (!session.url) {
      return respond({ ok: false, error: "Stripe did not return a checkout URL", stage });
    }

    return respond({ ok: true, url: session.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`checkout failed at stage=${stage}:`, msg);
    return respond({ ok: false, error: msg, stage });
  }
});
