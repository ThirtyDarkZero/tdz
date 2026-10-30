import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, ImagePlus, Loader2, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActingArtist } from "@/contexts/ActingArtistContext";
import { toast } from "sonner";

const NETWORKS = [
  { id: "instagram", label: "Instagram", limit: 2200 },
  { id: "tiktok", label: "TikTok", limit: 2200 },
  { id: "facebook", label: "Facebook", limit: 63206 },
  { id: "twitter", label: "X", limit: 280 },
  { id: "threads", label: "Threads", limit: 500 },
  { id: "youtube", label: "YouTube", limit: 5000 },
] as const;

interface Post {
  id: string; body: string; media_urls: string[]; platforms: string[]; scheduled_at: string | null;
  status: string; results: { platform: string; status?: string; postUrl?: string }[]; error: string | null; created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tables not in generated types yet
const db = supabase as any;

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("social", { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const b = ctx && typeof ctx.json === "function" ? await ctx.json().catch(() => null) : null;
    throw new Error(b?.error ?? error.message);
  }
  return data;
}

/** Write once, post or schedule to every connected network. */
export function SocialScheduler() {
  const { effectiveUserId } = useActingArtist();
  const [linked, setLinked] = useState<string[] | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!effectiveUserId) return;
    const [{ data: plats }, { data: ps }] = await Promise.all([
      supabase.rpc("social_platforms" as never, { p_artist: effectiveUserId } as never),
      db.from("social_posts").select("*").eq("artist_id", effectiveUserId).order("created_at", { ascending: false }).limit(50),
    ]);
    setLinked((plats as string[] | null) ?? []);
    setPosts(ps ?? []);
  }, [effectiveUserId]);

  useEffect(() => {
    load();
    if (effectiveUserId) call({ action: "sync", artist_id: effectiveUserId }).then(load).catch(() => {});
  }, [load, effectiveUserId]);

  useEffect(() => { if (linked) setChosen((c) => (c.length ? c.filter((x) => linked.includes(x)) : linked)); }, [linked]);

  const connect = async () => {
    setBusy("link");
    // Open the window first (popup blockers), then point it at the linking page.
    const win = window.open("about:blank", "_blank");
    try {
      const { url } = await call({ action: "link", artist_id: effectiveUserId });
      if (win) win.location.href = url; else window.location.href = url;
      toast.message("Connect your accounts in the new tab, then press Refresh.");
    } catch (e) {
      win?.close();
      toast.error(e instanceof Error ? e.message : String(e));
    } finally { setBusy(null); }
  };

  const refresh = async () => {
    setBusy("refresh");
    try { const { platforms } = await call({ action: "refresh", artist_id: effectiveUserId }); setLinked(platforms); }
    catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length || !effectiveUserId) return;
    setBusy("upload");
    try {
      for (const f of Array.from(files).slice(0, 10 - media.length)) {
        const path = `${effectiveUserId}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]+/g, "_")}`;
        const { error } = await supabase.storage.from("social-media").upload(path, f, { contentType: f.type });
        if (error) throw error;
        setMedia((m) => [...m, supabase.storage.from("social-media").getPublicUrl(path).data.publicUrl]);
      }
    } catch (e) { toast.error(`Upload failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(null); }
  };

  const tightest = NETWORKS.filter((n) => chosen.includes(n.id)).reduce((m, n) => Math.min(m, n.limit), Infinity);

  const submit = async () => {
    setBusy("post");
    try {
      const { post, error } = await call({
        action: "post", artist_id: effectiveUserId, body: text, platforms: chosen, media_urls: media,
        scheduled_at: when ? new Date(when).toISOString() : null,
      });
      if (post?.status === "partial") toast.warning(`Posted to some networks. ${error ?? post.error ?? ""}`);
      else toast.success(when ? `Scheduled for ${format(new Date(when), "PPP p")}` : "Posted");
      setText(""); setMedia([]); setWhen("");
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  };

  const cancel = async (p: Post) => {
    try { await call({ action: "cancel", post_id: p.id, artist_id: effectiveUserId }); toast.success("Canceled"); load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  if (linked === null) return <div className="py-10 grid place-items-center"><Loader2 className="w-5 h-5 animate-spin" aria-label="Loading" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Connected accounts</p>
            <p className="text-sm text-muted-foreground">{linked.length ? linked.map((p) => NETWORKS.find((n) => n.id === p)?.label ?? p).join(", ") : "None yet. Connect once and post everywhere from here."}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh} disabled={!!busy} className="gap-1"><RefreshCw className="w-3.5 h-3.5" />Refresh</Button>
            <Button size="sm" onClick={connect} disabled={!!busy}>{busy === "link" ? "Opening…" : linked.length ? "Manage accounts" : "Connect accounts"}</Button>
          </div>
        </CardContent>
      </Card>

      {linked.length > 0 && (
        <Card>
          <CardContent className="pt-6 grid gap-4">
            <fieldset>
              <legend className="text-sm font-medium mb-2">Post to</legend>
              <div className="flex flex-wrap gap-4">
                {NETWORKS.filter((n) => linked.includes(n.id)).map((n) => (
                  <label key={n.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={chosen.includes(n.id)} onCheckedChange={(v) => setChosen((c) => (v ? [...c, n.id] : c.filter((x) => x !== n.id)))} />
                    {n.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <Label htmlFor="sp-text">Caption</Label>
              <Textarea id="sp-text" value={text} onChange={(e) => setText(e.target.value)} rows={5} className="mt-1" placeholder="New single out now. Link in bio." />
              {Number.isFinite(tightest) && (
                <p className={`text-xs mt-1 ${text.length > tightest ? "text-destructive" : "text-muted-foreground"}`}>{text.length}/{tightest} characters</p>
              )}
            </div>
            <div>
              <Label>Photos or video</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {media.map((m) => (
                  <div key={m} className="relative w-20 h-20 rounded-md overflow-hidden bg-muted">
                    {/\.(mp4|mov|m4v|webm)/i.test(m) ? <video src={m} className="w-full h-full object-cover" muted /> : <img src={m} alt="" className="w-full h-full object-cover" />}
                    <button type="button" aria-label="Remove" onClick={() => setMedia((x) => x.filter((y) => y !== m))} className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5"><X className="w-3 h-3 text-white" /></button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-md border border-dashed grid place-items-center cursor-pointer text-muted-foreground hover:text-foreground">
                  {busy === "upload" ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                  <span className="sr-only">Add photo or video</span>
                  <input type="file" accept="image/*,video/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
                </label>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor="sp-when">Schedule (leave empty to post now)</Label>
                <Input id="sp-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="mt-1" />
              </div>
              <Button onClick={submit} disabled={!!busy || !chosen.length || text.length > tightest}>
                {busy === "post" ? "Working…" : when ? "Schedule post" : "Post now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {posts.length > 0 && (
        <div className="grid gap-3">
          <h3 className="font-semibold">Posts</h3>
          {posts.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4 grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    {p.scheduled_at ? format(new Date(p.scheduled_at), "PPP p") : format(new Date(p.created_at), "PPP p")}
                    {" — "}{p.platforms.map((x) => NETWORKS.find((n) => n.id === x)?.label ?? x).join(", ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "failed" ? "destructive" : p.status === "posted" ? "default" : "secondary"}>{p.status}</Badge>
                    {p.status === "scheduled" && <Button variant="ghost" size="sm" onClick={() => cancel(p)}>Cancel</Button>}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap line-clamp-3">{p.body}</p>
                {p.results?.some((r) => r.postUrl) && (
                  <div className="flex flex-wrap gap-3 text-sm">
                    {p.results.filter((r) => r.postUrl).map((r) => (
                      <a key={r.platform} href={r.postUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
                        {NETWORKS.find((n) => n.id === r.platform)?.label ?? r.platform}<ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
                {p.error && <p className="text-sm text-destructive">{p.error}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
