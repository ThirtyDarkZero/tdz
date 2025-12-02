import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DownloadPurchaseRequest {
  trackId: string;
  sourceId: string; // Square payment token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
    const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID');

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
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { trackId, sourceId } = await req.json() as DownloadPurchaseRequest;

    if (!trackId || !sourceId) {
      return new Response(
        JSON.stringify({ error: 'Missing trackId or sourceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get track details including price and artist
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, title, artist_name, user_id, download_price')
      .eq('id', trackId)
      .single();

    if (trackError || !track) {
      return new Response(
        JSON.stringify({ error: 'Track not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const downloadPrice = track.download_price || 0.99; // Default $0.99 if not set
    const priceInCents = Math.round(downloadPrice * 100);

    // Check if user already purchased this track
    const { data: existingPurchase } = await supabase
      .from('download_purchases')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('track_id', trackId)
      .maybeSingle();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ error: 'You already own this track', alreadyOwned: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing download purchase: ${track.title} for $${downloadPrice}`);

    // Process payment via Square
    if (!squareAccessToken || !squareLocationId) {
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const idempotencyKey = crypto.randomUUID();
    const squareResponse = await fetch('https://connect.squareup.com/v2/payments', {
      method: 'POST',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        source_id: sourceId,
        amount_money: {
          amount: priceInCents,
          currency: 'USD',
        },
        location_id: squareLocationId,
        note: `Download: ${track.title} by ${track.artist_name}`,
        reference_id: `download-${trackId}-${user.id}`,
      }),
    });

    const squareData = await squareResponse.json();

    if (!squareResponse.ok || squareData.errors) {
      const errorMessage = squareData.errors?.[0]?.detail || 'Payment failed';
      console.error('Square payment failed:', squareData.errors);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payment successful - calculate revenue split
    // Artist gets 100% minus transaction fee (approx 2.9% + $0.30)
    const transactionFee = (downloadPrice * 0.029) + 0.30;
    const artistRevenue = downloadPrice - transactionFee;

    // Record download purchase
    const { error: purchaseError } = await supabase
      .from('download_purchases')
      .insert({
        track_id: trackId,
        buyer_id: user.id,
        artist_id: track.user_id,
        price: downloadPrice,
        artist_revenue: artistRevenue,
        transaction_fee: transactionFee,
        payment_status: 'completed',
      });

    if (purchaseError) {
      console.error('Failed to record download purchase:', purchaseError);
    }

    // Record platform revenue (the transaction fee we keep)
    await supabase
      .from('platform_revenue')
      .insert({
        revenue_type: 'download_fee',
        amount: transactionFee,
        period_date: new Date().toISOString().split('T')[0],
        description: `Download fee: ${track.title}`,
      });

    // Update or create artist earnings for current period
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: existingEarnings } = await supabase
      .from('artist_earnings')
      .select('id, download_revenue, total_downloads, total_earnings')
      .eq('artist_id', track.user_id)
      .eq('period_start', periodStart)
      .maybeSingle();

    if (existingEarnings) {
      // Update existing period
      const newDownloadRevenue = (existingEarnings.download_revenue || 0) + artistRevenue;
      const newTotalDownloads = (existingEarnings.total_downloads || 0) + 1;
      const newTotalEarnings = (existingEarnings.total_earnings || 0) + artistRevenue;

      await supabase
        .from('artist_earnings')
        .update({
          download_revenue: newDownloadRevenue,
          total_downloads: newTotalDownloads,
          total_earnings: newTotalEarnings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingEarnings.id);
    } else {
      // Create new earnings period
      await supabase
        .from('artist_earnings')
        .insert({
          artist_id: track.user_id,
          period_start: periodStart,
          period_end: periodEnd,
          download_revenue: artistRevenue,
          total_downloads: 1,
          total_earnings: artistRevenue,
          payout_status: 'pending',
        });
    }

    console.log(`Download purchase complete: Artist ${track.user_id} earned $${artistRevenue.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully purchased "${track.title}"`,
        downloadUrl: `/api/download/${trackId}`, // Would need separate download endpoint
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing download purchase:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
