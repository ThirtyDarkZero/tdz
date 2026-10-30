// Connect an artist's own Meta or Google Ads account.
//
// POST { action: "start", platform, artist_id? }  (signed in) → { url } to send the artist to
// GET  ?code=…&state=…                            (provider redirect) → stores tokens, back to the Studio
// POST { action: "choose", platform, account_id, page_id?, artist_id? } → pick which account/page to use
// POST { action: "disconnect", platform, artist_id? }
import "../_shared/fetchTimeout.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightWithOrigin } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { encrypt } from "../ad-agent/lib.ts";
import { metaAccounts, metaExchangeCode, metaOAuthUrl } from "../ad-agent/meta.ts";
import { googleCustomers, googleExchangeCode, googleOAuthUrl } from "../ad-agent/google.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.thirtydarkzero.net";
const CALLBACK = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ads-oauth`;
const KEY = () => Deno.env.get("ADS_TOKEN_KEY") ?? "";

Deno.serve(async (req) => {
  const pre = handleCorsPreflightWithOrigin(req);
  if (pre) return pre;
  const headers = { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const back = (q: string) => Response.redirect(`${SITE_URL}/studio?section=promote&promote=ads&${q}`, 302);

  // Provider redirect
  if (req.method === "GET") {
    const url = new URL(req.url);
    const state = url.searchParams.get("state") ?? "";
    const code = url.searchParams.get("code");
    if (!/^[0-9a-f-]{36}$/i.test(state)) return back("ads_error=invalid");
    const { data: st } = await db.from("ad_oauth_states").delete().eq("state", state).select("*").maybeSingle();
    if (!st || Date.now() - new Date(st.created_at).getTime() > 15 * 60_000) return back("ads_error=expired");
    if (!code) return back("ads_error=declined");
    try {
      if (st.platform === "meta") {
        const { token, expiresIn } = await metaExchangeCode(Deno.env.get("META_APP_ID")!, Deno.env.get("META_APP_SECRET")!, CALLBACK, code);
        const { adAccounts, pages } = await metaAccounts(token);
        const single = adAccounts.length === 1 && pages.length === 1;
        await db.from("ad_connections").upsert({
          artist_id: st.artist_id, platform: "meta", token_cipher: await encrypt(token, KEY()), refresh_cipher: null,
          token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          account_id: single ? adAccounts[0].id : null, account_name: single ? adAccounts[0].name : null,
          currency: single ? adAccounts[0].currency : null, page_id: single ? pages[0].id : null,
          choices: { adAccounts, pages }, status: single ? "connected" : "needs_account", error: null,
          connected_by: st.created_by, updated_at: new Date().toISOString(),
        });
      } else {
        const r = await googleExchangeCode(Deno.env.get("GOOGLE_ADS_CLIENT_ID")!, Deno.env.get("GOOGLE_ADS_CLIENT_SECRET")!, CALLBACK, code);
        const customers = await googleCustomers(r.token);
        const single = customers.length === 1;
        await db.from("ad_connections").upsert({
          artist_id: st.artist_id, platform: "google", token_cipher: await encrypt(r.token, KEY()),
          refresh_cipher: r.refresh ? await encrypt(r.refresh, KEY()) : null,
          token_expires_at: new Date(Date.now() + r.expiresIn * 1000).toISOString(),
          account_id: single ? customers[0] : null, account_name: single ? `Google Ads ${customers[0]}` : null,
          choices: { adAccounts: customers.map((id) => ({ id, name: `Google Ads ${id}` })) },
          status: single ? "connected" : "needs_account", error: null, connected_by: st.created_by, updated_at: new Date().toISOString(),
        });
      }
      return back(`ads_connected=${st.platform}`);
    } catch (e) {
      console.error("ads-oauth callback", e);
      return back(`ads_error=${encodeURIComponent(e instanceof Error ? e.message.slice(0, 120) : "failed")}`);
    }
  }

  const auth = await requireUser(req);
  if (!auth.user) return reply(401, { error: "Sign in again." });
  const body = await req.json().catch(() => ({}));
  const platform = body.platform === "google" ? "google" : body.platform === "meta" ? "meta" : null;
  if (!platform) return reply(400, { error: "platform must be meta or google" });
  let artistId = auth.user.id;
  if (body.artist_id && body.artist_id !== auth.user.id) {
    const { data: mgr } = await db.from("manager_artists").select("id").eq("manager_id", auth.user.id).eq("artist_id", body.artist_id).maybeSingle();
    if (!mgr) return reply(403, { error: "You don't manage this artist." });
    artistId = body.artist_id;
  }

  if (body.action === "start") {
    const ready = platform === "meta"
      ? Deno.env.get("META_APP_ID") && Deno.env.get("META_APP_SECRET")
      : Deno.env.get("GOOGLE_ADS_CLIENT_ID") && Deno.env.get("GOOGLE_ADS_CLIENT_SECRET") && Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
    if (!ready || !KEY()) return reply(503, { error: `${platform === "meta" ? "Meta" : "Google"} ads aren't set up on TDZ yet.` });
    const { data: st } = await db.from("ad_oauth_states").insert({ artist_id: artistId, platform, created_by: auth.user.id }).select("state").single();
    const url = platform === "meta"
      ? metaOAuthUrl(Deno.env.get("META_APP_ID")!, CALLBACK, st!.state)
      : googleOAuthUrl(Deno.env.get("GOOGLE_ADS_CLIENT_ID")!, CALLBACK, st!.state);
    return reply(200, { url });
  }

  if (body.action === "choose") {
    const { data: conn } = await db.from("ad_connections").select("choices").eq("artist_id", artistId).eq("platform", platform).maybeSingle();
    const acct = conn?.choices?.adAccounts?.find((a: { id: string }) => a.id === body.account_id);
    if (!acct) return reply(400, { error: "Pick one of your ad accounts." });
    const page = platform === "meta" ? conn?.choices?.pages?.find((p: { id: string }) => p.id === body.page_id) : null;
    if (platform === "meta" && !page) return reply(400, { error: "Pick the Facebook Page that will run the ads." });
    await db.from("ad_connections").update({
      account_id: acct.id, account_name: acct.name, currency: acct.currency ?? null, page_id: page?.id ?? null,
      status: "connected", updated_at: new Date().toISOString(),
    }).eq("artist_id", artistId).eq("platform", platform);
    return reply(200, { ok: true });
  }

  if (body.action === "disconnect") {
    const { count } = await db.from("ad_campaigns").select("id", { count: "exact", head: true })
      .eq("artist_id", artistId).eq("platform", platform).in("status", ["active", "paused", "launching"]);
    if (count) return reply(409, { error: "Stop or finish running campaigns before disconnecting." });
    await db.from("ad_connections").delete().eq("artist_id", artistId).eq("platform", platform);
    return reply(200, { ok: true });
  }

  return reply(400, { error: "Unknown action" });
});
