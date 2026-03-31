import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { action, track_id, album_id } = await req.json();

    // Get artist context
    const [profileRes, tracksRes, earningsRes, narrativeRes] = await Promise.all([
      supabase.from("artist_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("tracks").select("*").eq("user_id", user.id).order("play_count", { ascending: false }).limit(20),
      supabase.from("artist_earnings").select("*").eq("artist_id", user.id).order("period_start", { ascending: false }).limit(6),
      supabase.from("artist_narrative").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    const profile = profileRes.data;
    const tracks = tracksRes.data || [];
    const narrative = narrativeRes.data;

    const context = `
Artist: ${profile?.artist_name || "Unknown"}
Monthly Listeners: ${profile?.monthly_listeners || 0}
Total Tracks: ${tracks.length}
Top Genre: ${tracks[0]?.genre || "Various"}
Avg Plays/Track: ${tracks.length > 0 ? Math.round(tracks.reduce((s, t) => s + (t.play_count || 0), 0) / tracks.length) : 0}
Brand Voice: ${narrative?.brand_voice || "authentic"}
Mission: ${narrative?.artist_mission || ""}`;

    let systemPrompt = "";
    let userPrompt = "";
    let tools: any[] | undefined;
    let tool_choice: any | undefined;

    switch (action) {
      case "optimize-metadata": {
        const track = track_id ? tracks.find((t: any) => t.id === track_id) : tracks[0];
        systemPrompt = `You are an expert music metadata optimizer. Optimize track metadata for maximum discoverability on streaming platforms.`;
        userPrompt = `Optimize metadata for: "${track?.title}" by ${profile?.artist_name}. Genre: ${track?.genre}. Current plays: ${track?.play_count}. ${context}`;
        
        tools = [{
          type: "function",
          function: {
            name: "metadata_optimization",
            description: "Optimized metadata recommendations",
            parameters: {
              type: "object",
              properties: {
                optimized_title: { type: "string" },
                genre_tags: { type: "array", items: { type: "string" } },
                mood_tags: { type: "array", items: { type: "string" } },
                description: { type: "string" },
                target_playlists: { type: "array", items: { type: "string" } },
                seo_keywords: { type: "array", items: { type: "string" } },
                release_timing: { type: "string", description: "Best day/time to release" },
                confidence_score: { type: "number", description: "0-100 confidence in optimization" },
              },
              required: ["optimized_title", "genre_tags", "mood_tags", "description", "target_playlists", "release_timing", "confidence_score"],
              additionalProperties: false,
            },
          },
        }];
        tool_choice = { type: "function", function: { name: "metadata_optimization" } };
        break;
      }

      case "pricing-strategy": {
        systemPrompt = `You are a music industry pricing strategist. Recommend optimal download pricing based on market data.`;
        userPrompt = `Recommend download pricing strategy. ${context}. Current avg track plays: ${tracks.length > 0 ? Math.round(tracks.reduce((s, t) => s + (t.play_count || 0), 0) / tracks.length) : 0}. Number of tracks: ${tracks.length}.`;
        
        tools = [{
          type: "function",
          function: {
            name: "pricing_recommendations",
            description: "Download pricing strategy",
            parameters: {
              type: "object",
              properties: {
                single_price: { type: "number", description: "Recommended single track price" },
                album_price: { type: "number", description: "Recommended album price" },
                bundle_discount: { type: "number", description: "Percentage discount for bundles" },
                premium_tracks: { type: "array", items: { type: "string" }, description: "Tracks that could command premium pricing" },
                rationale: { type: "string" },
                projected_monthly_revenue: { type: "string" },
              },
              required: ["single_price", "album_price", "bundle_discount", "rationale", "projected_monthly_revenue"],
              additionalProperties: false,
            },
          },
        }];
        tool_choice = { type: "function", function: { name: "pricing_recommendations" } };
        break;
      }

      case "growth-audit": {
        systemPrompt = `You are a music industry growth consultant performing a comprehensive career audit.`;
        userPrompt = `Perform a growth audit. ${context}. Verified: ${profile?.verified}. Bio: ${profile?.bio?.substring(0, 200) || "Not set"}`;
        
        tools = [{
          type: "function",
          function: {
            name: "growth_audit",
            description: "Comprehensive growth audit results",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "number", description: "0-100 overall health score" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                immediate_actions: { type: "array", items: { type: "object", properties: { action: { type: "string" }, impact: { type: "string" }, effort: { type: "string", enum: ["low", "medium", "high"] } }, required: ["action", "impact", "effort"], additionalProperties: false } },
                thirty_day_plan: { type: "array", items: { type: "string" } },
                revenue_potential: { type: "string" },
              },
              required: ["overall_score", "strengths", "weaknesses", "immediate_actions", "thirty_day_plan", "revenue_potential"],
              additionalProperties: false,
            },
          },
        }];
        tool_choice = { type: "function", function: { name: "growth_audit" } };
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
        return new Response(JSON.stringify({ error: "Rate limited — try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
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
    console.error("Release optimizer error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
