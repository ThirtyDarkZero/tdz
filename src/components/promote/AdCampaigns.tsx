import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActingArtist } from "@/contexts/ActingArtistContext";
import { toast } from "sonner";

type Platform = "meta" | "google";
interface Connection { platform: Platform; account_name: string | null; currency: string | null; page_id: string | null; status: string; error: string | null;
  choices: { adAccounts?: { id: string; name: string }[]; pages?: { id: string; name: string }[] } | null }
interface Phase { name: string; label: string; startDay: number; endDay: number; budgetCents: number }
interface Campaign {
  id: string; platform: Platform; name: string; goal: string; duration_days: 30 | 60 | 90; total_budget_cents: number; start_date: string;
  destination_url: string; countries: string[]; age_min: number; age_max: number; keywords: string[];
  creatives: { imageUrl?: string; videoUrl?: string; headline?: string; primaryText?: string }[];
  plan: { phases: Phase[] } | null; status: string; spent_cents: number; error: string | null; created_at: string;
}
interface Report { report_date: string; day_number: number; spend_cents: number; clicks: number; impressions: number; smart_link_visits: number; summary: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tables not in generated types yet
const db = supabase as any;
const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const LABEL: Record<Platform, string> = { meta: "Meta (Instagram & Facebook)", google: "Google Search" };

async function fn(name: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const b = ctx && typeof ctx.json === "function" ? await ctx.json().catch(() => null) : null;
    throw new Error(b?.error ?? error.message);
  }
  return data;
}

const blank = (): Partial<Campaign> => ({
  platform: "meta", name: "", goal: "streams", duration_days: 30, total_budget_cents: 30000,
  start_date: format(new Date(Date.now() + 86_400_000), "yyyy-MM-dd"), destination_url: "", countries: ["US"],
  age_min: 18, age_max: 44, keywords: [], creatives: [],
});

/** Ad campaigns run by TDZ's media-buying agent in the artist's own ad accounts. */
export function AdCampaigns() {
  const { effectiveUserId } = useActingArtist();
  const [conns, setConns] = useState<Connection[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [reports, setReports] = useState<Record<string, Report[]>>({});
  const [links, setLinks] = useState<{ short_code: string; title: string }[]>([]);
  const [draft, setDraft] = useState<Partial<Campaign> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!effectiveUserId) return;
    const [{ data: cs }, { data: cps }, { data: ls }] = await Promise.all([
      supabase.rpc("ad_connection_status" as never, { p_artist: effectiveUserId } as never),
      db.from("ad_campaigns").select("*").eq("artist_id", effectiveUserId).order("created_at", { ascending: false }),
      supabase.from("smart_links").select("short_code, title").eq("user_id", effectiveUserId).order("created_at", { ascending: false }).limit(30),
    ]);
    setConns((cs as Connection[]) ?? []);
    setCampaigns(cps ?? []);
    setLinks((ls as { short_code: string; title: string }[]) ?? []);
  }, [effectiveUserId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("ads_connected")) toast.success(`${q.get("ads_connected") === "meta" ? "Meta" : "Google Ads"} connected`);
    if (q.get("ads_error")) toast.error(`Couldn't connect: ${q.get("ads_error")}`);
  }, []);

  const run = async (label: string, f: () => Promise<void>) => {
    setBusy(label);
    try { await f(); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); load(); }
  };

  const connect = (platform: Platform) => run(`connect-${platform}`, async () => {
    const { url } = await fn("ads-oauth", { action: "start", platform, artist_id: effectiveUserId });
    window.location.href = url;
  });

  const choose = (platform: Platform, account_id: string, page_id?: string) => run(`choose-${platform}`, async () => {
    await fn("ads-oauth", { action: "choose", platform, account_id, page_id, artist_id: effectiveUserId });
    toast.success("Ad account selected");
  });

  const upload = async (files: FileList | null) => {
    if (!files?.length || !effectiveUserId || !draft) return;
    setBusy("upload");
    try {
      const added: Campaign["creatives"] = [];
      for (const f of Array.from(files).slice(0, 6)) {
        const path = `${effectiveUserId}/ads/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]+/g, "_")}`;
        const { error } = await supabase.storage.from("social-media").upload(path, f, { contentType: f.type });
        if (error) throw error;
        const url = supabase.storage.from("social-media").getPublicUrl(path).data.publicUrl;
        added.push(f.type.startsWith("video") ? { videoUrl: url } : { imageUrl: url });
      }
      setDraft((d) => ({ ...d, creatives: [...(d?.creatives ?? []), ...added] }));
    } catch (e) { toast.error(`Upload failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(null); }
  };

  const saveAndPlan = () => run("plan", async () => {
    const d = draft!;
    if (!d.name?.trim()) throw new Error("Name the campaign.");
    if (!/^https:\/\//.test(d.destination_url ?? "")) throw new Error("Choose where the ads send people (a smart link works best).");
    if ((d.total_budget_cents ?? 0) < 100) throw new Error("Set a budget.");
    const row = {
      artist_id: effectiveUserId, platform: d.platform, name: d.name.trim(), goal: d.goal, duration_days: d.duration_days,
      total_budget_cents: d.total_budget_cents, start_date: d.start_date, destination_url: d.destination_url,
      countries: d.countries, age_min: d.age_min, age_max: d.age_max, keywords: d.keywords, creatives: d.creatives,
    };
    const res = d.id
      ? await db.from("ad_campaigns").update(row).eq("id", d.id).select("id").single()
      : await db.from("ad_campaigns").insert(row).select("id").single();
    if (res.error) throw new Error(res.error.message);
    await fn("ad-agent", { action: "plan", campaign_id: res.data.id });
    setDraft(null);
    toast.success("Plan ready. Review it and approve to launch.");
  });

  const act = (c: Campaign, action: "approve" | "pause" | "resume" | "cancel") => {
    if (action === "approve" && !window.confirm(
      `Launch "${c.name}"? ${c.platform === "meta" ? "Meta" : "Google"} will charge your ad account up to ${money(c.total_budget_cents)} over ${c.duration_days} days. TDZ takes no fee.`)) return;
    if (action === "cancel" && !window.confirm("Stop this campaign for good?")) return;
    run(`${action}-${c.id}`, async () => {
      await fn("ad-agent", { action, campaign_id: c.id });
      toast.success(action === "approve" ? "Launched. You'll get a report every morning." : "Done");
    });
  };

  const toggleReports = async (id: string) => {
    if (reports[id]) { setReports(({ [id]: _, ...rest }) => rest); return; }
    const { data } = await db.from("ad_daily_reports").select("*").eq("campaign_id", id).order("report_date", { ascending: false }).limit(90);
    setReports((r) => ({ ...r, [id]: data ?? [] }));
  };

  const conn = (p: Platform) => conns.find((c) => c.platform === p);

  if (draft) {
    const c = conn(draft.platform as Platform);
    return (
      <Card>
        <CardContent className="pt-6 grid gap-5">
          <fieldset>
            <legend className="text-sm font-medium mb-2">Where</legend>
            <div className="flex flex-wrap gap-2">
              {(["meta", "google"] as const).map((p) => (
                <Button key={p} type="button" variant={draft.platform === p ? "default" : "outline"} size="sm" onClick={() => setDraft({ ...draft, platform: p })}>{LABEL[p]}</Button>
              ))}
            </div>
            {c?.status !== "connected" && <p className="text-sm text-amber-500 mt-2">Connect this ad account before launching (you can still plan).</p>}
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="ac-name">Campaign name</Label><Input id="ac-name" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1" placeholder="Midnight Run release" /></div>
            <div>
              <Label htmlFor="ac-goal">Goal</Label>
              <select id="ac-goal" value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="streams">Get streams</option><option value="presaves">Get pre-saves</option><option value="followers">Grow followers</option>
              </select>
            </div>
          </div>
          <fieldset>
            <legend className="text-sm font-medium mb-2">Length</legend>
            <div className="flex gap-2">
              {([30, 60, 90] as const).map((d) => (
                <Button key={d} type="button" size="sm" variant={draft.duration_days === d ? "default" : "outline"} onClick={() => setDraft({ ...draft, duration_days: d })}>{d} days</Button>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ac-budget">Total budget (USD)</Label>
              <Input id="ac-budget" inputMode="numeric" value={draft.total_budget_cents ? draft.total_budget_cents / 100 : ""} onChange={(e) => setDraft({ ...draft, total_budget_cents: Math.round(Number(e.target.value || 0) * 100) })} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">About {money(Math.floor((draft.total_budget_cents ?? 0) / (draft.duration_days ?? 30)))} a day. Billed by {draft.platform === "meta" ? "Meta" : "Google"} to your ad account.</p>
            </div>
            <div><Label htmlFor="ac-start">Start date</Label><Input id="ac-start" type="date" value={draft.start_date} min={format(new Date(), "yyyy-MM-dd")} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} className="mt-1" /></div>
          </div>
          <div>
            <Label htmlFor="ac-dest">Send people to</Label>
            <select id="ac-dest" value={draft.destination_url} onChange={(e) => setDraft({ ...draft, destination_url: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Choose a smart link…</option>
              {links.map((l) => <option key={l.short_code} value={`https://www.thirtydarkzero.net/link/${l.short_code}`}>{l.title} (/link/{l.short_code})</option>)}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Smart links let us count every visit from the ads.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1"><Label htmlFor="ac-ctry">Countries</Label><Input id="ac-ctry" value={(draft.countries ?? []).join(", ")} onChange={(e) => setDraft({ ...draft, countries: e.target.value.toUpperCase().split(/[,\s]+/).filter((x) => /^[A-Z]{2}$/.test(x)) })} className="mt-1" placeholder="US, CA, GB" /></div>
            <div><Label htmlFor="ac-amin">Age from</Label><Input id="ac-amin" type="number" min={13} max={65} value={draft.age_min} onChange={(e) => setDraft({ ...draft, age_min: Number(e.target.value) })} className="mt-1" /></div>
            <div><Label htmlFor="ac-amax">to</Label><Input id="ac-amax" type="number" min={13} max={65} value={draft.age_max} onChange={(e) => setDraft({ ...draft, age_max: Number(e.target.value) })} className="mt-1" /></div>
          </div>
          {draft.platform === "meta" ? (
            <div>
              <Label>Ad photos or videos</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(draft.creatives ?? []).map((cr, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden bg-muted">
                    {cr.videoUrl ? <video src={cr.videoUrl} className="w-full h-full object-cover" muted /> : <img src={cr.imageUrl} alt="" className="w-full h-full object-cover" />}
                    <button type="button" aria-label="Remove" onClick={() => setDraft({ ...draft, creatives: draft.creatives!.filter((_, j) => j !== i) })} className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5"><X className="w-3 h-3 text-white" /></button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-md border border-dashed grid place-items-center cursor-pointer text-muted-foreground">
                  {busy === "upload" ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                  <span className="sr-only">Add photo or video</span>
                  <input type="file" accept="image/*,video/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">2–4 vertical videos work best. The agent writes the ad text; you approve it before launch.</p>
            </div>
          ) : (
            <div>
              <Label htmlFor="ac-kw">Search terms (optional)</Label>
              <Input id="ac-kw" value={(draft.keywords ?? []).join(", ")} onChange={(e) => setDraft({ ...draft, keywords: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} className="mt-1" placeholder="your artist name, song title" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveAndPlan} disabled={!!busy}>{busy === "plan" ? "Planning…" : "Build the plan"}</Button>
            <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {(["meta", "google"] as const).map((p) => {
          const c = conn(p);
          return (
            <Card key={p}>
              <CardContent className="pt-6 grid gap-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{LABEL[p]}</p>
                  <Badge variant={c?.status === "connected" ? "default" : "secondary"}>{c?.status === "connected" ? "Connected" : c?.status === "needs_account" ? "Pick account" : c?.status === "expired" ? "Expired" : "Not connected"}</Badge>
                </div>
                {c?.status === "connected" && <p className="text-sm text-muted-foreground">{c.account_name}{c.currency ? ` (${c.currency})` : ""}</p>}
                {c?.status === "needs_account" && (
                  <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); choose(p, String(f.get("acct")), f.get("page") ? String(f.get("page")) : undefined); }}>
                    <select name="acct" aria-label="Ad account" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                      {c.choices?.adAccounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    {p === "meta" && (
                      <select name="page" aria-label="Facebook Page" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                        {c.choices?.pages?.map((pg) => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                      </select>
                    )}
                    <Button size="sm" type="submit" disabled={!!busy}>Use this account</Button>
                  </form>
                )}
                {c?.status !== "connected" && c?.status !== "needs_account" && (
                  <Button size="sm" onClick={() => connect(p)} disabled={!!busy}>{busy === `connect-${p}` ? "Opening…" : "Connect"}</Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">You set the budget and approve the plan. The agent tests, pauses weak ads, moves money to what works, and emails you a report every morning. Ads are billed by Meta or Google to your own account. TDZ takes no fee.</p>
        <Button onClick={() => setDraft(blank())} className="gap-1 shrink-0"><Plus className="w-4 h-4" />New campaign</Button>
      </div>

      {campaigns.map((c) => (
        <Card key={c.id}>
          <CardContent className="pt-6 grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{LABEL[c.platform]} — {c.duration_days} days from {format(new Date(`${c.start_date}T12:00:00`), "PPP")}</p>
              </div>
              <Badge variant={c.status === "failed" ? "destructive" : c.status === "active" ? "default" : "secondary"}>{c.status.replace("_", " ")}</Badge>
            </div>
            {["active", "paused", "completed"].includes(c.status) && (
              <div>
                <Progress value={Math.min(100, (c.spent_cents / c.total_budget_cents) * 100)} />
                <p className="text-xs text-muted-foreground mt-1">{money(c.spent_cents)} of {money(c.total_budget_cents)} spent</p>
              </div>
            )}
            {c.status === "awaiting_approval" && c.plan && (
              <ol className="grid gap-2 text-sm">
                {c.plan.phases.map((p) => (
                  <li key={p.name} className="rounded-md border p-3">
                    <span className="font-medium">Days {p.startDay}–{p.endDay}: {p.label}</span>
                    <span className="block text-muted-foreground">{money(p.budgetCents)} (about {money(Math.floor(p.budgetCents / (p.endDay - p.startDay + 1)))} a day)</span>
                  </li>
                ))}
              </ol>
            )}
            {c.status === "awaiting_approval" && c.creatives?.some((x) => x.headline) && (
              <details className="text-sm"><summary className="cursor-pointer">Ad text the agent wrote</summary>
                <ul className="mt-2 grid gap-1">{c.creatives.map((x, i) => <li key={i}><strong>{x.headline}</strong> — {x.primaryText}</li>)}</ul>
              </details>
            )}
            {c.error && <p className="text-sm text-destructive">{c.error}</p>}
            <div className="flex flex-wrap gap-2">
              {c.status === "awaiting_approval" && <Button size="sm" onClick={() => act(c, "approve")} disabled={!!busy || conn(c.platform)?.status !== "connected"}>{busy === `approve-${c.id}` ? "Launching…" : "Approve and launch"}</Button>}
              {["draft", "awaiting_approval"].includes(c.status) && <Button size="sm" variant="outline" onClick={() => setDraft(c)}>Edit</Button>}
              {c.status === "active" && <Button size="sm" variant="outline" onClick={() => act(c, "pause")} disabled={!!busy}>Pause</Button>}
              {c.status === "paused" && <Button size="sm" variant="outline" onClick={() => act(c, "resume")} disabled={!!busy}>Resume</Button>}
              {["active", "paused", "awaiting_approval", "draft"].includes(c.status) && <Button size="sm" variant="ghost" onClick={() => act(c, "cancel")} disabled={!!busy}>Stop</Button>}
              {["active", "paused", "completed"].includes(c.status) && <Button size="sm" variant="ghost" onClick={() => toggleReports(c.id)}>Daily reports</Button>}
            </div>
            {reports[c.id] && (
              <ul className="grid gap-2">
                {reports[c.id].length === 0 && <li className="text-sm text-muted-foreground">The first report arrives the morning after launch.</li>}
                {reports[c.id].map((r) => (
                  <li key={r.report_date} className="rounded-md border p-3 text-sm whitespace-pre-line">
                    <span className="font-medium">{format(new Date(`${r.report_date}T12:00:00`), "EEE, MMM d")}</span>{"\n"}{r.summary}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
