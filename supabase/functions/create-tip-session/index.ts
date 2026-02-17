import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { artistId, amount, message } = await req.json();

    if (!artistId || !amount || typeof amount !== 'number' || amount < 1 || amount > 500) {
      return new Response(JSON.stringify({ error: 'Invalid tip amount (must be $1-$500)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify artist exists
    const { data: artist } = await supabase
      .from('artist_profiles')
      .select('artist_name, user_id')
      .eq('user_id', artistId)
      .maybeSingle();

    if (!artist) {
      return new Response(JSON.stringify({ error: 'Artist not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent self-tipping
    if (user.id === artistId) {
      return new Response(JSON.stringify({ error: 'Cannot tip yourself' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create tip record
    const { data: tip, error: tipError } = await supabase
      .from('artist_tips')
      .insert({
        artist_id: artistId,
        tipper_id: user.id,
        amount,
        message: message?.slice(0, 500) || null,
        status: 'pending',
      })
      .select()
      .single();

    if (tipError) {
      console.error('Tip insert error:', tipError);
      return new Response(JSON.stringify({ error: 'Failed to create tip' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Square checkout for the tip
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
    const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID');
    const squareAppId = Deno.env.get('SQUARE_APPLICATION_ID') || '';
    const isProduction = squareAppId.startsWith('sq0idp-');
    const squareBaseUrl = isProduction
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

    if (!squareAccessToken || !squareLocationId) {
      // Mark tip as completed without Square (for testing)
      await supabase.from('artist_tips').update({ status: 'completed' }).eq('id', tip.id);
      return new Response(JSON.stringify({ 
        success: true, 
        tipId: tip.id,
        message: 'Tip recorded (payment processing not configured)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const redirectUrl = `https://tdz.lovable.app/artist/${artistId}?tip=success&tipId=${tip.id}`;
    const amountInCents = Math.round(amount * 100);

    const checkoutResponse = await fetch(`${squareBaseUrl}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: tip.id,
        quick_pay: {
          name: `Tip for ${artist.artist_name}`,
          price_money: { amount: amountInCents, currency: 'USD' },
          location_id: squareLocationId,
        },
        checkout_options: {
          redirect_url: redirectUrl,
          allow_tipping: false,
        },
        pre_populated_data: {
          buyer_email: user.email,
        },
      }),
    });

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok || !checkoutData.payment_link?.url) {
      console.error('Square checkout error:', checkoutData);
      await supabase.from('artist_tips').update({ status: 'failed' }).eq('id', tip.id);
      return new Response(JSON.stringify({ error: 'Failed to create payment link' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update tip with Square payment reference
    await supabase.from('artist_tips').update({
      square_payment_id: checkoutData.payment_link.id,
    }).eq('id', tip.id);

    return new Response(JSON.stringify({
      checkoutUrl: checkoutData.payment_link.url,
      tipId: tip.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('create-tip-session error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
