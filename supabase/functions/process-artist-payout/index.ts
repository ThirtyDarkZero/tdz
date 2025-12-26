import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Input validation
function validateInput(data: unknown): { artistId: string; amount?: number } | { error: string } {
  if (!data || typeof data !== 'object') {
    return { error: 'Invalid request body' };
  }

  const { artistId, amount } = data as Record<string, unknown>;

  // Validate artistId - required and must be UUID
  if (!artistId || typeof artistId !== 'string') {
    return { error: 'Missing or invalid artistId' };
  }
  if (!UUID_REGEX.test(artistId)) {
    return { error: 'Invalid artistId format - must be a valid UUID' };
  }

  // Validate amount - optional, but if provided must be positive number
  let validatedAmount: number | undefined;
  if (amount !== undefined) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return { error: 'amount must be a number' };
    }
    if (amount <= 0) {
      return { error: 'amount must be a positive number' };
    }
    if (amount > 1000000) { // Max $1M per payout
      return { error: 'amount exceeds maximum allowed payout' };
    }
    validatedAmount = amount;
  }

  return { artistId, amount: validatedAmount };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN')!;

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

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateInput(rawBody);
    if ('error' in validation) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { artistId, amount } = validation;

    // Verify the user is the artist or an admin
    if (artistId !== user.id) {
      // Check if user is admin
      const { data: roleData } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      if (!roleData) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized to process this payout' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get artist's pending earnings
    const { data: earnings, error: earningsError } = await supabase
      .from('artist_earnings')
      .select('*')
      .eq('artist_id', artistId)
      .eq('payout_status', 'pending')
      .order('period_end', { ascending: true });

    if (earningsError) {
      console.error('Error fetching earnings:', earningsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch earnings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!earnings || earnings.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No pending earnings to pay out' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total pending amount
    const totalPending = earnings.reduce((sum, e) => sum + (e.total_earnings || 0), 0);
    const payoutAmount = amount ? Math.min(amount, totalPending) : totalPending;

    // Minimum payout threshold: $50
    const MINIMUM_PAYOUT = 50;
    if (payoutAmount < MINIMUM_PAYOUT) {
      return new Response(
        JSON.stringify({ 
          error: `Minimum payout is $${MINIMUM_PAYOUT}. Current balance: $${totalPending.toFixed(2)}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get artist's payout details
    const { data: payoutDetails } = await supabase
      .from('artist_payout_details')
      .select('*')
      .eq('artist_id', artistId)
      .maybeSingle();

    if (!payoutDetails || !payoutDetails.square_customer_id) {
      return new Response(
        JSON.stringify({ error: 'Artist has not set up payout details. Please add bank account information.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert to cents for Square API
    const amountCents = Math.round(payoutAmount * 100);
    const idempotencyKey = crypto.randomUUID();

    // Create payout using Square Bank Accounts API
    // Note: Square Payouts API requires seller dashboard setup
    // For programmatic payouts, we use the Transfers API or record external payouts
    const payoutResponse = await fetch('https://connect.squareup.com/v2/payouts', {
      method: 'POST',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        payout: {
          destination_type: 'BANK',
          amount_money: {
            amount: amountCents,
            currency: 'USD',
          },
        },
      }),
    });

    const payoutData = await payoutResponse.json();
    console.log('Square payout response:', JSON.stringify(payoutData));

    // If Square Payouts API is not available, record the payout for manual processing
    let payoutId = payoutData.payout?.id;
    let payoutStatus = 'processing';

    if (!payoutResponse.ok || payoutData.errors) {
      // Log the error but continue - we'll record this for manual processing
      console.log('Square payout API unavailable, recording for manual processing');
      payoutId = `manual_${idempotencyKey}`;
      payoutStatus = 'pending_manual';
    }

    // Record the payout transaction
    const { data: payoutRecord, error: recordError } = await supabase
      .from('artist_payouts')
      .insert({
        artist_id: artistId,
        amount: payoutAmount,
        status: payoutStatus,
        square_payout_id: payoutId,
        earnings_ids: earnings.map(e => e.id),
        processed_by: user.id,
      })
      .select()
      .single();

    if (recordError) {
      console.error('Error recording payout:', recordError);
    }

    // Update earnings records to mark as processing
    const earningsIds = earnings.map(e => e.id);
    await supabase
      .from('artist_earnings')
      .update({ 
        payout_status: 'processing',
        payout_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', earningsIds);

    console.log(`Payout initiated for artist ${artistId}: $${payoutAmount}`);

    return new Response(
      JSON.stringify({
        success: true,
        payout: {
          id: payoutRecord?.id || payoutId,
          amount: payoutAmount,
          status: payoutStatus,
          earningsProcessed: earnings.length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing payout:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
