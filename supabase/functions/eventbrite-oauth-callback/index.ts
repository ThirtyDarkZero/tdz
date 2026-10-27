import "../_shared/fetchTimeout.ts";
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
    const clientId = Deno.env.get("EVENTBRITE_CLIENT_ID");
    const clientSecret = Deno.env.get("EVENTBRITE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Eventbrite OAuth not configured. Missing EVENTBRITE_CLIENT_ID or EVENTBRITE_CLIENT_SECRET." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { code, state } = await req.json();
    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: "Missing authorization code or state" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid state parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId } = stateData;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Invalid state: missing user ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://www.eventbrite.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: "https://tdz.lovable.app/eventbrite-callback",
      }),
    });

    const tokenData = await tokenRes.json();
    console.log("Eventbrite token response status:", tokenRes.status);

    if (!tokenRes.ok || !tokenData.access_token) {
      const errMsg = tokenData.error_description || tokenData.error || "Token exchange failed";
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenData.access_token;

    // Fetch user's organization
    let orgId = null;
    let orgName = null;
    try {
      const orgRes = await fetch("https://www.eventbriteapi.com/v3/users/me/organizations/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const orgData = await orgRes.json();
      if (orgData.organizations?.length > 0) {
        orgId = orgData.organizations[0].id;
        orgName = orgData.organizations[0].name;
      }
    } catch (e) {
      console.warn("Could not fetch Eventbrite org:", e);
    }

    // Upsert token into artist_eventbrite_tokens
    const { error: upsertError } = await supabase
      .from("artist_eventbrite_tokens")
      .upsert({
        user_id: userId,
        access_token: accessToken,
        organization_id: orgId,
        organization_name: orgName,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Error storing Eventbrite token:", upsertError);
      throw upsertError;
    }

    console.log(`Eventbrite OAuth completed for user ${userId}, org ${orgId}`);

    return new Response(
      JSON.stringify({
        success: true,
        organizationId: orgId,
        organizationName: orgName,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Eventbrite OAuth callback error:", error);
    return new Response(
      JSON.stringify({ error: "OAuth callback failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
