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

// Resolve the TDZ user for a Stripe subscription even if metadata was stripped:
// subscription metadata -> customer metadata -> customer email -> auth user lookup.
async function resolveUserId(
  stripe: Stripe,
  supabase: ReturnType<typeof createClient>,
  sub: Stripe.Subscription,
): Promise<string | null> {
  if (sub.metadata?.user_id) return sub.metadata.user_id;

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return null;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    if (customer.metadata?.user_id) return customer.metadata.user_id;

    const email = customer.email?.toLowerCase();
    if (!email) return null;

    for (let page = 1; page <= 5; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data?.users?.length) break;
      const match = data.users.find((u) => u.email?.toLowerCase() === email);
      if (match) return match.id;
      if (data.users.length < 200) break;
    }
  } catch (e) {
    console.error("[stripe-webhook] resolveUserId failed:", e);
  }
  return null;
}

// Upsert (never silently no-op) the user's subscription row.
async function writeSubscription(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  fields: Record<string, unknown>,
) {
  const { error } = await supabase.from("user_subscriptions").upsert({
    user_id: userId,
    ...fields,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) console.error("[stripe-webhook] subscription upsert failed:", error.message);
}



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

  // Idempotency: if this event id was already fully processed, ack and return.
  // We still upsert-received below for first-time events so retries can be traced.
  try {
    const { data: existing } = await supabase
      .from("stripe_webhook_events")
      .select("status")
      .eq("stripe_event_id", event.id)
      .maybeSingle();
    if (existing?.status === "processed" || existing?.status === "ignored") {
      console.log(`[stripe-webhook] duplicate event ${event.id} status=${existing.status}; acking`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("[stripe-webhook] dedupe check failed:", e);
  }

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

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(stripe, supabase, sub);
        if (userId) {
          const priceId = sub.items.data[0]?.price?.id;
          const plan = (priceId && PRICE_TO_PLAN[priceId]) || sub.metadata?.plan || undefined;
          const active = event.type !== "customer.subscription.deleted" &&
            (sub.status === "active" || sub.status === "trialing");
          await writeSubscription(supabase, userId, {
            ...(plan ? { plan } : {}),
            status: active ? (sub.status === "trialing" ? "trial" : "active") : "canceled",
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            expires_at: new Date(sub.current_period_end * 1000).toISOString(),
            canceled_at: active ? null : new Date().toISOString(),
          });
          console.log(`[stripe-webhook] ${event.type} user=${userId} status=${sub.status}`);
        } else {
          console.warn(`[stripe-webhook] ${event.type}: no user match for sub=${sub.id}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = await resolveUserId(stripe, supabase, sub);
          if (userId) {
            const priceId = sub.items.data[0]?.price?.id;
            const plan = (priceId && PRICE_TO_PLAN[priceId]) || undefined;
            await writeSubscription(supabase, userId, {
              ...(plan ? { plan } : {}),
              status: "active",
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              expires_at: new Date(sub.current_period_end * 1000).toISOString(),
              canceled_at: null,
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        // Only downgrade once Stripe has stopped retrying (dunning exhausted).
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription && !invoice.next_payment_attempt) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = await resolveUserId(stripe, supabase, sub);
          if (userId) {
            await writeSubscription(supabase, userId, {
              status: "expired",
              expires_at: new Date().toISOString(),
            });
            console.log(`[stripe-webhook] dunning exhausted, expired user=${userId}`);
          }
        }
        break;
      }


      case "account.updated":
      case "capability.updated": {
        // capability.updated arrives on the connected account object; fetch the
        // parent account to get a consistent readiness view.
        let account: Stripe.Account;
        if (event.type === "account.updated") {
          account = event.data.object as Stripe.Account;
        } else {
          const cap = event.data.object as Stripe.Capability;
          const acctId = typeof cap.account === "string" ? cap.account : cap.account?.id;
          if (!acctId) break;
          account = await stripe.accounts.retrieve(acctId);
        }
        const userId = account.metadata?.user_id;
        const ready = !!(account.charges_enabled && account.payouts_enabled && account.details_submitted);
        const needsAttention =
          (account.requirements?.currently_due?.length ?? 0) > 0 ||
          (account.requirements?.past_due?.length ?? 0) > 0 ||
          !!account.requirements?.disabled_reason;

        // Prefer metadata user_id, fall back to matching by stripe_connect_id so
        // reconciliation still works if metadata was ever stripped.
        const query = supabase.from("artist_payout_details").update({
          payout_enabled: ready,
          updated_at: new Date().toISOString(),
        });
        if (userId) await query.eq("artist_id", userId);
        else await query.eq("stripe_connect_id", account.id);

        console.log(`[stripe-webhook] ${event.type} account=${account.id} user=${userId ?? "?"} ready=${ready} attention=${needsAttention}`);
        break;
      }

      case "account.application.deauthorized": {
        // Artist disconnected our platform from their Stripe. Mark payouts disabled
        // and clear the connect id so re-onboarding creates a fresh account.
        const account = event.data.object as Stripe.Account;
        await supabase.from("artist_payout_details")
          .update({
            payout_enabled: false,
            stripe_connect_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_connect_id", account.id);
        console.log(`[stripe-webhook] account.deauthorized account=${account.id}`);
        break;
      }

      case "transfer.created":
      case "transfer.updated":
      case "transfer.paid": {
        // Confirm the transfer row exists and mark completed. Idempotent — matches
        // on square_payout_id (which holds the Stripe transfer id).
        const transfer = event.data.object as Stripe.Transfer;
        await supabase.from("artist_payouts")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("square_payout_id", transfer.id);
        console.log(`[stripe-webhook] ${event.type} transfer=${transfer.id}`);
        break;
      }

      case "transfer.reversed":
      case "transfer.failed": {
        // Reverse the payout: mark failed/reversed and flip linked earnings back
        // to pending so the artist can retry withdrawal without losing balance.
        // The DB state machine blocks illegal transitions (e.g. reversed -> failed);
        // we swallow those errors so out-of-order webhook delivery still 200s.
        const transfer = event.data.object as Stripe.Transfer;
        const { data: payout } = await supabase.from("artist_payouts")
          .select("id, earnings_ids, artist_id, status")
          .eq("square_payout_id", transfer.id)
          .maybeSingle();

        const nextStatus = event.type === "transfer.reversed" ? "reversed" : "failed";
        const { error: transitionErr } = await supabase.from("artist_payouts")
          .update({
            status: nextStatus,
            completed_at: nextStatus === "reversed" ? new Date().toISOString() : null,
          })
          .eq("square_payout_id", transfer.id);

        if (transitionErr) {
          console.warn(`[stripe-webhook] ${event.type} blocked by state machine (payout=${payout?.id} current=${payout?.status} -> ${nextStatus}): ${transitionErr.message}`);
        } else if (nextStatus === "failed" && payout?.earnings_ids?.length) {
          // Only re-open earnings on true failure. Reversed transfers are a
          // clawback — earnings stay marked paid until finance reviews.
          await supabase.from("artist_earnings")
            .update({ payout_status: "pending", payout_date: null })
            .in("id", payout.earnings_ids);
        }
        console.log(`[stripe-webhook] ${event.type} transfer=${transfer.id} payout=${payout?.id ?? "?"}`);
        break;
      }


      case "payout.paid":
      case "payout.failed":
      case "payout.canceled": {
        // Stripe -> artist bank leg (fires on the connected account for Express).
        // We only log for observability; the platform-side artist_payouts row
        // already reflects the transfer state above.
        const payout = event.data.object as Stripe.Payout;
        console.log(`[stripe-webhook] ${event.type} payout=${payout.id} amount=${payout.amount} account=${event.account ?? "?"}`);
        break;
      }

      default:
        console.log(`[stripe-webhook] unhandled event ${event.type}`);
        await supabase.from("stripe_webhook_events").update({
          status: "ignored",
          processing_ms: Date.now() - startedAt,
          processed_at: new Date().toISOString(),
        }).eq("stripe_event_id", event.id);
        return new Response(JSON.stringify({ received: true, ignored: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }


    await supabase.from("stripe_webhook_events").update({
      status: "processed",
      processing_ms: Date.now() - startedAt,
      processed_at: new Date().toISOString(),
    }).eq("stripe_event_id", event.id);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[stripe-webhook] processing error:", err);
    try {
      await supabase.from("stripe_webhook_events").update({
        status: "failed",
        processing_ms: Date.now() - startedAt,
        processed_at: new Date().toISOString(),
        error_message: err instanceof Error ? err.message : String(err),
      }).eq("stripe_event_id", event.id);
    } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
