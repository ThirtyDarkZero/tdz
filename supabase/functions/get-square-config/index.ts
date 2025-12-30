import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const squareAppId = Deno.env.get('SQUARE_APPLICATION_ID');
    const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID');

    if (!squareAppId || !squareLocationId) {
      console.error('Missing Square configuration:', { 
        hasAppId: !!squareAppId, 
        hasLocationId: !!squareLocationId 
      });
      return new Response(
        JSON.stringify({ error: 'Square is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine environment - production if app ID starts with 'sq0idp' (production prefix)
    const isProduction = squareAppId.startsWith('sq0idp');
    
    console.log(`Returning Square config - Production: ${isProduction}`);

    return new Response(
      JSON.stringify({
        applicationId: squareAppId,
        locationId: squareLocationId,
        environment: isProduction ? 'production' : 'sandbox',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Square config:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
