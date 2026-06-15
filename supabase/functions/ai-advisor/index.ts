import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser, unauthorized } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Require authenticated user
  {
    const __auth = await requireUser(req);
    if (!__auth.user) return unauthorized(corsHeaders);
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { messages, advisorRole, systemPrompt } = await req.json();

    const systemPrompts: Record<string, string> = {
      cfo: `You are the AI Chief Financial Officer for TDZ Distribution, a music streaming and distribution platform that pays artists $1 per stream. You have access to platform financial data and provide strategic financial guidance, revenue analysis, payout recommendations, cash flow projections, and cost optimization strategies. Be direct, data-driven, and executive-level.`,
      counsel: `You are the AI General Counsel for TDZ Distribution. You provide legal guidance on music licensing, artist contracts, copyright matters, platform terms of service, DMCA compliance, revenue sharing agreements, and general music industry law. Always note your guidance is informational and not a substitute for qualified legal counsel.`,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt || systemPrompts[advisorRole] || systemPrompts.cfo },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("AI advisor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
