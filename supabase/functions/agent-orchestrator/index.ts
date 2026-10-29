import "../_shared/aiFallback.ts";
import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { publicError } from "../_shared/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Tools the AI agent can call — each maps to a real edge function or DB query
const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_artist_analytics",
      description: "Get real-time analytics for the artist including streams, revenue, top tracks, fan demographics",
      parameters: {
        type: "object",
        properties: {
          time_range: { type: "string", enum: ["7d", "30d", "90d", "all"], description: "Time range for analytics" },
        },
        required: ["time_range"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_release_strategy",
      description: "Generate an AI-powered release strategy with timeline, marketing plan, and content calendar",
      parameters: {
        type: "object",
        properties: {
          release_type: { type: "string", enum: ["single", "ep", "album"], description: "Type of release" },
          genre: { type: "string", description: "Primary genre" },
          target_date: { type: "string", description: "Target release date (ISO)" },
        },
        required: ["release_type", "genre"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "optimize_revenue",
      description: "Analyze current revenue streams and suggest optimization strategies",
      parameters: {
        type: "object",
        properties: {
          focus: { type: "string", enum: ["streaming", "downloads", "merch", "touring", "all"], description: "Revenue area to focus on" },
        },
        required: ["focus"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_fan_engagement",
      description: "Deep analysis of fan engagement patterns, super fans, and growth opportunities",
      parameters: {
        type: "object",
        properties: {
          segment: { type: "string", enum: ["all", "super_fans", "new_fans", "inactive"], description: "Fan segment to analyze" },
        },
        required: ["segment"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_marketing_content",
      description: "Generate marketing content (captions, bios, press releases, email campaigns)",
      parameters: {
        type: "object",
        properties: {
          content_type: { type: "string", enum: ["caption", "bio", "press-release", "email", "announcement"], description: "Type of content" },
          tone: { type: "string", enum: ["professional", "casual", "hype", "intimate"], description: "Tone of content" },
          topic: { type: "string", description: "What the content should be about" },
        },
        required: ["content_type", "tone", "topic"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_momentum_insights",
      description: "Get momentum score breakdown and specific actions to increase it",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tour_recommendations",
      description: "Get AI-powered tour routing and venue recommendations based on fan geography",
      parameters: {
        type: "object",
        properties: {
          region: { type: "string", enum: ["north_america", "europe", "asia", "global"], description: "Target region" },
          budget: { type: "string", enum: ["low", "medium", "high"], description: "Tour budget level" },
        },
        required: ["region"],
        additionalProperties: false,
      },
    },
  },
];

// Execute a tool by calling internal DB or edge functions
async function executeTool(
  toolName: string,
  args: Record<string, any>,
  userId: string,
  supabase: any
): Promise<string> {
  switch (toolName) {
    case "get_artist_analytics": {
      const [tracks, earnings, profile, streams] = await Promise.all([
        supabase.from("tracks").select("id, title, play_count, like_count, genre, created_at, download_price")
          .eq("user_id", userId).order("play_count", { ascending: false }).limit(20),
        supabase.from("artist_earnings").select("*").eq("artist_id", userId).order("period_start", { ascending: false }).limit(12),
        supabase.from("artist_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("stream_events").select("created_at, track_id").eq("artist_id", userId).limit(500),
      ]);

      const totalPlays = (tracks.data || []).reduce((s: number, t: any) => s + (t.play_count || 0), 0);
      const totalLikes = (tracks.data || []).reduce((s: number, t: any) => s + (t.like_count || 0), 0);
      const totalEarnings = (earnings.data || []).reduce((s: number, e: any) => s + (e.streaming_revenue || 0) + (e.download_revenue || 0), 0);

      return JSON.stringify({
        artist_name: profile.data?.artist_name || "Unknown",
        monthly_listeners: profile.data?.monthly_listeners || 0,
        verified: profile.data?.verified || false,
        total_tracks: (tracks.data || []).length,
        total_plays: totalPlays,
        total_likes: totalLikes,
        total_earnings: `$${totalEarnings.toFixed(2)}`,
        top_tracks: (tracks.data || []).slice(0, 5).map((t: any) => ({
          title: t.title, plays: t.play_count, likes: t.like_count, genre: t.genre,
        })),
        genres: [...new Set((tracks.data || []).map((t: any) => t.genre).filter(Boolean))],
        recent_earnings: (earnings.data || []).slice(0, 3).map((e: any) => ({
          period: `${e.period_start} to ${e.period_end}`,
          streaming: `$${e.streaming_revenue}`,
          downloads: `$${e.download_revenue}`,
          status: e.payout_status,
        })),
      });
    }

    case "generate_release_strategy": {
      const { data: tracks } = await supabase.from("tracks")
        .select("genre, play_count, created_at").eq("user_id", userId).order("play_count", { ascending: false }).limit(10);
      const { data: profile } = await supabase.from("artist_profiles")
        .select("artist_name, monthly_listeners").eq("user_id", userId).maybeSingle();

      return JSON.stringify({
        artist: profile?.artist_name || "Artist",
        listeners: profile?.monthly_listeners || 0,
        release_type: args.release_type,
        genre: args.genre,
        target_date: args.target_date || "TBD",
        top_performing_genres: [...new Set((tracks || []).map((t: any) => t.genre).filter(Boolean))],
        avg_plays: (tracks || []).length > 0
          ? Math.round((tracks || []).reduce((s: number, t: any) => s + (t.play_count || 0), 0) / tracks.length)
          : 0,
        recommendation: "Data loaded — generate strategy based on these metrics",
      });
    }

    case "optimize_revenue": {
      const [earnings, downloads, tips, subs] = await Promise.all([
        supabase.from("artist_earnings").select("streaming_revenue, download_revenue, total_streams")
          .eq("artist_id", userId).order("period_start", { ascending: false }).limit(6),
        supabase.from("download_purchases").select("price, artist_revenue").eq("artist_id", userId),
        supabase.from("artist_tips").select("amount").eq("artist_id", userId),
        supabase.from("user_subscriptions").select("plan, status").eq("user_id", userId).maybeSingle(),
      ]);

      const streamRev = (earnings.data || []).reduce((s: number, e: any) => s + (e.streaming_revenue || 0), 0);
      const dlRev = (downloads.data || []).reduce((s: number, d: any) => s + (d.artist_revenue || 0), 0);
      const tipRev = (tips.data || []).reduce((s: number, t: any) => s + (t.amount || 0), 0);

      return JSON.stringify({
        focus: args.focus,
        current_plan: subs.data?.plan || "free",
        revenue_breakdown: {
          streaming: `$${streamRev.toFixed(2)}`,
          downloads: `$${dlRev.toFixed(2)}`,
          tips: `$${tipRev.toFixed(2)}`,
          total: `$${(streamRev + dlRev + tipRev).toFixed(2)}`,
        },
        total_downloads: (downloads.data || []).length,
        avg_download_price: (downloads.data || []).length > 0
          ? `$${((downloads.data || []).reduce((s: number, d: any) => s + (d.price || 0), 0) / downloads.data.length).toFixed(2)}`
          : "$0.00",
      });
    }

    case "analyze_fan_engagement": {
      const [fanMetrics, followers, engagement] = await Promise.all([
        supabase.from("fan_metrics").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("artist_follows").select("id", { count: "exact", head: true }).eq("artist_id", userId),
        supabase.from("fan_engagement").select("*").limit(100),
      ]);

      return JSON.stringify({
        segment: args.segment,
        email_list_size: fanMetrics.data?.email_list_size || 0,
        super_fans: fanMetrics.data?.super_fans_count || 0,
        open_rate: `${(fanMetrics.data?.open_rate || 0).toFixed(1)}%`,
        conversion_rate: `${(fanMetrics.data?.conversion_rate || 0).toFixed(1)}%`,
        total_followers: followers.count || 0,
      });
    }

    case "generate_marketing_content": {
      const { data: profile } = await supabase.from("artist_profiles")
        .select("artist_name, bio").eq("user_id", userId).maybeSingle();
      const { data: narrative } = await supabase.from("artist_narrative")
        .select("*").eq("user_id", userId).maybeSingle();

      return JSON.stringify({
        content_type: args.content_type,
        tone: args.tone,
        topic: args.topic,
        artist_name: profile?.artist_name || "Artist",
        bio: profile?.bio || "",
        brand_voice: narrative?.brand_voice || "authentic",
        origin_story: narrative?.origin_story || "",
        mission: narrative?.artist_mission || "",
      });
    }

    case "get_momentum_insights": {
      const { data: momentum } = await supabase.from("momentum_scores")
        .select("*").eq("user_id", userId).maybeSingle();
      const { data: recentTracks } = await supabase.from("tracks")
        .select("title, created_at, play_count, is_published")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(5);

      return JSON.stringify({
        score: momentum?.score || 0,
        streak_days: momentum?.streak_days || 0,
        recent_tracks: (recentTracks || []).map((t: any) => ({
          title: t.title, published: t.is_published, plays: t.play_count,
          days_ago: Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000),
        })),
      });
    }

    case "tour_recommendations": {
      const { data: demographics } = await supabase.from("listener_demographics")
        .select("country, city, listener_count").eq("artist_id", userId).order("listener_count", { ascending: false }).limit(20);
      const { data: profile } = await supabase.from("artist_profiles")
        .select("artist_name, monthly_listeners").eq("user_id", userId).maybeSingle();

      return JSON.stringify({
        region: args.region,
        budget: args.budget || "medium",
        artist: profile?.artist_name || "Artist",
        monthly_listeners: profile?.monthly_listeners || 0,
        top_markets: (demographics || []).slice(0, 10).map((d: any) => ({
          city: d.city, country: d.country, listeners: d.listener_count,
        })),
      });
    }

    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth
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

    const { messages, context } = await req.json().catch(() => ({}));

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get artist profile for context
    const { data: profile } = await supabase.from("artist_profiles")
      .select("artist_name, monthly_listeners, verified, total_plays")
      .eq("user_id", user.id).maybeSingle();

    const systemPrompt = `You are a senior executive at TDZ Distribution — a major record label and streaming platform that pays artists $1 per stream. You have direct access to the artist's real data through tools.

ARTIST: ${profile?.artist_name || "Artist"} | Monthly Listeners: ${profile?.monthly_listeners || 0} | Verified: ${profile?.verified ? "Yes" : "No"} | Total Plays: ${profile?.total_plays || 0}

YOUR CAPABILITIES:
- Pull real-time analytics (streams, revenue, demographics)
- Generate release strategies with timelines
- Optimize revenue across all streams
- Analyze fan engagement and identify growth opportunities
- Create marketing content (captions, bios, press releases, emails)
- Provide momentum insights and actionable boosters
- Recommend tour routes based on fan geography

RULES:
- Always use tools to get real data before making recommendations
- Be specific and actionable — no generic advice
- Reference the artist's actual metrics
- Think like a top-tier music industry strategist
- Be concise but impactful (2-3 paragraphs + specific action items)
- When generating content, make it sound like the artist, not corporate
- Stay in character for your department role

${context ? `DEPARTMENT CONTEXT: ${context}` : ""}`;

    // Initial AI call with tools
    let aiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content.substring(0, 5000) : "",
      })),
    ];

    let maxIterations = 5;
    let finalContent = "";

    while (maxIterations > 0) {
      maxIterations--;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          tools: AGENT_TOOLS,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited — please try again shortly." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await response.text();
        console.error("AI gateway error:", response.status, errText);
        throw new Error("AI gateway error");
      }

      const result = await response.json();
      const choice = result.choices?.[0];

      if (!choice) throw new Error("No response from AI");

      // If the AI wants to call tools
      if (choice.finish_reason === "tool_calls" || choice.message?.tool_calls?.length) {
        const toolCalls = choice.message.tool_calls || [];
        
        // Add assistant message with tool calls
        aiMessages.push(choice.message);

        // Execute all tool calls in parallel
        const toolResults = await Promise.all(
          toolCalls.map(async (tc: any) => {
            const args = JSON.parse(tc.function.arguments || "{}");
            const result = await executeTool(tc.function.name, args, user.id, supabase);
            return {
              role: "tool",
              tool_call_id: tc.id,
              content: result,
            };
          })
        );

        aiMessages.push(...toolResults);
        continue; // Loop back for the AI to process tool results
      }

      // AI is done — return the final response
      finalContent = choice.message?.content || "I couldn't generate a response.";
      break;
    }

    return new Response(JSON.stringify({ response: finalContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Agent orchestrator error:", error);
    return new Response(JSON.stringify({ error: publicError(error, "Unknown error") }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
