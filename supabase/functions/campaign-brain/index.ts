import "../_shared/aiFallback.ts";
import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser, unauthorized } from "../_shared/auth.ts";
import { publicError } from "../_shared/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RELEASE_CYCLE_STRATEGIES: Record<string, string> = {
  "pre-release": `PRE-RELEASE STRATEGY (Major Label Playbook):
- Build anticipation with teaser content, behind-the-scenes, and countdowns
- Seed the narrative: why this release matters, what inspired it
- Pre-save campaigns are CRITICAL — push hard on smart links
- Drip-feed content: artwork reveal → tracklist → snippet → full release
- Email fans with exclusive early access or pre-save incentives
- Tour announcements should tie into the release narrative
- Bio updates should hint at evolution without spoiling`,

  "release-week": `RELEASE WEEK STRATEGY (Maximum Impact):
- EVERYTHING points to the release — every caption, email, story, bio
- Day 1: Big announcement across all channels simultaneously
- Day 2-3: Behind-the-scenes, studio footage, reaction videos
- Day 4-5: Fan engagement — reshare fan posts, run listening parties
- Day 6-7: Push for playlist adds, reviews, press coverage
- Emails should be urgent/celebratory — "IT'S HERE" energy
- Smart links should be updated with all platform links
- Bio should reference the new release prominently`,

  "post-release": `POST-RELEASE STRATEGY (Sustain Momentum):
- Share streaming milestones ("10K streams in 3 days!")
- Fan spotlight — reshare covers, reactions, playlists featuring you
- Remix/acoustic versions, lyric videos to extend the release lifecycle
- Plan the next release cycle — tease what's coming next
- Email thank-you to fans, share behind-the-scenes of the creative process
- Use data: which songs resonated? Double down on what worked
- Tour content should reference songs from the release`,

  "no-release": `BETWEEN RELEASES (Build & Engage):
- Focus on storytelling: origin, process, inspiration, community
- Grow email list with lead magnets (unreleased demos, exclusive content)
- Tour promotion and recap content
- Collaborate with other artists for cross-promotion
- Build anticipation for next release without revealing too much
- Personal content: day-in-the-life, gear reviews, genre deep-dives`,
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

    const { action, narrative_context, content_type, extra_context, release_phase } = await req.json().catch(() => ({}));

    const phaseStrategy = RELEASE_CYCLE_STRATEGIES[release_phase] || RELEASE_CYCLE_STRATEGIES["no-release"];

    let systemPrompt = "";
    let userPrompt = "";
    let tools: any[] | undefined;
    let tool_choice: any | undefined;

    switch (action) {
      case "generate-content": {
        const contentTypeInstructions: Record<string, string> = {
          "caption": "Write a social media caption (Instagram/TikTok). Under 300 chars, include emoji, authentic voice. If in release cycle, tie it to the release.",
          "tweet": "Write a Twitter/X thread (3-5 tweets, each under 280 chars). Conversational and engaging. If in release cycle, work it in naturally.",
          "bio": "Write a professional artist biography (3-4 paragraphs, third person). Cover origin, style, mission, uniqueness. If there's an active release, mention it as the latest chapter. This is a BIOGRAPHY, not marketing copy.",
          "press-release": "Write a music industry press release. Headline, dateline, body, quotes, boilerplate. If in release cycle, this IS about the release.",
          "email": "Write a fan newsletter. Warm greeting, personal update, CTA. If in release cycle, the release is the centerpiece.",
          "announcement": "Write a release/drop announcement. Build hype, tease content, clear CTA. Urgent and exciting.",
          "release-plan": "Generate a FULL release cycle content plan with specific posts/emails/actions for pre-release (4 weeks), release week (7 days), and post-release (2 weeks). Include dates relative to release day.",
          "smart-link-copy": "Write marketing copy for a smart link landing page: headline, subheadline, CTA text, social caption.",
          "tour-promo": "Write tour/show promotional content: announcement post, email copy, and social captions for upcoming shows.",
        };

        systemPrompt = `You are a major record label's Head of Marketing & Strategy — think Republic Records, Interscope, Atlantic level. You craft campaigns that break artists.

CRITICAL RULES:
- You have the artist's FULL context below. Use it. Reference their specific songs, metrics, story.
- You understand where they are in their release cycle and adjust strategy accordingly.
- Your content should sound like the ARTIST, not a corporation. Match their brand voice.
- Think in terms of NARRATIVE ARCS — every piece of content builds the bigger story.
- Reference real metrics when appropriate to build credibility.

${phaseStrategy}`;

        const instruction = contentTypeInstructions[content_type] || contentTypeInstructions["caption"];
        userPrompt = `${instruction}

═══ FULL ARTIST CONTEXT ═══
${narrative_context}

${extra_context ? `═══ ADDITIONAL CONTEXT ═══\n${extra_context}` : ""}

Generate the ${content_type} now. Make it exceptional.`;
        break;
      }

      case "release-cycle-plan": {
        systemPrompt = `You are a major label Campaign Director. You plan entire release cycles — from the first teaser to the final push. Think 360° campaigns.`;
        userPrompt = `Create a comprehensive release cycle content plan for this artist and release.

${narrative_context}

${extra_context ? `Additional details: ${extra_context}` : ""}

Generate a detailed week-by-week plan.`;

        tools = [{
          type: "function",
          function: {
            name: "create_release_plan",
            description: "Generate a full release cycle plan",
            parameters: {
              type: "object",
              properties: {
                release_title: { type: "string" },
                campaign_theme: { type: "string", description: "One-line campaign theme/tagline" },
                pre_release: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      week: { type: "string", description: "e.g. 'Week -4', 'Week -1'" },
                      actions: { type: "array", items: { type: "string" } },
                      content_pieces: { type: "array", items: { type: "string" } },
                      email_subject: { type: "string" },
                    },
                    required: ["week", "actions", "content_pieces"],
                    additionalProperties: false,
                  },
                },
                release_week: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string", description: "e.g. 'Day 1 (Release)', 'Day 3'" },
                      actions: { type: "array", items: { type: "string" } },
                      content_pieces: { type: "array", items: { type: "string" } },
                    },
                    required: ["day", "actions", "content_pieces"],
                    additionalProperties: false,
                  },
                },
                post_release: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      week: { type: "string" },
                      actions: { type: "array", items: { type: "string" } },
                      content_pieces: { type: "array", items: { type: "string" } },
                    },
                    required: ["week", "actions", "content_pieces"],
                    additionalProperties: false,
                  },
                },
                key_milestones: { type: "array", items: { type: "string" } },
              },
              required: ["release_title", "campaign_theme", "pre_release", "release_week", "post_release", "key_milestones"],
              additionalProperties: false,
            },
          },
        }];
        tool_choice = { type: "function", function: { name: "create_release_plan" } };
        break;
      }

      case "email-campaign": {
        systemPrompt = `You are a major label's email marketing director. You write emails that get opened, read, and acted on. You use the artist's authentic voice and their current release cycle status to determine what the email should focus on.

${phaseStrategy}`;
        userPrompt = `Write an email campaign using this artist's full context:

${narrative_context}

Campaign type: ${extra_context || "fan update"}

Return JSON: { "subject": "...", "preheader": "...", "html": "full HTML email with inline styles, dark theme", "plain": "plain text version" }`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const result = await response.json();

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ result: parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ result: result.choices?.[0]?.message?.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Campaign brain error:", error);
    return new Response(JSON.stringify({ error: publicError(error, "Unknown error") }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
