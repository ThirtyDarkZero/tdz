import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("EVENTBRITE_API_TOKEN");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Eventbrite OAuth not configured. Missing EVENTBRITE_API_TOKEN." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { redirectUri } = await req.json();
    if (!redirectUri) {
      return new Response(
        JSON.stringify({ error: "Missing redirectUri" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const state = btoa(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
    }));

    // Eventbrite OAuth2 authorize URL
    // EVENTBRITE_API_TOKEN is the OAuth App API Key (client_id equivalent)
    const params = new URLSearchParams({
      response_type: "code",
      client_id: apiKey,
      redirect_uri: "https://tdz.lovable.app/eventbrite-callback",
      state,
    });

    const authUrl = `https://www.eventbrite.com/oauth/authorize?${params.toString()}`;

    return new Response(
      JSON.stringify({ success: true, authUrl, state }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating Eventbrite OAuth URL:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate authorization URL" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
