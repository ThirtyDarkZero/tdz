import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { publicError } from "../_shared/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = await req.json().catch(() => ({}));

    // Gather comprehensive fan data
    const [followers, fanMetrics, demographics, contacts, innerCircle, tips, engagement] = await Promise.all([
      supabase.from("artist_follows").select("follower_id, created_at").eq("artist_id", user.id).order("created_at", { ascending: false }).limit(200),
      supabase.from("fan_metrics").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("listener_demographics")
        .select("city,country,country_code,device_type,browser,os,gender,age_range,listening_time_of_day,language,referral_source,listener_id")
        .eq("artist_id", user.id)
        .limit(30),
      supabase.from("artist_contacts").select("*").eq("artist_id", user.id),
      supabase.from("inner_circle_members").select("*").eq("artist_id", user.id),
      supabase.from("artist_tips").select("amount, created_at").eq("artist_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("fan_engagement").select("*").limit(50),
    ]);

    const profile = await supabase.from("artist_profiles").select("artist_name, monthly_listeners").eq("user_id", user.id).maybeSingle();

    const fanData = `
Artist: ${profile.data?.artist_name || "Artist"}
Monthly Listeners: ${profile.data?.monthly_listeners || 0}
Total Followers: ${(followers.data || []).length}
Email List: ${fanMetrics.data?.email_list_size || 0}
Super Fans: ${fanMetrics.data?.super_fans_count || 0}
Email Open Rate: ${fanMetrics.data?.open_rate || 0}%
Conversion Rate: ${fanMetrics.data?.conversion_rate || 0}%
Inner Circle Members: ${(innerCircle.data || []).length}
Total Tips: $${(tips.data || []).reduce((s: number, t: any) => s + (t.amount || 0), 0).toFixed(2)}
Contacts: ${(contacts.data || []).length}
Top Markets: ${(demographics.data || []).slice(0, 5).map((d: any) => `${d.city}, ${d.country} (${d.listener_count})`).join("; ")}
New Followers (30d): ${(followers.data || []).filter((f: any) => new Date(f.created_at) > new Date(Date.now() - 30 * 86400000)).length}`;

    let systemPrompt = "";
    let userPrompt = "";
    let tools: any[] | undefined;
    let tool_choice: any | undefined;

    switch (action) {
      case "super-fan-analysis": {
        systemPrompt = `You are a fan engagement analyst. Identify and analyze super fan patterns.`;
        userPrompt = `Analyze super fan dynamics. ${fanData}`;
        tools = [{
          type: "function",
          function: {
            name: "super_fan_report",
            description: "Super fan analysis report",
            parameters: {
              type: "object",
              properties: {
                super_fan_score: { type: "number", description: "0-100 super fan health" },
                growth_trend: { type: "string", enum: ["growing", "stable", "declining"] },
                engagement_strategies: { type: "array", items: { type: "object", properties: { strategy: { type: "string" }, expected_impact: { type: "string" }, priority: { type: "string", enum: ["high", "medium", "low"] } }, required: ["strategy", "expected_impact", "priority"], additionalProperties: false } },
                monetization_opportunities: { type: "array", items: { type: "string" } },
                fan_retention_tips: { type: "array", items: { type: "string" } },
                inner_circle_recommendation: { type: "string" },
              },
              required: ["super_fan_score", "growth_trend", "engagement_strategies", "monetization_opportunities", "fan_retention_tips"],
              additionalProperties: false,
            },
          },
        }];
        tool_choice = { type: "function", function: { name: "super_fan_report" } };
        break;
      }

      case "email-optimization": {
        systemPrompt = `You are an email marketing expert for musicians.`;
        userPrompt = `Optimize email strategy. ${fanData}`;
        tools = [{
          type: "function",
          function: {
            name: "email_optimization",
            description: "Email marketing optimization plan",
            parameters: {
              type: "object",
              properties: {
                current_health: { type: "string" },
                open_rate_benchmark: { type: "string" },
                subject_line_tips: { type: "array", items: { type: "string" } },
                segmentation_plan: { type: "array", items: { type: "object", properties: { segment: { type: "string" }, size_estimate: { type: "string" }, content_strategy: { type: "string" } }, required: ["segment", "size_estimate", "content_strategy"], additionalProperties: false } },
                automation_sequences: { type: "array", items: { type: "object", properties: { trigger: { type: "string" }, emails: { type: "number" }, goal: { type: "string" } }, required: ["trigger", "emails", "goal"], additionalProperties: false } },
                list_growth_tactics: { type: "array", items: { type: "string" } },
              },
              required: ["current_health", "subject_line_tips", "segmentation_plan", "list_growth_tactics"],
              additionalProperties: false,
            },
          },
        }];
        tool_choice = { type: "function", function: { name: "email_optimization" } };
        break;
      }

      case "geographic-strategy": {
        systemPrompt = `You are a geographic expansion strategist for artists.`;
        userPrompt = `Create geographic expansion strategy. ${fanData}`;
        tools = [{
          type: "function",
          function: {
            name: "geo_strategy",
            description: "Geographic expansion plan",
            parameters: {
              type: "object",
              properties: {
                primary_markets: { type: "array", items: { type: "object", properties: { market: { type: "string" }, listeners: { type: "number" }, growth_potential: { type: "string" }, actions: { type: "array", items: { type: "string" } } }, required: ["market", "growth_potential", "actions"], additionalProperties: false } },
                expansion_markets: { type: "array", items: { type: "object", properties: { market: { type: "string" }, rationale: { type: "string" }, entry_strategy: { type: "string" } }, required: ["market", "rationale", "entry_strategy"], additionalProperties: false } },
                playlist_targets_by_region: { type: "array", items: { type: "string" } },
                touring_priority: { type: "array", items: { type: "string" } },
              },
              required: ["primary_markets", "expansion_markets", "touring_priority"],
              additionalProperties: false,
            },
          },
        }];
        tool_choice = { type: "function", function: { name: "geo_strategy" } };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };
    if (tools) body.tools = tools;
    if (tool_choice) body.tool_choice = tool_choice;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ result: JSON.parse(toolCall.function.arguments) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ result: result.choices?.[0]?.message?.content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Fan intelligence error:", error);
    return new Response(JSON.stringify({ error: publicError(error, "Unknown error") }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
