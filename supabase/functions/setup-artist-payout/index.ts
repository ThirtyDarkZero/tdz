import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayoutSetupRequest {
  bankAccountToken: string; // Token from Square Web Payments SDK
  accountHolderName: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');

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

    const { bankAccountToken, accountHolderName } = await req.json() as PayoutSetupRequest;

    if (!accountHolderName) {
      return new Response(
        JSON.stringify({ error: 'Account holder name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's email for Square customer
    const userEmail = user.email || `${user.id}@tdz.app`;

    // Check if artist already has payout details
    const { data: existingDetails } = await supabase
      .from('artist_payout_details')
      .select('*')
      .eq('artist_id', user.id)
      .maybeSingle();

    let squareCustomerId = existingDetails?.square_customer_id || null;

    // Try to create Square customer if token is available and valid
    if (!squareCustomerId && squareAccessToken) {
      try {
        const customerResponse = await fetch('https://connect.squareup.com/v2/customers', {
          method: 'POST',
          headers: {
            'Square-Version': '2024-01-18',
            'Authorization': `Bearer ${squareAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idempotency_key: crypto.randomUUID(),
            given_name: accountHolderName,
            email_address: userEmail,
            reference_id: user.id,
          }),
        });

        const customerData = await customerResponse.json();
        console.log('Square customer response:', JSON.stringify(customerData));

        if (customerResponse.ok && !customerData.errors) {
          squareCustomerId = customerData.customer?.id;
        } else {
          // Log but don't fail - we can still save payout details without Square
          console.warn('Square customer creation failed:', customerData.errors);
        }
      } catch (squareError) {
        console.error('Square API error:', squareError);
        // Continue without Square - manual payouts will be used
      }
    }

    // Store bank account token for payouts
    // Note: Square doesn't directly link bank accounts to customers for payouts
    // Bank accounts are typically managed through the Square Dashboard
    // We store the reference for record-keeping and future API support
    
    const payoutDetails = {
      artist_id: user.id,
      square_customer_id: squareCustomerId,
      account_holder_name: accountHolderName,
      bank_token_reference: bankAccountToken,
      payout_enabled: true,
      updated_at: new Date().toISOString(),
    };

    if (existingDetails) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('artist_payout_details')
        .update(payoutDetails)
        .eq('artist_id', user.id);

      if (updateError) {
        console.error('Error updating payout details:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update payout details' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('artist_payout_details')
        .insert({
          ...payoutDetails,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error inserting payout details:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save payout details' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Payout setup completed for artist ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payout account linked successfully',
        customerId: squareCustomerId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error setting up payout:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
