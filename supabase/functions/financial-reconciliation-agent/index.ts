// Financial reconciliation agent — runs every 6h via pg_cron.
// Pulls last 24h of Stripe charges/transfers and matches them to internal records.
// Writes unmatched_transactions for CEO review.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { requireAdminOrCron } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Restrict to cron scheduler or admin users
  const gate = await requireAdminOrCron(req);
  if (!gate.ok) {
    return new Response(JSON.stringify({ error: gate.error ?? "Unauthorized" }), {
      status: gate.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const since = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  const summary = { charges: 0, matched: 0, unmatched: 0, errors: 0 };

  try {
    const charges = await stripe.charges.list({ created: { gte: since }, limit: 100 });
    summary.charges = charges.data.length;

    for (const ch of charges.data) {
      try {
        const meta = ch.metadata || {};
        const type = meta.type;
        let matched = false;

        if (type === "subscription" && meta.user_id) {
          const { data } = await supabase.from("user_subscriptions")
            .select("id").eq("user_id", meta.user_id).maybeSingle();
          matched = !!data;
        } else if (type === "download" && meta.track_id && meta.buyer_id) {
          const { data } = await supabase.from("download_purchases")
            .select("id").eq("track_id", meta.track_id).eq("buyer_id", meta.buyer_id).limit(1);
          matched = (data?.length || 0) > 0;
        } else if (type === "merch" && meta.buyer_id) {
          const { data } = await supabase.from("merch_purchases")
            .select("id").eq("buyer_id", meta.buyer_id).eq("stripe_payment_intent_id", ch.payment_intent as string).limit(1);
          matched = (data?.length || 0) > 0;
        }

        if (matched) {
          summary.matched++;
        } else {
          summary.unmatched++;
          await supabase.from("unmatched_transactions").upsert({
            stripe_object_id: ch.id,
            stripe_object_type: "charge",
            amount: ch.amount / 100,
            currency: ch.currency,
            customer_email: ch.billing_details?.email || null,
            metadata: meta,
            suggested_match_table: type === "subscription" ? "user_subscriptions"
                                  : type === "download" ? "download_purchases"
                                  : type === "merch" ? "merch_purchases" : null,
            status: "pending",
          }, { onConflict: "stripe_object_id" });
        }
      } catch (e) {
        summary.errors++;
        console.error("reconcile charge", ch.id, e);
      }
    }

    await supabase.from("system_health_log").insert({
      check_type: "financial_reconciliation",
      status: summary.errors > 0 ? "degraded" : "healthy",
      details: summary,
    });

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("reconciliation error:", err);
    await supabase.from("system_health_log").insert({
      check_type: "financial_reconciliation",
      status: "error",
      error_message: err instanceof Error ? err.message : String(err),
    });
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
