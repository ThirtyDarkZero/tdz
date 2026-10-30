// The media buyer agent.
//
// Artist (or their manager):
//   POST { action: "plan", campaign_id }     → writes ad copy if missing, builds the 30/60/90 plan, awaits approval
//   POST { action: "approve", campaign_id }  → launches in the artist's own Meta/Google account
//   POST { action: "pause" | "resume" | "cancel", campaign_id }
// Cron:
//   POST { action: "optimize_all" }          → daily: pull numbers, pause losers, pace budget, report
import "../_shared/fetchTimeout.ts";
import "../_shared/aiFallback.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";
import { dayOf, decrypt, encrypt, optimize, phaseOn, planCampaign, splitBudget, summarize, todaysBudgetCents, type Decision, type Plan } from "../_shared/adAgentLib.ts";
import { metaInsights, metaLaunch, metaSetDailyBudget, metaSetStatus } from "./meta.ts";
import { googleInsights, googleLaunch, googleRefresh, googleSetBudget, googleSetStatus } from "./google.ts";

type Campaign = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const KEY = () => Deno.env.get("ADS_TOKEN_KEY") ?? "";

async function tokenFor(db: SupabaseClient, artistId: string, platform: string) {
  const { data: c } = await db.from("ad_connections").select("*").eq("artist_id", artistId).eq("platform", platform).maybeSingle();
  if (!c) throw new Error(`Connect a ${platform === "meta" ? "Meta" : "Google Ads"} account first.`);
  if (c.status === "needs_account" || !c.account_id) throw new Error("Pick which ad account to use first.");
  let token = await decrypt(c.token_cipher, KEY());
  if (platform === "google" && c.refresh_cipher && (!c.token_expires_at || new Date(c.token_expires_at).getTime() < Date.now() + 60_000)) {
    const r = await googleRefresh(Deno.env.get("GOOGLE_ADS_CLIENT_ID")!, Deno.env.get("GOOGLE_ADS_CLIENT_SECRET")!, await decrypt(c.refresh_cipher, KEY()));
    token = r.token;
    await db.from("ad_connections").update({
      token_cipher: await encrypt(token, KEY()), token_expires_at: new Date(Date.now() + r.expiresIn * 1000).toISOString(),
    }).eq("artist_id", artistId).eq("platform", platform);
  } else if (c.token_expires_at && new Date(c.token_expires_at).getTime() < Date.now()) {
    throw new Error("The ad account connection expired. Reconnect it in Promote > Ads.");
  }
  return { token, conn: c };
}

/** Ask the model for ad copy when the artist didn't write any. */
async function writeCopy(c: Campaign, artistName: string): Promise<{ headlines: string[]; texts: string[] }> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash", temperature: 0.8,
      messages: [{ role: "user", content:
        `Write ad copy for ${artistName}'s music on Instagram/Facebook${c.platform === "google" ? " and Google Search" : ""}. Goal: ${c.goal}. ` +
        `Campaign: "${c.name}". Link goes to a smart link where fans pick their streaming app. ` +
        `Return ONLY JSON {"headlines":[5 headlines, max 30 characters],"texts":[3 primary texts, max 125 characters, no hashtags, no fake claims]}` }],
    }),
  });
  const out = await res.json().catch(() => ({}));
  const raw = String(out?.choices?.[0]?.message?.content ?? "");
  try {
    const j = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    return { headlines: (j.headlines ?? []).map(String).slice(0, 15), texts: (j.texts ?? []).map(String).slice(0, 4) };
  } catch {
    return { headlines: [`New music from ${artistName}`.slice(0, 30), "Listen now", "Out now"], texts: [`${artistName} — out now. Tap to listen.`] };
  }
}

async function artistOf(db: SupabaseClient, id: string) {
  const [{ data: p }, { data: u }] = await Promise.all([
    db.from("artist_profiles").select("artist_name").eq("user_id", id).maybeSingle(),
    db.auth.admin.getUserById(id),
  ]);
  return { name: p?.artist_name ?? "TDZ artist", email: u?.user?.email ?? null };
}

async function plan(db: SupabaseClient, c: Campaign) {
  const audiences = c.platform === "meta" ? 3 : 1;
  const p = planCampaign(c.duration_days, c.total_budget_cents, audiences);
  if ("error" in p) throw new Error(p.error);
  let creatives = Array.isArray(c.creatives) ? c.creatives : [];
  let keywords: string[] = c.keywords ?? [];
  const artist = await artistOf(db, c.artist_id);
  const needCopy = c.platform === "google" || creatives.some((x: Record<string, string>) => !x.headline || !x.primaryText);
  const copy = needCopy ? await writeCopy(c, artist.name) : null;
  if (copy) {
    creatives = creatives.map((x: Record<string, string>, i: number) => ({
      ...x, headline: x.headline || copy.headlines[i % copy.headlines.length], primaryText: x.primaryText || copy.texts[i % copy.texts.length],
    }));
  }
  if (c.platform === "meta" && !creatives.length) throw new Error("Add at least one photo or video for the ads.");
  if (c.platform === "google" && !keywords.length) {
    keywords = [artist.name, `${artist.name} new music`, `${artist.name} ${c.name}`].map((k) => k.toLowerCase());
  }
  const full = {
    ...p,
    audiences: c.platform === "meta"
      ? [{ name: "Fans of similar artists", interests: [] }, { name: "Music lovers 18–34", interests: [] }, { name: "Broad", interests: [] }].slice(0, audiences)
      : [{ name: "People searching for you", interests: [] }],
    copy,
  };
  await db.from("ad_campaigns").update({ plan: full, creatives, keywords, status: "awaiting_approval", error: null }).eq("id", c.id);
  return full;
}

async function launch(db: SupabaseClient, c: Campaign, approver: string) {
  if (c.status !== "awaiting_approval" || !c.plan) throw new Error("Build the plan first.");
  const { token, conn } = await tokenFor(db, c.artist_id, c.platform);
  const p = c.plan as Plan & { audiences: { name: string; interests: string[] }[]; copy?: { headlines: string[]; texts: string[] } };
  await db.from("ad_campaigns").update({ status: "launching", approved_at: new Date().toISOString(), approved_by: approver }).eq("id", c.id);
  const start = new Date(Math.max(new Date(`${c.start_date}T00:00:00Z`).getTime(), Date.now() + 15 * 60_000));
  const end = new Date(new Date(`${c.start_date}T00:00:00Z`).getTime() + c.duration_days * 86_400_000);
  const day1 = todaysBudgetCents(p, 1, 0);
  try {
    let external: Record<string, unknown>;
    if (c.platform === "meta") {
      if (!conn.page_id) throw new Error("Pick the Facebook Page that will run the ads.");
      external = await metaLaunch({
        token, adAccountId: conn.account_id, pageId: conn.page_id, name: `TDZ — ${c.name}`,
        spendCapCents: c.total_budget_cents, destination: c.destination_url, countries: c.countries,
        ageMin: c.age_min, ageMax: c.age_max, startTime: start.toISOString(), endTime: end.toISOString(),
        audiences: p.audiences, creatives: c.creatives,
        dailyBudgetCentsPerAdSet: Math.max(100, Math.floor(day1 / p.audiences.length)),
      });
    } else {
      external = await googleLaunch({
        token, customerId: conn.account_id, name: `TDZ — ${c.name}`, dailyBudgetMicros: day1 * 10_000,
        destination: c.destination_url, keywords: c.keywords, startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10),
        headlines: (c.creatives ?? []).map((x: Record<string, string>) => x.headline).concat(p.copy?.headlines ?? []).filter(Boolean).slice(0, 15),
        descriptions: (c.creatives ?? []).map((x: Record<string, string>) => x.primaryText).concat(p.copy?.texts ?? []).filter(Boolean).slice(0, 4),
      });
    }
    await db.from("ad_campaigns").update({ status: "active", external, error: null }).eq("id", c.id);
  } catch (e) {
    await db.from("ad_campaigns").update({ status: "failed", error: e instanceof Error ? e.message : String(e) }).eq("id", c.id);
    throw e;
  }
}

async function setRunning(db: SupabaseClient, c: Campaign, run: boolean) {
  const { token, conn } = await tokenFor(db, c.artist_id, c.platform);
  if (c.platform === "meta") await metaSetStatus(token, c.external.campaignId, run ? "ACTIVE" : "PAUSED");
  else await googleSetStatus(token, conn.account_id, c.external.campaignResource, run ? "ENABLED" : "PAUSED");
}

/** One day of media buying for one campaign. */
async function optimizeOne(db: SupabaseClient, c: Campaign, today: Date) {
  const yesterday = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);
  if (c.last_optimized_on === today.toISOString().slice(0, 10)) return "already done";
  const { token, conn } = await tokenFor(db, c.artist_id, c.platform);
  const p = c.plan as Plan;
  const day = dayOf(c.start_date, today);

  const stats = c.platform === "meta"
    ? await metaInsights(token, c.external.campaignId, yesterday)
    : await googleInsights(token, conn.account_id, c.external.campaignResource, yesterday);
  const spent = stats.reduce((s: number, x: { spendCents: number }) => s + x.spendCents, 0);
  const impressions = stats.reduce((s: number, x: { impressions: number }) => s + x.impressions, 0);
  const clicks = stats.reduce((s: number, x: { clicks: number }) => s + x.clicks, 0);
  const totalSpent = c.spent_cents + spent;

  const decisions: Decision[] = [];
  const done = day > c.duration_days || totalSpent >= c.total_budget_cents;
  if (done) {
    await setRunning(db, c, false);
    decisions.push({ kind: "budget", target: "campaign", reason: totalSpent >= c.total_budget_cents ? "Budget fully spent — campaign stopped" : "Campaign finished on schedule" });
  } else {
    // Pause clear losers (Meta has per-ad control; Google rotates ads itself).
    if (c.platform === "meta") {
      for (const d of optimize(stats)) {
        await metaSetStatus(token, d.target, "PAUSED");
        decisions.push(d);
      }
    }
    // Pace today's budget so the campaign can never overspend.
    const budget = todaysBudgetCents(p, day, totalSpent);
    if (c.platform === "meta") {
      const bySet = new Map<string, number>();
      for (const s of stats) bySet.set(s.adSetId, (bySet.get(s.adSetId) ?? 0) + s.clicks);
      const sets = (c.external.adSets ?? []).map((s: { id: string }) => ({ id: s.id, clicks: bySet.get(s.id) ?? 0 }));
      // After the test phase, budget follows the ad sets that earn clicks.
      const split = phaseOn(p, day)?.name === "test" ? splitBudget(budget, sets.map((s: { id: string }) => ({ ...s, clicks: 1 }))) : splitBudget(budget, sets);
      for (const [id, cents] of Object.entries(split)) await metaSetDailyBudget(token, id, cents);
    } else {
      await googleSetBudget(token, conn.account_id, c.external.budgetResource, budget * 10_000);
    }
    decisions.push({ kind: "budget", target: "campaign", reason: `Set today's budget to $${(budget / 100).toFixed(2)}`, value: budget });
  }

  // Smart link visits yesterday, from TDZ's own tracking.
  let visits = 0;
  const code = c.destination_url.match(/\/(?:link|s)\/([A-Za-z0-9_-]+)/)?.[1];
  if (code) {
    const { data: link } = await db.from("smart_links").select("id").ilike("short_code", code).maybeSingle();
    if (link) {
      const { count } = await db.from("smart_link_clicks").select("id", { count: "exact", head: true })
        .eq("smart_link_id", link.id).eq("platform", "view").gte("clicked_at", `${yesterday}T00:00:00Z`).lt("clicked_at", `${today.toISOString().slice(0, 10)}T00:00:00Z`);
      visits = count ?? 0;
    }
  }

  const summary = summarize({
    day: Math.max(1, day - 1), durationDays: c.duration_days, phase: phaseOn(p, Math.max(1, day - 1)),
    spentTodayCents: spent, spentTotalCents: totalSpent, budgetCents: c.total_budget_cents, impressions, clicks, smartLinkVisits: visits, decisions,
  });
  await db.from("ad_daily_reports").upsert({
    campaign_id: c.id, report_date: yesterday, day_number: Math.max(1, day - 1), phase: phaseOn(p, Math.max(1, day - 1))?.name ?? null,
    spend_cents: spent, impressions, clicks, smart_link_visits: visits,
    budget_next_cents: decisions.find((d) => d.value !== undefined)?.value ?? 0, decisions, summary,
  }, { onConflict: "campaign_id,report_date" });
  await db.from("ad_campaigns").update({
    spent_cents: totalSpent, last_optimized_on: today.toISOString().slice(0, 10), status: done ? "completed" : "active",
  }).eq("id", c.id);

  const artist = await artistOf(db, c.artist_id);
  if (artist.email) {
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ templateName: "ad-daily-report", recipientEmail: artist.email, idempotencyKey: `ad-report-${c.id}-${yesterday}`,
        templateData: { campaignName: c.name, platform: c.platform, summary } }),
    }).catch(() => null);
  }
  return summary;
}

Deno.serve(async (req) => {
  const pre = handleCorsPreflightWithOrigin(req);
  if (pre) return pre;
  const headers = { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (!KEY()) return reply(503, { error: "Ad agents aren't set up yet (ADS_TOKEN_KEY missing)." });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(() => ({}));
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const isServer = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    (!!Deno.env.get("CRON_SECRET") && req.headers.get("x-cron-secret") === Deno.env.get("CRON_SECRET"));

  if (body.action === "optimize_all") {
    if (!isServer) return reply(401, { error: "Unauthorized" });
    const { data: active } = await db.from("ad_campaigns").select("*").eq("status", "active").limit(200);
    const results: Record<string, string> = {};
    for (const c of active ?? []) {
      try { results[c.id] = await optimizeOne(db, c, new Date()); }
      catch (e) {
        results[c.id] = `error: ${e instanceof Error ? e.message : e}`;
        await db.from("ad_campaigns").update({ error: results[c.id].slice(7, 500) }).eq("id", c.id);
      }
    }
    return reply(200, { campaigns: Object.keys(results).length, results });
  }

  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return reply(401, { error: "Sign in again." });
  const { data: c } = await db.from("ad_campaigns").select("*").eq("id", String(body.campaign_id ?? "")).maybeSingle();
  if (!c) return reply(404, { error: "Campaign not found" });
  if (c.artist_id !== user.id) {
    const { data: mgr } = await db.from("manager_artists").select("id").eq("manager_id", user.id).eq("artist_id", c.artist_id).maybeSingle();
    if (!mgr) return reply(403, { error: "Not your campaign" });
  }

  try {
    switch (body.action) {
      case "plan": return reply(200, { plan: await plan(db, c) });
      case "approve": await launch(db, c, user.id); return reply(200, { ok: true });
      case "pause":
        if (c.status !== "active") return reply(409, { error: "Only running campaigns can be paused." });
        await setRunning(db, c, false);
        await db.from("ad_campaigns").update({ status: "paused" }).eq("id", c.id);
        return reply(200, { ok: true });
      case "resume":
        if (c.status !== "paused") return reply(409, { error: "Only paused campaigns can be resumed." });
        await setRunning(db, c, true);
        await db.from("ad_campaigns").update({ status: "active" }).eq("id", c.id);
        return reply(200, { ok: true });
      case "cancel":
        if (["active", "paused"].includes(c.status)) await setRunning(db, c, false);
        await db.from("ad_campaigns").update({ status: "canceled" }).eq("id", c.id);
        return reply(200, { ok: true });
      default: return reply(400, { error: "Unknown action" });
    }
  } catch (e) {
    return reply(400, { error: e instanceof Error ? e.message : String(e) });
  }
});
