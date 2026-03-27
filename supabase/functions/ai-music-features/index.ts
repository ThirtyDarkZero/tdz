import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { type, data } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";
    let tools: any[] | undefined;
    let tool_choice: any | undefined;

    switch (type) {
      case "narrative-score": {
        // AI-powered narrative strength analysis
        systemPrompt = "You are a music branding expert. Analyze an artist's narrative data and return a detailed strength assessment.";
        userPrompt = `Analyze this artist narrative and score it 0-100. Consider completeness, authenticity, emotional resonance, and marketing potential:
Origin Story: ${data.origin_story || "Not provided"}
Mission: ${data.artist_mission || "Not provided"}
Emotional Core: ${data.emotional_core || "Not provided"}
Unique Value Prop: ${data.unique_value_prop || "Not provided"}
Brand Voice: ${data.brand_voice || "Not provided"}
Target Audience: ${data.target_audience || "Not provided"}
Key Phrases: ${(data.key_phrases || []).join(", ") || "None"}`;
        tools = [{
          type: "function",
          function: {
            name: "score_narrative",
            description: "Return narrative strength score and suggestions",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", description: "Overall narrative strength 0-100" },
                strengths: { type: "array", items: { type: "string" }, description: "Top 3 strengths" },
                improvements: { type: "array", items: { type: "string" }, description: "Top 3 areas to improve" },
                summary: { type: "string", description: "One-sentence brand identity summary" }
              },
              required: ["score", "strengths", "improvements", "summary"],
              additionalProperties: false
            }
          }
        }];
        tool_choice = { type: "function", function: { name: "score_narrative" } };
        break;
      }

      case "smart-link-copy": {
        // Generate marketing copy for smart links
        systemPrompt = "You are a music marketing copywriter. Write compelling copy for a smart link landing page.";
        userPrompt = `Write marketing copy for a smart link for this release:
Title: ${data.title}
Artist: ${data.artist_name}
Genre: ${data.genre || "Unknown"}
Brand Voice: ${data.brand_voice || "Professional and engaging"}
Mission: ${data.artist_mission || ""}`;
        tools = [{
          type: "function",
          function: {
            name: "generate_copy",
            description: "Return smart link copy variants",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string", description: "Main headline, 5-8 words" },
                subheadline: { type: "string", description: "Supporting line, 10-15 words" },
                cta_text: { type: "string", description: "Call-to-action button text" },
                social_caption: { type: "string", description: "Social media caption, under 280 chars" }
              },
              required: ["headline", "subheadline", "cta_text", "social_caption"],
              additionalProperties: false
            }
          }
        }];
        tool_choice = { type: "function", function: { name: "generate_copy" } };
        break;
      }

      case "release-recommendation": {
        // Smart release timing recommendation
        systemPrompt = "You are a music distribution strategist. Recommend optimal release timing and strategy.";
        userPrompt = `Recommend a release strategy for this track:
Title: ${data.title}
Genre: ${data.genre || "Unknown"}
BPM: ${data.bpm || "Unknown"}
Mood: ${data.mood || "Unknown"}
Artist Monthly Listeners: ${data.monthly_listeners || 0}
Day of Week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`;
        tools = [{
          type: "function",
          function: {
            name: "recommend_release",
            description: "Return release strategy recommendation",
            parameters: {
              type: "object",
              properties: {
                recommended_day: { type: "string", description: "Best day of week to release" },
                recommended_time: { type: "string", description: "Best time (e.g., '12:00 AM EST')" },
                reasoning: { type: "string", description: "Why this timing is optimal" },
                pre_release_steps: { type: "array", items: { type: "string" }, description: "3-5 pre-release steps" },
                post_release_steps: { type: "array", items: { type: "string" }, description: "3-5 post-release steps" }
              },
              required: ["recommended_day", "recommended_time", "reasoning", "pre_release_steps", "post_release_steps"],
              additionalProperties: false
            }
          }
        }];
        tool_choice = { type: "function", function: { name: "recommend_release" } };
        break;
      }

      case "storytelling-content": {
        const contentTypePrompts: Record<string, string> = {
          "caption": `Write a compelling social media caption (Instagram/TikTok) for this artist. Keep it under 300 characters, include relevant emoji, make it authentic to their voice. Do NOT write about a release unless specified.`,
          "tweet": `Write a Twitter/X thread (3-5 tweets) for this artist. Each tweet under 280 chars. Make it conversational, authentic, and engaging. Do NOT treat this as a release announcement unless specified.`,
          "bio": `Write a professional artist biography (3-4 paragraphs). Cover their origin, musical style, mission, and what makes them unique. This is a BIOGRAPHY about the artist as a person and musician — NOT a release announcement, NOT marketing copy. Write in third person.`,
          "press-release": `Write a professional press release for this artist. Include a headline, dateline, body paragraphs covering their story, quotes, and a boilerplate. Format it like a real music industry press release.`,
          "email": `Write a fan newsletter email. Include a warm greeting, personal update, and a call-to-action. Make it feel like a personal letter from the artist to their fans.`,
          "announcement": `Write a release/drop announcement. Build hype, tease the content, include a clear call-to-action. Make it exciting and urgent.`,
        };
        const contentType = data.content_type || "caption";
        const typePrompt = contentTypePrompts[contentType] || contentTypePrompts["caption"];
        
        systemPrompt = `You are a music industry copywriter who writes content that sounds authentically like the artist. You MUST follow the specific content type instructions exactly. Never confuse a biography with a release announcement.`;
        userPrompt = `${typePrompt}

Here is everything about the artist:
- Origin Story: ${data.origin_story || "Not provided"}
- Mission: ${data.artist_mission || "Not provided"}  
- Emotional Core: ${data.emotional_core || "Not provided"}
- Target Audience: ${data.target_audience || "Not provided"}
- Brand Voice / Vibe: ${data.brand_voice || "Not provided"}
- Additional Context: ${data.extra_context || "None"}

Write the ${contentType} now. Stay true to their voice and story.`;
        break;
      }

      case "email-subject-optimize": {
        systemPrompt = "You are an email marketing expert specializing in music. Optimize email subject lines for open rates.";
        userPrompt = `Generate 5 optimized subject line variants for this email:
Original Subject: ${data.subject}
Email Type: ${data.email_type || "fan update"}
Artist Name: ${data.artist_name}
Brand Voice: ${data.brand_voice || "authentic and engaging"}`;
        tools = [{
          type: "function",
          function: {
            name: "optimize_subjects",
            description: "Return optimized subject line variants",
            parameters: {
              type: "object",
              properties: {
                variants: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      subject: { type: "string" },
                      strategy: { type: "string", description: "Why this variant works" }
                    },
                    required: ["subject", "strategy"],
                    additionalProperties: false
                  }
                }
              },
              required: ["variants"],
              additionalProperties: false
            }
          }
        }];
        tool_choice = { type: "function", function: { name: "optimize_subjects" } };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown AI feature type" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
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
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    
    // Extract tool call result
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ result: parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback to content
    return new Response(JSON.stringify({ result: result.choices?.[0]?.message?.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("AI features error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
