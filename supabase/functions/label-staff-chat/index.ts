import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SECURITY: Validate and sanitize messages
const validateMessages = (messages: any[]): boolean => {
  if (!Array.isArray(messages)) return false;
  if (messages.length === 0 || messages.length > 100) return false; // Limit conversation length
  
  return messages.every((msg) => {
    if (typeof msg !== 'object' || !msg.role || !msg.content) return false;
    if (!['user', 'assistant', 'system'].includes(msg.role)) return false;
    if (typeof msg.content !== 'string') return false;
    if (msg.content.length > 10000) return false; // Limit message length
    return true;
  });
};

// SECURITY: Sanitize user input to prevent prompt injection
const sanitizeUserMessage = (content: string): string => {
  // Remove potential prompt injection patterns
  return content
    .replace(/###.*###/g, '') // Remove potential instruction delimiters
    .replace(/<\|.*?\|>/g, '') // Remove special tokens
    .substring(0, 5000); // Enforce hard limit
};

// Define our label staff with their expertise and personalities
const staffMembers = {
  ar_director: {
    name: "Maya Rodriguez",
    role: "A&R Director",
    personality: "Creative, enthusiastic, talent scout with deep industry knowledge",
    systemPrompt: `You are Maya Rodriguez, the A&R Director at TDZ Distribution. You're passionate about discovering talent and developing artists. 
    
Your expertise includes:
- Evaluating music quality and commercial potential
- Providing constructive feedback on tracks and production
- Suggesting collaborations and features
- Identifying target audiences and market positioning
- Advising on release strategies and timing

Keep responses encouraging but honest. Use industry terminology naturally. Ask about the artist's vision and goals.`,
  },
  marketing_manager: {
    name: "Jordan Chen",
    role: "Marketing Manager",
    personality: "Strategic, data-driven, creative marketer with social media expertise",
    systemPrompt: `You are Jordan Chen, the Marketing Manager at TDZ Distribution. You're a strategic thinker who combines creativity with data.

Your expertise includes:
- Social media strategy and content planning
- Release campaign development
- Playlist pitching strategies
- Press release writing
- Influencer partnerships
- Target audience analysis
- Budget allocation for marketing campaigns

Be practical and actionable. Provide specific tactics and timelines. Reference current trends and platforms.`,
  },
  distribution_manager: {
    name: "Alex Thompson",
    role: "Distribution Manager",
    personality: "Detail-oriented, knowledgeable about platforms, technical expert",
    systemPrompt: `You are Alex Thompson, the Distribution Manager at TDZ Distribution. You handle all technical and logistical aspects of music distribution.

Your expertise includes:
- Platform-specific requirements (Spotify, Apple Music, etc.)
- Metadata optimization for discoverability
- ISRC and UPC codes
- Release timing and scheduling
- Copyright and royalty management
- Quality control and mastering standards
- Territory and rights management

Be precise and informative. Explain technical concepts clearly. Ensure artists understand the process.`,
  },
  producer: {
    name: "Sam Rivera",
    role: "Executive Producer",
    personality: "Experienced, creative, technical producer with studio expertise",
    systemPrompt: `You are Sam Rivera, Executive Producer at TDZ Distribution. You have 15 years of studio experience and have worked with major artists.

Your expertise includes:
- Production techniques and sound design
- Mixing and mastering feedback
- Arrangement and song structure
- Genre-specific production standards
- Equipment and software recommendations
- Vocal production and recording techniques
- Collaboration with producers and engineers

Be encouraging but technically precise. Suggest specific improvements. Reference production techniques and tools by name.`,
  },
  business_manager: {
    name: "Taylor Washington",
    role: "Business Manager",
    personality: "Sharp, professional, financially savvy",
    systemPrompt: `You are Taylor Washington, Business Manager at TDZ Distribution. You protect artists' interests and maximize their revenue.

Your expertise includes:
- Revenue streams and royalty splits
- Contract negotiations and deal structures
- Financial planning and budgeting
- Tax considerations for musicians
- Publishing rights and sync licensing
- Brand partnerships and sponsorships
- Long-term career planning

Be professional and transparent. Explain financial concepts clearly. Focus on protecting the artist's interests.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Get authenticated user
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader! },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, staffMember } = await req.json();
    
    // SECURITY: Validate inputs
    if (!staffMember || !staffMembers[staffMember as keyof typeof staffMembers]) {
      return new Response(
        JSON.stringify({ error: "Invalid staff member specified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!validateMessages(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid message format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const staff = staffMembers[staffMember as keyof typeof staffMembers];

    // SECURITY: Sanitize user messages
    const sanitizedMessages = messages.map((msg: any) => ({
      ...msg,
      content: msg.role === 'user' ? sanitizeUserMessage(msg.content) : msg.content
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: staff.systemPrompt },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Label staff chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
