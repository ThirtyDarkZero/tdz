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

    // Square OAuth authorization URL (production)
    const baseUrl = 'https://connect.squareup.com/oauth2/authorize';
    
    const params = new URLSearchParams({
      client_id: squareAppId,
      scope: 'MERCHANT_PROFILE_READ BANK_ACCOUNTS_READ PAYMENTS_WRITE PAYMENTS_READ',
      session: 'false',
      state: state,
      redirect_uri: redirectUri,
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    console.log(`Generated Square OAuth URL for user ${user.id}`);
    console.log(`Redirect URI: ${redirectUri}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        authUrl,
        state 
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
