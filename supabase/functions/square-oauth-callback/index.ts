import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsPreflightWithOrigin } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const squareAppId = Deno.env.get('SQUARE_APPLICATION_ID')!;
    const squareAppSecret = Deno.env.get('SQUARE_APPLICATION_SECRET');

    if (!squareAppSecret) {
      console.error('SQUARE_APPLICATION_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Square OAuth not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Authenticate the caller ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const authenticatedUserId = claimsData.claims.sub as string;

    // ── Parse request body ──
    const { code, state } = await req.json();

    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization code or state' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid state parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId } = stateData;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid state: missing user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── CRITICAL: Verify the authenticated user matches the state userId ──
    if (authenticatedUserId !== userId) {
      console.error('User ID mismatch: authenticated', authenticatedUserId, 'vs state', userId);
      return new Response(
        JSON.stringify({ error: 'Forbidden: user mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for DB writes
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Square environment detection
    const isProd = squareAppId.startsWith('sq0idp-');
    const connectBase = isProd ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`${connectBase}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-01-18',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: squareAppId,
        client_secret: squareAppSecret,
        code: code,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.errors) {
      const errorMessage = tokenData.errors?.[0]?.detail || 'Failed to exchange code';
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token, refresh_token, expires_at, merchant_id } = tokenData;

    // Get merchant info
    let merchantName = 'Square Account';
    try {
      const merchantResponse = await fetch(`${connectBase}/v2/merchants/me`, {
        headers: {
          'Square-Version': '2024-01-18',
          'Authorization': `Bearer ${access_token}`,
        },
      });
      const merchantData = await merchantResponse.json();
      if (merchantData.merchant) {
        merchantName = merchantData.merchant.business_name || merchantData.merchant.country;
      }
    } catch (e) {
      console.warn('Could not fetch merchant info:', e);
    }

    // Store the OAuth tokens
    const { data: existingDetails } = await supabase
      .from('artist_payout_details')
      .select('*')
      .eq('artist_id', authenticatedUserId)
      .maybeSingle();

    const payoutDetails = {
      artist_id: authenticatedUserId,
      square_merchant_id: merchant_id,
      square_access_token: access_token,
      square_refresh_token: refresh_token,
      square_token_expires_at: expires_at,
      account_holder_name: merchantName,
      payout_enabled: true,
      updated_at: new Date().toISOString(),
    };

    if (existingDetails) {
      const { error: updateError } = await supabase
        .from('artist_payout_details')
        .update(payoutDetails)
        .eq('artist_id', authenticatedUserId);

      if (updateError) {
        console.error('Error updating payout details:', updateError);
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('artist_payout_details')
        .insert({
          ...payoutDetails,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error inserting payout details:', insertError);
        throw insertError;
      }
    }

    console.log(`Square OAuth completed for user ${authenticatedUserId}, merchant ${merchant_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        merchantId: merchant_id,
        merchantName: merchantName,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(
      JSON.stringify({ error: 'OAuth callback failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
