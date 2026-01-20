import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const squareAppId = Deno.env.get('SQUARE_APPLICATION_ID');

    if (!squareAppId) {
      console.error('SQUARE_APPLICATION_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Square OAuth not configured. Please add SQUARE_APPLICATION_ID secret.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { redirectUri } = await req.json();

    if (!redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Missing redirectUri parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate state token to prevent CSRF (includes user ID)
    const state = btoa(JSON.stringify({ 
      userId: user.id, 
      timestamp: Date.now(),
      nonce: crypto.randomUUID()
    }));

    // Square OAuth authorization URL (auto-detect Production vs Sandbox)
    // Production app IDs start with "sq0idp-"; sandbox typically starts with "sq0idb-".
    const isProd = squareAppId.startsWith('sq0idp-');
    const baseUrl = isProd
      ? 'https://connect.squareup.com/oauth2/authorize'
      : 'https://connect.squareupsandbox.com/oauth2/authorize';
    
    // CRITICAL: Use the exact hardcoded redirect URI that matches Square Dashboard
    const exactRedirectUri = 'https://tdz.lovable.app/square-callback';
    
    console.log('=== SQUARE OAUTH DEBUG ===');
    console.log('Environment:', isProd ? 'PRODUCTION' : 'SANDBOX');
    console.log('App ID:', squareAppId);
    console.log('Requested redirectUri from client:', redirectUri);
    console.log('Using exact redirectUri:', exactRedirectUri);
    console.log('Base URL:', baseUrl);
    
    const params = new URLSearchParams({
      client_id: squareAppId,
      scope: 'MERCHANT_PROFILE_READ BANK_ACCOUNTS_READ PAYMENTS_WRITE PAYMENTS_READ',
      session: 'false',
      state: state,
      redirect_uri: exactRedirectUri,
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    console.log('Final auth URL:', authUrl);
    console.log('=== END DEBUG ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        authUrl,
        state,
        debug: {
          environment: isProd ? 'production' : 'sandbox',
          redirectUri: exactRedirectUri,
          baseUrl
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate authorization URL' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
