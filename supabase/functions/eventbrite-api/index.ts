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
      // ── Organizations ──
      case "get_organizations": {
        result = await ebFetch("/users/me/organizations/");
        break;
      }

      // ── List Events ──
      case "list_events": {
        const orgId = params.organization_id;
        if (!orgId) throw new Error("organization_id required");
        const status = params.status || "live,draft,started";
        result = await ebFetch(
          `/organizations/${orgId}/events/?status=${status}&order_by=start_desc&expand=venue,ticket_classes,music_properties`
        );
        break;
      }

      // ── Create Event ──
      case "create_event": {
        const orgId = params.organization_id;
        if (!orgId) throw new Error("organization_id required");

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
              capacity: params.capacity || null,
            },
          }),
        });

        // Create ticket class(es)
        if (params.ticket_name && params.ticket_price !== undefined) {
          const ticketBody: any = {
            ticket_class: {
              name: params.ticket_name || "General Admission",
              quantity_total: params.ticket_quantity || 100,
              free: params.ticket_price === 0,
            },
          };
          if (params.ticket_price > 0) {
            ticketBody.ticket_class.cost = `${params.currency || "USD"},${Math.round(params.ticket_price * 100)}`;
          }
          await ebFetch(`/events/${event.id}/ticket_classes/`, {
            method: "POST",
            body: JSON.stringify(ticketBody),
          });
        }

        // Create VIP ticket if specified
        if (params.vip_ticket_price && params.vip_ticket_price > 0) {
          await ebFetch(`/events/${event.id}/ticket_classes/`, {
            method: "POST",
            body: JSON.stringify({
              ticket_class: {
                name: params.vip_ticket_name || "VIP",
                quantity_total: params.vip_ticket_quantity || 50,
                cost: `${params.currency || "USD"},${Math.round(params.vip_ticket_price * 100)}`,
                free: false,
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

      // ── Get Event (with expansions) ──
      case "get_event": {
        if (!params.event_id) throw new Error("event_id required");
        result = await ebFetch(
          `/events/${params.event_id}/?expand=venue,ticket_classes,music_properties,ticket_availability`
        );
        break;
      }

      // ── Update Event ──
      case "update_event": {
        if (!params.event_id) throw new Error("event_id required");
        const updateBody: any = { event: {} };
        if (params.name) updateBody.event.name = { html: params.name };
        if (params.description) updateBody.event.description = { html: params.description };
        if (params.start_utc) {
          updateBody.event.start = { timezone: params.timezone || "America/New_York", utc: params.start_utc };
        }
        if (params.end_utc) {
          updateBody.event.end = { timezone: params.timezone || "America/New_York", utc: params.end_utc };
        }
        if (params.capacity) updateBody.event.capacity = params.capacity;
        if (params.listed !== undefined) updateBody.event.listed = params.listed;
        
        result = await ebFetch(`/events/${params.event_id}/`, {
          method: "POST",
          body: JSON.stringify(updateBody),
        });
        break;
      }

      // ── Publish / Unpublish ──
      case "publish_event": {
        if (!params.event_id) throw new Error("event_id required");
        result = await ebFetch(`/events/${params.event_id}/publish/`, { method: "POST" });
        break;
      }

      case "unpublish_event": {
        if (!params.event_id) throw new Error("event_id required");
        result = await ebFetch(`/events/${params.event_id}/unpublish/`, { method: "POST" });
        break;
      }

      // ── Cancel Event ──
      case "cancel_event": {
        if (!params.event_id) throw new Error("event_id required");
        result = await ebFetch(`/events/${params.event_id}/cancel/`, { method: "POST" });
        // Update local tour_dates status
        await supabase
          .from("tour_dates")
          .update({ status: "cancelled" })
          .eq("eventbrite_event_id", params.event_id);
        break;
      }

      // ── List Attendees ──
      case "list_attendees": {
        if (!params.event_id) throw new Error("event_id required");
        const continuation = params.continuation ? `&continuation=${params.continuation}` : "";
        result = await ebFetch(
          `/events/${params.event_id}/attendees/?expand=answers${continuation}`
        );
        break;
      }

      // ── List Orders ──
      case "list_orders": {
        if (!params.event_id) throw new Error("event_id required");
        result = await ebFetch(`/events/${params.event_id}/orders/`);
        break;
      }

      // ── List Ticket Classes ──
      case "list_ticket_classes": {
        if (!params.event_id) throw new Error("event_id required");
        result = await ebFetch(`/events/${params.event_id}/ticket_classes/`);
        break;
      }

      // ── Create / Update Ticket Class ──
      case "create_ticket_class": {
        if (!params.event_id) throw new Error("event_id required");
        const tcBody: any = {
          ticket_class: {
            name: params.name || "General Admission",
            quantity_total: params.quantity_total || 100,
            free: params.price === 0 || !params.price,
          },
        };
        if (params.price && params.price > 0) {
          tcBody.ticket_class.cost = `${params.currency || "USD"},${Math.round(params.price * 100)}`;
        }
        if (params.description) tcBody.ticket_class.description = params.description;
        if (params.sales_start) tcBody.ticket_class.sales_start = params.sales_start;
        if (params.sales_end) tcBody.ticket_class.sales_end = params.sales_end;
        
        result = await ebFetch(`/events/${params.event_id}/ticket_classes/`, {
          method: "POST",
          body: JSON.stringify(tcBody),
        });
        break;
      }

      // ── Create Discount ──
      case "create_discount": {
        const orgId = params.organization_id;
        if (!orgId) throw new Error("organization_id required");
        const discountBody: any = {
          discount: {
            code: params.code,
            type: params.type || "coded",
            event_id: params.event_id || null,
            quantity_available: params.quantity_available || 0,
          },
        };
        if (params.amount_off) discountBody.discount.amount_off = params.amount_off;
        if (params.percent_off) discountBody.discount.percent_off = params.percent_off;
        
        result = await ebFetch(`/organizations/${orgId}/discounts/`, {
          method: "POST",
          body: JSON.stringify(discountBody),
        });
        break;
      }

      // ── Create Venue ──
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

      // ── List Venues ──
      case "list_venues": {
        const orgId = params.organization_id;
        if (!orgId) throw new Error("organization_id required");
        result = await ebFetch(`/organizations/${orgId}/venues/`);
        break;
      }

      // ── Sales Report ──
      case "sales_report": {
        if (!params.event_id) throw new Error("event_id required");
        // Get ticket classes for sales data
        const ticketClasses = await ebFetch(`/events/${params.event_id}/ticket_classes/`);
        const attendees = await ebFetch(`/events/${params.event_id}/attendees/?status=attending`);
        
        let totalSold = 0;
        let totalRevenue = 0;
        const ticketBreakdown: any[] = [];
        
        for (const tc of (ticketClasses.ticket_classes || [])) {
          const sold = tc.quantity_sold || 0;
          totalSold += sold;
          const price = tc.cost ? (tc.cost.value || 0) / 100 : 0;
          totalRevenue += sold * price;
          ticketBreakdown.push({
            name: tc.name,
            sold,
            total: tc.quantity_total,
            price,
            revenue: sold * price,
            free: tc.free || false,
          });
        }
        
        result = {
          total_sold: totalSold,
          total_revenue: totalRevenue,
          total_attendees: attendees.pagination?.object_count || 0,
          ticket_breakdown: ticketBreakdown,
          currency: ticketClasses.ticket_classes?.[0]?.cost?.currency || "USD",
        };
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
