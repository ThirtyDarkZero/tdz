import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionRequest {
  plan: 'starter' | 'pro' | 'enterprise' | 'fan';
  sourceId: string; // Payment source token from Square Web Payments SDK
  customerId?: string;
}

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  starter: { amount: 999, name: 'TDZ Starter Plan' },
  pro: { amount: 1999, name: 'TDZ Pro Plan' },
  enterprise: { amount: 4999, name: 'TDZ Enterprise Plan' },
  fan: { amount: 1200, name: 'TDZ Fan Plan' },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN')!;
    const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID')!;
    const squareAppId = Deno.env.get('SQUARE_APPLICATION_ID') || '';
    
    // Determine if production based on app ID prefix
    const isProduction = squareAppId.startsWith('sq0idp');
    const squareApiUrl = isProduction 
      ? 'https://connect.squareup.com/v2/payments'
      : 'https://connect.squareupsandbox.com/v2/payments';
    
    console.log(`Square environment: ${isProduction ? 'PRODUCTION' : 'SANDBOX'}`);

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { plan, sourceId } = await req.json() as SubscriptionRequest;

    if (!plan || !sourceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: plan and sourceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const planDetails = PLAN_PRICES[plan];
    if (!planDetails) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${plan} subscription for user ${user.id}`);

    // Create payment with Square API - use dynamic URL based on environment
    const idempotencyKey = crypto.randomUUID();
    console.log(`Calling Square API at: ${squareApiUrl}`);
    
    const squareResponse = await fetch(squareApiUrl, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-11-20',
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        source_id: sourceId,
        amount_money: {
          amount: planDetails.amount,
          currency: 'USD',
        },
        location_id: squareLocationId,
        note: `${planDetails.name} - User: ${user.email}`,
        reference_id: user.id,
      }),
    });

    const squareData = await squareResponse.json();
    console.log('Square response:', JSON.stringify(squareData));

    if (!squareResponse.ok || squareData.errors) {
      const errorMessage = squareData.errors?.[0]?.detail || 'Payment failed';
      console.error('Square payment failed:', squareData.errors);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payment successful - update user subscription in database
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Check if user already has a subscription
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan: plan,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to update subscription:', updateError);
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan: plan,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error('Failed to create subscription:', insertError);
      }
    }

    // CRITICAL: Record revenue in platform_revenue table to fund artist payouts
    const revenueType = plan === 'fan' ? 'fan_subscription' : 'artist_subscription';
    const revenueAmount = planDetails.amount / 100; // Convert cents to dollars
    
    const { error: revenueError } = await supabase
      .from('platform_revenue')
      .insert({
        revenue_type: revenueType,
        amount: revenueAmount,
        period_date: new Date().toISOString().split('T')[0],
        description: `${planDetails.name} subscription - ${user.email}`,
      });

    if (revenueError) {
      console.error('Failed to record platform revenue:', revenueError);
      // Log for reconciliation but don't fail the request
    } else {
      console.log(`Recorded $${revenueAmount} ${revenueType} revenue`);
    }

    console.log(`Subscription created successfully for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: squareData.payment?.id,
          status: squareData.payment?.status,
        },
        subscription: {
          plan,
          expiresAt: expiresAt.toISOString(),
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
