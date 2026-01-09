import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
    const squareAppId = Deno.env.get('SQUARE_APPLICATION_ID');
    const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID');

    if (!squareAccessToken || !squareAppId) {
      console.log('Square credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Square credentials not configured',
          balance: null,
          configured: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine if production or sandbox
    const isProduction = squareAppId.startsWith('sq0idp-');
    const baseUrl = isProduction 
      ? 'https://connect.squareup.com' 
      : 'https://connect.squareupsandbox.com';

    console.log(`Fetching Square balance from ${isProduction ? 'Production' : 'Sandbox'}`);

    // Get location info for balance
    const locationsResponse = await fetch(`${baseUrl}/v2/locations`, {
      method: 'GET',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const locationsData = await locationsResponse.json();
    console.log('Square locations response:', JSON.stringify(locationsData));

    if (!locationsResponse.ok || locationsData.errors) {
      console.error('Square API error:', locationsData.errors);
      return new Response(
        JSON.stringify({ 
          error: locationsData.errors?.[0]?.detail || 'Failed to fetch Square data',
          balance: null,
          configured: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get balance from bank accounts / payouts
    const bankAccountsResponse = await fetch(`${baseUrl}/v2/bank-accounts`, {
      method: 'GET',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const bankAccountsData = await bankAccountsResponse.json();
    console.log('Square bank accounts:', JSON.stringify(bankAccountsData));

    // Get payments to calculate revenue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const paymentsResponse = await fetch(`${baseUrl}/v2/payments?begin_time=${thirtyDaysAgo.toISOString()}&limit=100`, {
      method: 'GET',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const paymentsData = await paymentsResponse.json();
    console.log('Square payments count:', paymentsData.payments?.length || 0);

    // Calculate total revenue from completed payments
    let totalRevenue = 0;
    let completedPayments = 0;
    if (paymentsData.payments) {
      for (const payment of paymentsData.payments) {
        if (payment.status === 'COMPLETED') {
          totalRevenue += (payment.amount_money?.amount || 0) / 100; // Convert cents to dollars
          completedPayments++;
        }
      }
    }

    // Get payouts (money sent to bank)
    const payoutsResponse = await fetch(`${baseUrl}/v2/payouts?limit=50`, {
      method: 'GET',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const payoutsData = await payoutsResponse.json();
    let totalPayouts = 0;
    if (payoutsData.payouts) {
      for (const payout of payoutsData.payouts) {
        if (payout.status === 'PAID' || payout.status === 'COMPLETED') {
          totalPayouts += (payout.amount_money?.amount || 0) / 100;
        }
      }
    }

    // Get location data
    const location = locationsData.locations?.find((l: any) => l.id === squareLocationId) 
      || locationsData.locations?.[0];

    return new Response(
      JSON.stringify({
        configured: true,
        isProduction,
        location: {
          id: location?.id,
          name: location?.name,
          currency: location?.currency || 'USD',
        },
        revenue: {
          last30Days: totalRevenue,
          completedPayments,
        },
        payouts: {
          total: totalPayouts,
          count: payoutsData.payouts?.length || 0,
        },
        // Estimated available balance (revenue - payouts already sent)
        estimatedBalance: totalRevenue - totalPayouts,
        bankAccounts: bankAccountsData.bank_accounts?.map((ba: any) => ({
          id: ba.id,
          bankName: ba.bank_name,
          last4: ba.primary_bank_identification_number?.slice(-4),
          status: ba.status,
        })) || [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Square balance:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        balance: null,
        configured: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
