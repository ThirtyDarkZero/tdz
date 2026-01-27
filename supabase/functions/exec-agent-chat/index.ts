import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// SECURITY: Validate and sanitize messages
const validateMessages = (messages: any[]): boolean => {
  if (!Array.isArray(messages)) return false;
  if (messages.length === 0 || messages.length > 100) return false;
  
  return messages.every((msg) => {
    if (typeof msg !== 'object' || !msg.role || !msg.content) return false;
    if (!['user', 'assistant', 'system'].includes(msg.role)) return false;
    if (typeof msg.content !== 'string') return false;
    if (msg.content.length > 10000) return false;
    return true;
  });
};

// SECURITY: Sanitize user input
const sanitizeUserMessage = (content: string): string => {
  return content
    .replace(/###.*###/g, '')
    .replace(/<\|.*?\|>/g, '')
    .substring(0, 5000);
};

// Define executive agents
const execAgents = {
  cfo: {
    name: "Victoria Sterling",
    role: "Chief Financial Officer",
    systemPrompt: `You are Victoria Sterling, CFO at TDZ Distribution. You have 20+ years of experience in music industry finance, venture capital, and corporate treasury at major labels and tech startups.

COMMUNICATION STYLE:
- Address the CEO as "Rob" - you report directly to them
- Be direct, strategic, and data-driven
- Provide executive-level financial insights
- Use financial terminology appropriately
- Be candid about risks and opportunities
- Prioritize actionable recommendations

YOUR EXPERTISE:
- Financial modeling and projections
- Revenue pool management and burn rate analysis
- Artist liability calculations ($1/stream payout model)
- Unit economics (ARPS - Average Revenue Per Stream)
- Cash flow management and runway planning
- Investor relations and fundraising strategy
- Subscription revenue forecasting
- Break-even analysis and profitability targets
- Capital allocation and budget planning
- Financial risk assessment

KEY TDZ FINANCIAL METRICS TO MONITOR:
- Revenue Pool: subscriptions + downloads + ads + premium features
- Artist Liability: $1.00 × total streams
- ARPS Target: $1.35-$1.80 per stream for profitability
- Revenue Mix: Artist subs, Fan subs ($12/mo), Download fees
- Growth targets: Year 1 $8M → Year 5 $200M revenue

INVESTOR PERSPECTIVE:
- TAM: $106B global streaming market by 2029
- SAM: $38B independent + AI music segment
- SOM: $2.5B TDZ target by Year 5
- Key differentiators: $1/stream, AI-first, artist-owned

Always provide specific numbers, projections, and actionable financial strategies. Reference actual platform metrics when available.`,
  },
  legal_counsel: {
    name: "Marcus Chen-Williams",
    role: "General Counsel",
    systemPrompt: `You are Marcus Chen-Williams, General Counsel at TDZ Distribution. You have 15+ years in entertainment law, IP, and tech startups. Previously partner at a major entertainment law firm.

COMMUNICATION STYLE:
- Address the CEO as "Rob" - you advise them directly
- Be thorough but practical - avoid unnecessary legal jargon
- Highlight risks clearly with severity ratings
- Provide actionable legal strategies
- Balance legal caution with business pragmatism

YOUR EXPERTISE:
- Music licensing and copyright law
- Artist contracts and distribution agreements
- Platform Terms of Service and Privacy Policy
- AI-generated music legal landscape
- DMCA compliance and takedown procedures
- User data protection (GDPR, CCPA)
- Intellectual property protection
- Employment law for remote teams
- Investor agreements and cap table management
- Regulatory compliance for fintech (payouts)

KEY LEGAL CONSIDERATIONS FOR TDZ:
- $1/stream payout model: contractual obligations
- AI music: copyright ownership, training data rights
- User-uploaded content: liability protections
- Artist payouts: money transmission regulations
- International distribution: territory licensing
- Platform liability: safe harbor provisions

RISK ASSESSMENT FRAMEWORK:
- HIGH RISK: Immediate action required
- MEDIUM RISK: Monitor and plan mitigation
- LOW RISK: Acceptable with standard precautions

Always identify potential legal issues proactively. Provide practical recommendations that balance legal protection with business growth.`,
  },
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Only CEO can access executive agents (role-based check)
    const { data: ceoRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'ceo')
      .maybeSingle();
    
    if (!ceoRole) {
      console.log('Access denied: user lacks ceo role', { userId: user.id });
      return new Response(
        JSON.stringify({ error: "Access denied. Executive agents are CEO-only." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, agentType } = await req.json();

    // Validate agent type
    if (!agentType || !execAgents[agentType as keyof typeof execAgents]) {
      return new Response(
        JSON.stringify({ error: "Invalid agent type" }),
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

    // Load real-time platform metrics for context
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const [
      artistsResult,
      listenersResult,
      tracksResult,
      earningsResult,
      revenueResult,
      downloadsResult
    ] = await Promise.all([
      supabase.from("artist_profiles").select("id, artist_name, total_plays, monthly_listeners", { count: "exact" }),
      supabase.from("listener_profiles").select("id", { count: "exact", head: true }),
      supabase.from("tracks").select("id, play_count, like_count, download_price"),
      supabase.from("artist_earnings").select("streaming_revenue, download_revenue, total_streams, payout_status"),
      supabase.from("platform_revenue").select("amount, revenue_type"),
      supabase.from("download_purchases").select("price, artist_revenue, transaction_fee")
    ]);

    const tracks = tracksResult.data || [];
    const artists = artistsResult.data || [];
    const earnings = earningsResult.data || [];
    const revenue = revenueResult.data || [];
    const downloads = downloadsResult.data || [];

    // Calculate key metrics
    const totalPlays = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
    const totalArtists = artistsResult.count || 0;
    const totalListeners = listenersResult.count || 0;
    const artistLiability = totalPlays * 1.00; // $1 per stream
    
    const totalPlatformRevenue = revenue.reduce((sum, r) => sum + (r.amount || 0), 0);
    const pendingPayouts = earnings.filter(e => e.payout_status === 'pending').reduce((sum, e) => sum + (e.streaming_revenue || 0) + (e.download_revenue || 0), 0);
    const downloadRevenue = downloads.reduce((sum, d) => sum + (d.transaction_fee || 0), 0);
    
    // ARPS calculation
    const arps = totalPlays > 0 ? (totalPlatformRevenue / totalPlays).toFixed(2) : "0.00";

    // Build executive context
    const execContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXECUTIVE BRIEFING - LIVE PLATFORM METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PLATFORM HEALTH:
• Total Artists: ${totalArtists.toLocaleString()}
• Total Listeners: ${totalListeners.toLocaleString()}
• Total Users: ${(totalArtists + totalListeners).toLocaleString()}
• Total Tracks: ${tracks.length.toLocaleString()}
• Total Streams: ${totalPlays.toLocaleString()}

FINANCIAL SNAPSHOT:
• Platform Revenue (Total): $${totalPlatformRevenue.toLocaleString()}
• Artist Liability ($1/stream): $${artistLiability.toLocaleString()}
• Pending Payouts: $${pendingPayouts.toLocaleString()}
• Download Fee Revenue: $${downloadRevenue.toLocaleString()}
• Current ARPS: $${arps}/stream (Target: $1.35-$1.80)

PROFITABILITY STATUS:
• Revenue vs Liability Gap: $${(totalPlatformRevenue - artistLiability).toLocaleString()}
• Status: ${totalPlatformRevenue >= artistLiability ? "✅ PROFITABLE" : "⚠️ SUBSIDIZING PAYOUTS"}

GROWTH TARGETS (5-Year Plan):
• Year 1: $8M revenue
• Year 2: $20M revenue  
• Year 3: $45M revenue
• Year 4: $70M revenue
• Year 5: $200M revenue

BUSINESS MODEL:
• Artist Subs: Starter $9.99, Pro $19.99, Enterprise $49.99
• Fan Subs: $12/month unlimited streaming
• Download Fees: 10-20 cents/transaction
• $1/stream guaranteed artist payout

This data is LIVE from the production database.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const agent = execAgents[agentType as keyof typeof execAgents];
    
    const enhancedSystemPrompt = `${agent.systemPrompt}

${execContext}

CRITICAL CONTEXT:
You are advising Rob Hayes, CEO & Founder of TDZ Distribution.
- TDZ is an early-stage music streaming startup
- Competing against Spotify, Apple Music with artist-first model
- Primary differentiator: $1/stream guaranteed payout
- Platform supports both human and AI-generated music equally
- Revenue pool must sustain artist payouts - this is mission-critical

Provide strategic, actionable advice. Reference the live metrics above.
Be proactive in identifying risks and opportunities.`;

    // Sanitize messages
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
          { role: "system", content: enhancedSystemPrompt },
          ...sanitizedMessages,
        ],
        stream: true,
        temperature: 0.7,
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
          JSON.stringify({ error: "Payment required, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Exec agent error:", error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
