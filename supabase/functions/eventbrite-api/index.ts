import "../_shared/fetchTimeout.ts";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) throw new Error("Unauthorized");

    // Try per-user OAuth token first, fall back to shared env token
    let token: string | null = null;
    const { data: tokenRow } = await supabase
      .from("artist_eventbrite_tokens")
      .select("access_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (tokenRow?.access_token) {
      token = tokenRow.access_token;
    } else {
      token = Deno.env.get("EVENTBRITE_API_TOKEN") || null;
    }

    if (!token) throw new Error("EVENTBRITE_NOT_CONNECTED");

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
        const timeFilter = params.time_filter ? `&time_filter=${params.time_filter}` : "";
        result = await ebFetch(
          `/organizations/${orgId}/events/?status=${status}&order_by=start_desc&expand=venue,ticket_classes,music_properties${timeFilter}`
        );
        break;
      }

      // ── Create Event ──
      case "create_event": {
        const orgId = params.organization_id;
        if (!orgId) throw new Error("organization_id required");

        const eventBody: any = {
          event: {
            name: { html: params.name },
            description: { html: params.description || "" },
            start: { timezone: params.timezone || "America/New_York", utc: params.start_utc },
            end: { timezone: params.timezone || "America/New_York", utc: params.end_utc },
            currency: params.currency || "USD",
            online_event: params.online_event || false,
            listed: params.listed !== false,
            shareable: true,
            capacity: params.capacity || null,
            invite_only: params.invite_only || false,
            show_remaining: params.show_remaining || false,
            summary: params.summary || null,
          },
        };

        if (params.venue_id) eventBody.event.venue_id = params.venue_id;
        if (params.password) eventBody.event.password = params.password;
        if (params.category_id) eventBody.event.category_id = params.category_id;

        const event = await ebFetch(`/organizations/${orgId}/events/`, {
          method: "POST",
          body: JSON.stringify(eventBody),
        });

        // Create ticket classes
        if (params.ticket_classes && Array.isArray(params.ticket_classes)) {
          for (const tc of params.ticket_classes) {
            const tcBody: any = {
              ticket_class: {
                name: tc.name || "General Admission",
                quantity_total: tc.quantity_total || 100,
                free: tc.price === 0 || tc.free || !tc.price,
                donation: tc.donation || false,
                hidden: tc.hidden || false,
              },
            };
            if (tc.price && tc.price > 0) {
              tcBody.ticket_class.cost = `${params.currency || "USD"},${Math.round(tc.price * 100)}`;
              tcBody.ticket_class.free = false;
            }
            if (tc.description) tcBody.ticket_class.description = tc.description;
            if (tc.sales_start) tcBody.ticket_class.sales_start = tc.sales_start;
            if (tc.sales_end) tcBody.ticket_class.sales_end = tc.sales_end;
            if (tc.minimum_quantity) tcBody.ticket_class.minimum_quantity = tc.minimum_quantity;
            if (tc.maximum_quantity) tcBody.ticket_class.maximum_quantity = tc.maximum_quantity;
            if (tc.sales_channels) tcBody.ticket_class.sales_channels = tc.sales_channels;

            await ebFetch(`/events/${event.id}/ticket_classes/`, {
              method: "POST",
              body: JSON.stringify(tcBody),
            });
          }
        } else {
          // Legacy: single GA + optional VIP
          if (params.ticket_name || params.ticket_price !== undefined) {
            const tcBody: any = {
              ticket_class: {
                name: params.ticket_name || "General Admission",
                quantity_total: params.ticket_quantity || 100,
                free: params.ticket_price === 0 || !params.ticket_price,
              },
            };
            if (params.ticket_price && params.ticket_price > 0) {
              tcBody.ticket_class.cost = `${params.currency || "USD"},${Math.round(params.ticket_price * 100)}`;
              tcBody.ticket_class.free = false;
            }
            await ebFetch(`/events/${event.id}/ticket_classes/`, {
              method: "POST",
              body: JSON.stringify(tcBody),
            });
          }
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
        }

        // Publish if requested
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
          city: params.city || (params.online_event ? "Online" : "TBA"),
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

      // ── Copy Event ──
      case "copy_event": {
        if (!params.event_id) throw new Error("event_id required");
        result = await ebFetch(`/events/${params.event_id}/copy/`, { method: "POST" });
        break;
      }

      // ── Get Event ──
      case "get_event": {
        if (!params.event_id) throw new Error("event_id required");
        const expand = params.expand || "venue,ticket_classes,music_properties,ticket_availability";
        result = await ebFetch(`/events/${params.event_id}/?expand=${expand}`);
        break;
      }

      // ── Update Event ──
      case "update_event": {
        if (!params.event_id) throw new Error("event_id required");
        const updateBody: any = { event: {} };
        if (params.name) updateBody.event.name = { html: params.name };
        if (params.description) updateBody.event.description = { html: params.description };
        if (params.summary !== undefined) updateBody.event.summary = params.summary;
        if (params.start_utc) {
          updateBody.event.start = { timezone: params.timezone || "America/New_York", utc: params.start_utc };
        }
        if (params.end_utc) {
          updateBody.event.end = { timezone: params.timezone || "America/New_York", utc: params.end_utc };
        }
        if (params.capacity !== undefined) updateBody.event.capacity = params.capacity;
        if (params.listed !== undefined) updateBody.event.listed = params.listed;
        if (params.online_event !== undefined) updateBody.event.online_event = params.online_event;
        if (params.shareable !== undefined) updateBody.event.shareable = params.shareable;
        if (params.invite_only !== undefined) updateBody.event.invite_only = params.invite_only;
        if (params.show_remaining !== undefined) updateBody.event.show_remaining = params.show_remaining;
        if (params.password !== undefined) updateBody.event.password = params.password;
        if (params.venue_id) updateBody.event.venue_id = params.venue_id;

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
        await supabase
          .from("tour_dates")
          .update({ status: "cancelled" })
          .eq("eventbrite_event_id", params.event_id);
        break;
      }

      // ── List Attendees ──
      case "list_attendees": {
        if (!params.event_id) throw new Error("event_id required");
        let path = `/events/${params.event_id}/attendees/?expand=answers`;
        if (params.status) path += `&status=${params.status}`;
        if (params.continuation) path += `&continuation=${params.continuation}`;
        result = await ebFetch(path);
        break;
      }

      // ── List Orders ──
      case "list_orders": {
        if (!params.event_id) throw new Error("event_id required");
        let path = `/events/${params.event_id}/orders/?expand=attendees`;
        if (params.status) path += `&status=${params.status}`;
        if (params.changed_since) path += `&changed_since=${params.changed_since}`;
        if (params.only_emails) path += `&only_emails=${params.only_emails}`;
        result = await ebFetch(path);
        break;
      }

      // ── Get Single Order ──
      case "get_order": {
        if (!params.order_id) throw new Error("order_id required");
        result = await ebFetch(`/orders/${params.order_id}/?expand=attendees`);
        break;
      }

      // ── List Ticket Classes ──
      case "list_ticket_classes": {
        if (!params.event_id) throw new Error("event_id required");
        result = await ebFetch(`/events/${params.event_id}/ticket_classes/`);
        break;
      }

      // ── Create Ticket Class ──
      case "create_ticket_class": {
        if (!params.event_id) throw new Error("event_id required");
        const tcBody: any = {
          ticket_class: {
            name: params.name || "General Admission",
            quantity_total: params.quantity_total || 100,
            free: params.price === 0 || !params.price,
            donation: params.donation || false,
            hidden: params.hidden || false,
          },
        };
        if (params.price && params.price > 0) {
          tcBody.ticket_class.cost = `${params.currency || "USD"},${Math.round(params.price * 100)}`;
          tcBody.ticket_class.free = false;
        }
        if (params.description) tcBody.ticket_class.description = params.description;
        if (params.sales_start) tcBody.ticket_class.sales_start = params.sales_start;
        if (params.sales_end) tcBody.ticket_class.sales_end = params.sales_end;
        if (params.minimum_quantity) tcBody.ticket_class.minimum_quantity = params.minimum_quantity;
        if (params.maximum_quantity) tcBody.ticket_class.maximum_quantity = params.maximum_quantity;

        result = await ebFetch(`/events/${params.event_id}/ticket_classes/`, {
          method: "POST",
          body: JSON.stringify(tcBody),
        });
        break;
      }

      // ── Update Ticket Class ──
      case "update_ticket_class": {
        if (!params.event_id || !params.ticket_class_id) throw new Error("event_id and ticket_class_id required");
        const utcBody: any = { ticket_class: {} };
        if (params.name) utcBody.ticket_class.name = params.name;
        if (params.quantity_total !== undefined) utcBody.ticket_class.quantity_total = params.quantity_total;
        if (params.price !== undefined) {
          if (params.price === 0) {
            utcBody.ticket_class.free = true;
          } else {
            utcBody.ticket_class.cost = `${params.currency || "USD"},${Math.round(params.price * 100)}`;
            utcBody.ticket_class.free = false;
          }
        }
        if (params.hidden !== undefined) utcBody.ticket_class.hidden = params.hidden;
        if (params.sales_start) utcBody.ticket_class.sales_start = params.sales_start;
        if (params.sales_end) utcBody.ticket_class.sales_end = params.sales_end;

        result = await ebFetch(`/events/${params.event_id}/ticket_classes/${params.ticket_class_id}/`, {
          method: "POST",
          body: JSON.stringify(utcBody),
        });
        break;
      }

      // ── Delete Ticket Class ──
      case "delete_ticket_class": {
        if (!params.event_id || !params.ticket_class_id) throw new Error("event_id and ticket_class_id required");
        await fetch(`${EVENTBRITE_BASE}/events/${params.event_id}/ticket_classes/${params.ticket_class_id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        result = { deleted: true };
        break;
      }

      // ── Custom Questions ──
      case "list_questions": {
        if (!params.event_id) throw new Error("event_id required");
        result = await ebFetch(`/events/${params.event_id}/questions/`);
        break;
      }

      case "list_canned_questions": {
        if (!params.event_id) throw new Error("event_id required");
        result = await ebFetch(`/events/${params.event_id}/canned_questions/`);
        break;
      }

      case "create_question": {
        if (!params.event_id) throw new Error("event_id required");
        const qBody: any = {
          question: {
            question: { html: params.question_text },
            type: params.type || "text",
            required: params.required || false,
            respondent: params.respondent || "attendee",
          },
        };
        if (params.choices && params.choices.length > 0) {
          qBody.question.choices = params.choices.map((c: string) => ({
            answer: { html: c },
          }));
        }
        if (params.ticket_classes && params.ticket_classes.length > 0) {
          qBody.question.ticket_classes = params.ticket_classes.map((id: string) => ({ id }));
        }
        result = await ebFetch(`/events/${params.event_id}/questions/`, {
          method: "POST",
          body: JSON.stringify(qBody),
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

      // ── List Discounts ──
      case "list_discounts": {
        const orgId = params.organization_id;
        if (!orgId) throw new Error("organization_id required");
        let path = `/organizations/${orgId}/discounts/`;
        if (params.event_id) path += `?event_id=${params.event_id}`;
        result = await ebFetch(path);
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
                address_2: params.address_2 || "",
                city: params.city || "",
                region: params.region || "",
                postal_code: params.postal_code || "",
                country: params.country || "US",
              },
              capacity: params.capacity || null,
              age_restriction: params.age_restriction || null,
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

      // ── Image Upload (Step 1: get upload instructions) ──
      case "get_image_upload_token": {
        const imgType = params.image_type || "image-event-logo";
        result = await ebFetch(`/media/upload/?type=${imgType}`);
        break;
      }

      // ── Image Upload (Step 3: notify API) ──
      case "notify_image_upload": {
        if (!params.upload_token) throw new Error("upload_token required");
        const notifyBody: any = { upload_token: params.upload_token };
        if (params.crop_mask) {
          notifyBody.crop_mask = params.crop_mask;
        } else {
          notifyBody.crop_mask = { top_left: { y: 1, x: 1 }, width: 1280, height: 640 };
        }
        result = await ebFetch(`/media/upload/`, {
          method: "POST",
          body: JSON.stringify(notifyBody),
        });
        break;
      }

      // ── Set Event Logo ──
      case "set_event_logo": {
        if (!params.event_id || !params.logo_id) throw new Error("event_id and logo_id required");
        result = await ebFetch(`/events/${params.event_id}/`, {
          method: "POST",
          body: JSON.stringify({ event: { logo_id: params.logo_id } }),
        });
        break;
      }

      // ── Structured Content (Event Description) ──
      case "get_structured_content": {
        if (!params.event_id) throw new Error("event_id required");
        const purpose = params.purpose || "listing";
        const version = params.version || "";
        result = await ebFetch(`/events/${params.event_id}/structured_content/${version}?purpose=${purpose}`);
        break;
      }

      case "set_structured_content": {
        if (!params.event_id) throw new Error("event_id required");
        const scVersion = params.version || "1";
        result = await ebFetch(`/events/${params.event_id}/structured_content/${scVersion}/`, {
          method: "POST",
          body: JSON.stringify({
            modules: params.modules || [],
            publish: params.publish !== false,
            purpose: params.purpose || "listing",
          }),
        });
        break;
      }

      // ── Online Event Page (Digital Links) ──
      case "set_online_event_page": {
        if (!params.event_id) throw new Error("event_id required");
        const pageVersion = params.version || "1";
        result = await ebFetch(`/events/${params.event_id}/structured_content/${pageVersion}/`, {
          method: "POST",
          body: JSON.stringify({
            modules: params.modules || [],
            publish: params.publish !== false,
            purpose: "digital_content",
          }),
        });
        break;
      }

      // ── Sales Report ──
      case "sales_report": {
        if (!params.event_id) throw new Error("event_id required");
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
            donation: tc.donation || false,
            on_sale_status: tc.on_sale_status || "AVAILABLE",
            sales_start: tc.sales_start,
            sales_end: tc.sales_end,
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
