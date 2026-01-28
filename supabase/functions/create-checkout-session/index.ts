import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan configurations
const PLAN_PRICES: Record<string, { amount: number; name: string; description: string }> = {
  starter: { amount: 999, name: "Starter Plan", description: "For emerging artists - $9.99/month" },
  pro: { amount: 1999, name: "Pro Plan", description: "For professional artists - $19.99/month" },
  enterprise: { amount: 4999, name: "Enterprise Plan", description: "For labels & managers - $49.99/month" },
  fan: { amount: 1200, name: "Fan Plan", description: "Unlimited music streaming - $12/month" },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
    const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID');
    const squareAppId = Deno.env.get('SQUARE_APPLICATION_ID');

    if (!squareAccessToken || !squareLocationId) {
      console.error('Missing Square credentials:', { 
        hasToken: !!squareAccessToken, 
        hasLocation: !!squareLocationId 
      });
      return new Response(
        JSON.stringify({ error: 'Square payment is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { plan, redirectUrl } = await req.json();

    if (!plan || !PLAN_PRICES[plan]) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const planConfig = PLAN_PRICES[plan];
    const idempotencyKey = crypto.randomUUID();

    // Determine Square API base URL
    const isProduction = squareAppId?.startsWith('sq0idp-');
    const squareApiUrl = isProduction 
      ? 'https://connect.squareup.com' 
      : 'https://connect.squareupsandbox.com';

    console.log('Creating checkout for plan:', plan, 'User:', user.id, 'Env:', isProduction ? 'PROD' : 'SANDBOX');

    // Create a checkout using Square Checkout API
    const checkoutResponse = await fetch(`${squareApiUrl}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        quick_pay: {
          name: planConfig.name,
          price_money: {
            amount: planConfig.amount,
            currency: 'USD',
          },
          location_id: squareLocationId,
        },
        checkout_options: {
          redirect_url: redirectUrl || `https://tdz.lovable.app/subscription-success?plan=${plan}`,
          ask_for_shipping_address: false,
        },
        pre_populated_data: {
          buyer_email: user.email,
        },
        payment_note: `TDZ ${planConfig.name} subscription for ${user.email}`,
      }),
    });

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      console.error('Square checkout creation failed:', JSON.stringify(checkoutData));
      
      // Provide more specific error messages
      const errorDetail = checkoutData.errors?.[0]?.detail || 'Payment system error';
      const errorCode = checkoutData.errors?.[0]?.code || 'UNKNOWN';
      
      return new Response(
        JSON.stringify({ 
          error: `Payment failed: ${errorDetail}`,
          code: errorCode,
          debug: isProduction ? undefined : checkoutData
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentLink = checkoutData.payment_link;
    
    if (!paymentLink?.url) {
      console.error('No payment URL in response:', checkoutData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate payment link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checkout created successfully:', paymentLink.id);

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: paymentLink.url,
        orderId: paymentLink.order_id,
        linkId: paymentLink.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
