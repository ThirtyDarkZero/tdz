// Minimal Meta Marketing API client for traffic campaigns to a smart link.
// Docs: developers.facebook.com/docs/marketing-api
const V = "v21.0";
const G = `https://graph.facebook.com/${V}`;

async function call(token: string, path: string, params: Record<string, unknown> = {}, method = "POST") {
  const body = new URLSearchParams({ access_token: token });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) body.set(k, typeof v === "string" ? v : JSON.stringify(v));
  }
  const url = method === "GET" ? `${G}/${path}?${body}` : `${G}/${path}`;
  const res = await fetch(url, method === "GET" ? {} : { method, body });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out.error) throw new Error(`Meta: ${out.error?.error_user_msg || out.error?.message || res.status}`);
  return out;
}

export const metaOAuthUrl = (appId: string, redirect: string, state: string) =>
  `https://www.facebook.com/${V}/dialog/oauth?` + new URLSearchParams({
    client_id: appId, redirect_uri: redirect, state,
    scope: "ads_management,ads_read,business_management,pages_show_list,pages_read_engagement",
  });

export async function metaExchangeCode(appId: string, secret: string, redirect: string, code: string) {
  const short = await call("", "oauth/access_token", { client_id: appId, client_secret: secret, redirect_uri: redirect, code }, "GET");
  const long = await call("", "oauth/access_token", {
    grant_type: "fb_exchange_token", client_id: appId, client_secret: secret, fb_exchange_token: short.access_token,
  }, "GET");
  return { token: long.access_token as string, expiresIn: Number(long.expires_in ?? 60 * 24 * 3600) };
}

export async function metaAccounts(token: string) {
  const [acts, pages] = await Promise.all([
    call(token, "me/adaccounts", { fields: "id,name,currency,account_status" }, "GET"),
    call(token, "me/accounts", { fields: "id,name" }, "GET"),
  ]);
  return {
    adAccounts: (acts.data ?? []).filter((a: { account_status: number }) => a.account_status === 1) as { id: string; name: string; currency: string }[],
    pages: (pages.data ?? []) as { id: string; name: string }[],
  };
}

export interface MetaLaunch {
  token: string; adAccountId: string; pageId: string; name: string; spendCapCents: number;
  destination: string; countries: string[]; ageMin: number; ageMax: number; startTime: string; endTime: string;
  audiences: { name: string; interests: string[] }[];
  creatives: { imageUrl?: string; videoUrl?: string; headline: string; primaryText: string }[];
  dailyBudgetCentsPerAdSet: number;
}

/** Create campaign → ad sets (one per audience) → creatives → ads. Everything starts ACTIVE at startTime. */
export async function metaLaunch(p: MetaLaunch) {
  const act = p.adAccountId.startsWith("act_") ? p.adAccountId : `act_${p.adAccountId}`;
  const campaign = await call(p.token, `${act}/campaigns`, {
    name: p.name, objective: "OUTCOME_TRAFFIC", status: "ACTIVE", special_ad_categories: [],
    spend_cap: p.spendCapCents, // hard ceiling at Meta, in the account's minor units
  });
  const creativeIds: string[] = [];
  for (const [i, c] of p.creatives.entries()) {
    let story: Record<string, unknown>;
    if (c.videoUrl) {
      const video = await call(p.token, `${act}/advideos`, { file_url: c.videoUrl });
      story = { page_id: p.pageId, video_data: {
        video_id: video.id, message: c.primaryText, title: c.headline, image_url: c.imageUrl,
        call_to_action: { type: "LISTEN_NOW", value: { link: p.destination } } } };
    } else {
      story = { page_id: p.pageId, link_data: {
        link: p.destination, message: c.primaryText, name: c.headline, picture: c.imageUrl,
        call_to_action: { type: "LISTEN_NOW", value: { link: p.destination } } } };
    }
    const cr = await call(p.token, `${act}/adcreatives`, { name: `${p.name} creative ${i + 1}`, object_story_spec: story });
    creativeIds.push(cr.id);
  }
  const adSets: { id: string; name: string }[] = [];
  const ads: { id: string; adSetId: string; creativeId: string }[] = [];
  for (const a of p.audiences) {
    const targeting: Record<string, unknown> = {
      geo_locations: { countries: p.countries }, age_min: p.ageMin, age_max: p.ageMax,
      ...(a.interests.length ? { flexible_spec: [{ interests: a.interests.map((id) => ({ id })) }] } : {}),
    };
    const set = await call(p.token, `${act}/adsets`, {
      name: `${p.name} — ${a.name}`, campaign_id: campaign.id, status: "ACTIVE",
      daily_budget: p.dailyBudgetCentsPerAdSet, billing_event: "IMPRESSIONS", optimization_goal: "LINK_CLICKS",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP", targeting, start_time: p.startTime, end_time: p.endTime,
    });
    adSets.push({ id: set.id, name: a.name });
    for (const creativeId of creativeIds) {
      const ad = await call(p.token, `${act}/ads`, { name: `${p.name} — ${a.name}`, adset_id: set.id, creative: { creative_id: creativeId }, status: "ACTIVE" });
      ads.push({ id: ad.id, adSetId: set.id, creativeId });
    }
  }
  return { campaignId: campaign.id as string, adSets, ads };
}

export const metaSetStatus = (token: string, id: string, status: "ACTIVE" | "PAUSED") => call(token, id, { status });
export const metaSetDailyBudget = (token: string, adSetId: string, cents: number) => call(token, adSetId, { daily_budget: cents });

/** Yesterday's numbers per ad. */
export async function metaInsights(token: string, campaignId: string, day: string) {
  const out = await call(token, `${campaignId}/insights`, {
    level: "ad", fields: "ad_id,adset_id,spend,impressions,clicks,inline_link_clicks",
    time_range: { since: day, until: day }, limit: 500,
  }, "GET");
  const [{ data: ads }] = await Promise.all([call(token, `${campaignId}/ads`, { fields: "id,effective_status", limit: 500 }, "GET")]);
  const active = new Set((ads ?? []).filter((a: { effective_status: string }) => a.effective_status === "ACTIVE").map((a: { id: string }) => a.id));
  return (out.data ?? []).map((r: Record<string, string>) => ({
    adId: r.ad_id, adSetId: r.adset_id, spendCents: Math.round(Number(r.spend ?? 0) * 100),
    impressions: Number(r.impressions ?? 0), clicks: Number(r.inline_link_clicks ?? r.clicks ?? 0), active: active.has(r.ad_id),
  }));
}
