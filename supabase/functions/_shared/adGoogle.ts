// Minimal Google Ads API (REST) client: a Search campaign that sends people
// searching for the artist or song to the smart link.
// Docs: developers.google.com/google-ads/api/rest/overview
const V = "v18";
const BASE = `https://googleads.googleapis.com/${V}`;

export const googleOAuthUrl = (clientId: string, redirect: string, state: string) =>
  "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
    client_id: clientId, redirect_uri: redirect, state, response_type: "code", access_type: "offline", prompt: "consent",
    scope: "https://www.googleapis.com/auth/adwords",
  });

export async function googleExchangeCode(clientId: string, secret: string, redirect: string, code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: clientId, client_secret: secret, redirect_uri: redirect, code, grant_type: "authorization_code" }),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(`Google: ${out.error_description ?? out.error}`);
  return { token: out.access_token as string, refresh: out.refresh_token as string, expiresIn: Number(out.expires_in) };
}

export async function googleRefresh(clientId: string, secret: string, refresh: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", body: new URLSearchParams({ client_id: clientId, client_secret: secret, refresh_token: refresh, grant_type: "refresh_token" }),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(`Google: ${out.error_description ?? out.error}`);
  return { token: out.access_token as string, expiresIn: Number(out.expires_in) };
}

function headers(token: string, loginCustomer?: string) {
  return {
    Authorization: `Bearer ${token}`, "developer-token": Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN") ?? "",
    "Content-Type": "application/json", ...(loginCustomer ? { "login-customer-id": loginCustomer } : {}),
  };
}

async function post(token: string, path: string, body: unknown) {
  const res = await fetch(`${BASE}/${path}`, { method: "POST", headers: headers(token), body: JSON.stringify(body) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google Ads: ${out.error?.details?.[0]?.errors?.[0]?.message ?? out.error?.message ?? res.status}`);
  return out;
}

export async function googleCustomers(token: string): Promise<string[]> {
  const res = await fetch(`${BASE}/customers:listAccessibleCustomers`, { headers: headers(token) });
  const out = await res.json();
  if (!res.ok) throw new Error(`Google Ads: ${out.error?.message ?? res.status}`);
  return (out.resourceNames ?? []).map((r: string) => r.split("/")[1]);
}

export interface GoogleLaunch {
  token: string; customerId: string; name: string; dailyBudgetMicros: number; destination: string;
  keywords: string[]; headlines: string[]; descriptions: string[]; startDate: string; endDate: string;
}

export async function googleLaunch(p: GoogleLaunch) {
  const c = p.customerId;
  const budget = await post(p.token, `customers/${c}/campaignBudgets:mutate`, {
    operations: [{ create: { name: `${p.name} budget ${Date.now()}`, amountMicros: String(p.dailyBudgetMicros), deliveryMethod: "STANDARD", explicitlyShared: false } }],
  });
  const campaign = await post(p.token, `customers/${c}/campaigns:mutate`, {
    operations: [{ create: {
      name: p.name, status: "ENABLED", advertisingChannelType: "SEARCH", campaignBudget: budget.results[0].resourceName,
      maximizeClicks: {}, startDate: p.startDate.replace(/-/g, ""), endDate: p.endDate.replace(/-/g, ""),
      networkSettings: { targetGoogleSearch: true, targetSearchNetwork: false, targetContentNetwork: false },
    } }],
  });
  const campaignRn = campaign.results[0].resourceName as string;
  const group = await post(p.token, `customers/${c}/adGroups:mutate`, {
    operations: [{ create: { name: `${p.name} — searches`, campaign: campaignRn, status: "ENABLED", type: "SEARCH_STANDARD" } }],
  });
  const groupRn = group.results[0].resourceName as string;
  await post(p.token, `customers/${c}/adGroupCriteria:mutate`, {
    operations: p.keywords.slice(0, 20).map((text) => ({ create: { adGroup: groupRn, status: "ENABLED", keyword: { text, matchType: "PHRASE" } } })),
  });
  await post(p.token, `customers/${c}/adGroupAds:mutate`, {
    operations: [{ create: { adGroup: groupRn, status: "ENABLED", ad: { finalUrls: [p.destination], responsiveSearchAd: {
      headlines: p.headlines.slice(0, 15).map((text) => ({ text: text.slice(0, 30) })),
      descriptions: p.descriptions.slice(0, 4).map((text) => ({ text: text.slice(0, 90) })),
    } } } }],
  });
  return { campaignResource: campaignRn, budgetResource: budget.results[0].resourceName as string, adGroupResource: groupRn };
}

export async function googleSetBudget(token: string, customerId: string, budgetResource: string, micros: number) {
  return post(token, `customers/${customerId}/campaignBudgets:mutate`, {
    operations: [{ update: { resourceName: budgetResource, amountMicros: String(micros) }, updateMask: "amount_micros" }],
  });
}

export async function googleSetStatus(token: string, customerId: string, campaignResource: string, status: "ENABLED" | "PAUSED") {
  return post(token, `customers/${customerId}/campaigns:mutate`, {
    operations: [{ update: { resourceName: campaignResource, status }, updateMask: "status" }],
  });
}

export async function googleInsights(token: string, customerId: string, campaignResource: string, day: string) {
  const id = campaignResource.split("/").pop();
  const out = await post(token, `customers/${customerId}/googleAds:search`, {
    query: `SELECT ad_group_ad.ad.id, ad_group.id, ad_group_ad.status, metrics.cost_micros, metrics.impressions, metrics.clicks
            FROM ad_group_ad WHERE campaign.id = ${id} AND segments.date = '${day}'`,
  });
  return (out.results ?? []).map((r: Record<string, Record<string, Record<string, string> | string>>) => ({
    adId: String((r.adGroupAd as Record<string, Record<string, string>>).ad.id), adSetId: String((r.adGroup as Record<string, string>).id),
    spendCents: Math.round(Number((r.metrics as Record<string, string>).costMicros ?? 0) / 10_000),
    impressions: Number((r.metrics as Record<string, string>).impressions ?? 0), clicks: Number((r.metrics as Record<string, string>).clicks ?? 0),
    active: (r.adGroupAd as Record<string, string>).status === "ENABLED",
  }));
}
