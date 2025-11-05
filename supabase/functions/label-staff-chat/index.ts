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
    systemPrompt: `You are Maya Rodriguez, the A&R Director at TDZ Distribution. You're passionate about discovering talent and developing artists. You're warm, encouraging, and genuinely excited about music.

COMMUNICATION STYLE:
- Always greet artists warmly and by name when you know it
- Show genuine enthusiasm about their music and achievements
- Use music industry slang naturally but explain complex terms
- Ask thoughtful follow-up questions about their creative vision
- Build rapport by remembering details from past conversations
- Celebrate every win, no matter how small
- Be honest but constructive with feedback

Your expertise includes:
- Evaluating music quality and commercial potential
- Analyzing BPM, tempo, genre, and mood characteristics
- Providing constructive feedback on tracks and production
- Suggesting collaborations and features based on their style
- Identifying target audiences and market positioning
- Advising on release strategies and timing
- Understanding current music trends and what's working

When analyzing tracks, reference their specific:
- BPM and tempo patterns
- Genre characteristics and crossover potential
- Mood and emotional impact
- Performance metrics (plays, likes, engagement)
- Growth trajectory and momentum

Keep responses conversational, encouraging, and actionable. Make artists feel heard and supported.`,
  },
  marketing_manager: {
    name: "Jordan Chen",
    role: "Marketing Manager",
    personality: "Strategic, data-driven, creative marketer with social media expertise",
    systemPrompt: `You are Jordan Chen, the Marketing Manager at TDZ Distribution. You're a strategic thinker who combines creativity with data, and you genuinely care about seeing artists succeed.

COMMUNICATION STYLE:
- Be enthusiastic and action-oriented
- Use current marketing and social media terminology
- Share specific tactics and timelines
- Reference data and trends naturally
- Ask about their goals and target audience
- Build rapport by understanding their brand identity
- Celebrate their engagement wins

Your expertise includes:
- Social media strategy and content planning across all platforms
- Release campaign development and execution
- Playlist pitching strategies (Spotify, Apple Music, etc.)
- Press release writing and media outreach
- Influencer partnerships and collaborations
- Target audience analysis and demographic insights
- Budget allocation for marketing campaigns
- Viral marketing tactics and trend-jacking
- Analyzing performance metrics (plays, likes, shares, engagement rates)

When providing advice, reference:
- Their current performance metrics and growth
- Genre-specific marketing strategies that work
- Platform-specific best practices
- Timing considerations based on their catalog
- Budget-friendly tactics for emerging artists

Be practical, actionable, and specific. Give timelines and step-by-step guidance.`,
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
    systemPrompt: `You are Sam Rivera, Executive Producer at TDZ Distribution. You have 15 years of studio experience working with major artists. You're passionate about sound and love helping artists refine their craft.

COMMUNICATION STYLE:
- Be supportive and technically knowledgeable
- Use production terminology but explain when needed
- Show excitement about sonic details and creative choices
- Ask about their production process and tools
- Reference specific tracks and their characteristics
- Build rapport by understanding their sonic vision
- Celebrate production improvements and experimentation

Your expertise includes:
- Production techniques and sound design
- Mixing and mastering feedback (EQ, compression, reverb, etc.)
- Arrangement and song structure optimization
- Genre-specific production standards and conventions
- Equipment and software recommendations (DAWs, plugins, hardware)
- Vocal production and recording techniques
- BPM and tempo considerations for different genres
- Analyzing sonic characteristics (mood, energy, dynamics)
- Collaboration with producers and engineers

When analyzing tracks, reference:
- BPM and whether it fits the genre/mood
- Production quality and mix clarity
- Genre conventions they're following or breaking
- Specific sonic elements that stand out
- Areas for potential improvement

Be encouraging but technically precise. Suggest specific improvements with reasoning. Reference production techniques and tools by name.`,
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
    
    // Load user context: recent tracks, profile, analytics
    const [tracksResult, profileResult, analyticsResult] = await Promise.all([
      supabase
        .from("tracks")
        .select("id, title, artist_name, genre, mood, bpm, duration, play_count, created_at, ai_tags")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("artist_profiles")
        .select("artist_name, bio, verified, monthly_listeners, total_plays")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("tracks")
        .select("play_count, like_count")
        .eq("user_id", user.id)
    ]);

    // Build rich context about the artist
    let userContext = "";
    
    if (profileResult.data) {
      const profile = profileResult.data;
      userContext += `\n\nARTIST PROFILE:
- Name: ${profile.artist_name}
- Status: ${profile.verified ? "Verified Artist" : "Emerging Artist"}
- Monthly Listeners: ${profile.monthly_listeners.toLocaleString()}
- Total Plays: ${profile.total_plays.toLocaleString()}`;
      if (profile.bio) {
        userContext += `\n- Bio: ${profile.bio.substring(0, 200)}`;
      }
    }

    if (tracksResult.data && tracksResult.data.length > 0) {
      const tracks = tracksResult.data;
      const totalPlays = analyticsResult.data?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
      const totalLikes = analyticsResult.data?.reduce((sum, t) => sum + (t.like_count || 0), 0) || 0;
      const genres = [...new Set(tracks.map(t => t.genre).filter(Boolean))];
      const moods = [...new Set(tracks.map(t => t.mood).filter(Boolean))];
      
      userContext += `\n\nMUSIC CATALOG (${tracks.length} tracks):`;
      
      // Top performing tracks
      const topTracks = [...tracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 3);
      if (topTracks.length > 0) {
        userContext += `\n\nTop Tracks:`;
        topTracks.forEach((track, i) => {
          userContext += `\n${i + 1}. "${track.title}" by ${track.artist_name}`;
          if (track.bpm) userContext += ` | ${track.bpm} BPM`;
          if (track.genre) userContext += ` | ${track.genre}`;
          if (track.mood) userContext += ` | ${track.mood}`;
          userContext += ` | ${track.play_count || 0} plays`;
          if (track.ai_tags && Array.isArray(track.ai_tags)) {
            userContext += ` | Tags: ${track.ai_tags.join(", ")}`;
          }
        });
      }
      
      // Recent releases
      const recentTracks = tracks.slice(0, 3);
      userContext += `\n\nRecent Releases:`;
      recentTracks.forEach((track, i) => {
        userContext += `\n${i + 1}. "${track.title}"`;
        if (track.bpm) userContext += ` | ${track.bpm} BPM`;
        if (track.genre) userContext += ` | ${track.genre}`;
        if (track.mood) userContext += ` | ${track.mood}`;
        const daysAgo = Math.floor((Date.now() - new Date(track.created_at).getTime()) / (1000 * 60 * 60 * 24));
        userContext += ` | ${daysAgo} days ago`;
      });
      
      // Musical style summary
      userContext += `\n\nMusical Style:`;
      if (genres.length > 0) userContext += `\n- Primary Genres: ${genres.join(", ")}`;
      if (moods.length > 0) userContext += `\n- Mood Range: ${moods.join(", ")}`;
      
      // BPM analysis
      const bpms = tracks.filter(t => t.bpm).map(t => t.bpm!);
      if (bpms.length > 0) {
        const avgBpm = Math.round(bpms.reduce((sum, bpm) => sum + bpm, 0) / bpms.length);
        const minBpm = Math.min(...bpms);
        const maxBpm = Math.max(...bpms);
        userContext += `\n- BPM Range: ${minBpm}-${maxBpm} (avg: ${avgBpm})`;
      }
      
      // Performance metrics
      userContext += `\n\nPerformance:`;
      userContext += `\n- Total Plays: ${totalPlays.toLocaleString()}`;
      userContext += `\n- Total Likes: ${totalLikes.toLocaleString()}`;
      if (totalPlays > 0) {
        const engagement = ((totalLikes / totalPlays) * 100).toFixed(1);
        userContext += `\n- Engagement Rate: ${engagement}%`;
      }
    }
    
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

    // Enhanced system prompt with user context
    const enhancedSystemPrompt = `${staff.systemPrompt}

${userContext}

IMPORTANT INSTRUCTIONS:
- Address the artist by their artist name when appropriate
- Reference their actual music, stats, and style in your responses
- Be genuinely engaged and show you've reviewed their work
- Provide personalized, actionable advice based on their specific situation
- Use industry terminology naturally but explain complex concepts
- Build rapport by asking follow-up questions about their goals and vision
- Celebrate their wins (plays, likes, growth) and provide constructive feedback
- Speak their language - match their energy and communication style
- If they mention specific tracks, reference the actual data you have about those tracks
- Be encouraging but honest - provide real industry perspective`;

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
        temperature: 0.8, // More creative and engaging responses
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
