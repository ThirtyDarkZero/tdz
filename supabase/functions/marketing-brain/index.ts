// Marketing Brain — autonomous head-of-marketing agent.
// Generates a daily sales-funnel set (email copy, subject lines, tutorial content,
// screenshot direction) using live platform metrics, and stores it as DRAFTS.
// It never sends email itself — drafts are reviewed/exported from the CEO Dashboard.
import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";
import { requireAdminOrCron, forbidden, unauthorized } from "../_shared/auth.ts";

const BRAND_BRIEF = `
BRAND: Thirty Dark Zero (TDZ) — an independent streaming + distribution platform.
CORE PROMISE: $1 per intentional play. Not fractions of a cent.
VOICE: Direct, confident, zero corporate filler. Short punchy sentences. Never hypey or salesy-cringe.
   Speak like a founder who has been an unpaid artist. Respect the reader's time.
VISUAL LANGUAGE (must be referenced in screenshot direction):
   - Dark cosmic backdrop #08081a / #0d0d24, glassmorphic panels, subtle nebula + starfield.
   - Coral #ff6347 primary accent, cyan #00c8ff for data/metrics, violet #8b5cf6 for depth.
   - Headings and big numbers in 'Six Caps' (tall condensed caps). Body copy in 'Raleway'.
   - Rounded pill CTA buttons in coral, uppercase, wide letter-spacing.
TERMINOLOGY: fans = "participants"; streams = "impact" / "intentional plays"; following = "join journey"; likes = "resonated".
AUDIENCES: "artist" (independent musicians), "manager" (labels/enterprise rosters), "fan" (listeners/participants).
FUNNEL STAGES: awareness, activation, education, retention, upgrade.
KEY FEATURES TO TEACH: Studio uploads + ISRC/UPC auto-codes, Smart Links, Autopilot releases,
   Momentum score, Fan Hub / contact manager, AI Label HQ agents, Manager HQ roster analytics + white-label,
   Stripe payouts with automatic $50 threshold transfers, Discovery Mood Morph + Live Pulse, Inner Circle.
`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  const preflight = handleCorsPreflightWithOrigin(req);
  if (preflight) return preflight;

  const gate = await requireAdminOrCron(req);
  if (!gate.ok) {
    return gate.status === 401 ? unauthorized(corsHeaders) : forbidden(corsHeaders);
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      /* cron sends no body */
    }
    const force = body?.force === true;

    const today = new Date().toISOString().slice(0, 10);

    // Skip if today's set already exists (cron safety / idempotent).
    if (!force) {
      const { count } = await supabase
        .from("marketing_drafts")
        .select("id", { count: "exact", head: true })
        .eq("draft_date", today);
      if ((count ?? 0) > 0) {
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: "already_generated", date: today }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // ---- Live platform context so the copy is grounded in reality ----
    const [artistsRes, tracksRes, listenersRes, earningsRes, recentRes] = await Promise.all([
      supabase.from("artist_profiles").select("id", { count: "exact", head: true }),
      supabase.from("tracks").select("play_count"),
      supabase.from("listener_profiles").select("id", { count: "exact", head: true }),
      supabase.from("artist_earnings").select("total_earnings"),
      supabase
        .from("tracks")
        .select("title, artist_name, genre")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const totalPlays = (tracksRes.data ?? []).reduce(
      (s: number, t: { play_count?: number }) => s + (t.play_count || 0),
      0,
    );
    const totalPaid = (earningsRes.data ?? []).reduce(
      (s: number, e: { total_earnings?: number }) => s + (Number(e.total_earnings) || 0),
      0,
    );

    const metrics = {
      artists: artistsRes.count ?? 0,
      participants: listenersRes.count ?? 0,
      tracks: (tracksRes.data ?? []).length,
      intentional_plays: totalPlays,
      artist_earnings_usd: Math.round(totalPaid * 100) / 100,
      recent_releases: (recentRes.data ?? []).map(
        (t: { title?: string; artist_name?: string; genre?: string }) =>
          `${t.title} — ${t.artist_name}${t.genre ? ` (${t.genre})` : ""}`,
      ),
    };

    // ---- Avoid repeating yesterday's angles ----
    const { data: recentDrafts } = await supabase
      .from("marketing_drafts")
      .select("subject_line, feature_focus, draft_date")
      .order("draft_date", { ascending: false })
      .limit(24);

    const history = (recentDrafts ?? [])
      .map((d) => `- ${d.draft_date}: [${d.feature_focus}] ${d.subject_line}`)
      .join("\n") || "(no prior drafts)";

    const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

    const systemPrompt = `You are the Head of Marketing for Thirty Dark Zero. You run an always-on
daily sales funnel. You write finished, ready-to-send copy — never placeholders, never "[insert X]".

${BRAND_BRIEF}

RULES:
- Every draft must teach something concrete about using the product, not just sell.
- Body copy is markdown: a short hook, 3-5 scannable steps or bullets, one clear CTA line.
- Subject lines: max ~55 characters, no emoji, no clickbait, no ALL CAPS words.
- screenshot_hint must describe an EXACT app screen to capture and how to frame it,
  referencing the dark cosmic visual language above.
- Never repeat a subject line or feature focus that appears in RECENT HISTORY.
- Ground claims in the REAL METRICS provided. Never invent numbers.`;

    const userPrompt = `Today is ${dayOfWeek}, ${today}.

REAL METRICS:
${JSON.stringify(metrics, null, 2)}

RECENT HISTORY (do not repeat these angles):
${history}

Produce today's funnel set: exactly 4 drafts.
1) audience "artist", stage "activation" or "education"
2) audience "artist", stage "retention" or "upgrade"
3) audience "manager", stage "awareness" or "upgrade"
4) audience "fan", stage "awareness" or "education"

Return ONLY valid JSON, no prose, no code fences, in this exact shape:
{"drafts":[{"audience":"artist","funnel_stage":"activation","subject_line":"...","preview_text":"...","body_markdown":"...","cta_label":"...","cta_url":"https://www.thirtydarkzero.net/studio","feature_focus":"...","screenshot_hint":"..."}]}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-terra",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      const status = aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502;
      return new Response(
        JSON.stringify({
          success: false,
          error:
            aiRes.status === 429
              ? "Rate limited by the AI gateway. Try again shortly."
              : aiRes.status === 402
              ? "AI credits exhausted. Add credits in workspace settings."
              : `AI gateway error: ${errText.slice(0, 300)}`,
        }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { drafts?: Record<string, string>[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { drafts: [] };
    }

    const drafts = (parsed.drafts ?? []).slice(0, 6).map((d) => ({
      draft_date: today,
      funnel_stage: String(d.funnel_stage || "education"),
      audience: String(d.audience || "artist"),
      subject_line: String(d.subject_line || "").slice(0, 160),
      preview_text: d.preview_text ? String(d.preview_text).slice(0, 300) : null,
      body_markdown: String(d.body_markdown || ""),
      cta_label: d.cta_label ? String(d.cta_label).slice(0, 80) : null,
      cta_url: d.cta_url ? String(d.cta_url).slice(0, 500) : "https://www.thirtydarkzero.net",
      feature_focus: d.feature_focus ? String(d.feature_focus).slice(0, 160) : null,
      screenshot_hint: d.screenshot_hint ? String(d.screenshot_hint) : null,
      channel: "email",
      status: "draft",
      generated_by: "marketing-brain",
      metadata: { metrics },
    }));

    if (drafts.length === 0) {
      throw new Error("Marketing Brain returned no usable drafts");
    }

    const { error: insertErr } = await supabase.from("marketing_drafts").insert(drafts);
    if (insertErr) throw insertErr;

    console.log(`[marketing-brain] generated ${drafts.length} drafts for ${today}`);

    return new Response(
      JSON.stringify({ success: true, date: today, generated: drafts.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[marketing-brain] error", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
