// Stripe Connect Express onboarding for artists.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://tdz.lovable.app";

    // Reuse existing Connect account if present
    const { data: existing } = await supabase
      .from("artist_payout_details")
      .select("stripe_connect_id")
      .eq("artist_id", user.id)
      .maybeSingle();

    let accountId = existing?.stripe_connect_id || null;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email!,
        metadata: { user_id: user.id },
        capabilities: { transfers: { requested: true } },
      });
      accountId = account.id;
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/studio?payout=refresh`,
      return_url: `${origin}/studio?payout=success&account=${accountId}`,
      type: "account_onboarding",
    });

    await supabase.from("artist_payout_details").upsert({
      artist_id: user.id,
      stripe_connect_id: accountId,
      payout_enabled: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "artist_id" });

    return new Response(JSON.stringify({
      success: true, onboardingUrl: accountLink.url, accountId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("setup-artist-payout error:", msg);
    let clientMsg = "Unable to start payout setup. Please try again.";
    let status = 500;
    if (msg === "Unauthorized") { clientMsg = "Unauthorized"; status = 401; }
    else if (msg.includes("signed up for Connect")) {
      clientMsg = "Stripe Connect is not enabled on this platform yet. Please contact support.";
    }
    return new Response(JSON.stringify({ error: clientMsg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
