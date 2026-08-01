// Stripe Connect Express onboarding for artists.
// Always responds 200 with a structured body so the client can surface the real reason.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";
import { makeIdempotencyKey, withStripeRetry } from "../_shared/stripeRetry.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  const preflight = handleCorsPreflightWithOrigin(req);
  if (preflight) return preflight;

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
      return respond({ success: false, error: "Please sign in again to connect Stripe.", stage });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user?.email) {
      console.error("setup-artist-payout auth error:", authError?.message);
      return respond({ success: false, error: "Please sign in again to connect Stripe.", stage });
    }

    stage = "stripe_init";
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return respond({ success: false, error: "Stripe is not configured on the server.", stage });
    }
    // Use the account's default API version — avoids version-pin incompatibilities.
    const stripe = new Stripe(stripeKey);
    const origin = req.headers.get("origin") || "https://tdz.lovable.app";

    stage = "load_existing";
    const { data: existing } = await supabase
      .from("artist_payout_details")
      .select("stripe_connect_id")
      .eq("artist_id", user.id)
      .maybeSingle();

    let accountId: string | null = existing?.stripe_connect_id || null;

    // A stored account can be stale (created in the other Stripe mode, or deleted).
    // Verify before reuse; otherwise we'd fail forever on accountLinks.create.
    if (accountId) {
      stage = "verify_existing";
      try {
        const acct = await stripe.accounts.retrieve(accountId);
        if ((acct as any)?.deleted) accountId = null;
      } catch (e) {
        console.warn("stored connect account unusable, recreating:", (e as Error).message);
        accountId = null;
      }
    }

    if (!accountId) {
      stage = "account_create";
      const baseParams = {
        email: user.email,
        metadata: { user_id: user.id },
        capabilities: { transfers: { requested: true } },
      };

      let account;
      try {
        account = await withStripeRetry(
          () => stripe.accounts.create({
            ...baseParams,
            controller: {
              losses: { payments: "application" },
              fees: { payer: "application" },
              stripe_dashboard: { type: "express" },
              requirement_collection: "stripe",
            },
          } as any, { idempotencyKey: makeIdempotencyKey("connect_account", user.id) }),
          { label: "accounts.create(controller)" }
        );
      } catch (e) {
        // Some platform configurations reject the controller shape; fall back to
        // the classic Express account type so onboarding never dead-ends.
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("controller account create failed, falling back to type=express:", msg);
        account = await withStripeRetry(
          () => stripe.accounts.create({
            ...baseParams,
            type: "express",
          } as any, { idempotencyKey: makeIdempotencyKey("connect_account_express", user.id) }),
          { label: "accounts.create(express)" }
        );
      }

      accountId = account.id;
      // Persist immediately so a later failure doesn't orphan the Stripe account.
      await supabase.from("artist_payout_details").upsert({
        artist_id: user.id,
        stripe_connect_id: accountId,
        payout_enabled: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "artist_id" });
    }

    stage = "account_link";
    // Account links are single-use and time-bound; retry only on transient errors.
    const accountLink = await withStripeRetry(
      () => stripe.accountLinks.create({
        account: accountId!,
        refresh_url: `${origin}/studio?payout=refresh`,
        return_url: `${origin}/studio?payout=success&account=${accountId}`,
        type: "account_onboarding",
      }),
      { label: "accountLinks.create" }
    );

    await supabase.from("artist_payout_details").upsert({
      artist_id: user.id,
      stripe_connect_id: accountId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "artist_id" });

    return respond({ success: true, onboardingUrl: accountLink.url, accountId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`setup-artist-payout failed at stage=${stage}:`, msg);

    let clientMsg = "Unable to start payout setup. Please try again.";
    if (/signed up for Connect|Connect platform|not.*enabled.*Connect/i.test(msg)) {
      clientMsg = "Stripe Connect isn't enabled on the platform account yet. Please contact support.";
    } else if (/testmode|live mode|similar object exists in/i.test(msg)) {
      clientMsg = "Stripe mode mismatch on the platform account. Please contact support.";
    } else if (/platform-profile|responsibilities/i.test(msg)) {
      clientMsg = "The Stripe platform profile needs to be completed before artists can connect. Please contact support.";
    }

    return respond({ success: false, error: clientMsg, detail: msg, stage });
  }
});
