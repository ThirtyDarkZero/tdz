// Stripe webhook handler — single source of truth for payment confirmations
// Public endpoint, signature-verified. Handles subscriptions, downloads, merch, and Connect updates.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const PRICE_TO_PLAN: Record<string, string> = {
  "price_1TMbKeGLQEZqkO65adCcqiRT": "starter",
  "price_1TMbQGGLQEZqkO65HKj9j9CP": "pro",
  "price_1TMbTkGLQEZqkO65DlF54NhG": "enterprise",
  "price_1TMbY5GLQEZqkO65XMRXlj9c": "fan",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  const startedAt = Date.now();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Signature verification failed:", err);
    // Log invalid-signature attempts so CEO can see them in the monitor.
    try {
      await supabase.from("stripe_webhook_events").insert({
        stripe_event_id: `invalid_${crypto.randomUUID()}`,
        event_type: "signature.invalid",
        status: "failed",
        signature_valid: false,
        error_message: err instanceof Error ? err.message : "invalid signature",
        payload: { raw_preview: body.slice(0, 2000) },
      });
    } catch (_) { /* don't block error response */ }
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : "invalid"}`, { status: 400 });
  }

  console.log(`[stripe-webhook] event=${event.type} id=${event.id}`);

  // Insert/upsert the received event row up front (status: received)
  try {
    await supabase.from("stripe_webhook_events").upsert({
      stripe_event_id: event.id,
      event_type: event.type,
      status: "received",
      livemode: !!event.livemode,
      signature_valid: true,
      payload: event as unknown as Record<string, unknown>,
      received_at: new Date(event.created * 1000).toISOString(),
    }, { onConflict: "stripe_event_id" });
  } catch (e) {
    console.error("[stripe-webhook] failed to log event:", e);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata || {};
        const type = meta.type || (session.mode === "subscription" ? "subscription" : "unknown");

        if (type === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = sub.items.data[0].price.id;
          const plan = PRICE_TO_PLAN[priceId] || meta.plan || null;
          const userId = meta.user_id || sub.metadata?.user_id;
          if (userId && plan) {
            await supabase.from("user_subscriptions").upsert({
              user_id: userId,
              plan,
              status: "active",
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              expires_at: new Date(sub.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
            console.log(`[stripe-webhook] subscription activated user=${userId} plan=${plan}`);
          }
        } else if (type === "download") {
          const buyerId = meta.buyer_id;
          const trackId = meta.track_id;
          const artistId = meta.artist_id;
          const price = (session.amount_total || 0) / 100;
          if (buyerId && trackId && artistId) {
            const fee = +(price * 0.029 + 0.30).toFixed(2); // Stripe approx
            const artistRevenue = +(price - fee).toFixed(2);
            await supabase.from("download_purchases").insert({
              buyer_id: buyerId, track_id: trackId, artist_id: artistId,
              price, transaction_fee: fee, artist_revenue: artistRevenue,
              payment_status: "completed",
            });
            // Add to artist earnings (download_revenue)
            const today = new Date();
            const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
            const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
            await supabase.from("artist_earnings").insert({
              artist_id: artistId,
              period_start: periodStart, period_end: periodEnd,
              download_revenue: artistRevenue, total_downloads: 1,
              streaming_revenue: 0, total_streams: 0,
              payout_status: "pending",
            });
          }
        } else if (type === "merch") {
          const buyerId = meta.buyer_id;
          const artistId = meta.artist_id;
          const itemName = meta.item_name || "Merch";
          const itemId = meta.item_id;
          const amount = (session.amount_total || 0) / 100;
          if (buyerId && artistId) {
            const fee = +(amount * 0.029 + 0.30).toFixed(2);
            const artistRevenue = +(amount - fee).toFixed(2);
            await supabase.from("merch_purchases").insert({
              buyer_id: buyerId, artist_id: artistId,
              item_name: itemName, item_id: itemId,
              amount, artist_revenue: artistRevenue, platform_fee: fee,
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent as string,
              status: "completed",
              metadata: meta,
            });
          }
        } else if (type === "tip") {
          const tipperId = meta.tipper_id;
          const artistId = meta.artist_id;
          const amount = (session.amount_total || 0) / 100;
          if (tipperId && artistId) {
            await supabase.from("artist_tips").insert({
              tipper_id: tipperId, artist_id: artistId,
              amount, currency: session.currency || "usd",
              square_payment_id: session.payment_intent as string,
              status: "completed",
              message: meta.message || null,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (userId) {
          const status = sub.status === "active" || sub.status === "trialing" ? "active" : "canceled";
          await supabase.from("user_subscriptions").update({
            status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            expires_at: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = sub.metadata?.user_id;
          if (userId) {
            await supabase.from("user_subscriptions").update({
              status: "active",
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              expires_at: new Date(sub.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }).eq("user_id", userId);
          }
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const userId = account.metadata?.user_id;
        if (userId) {
          const ready = !!(account.charges_enabled && account.payouts_enabled && account.details_submitted);
          await supabase.from("artist_payout_details").update({
            payout_enabled: ready,
            updated_at: new Date().toISOString(),
          }).eq("artist_id", userId);
          console.log(`[stripe-webhook] account.updated user=${userId} payout_enabled=${ready}`);
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] unhandled event ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[stripe-webhook] processing error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
