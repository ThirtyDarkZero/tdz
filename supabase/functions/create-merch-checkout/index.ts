// Create a Stripe Checkout session for a merch purchase.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");
    const { data: u } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = u.user;
    if (!user?.email) throw new Error("User not authenticated");

    // DISABLED (audit): the price came from the browser, so a buyer could set
    // any price. Re-enable once merch items and prices are stored server-side
    // and looked up here by itemId. Not currently used by the app.
    return new Response(JSON.stringify({ error: "Merch checkout is not available yet." }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // deno-lint-ignore no-unreachable
    const body = await req.json().catch(() => ({}));
    const { artistId, itemName, itemId, priceCents, quantity = 1, imageUrl } = body;
    if (!artistId || !itemName || !priceCents || priceCents < 50) {
      return new Response(JSON.stringify({ error: "Invalid merch payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;
    const origin = req.headers.get("origin") || "https://tdz.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: itemName,
            images: imageUrl ? [imageUrl] : undefined,
          },
          unit_amount: priceCents,
        },
        quantity,
      }],
      mode: "payment",
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "AU"] as any },
      success_url: `${origin}/merch-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: {
        type: "merch",
        buyer_id: user.id,
        artist_id: artistId,
        item_name: itemName,
        item_id: itemId || "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("create-merch-checkout error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
