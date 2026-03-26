import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVENTBRITE_BASE = "https://www.eventbriteapi.com/v3";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("EVENTBRITE_API_TOKEN");
    if (!token) throw new Error("EVENTBRITE_API_TOKEN not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) throw new Error("Unauthorized");

    const { action, ...params } = await req.json();

    const ebFetch = async (path: string, options: RequestInit = {}) => {
      const res = await fetch(`${EVENTBRITE_BASE}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Eventbrite API error ${res.status}: ${err}`);
      }
      return res.json();
    };

    let result: any;

    switch (action) {
      case "get_organizations": {
        result = await ebFetch("/users/me/organizations/");
        break;
      }

      case "list_events": {
        const orgId = params.organization_id;
        if (!orgId) throw new Error("organization_id required");
        result = await ebFetch(`/organizations/${orgId}/events/?status=live,draft,started&order_by=start_desc`);
        break;
      }

      case "create_event": {
        const orgId = params.organization_id;
        if (!orgId) throw new Error("organization_id required");

        // Create event
        const event = await ebFetch(`/organizations/${orgId}/events/`, {
          method: "POST",
          body: JSON.stringify({
            event: {
              name: { html: params.name },
              description: { html: params.description || "" },
              start: { timezone: params.timezone || "America/New_York", utc: params.start_utc },
              end: { timezone: params.timezone || "America/New_York", utc: params.end_utc },
              currency: params.currency || "USD",
              online_event: params.online_event || false,
              venue_id: params.venue_id || null,
              listed: true,
              shareable: true,
            },
          }),
        });

        // Create ticket class if price provided
        if (params.ticket_name && params.ticket_price !== undefined) {
          await ebFetch(`/events/${event.id}/ticket_classes/`, {
            method: "POST",
            body: JSON.stringify({
              ticket_class: {
                name: params.ticket_name || "General Admission",
                quantity_total: params.ticket_quantity || 100,
                cost: `${params.currency || "USD"},${Math.round((params.ticket_price || 0) * 100)}`,
                free: params.ticket_price === 0,
              },
            }),
          });
        }

        // Publish event if requested
        if (params.publish) {
          try {
            await ebFetch(`/events/${event.id}/publish/`, { method: "POST" });
          } catch (pubErr) {
            console.warn("Could not auto-publish:", pubErr);
          }
        }

        // Save to tour_dates
        await supabase.from("tour_dates").insert({
          artist_id: user.id,
          venue: params.venue_name || "TBA",
          city: params.city || "Online",
          state: params.state || null,
          country: params.country || "US",
          date_time: params.start_utc,
          ticket_url: event.url,
          eventbrite_event_id: event.id,
          status: "confirmed",
        });

        result = event;
        break;
      }

      case "get_event": {
        if (!params.event_id) throw new Error("event_id required");
        result = await ebFetch(`/events/${params.event_id}/?expand=venue,ticket_classes`);
        break;
      }

      case "create_venue": {
        const orgId = params.organization_id;
        if (!orgId) throw new Error("organization_id required");
        result = await ebFetch(`/organizations/${orgId}/venues/`, {
          method: "POST",
          body: JSON.stringify({
            venue: {
              name: params.name,
              address: {
                address_1: params.address_1 || "",
                city: params.city || "",
                region: params.region || "",
                postal_code: params.postal_code || "",
                country: params.country || "US",
              },
            },
          }),
        });
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Eventbrite error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
