import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Copy, ExternalLink, Plus, Trash2, Sparkles, Loader2, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAIFeature } from "@/hooks/useAIFeature";
import { PLATFORMS, cleanUrl, isValidCode, linkStats, smartLinkUrl, toCode } from "@/lib/smartLinks";

interface SmartLink {
  id: string;
  short_code: string;
  title: string | null;
  clicks: number | null;
  created_at: string;
}

interface Release { id: string; type: "track" | "album"; title: string }

export function SmartLinkBuilder() {
  const { user } = useAuth();
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [release, setRelease] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState("");
  const [platforms, setPlatforms] = useState<{ name: string; url: string }[]>([
    { name: "Spotify", url: "" },
    { name: "Apple Music", url: "" },
    { name: "YouTube", url: "" },
  ]);
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState<Record<string, { platform: string; clicks: number }[]>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiCopy, setAiCopy] = useState<any>(null);
  const copyAI = useAIFeature("smart-link-copy");

  const loadLinks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("smart_links")
      .select("id, short_code, title, clicks, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLinks((data as SmartLink[]) || []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadLinks();
    Promise.all([
      supabase.from("tracks").select("id, title").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("albums").select("id, title").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]).then(([t, a]) => setReleases([
      ...((a.data ?? []) as { id: string; title: string }[]).map((r) => ({ ...r, type: "album" as const })),
      ...((t.data ?? []) as { id: string; title: string }[]).map((r) => ({ ...r, type: "track" as const })),
    ]));
  }, [user, loadLinks]);

  const pickRelease = (key: string) => {
    setRelease(key);
    const r = releases.find((x) => `${x.type}:${x.id}` === key);
    if (r) {
      setTitle(r.title);
      if (!slugTouched) setSlug(toCode(r.title));
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    const code = toCode(slug || title);
    if (!title.trim()) { toast.error("Add a title."); return; }
    if (!isValidCode(code)) { toast.error("The link name needs at least 2 letters or numbers."); return; }

    const platformMap: Record<string, string> = {};
    for (const p of platforms) {
      if (!p.url.trim()) continue;
      const url = cleanUrl(p.url);
      if (!url || !p.name.trim()) { toast.error(`Check the ${p.name || "platform"} link — it must be a web address.`); return; }
      platformMap[p.name.trim()] = url;
    }
    const target = releases.find((x) => `${x.type}:${x.id}` === release);
    if (!target && Object.keys(platformMap).length === 0) {
      toast.error("Pick a TDZ release or add at least one platform link.");
      return;
    }
    const art = artworkUrl.trim() ? cleanUrl(artworkUrl) : null;
    if (artworkUrl.trim() && !art) { toast.error("The artwork must be a web address."); return; }

    setCreating(true);
    const { error } = await supabase.from("smart_links").insert({
      user_id: user.id,
      short_code: code,
      title: title.trim(),
      target_type: target?.type ?? null,
      target_id: target?.id ?? null,
      artwork_url: art,
      platforms: platformMap,
    } as never);
    setCreating(false);

    if (error) {
      toast.error(error.code === "23505" ? `/link/${code} is taken. Try another name.` : `Couldn't create the link: ${error.message}`);
      return;
    }
    await navigator.clipboard?.writeText(smartLinkUrl(code)).catch(() => {});
    toast.success("Smart link created and copied");
    setTitle(""); setSlug(""); setSlugTouched(false); setArtworkUrl(""); setRelease("");
    setPlatforms([{ name: "Spotify", url: "" }, { name: "Apple Music", url: "" }, { name: "YouTube", url: "" }]);
    loadLinks();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("smart_links").delete().eq("id", id);
    if (error) toast.error(`Couldn't delete: ${error.message}`);
    else { toast.success("Link deleted"); loadLinks(); }
  };

  const toggleStats = async (id: string) => {
    if (stats[id]) { setStats(({ [id]: _, ...rest }) => rest); return; }
    const s = await linkStats(id);
    setStats((prev) => ({ ...prev, [id]: s }));
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(smartLinkUrl(code));
    toast.success("Link copied");
  };

  return (
    <div className="space-y-6">
      <Card style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Link2 className="w-5 h-5" /> Create Smart Link
          </CardTitle>
          <CardDescription>One link for all platforms — track clicks automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sl-release">TDZ release (optional)</Label>
            <select id="sl-release" value={release} onChange={(e) => pickRelease(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">None — outside platforms only</option>
              {releases.map((r) => <option key={`${r.type}:${r.id}`} value={`${r.type}:${r.id}`}>{r.type === "album" ? "Album" : "Track"}: {r.title}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sl-title">Title</Label>
              <Input id="sl-title" value={title} onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(toCode(e.target.value)); }} className="mt-1" placeholder="My New Single" />
            </div>
            <div>
              <Label htmlFor="sl-slug">Link name</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">/link/</span>
                <Input id="sl-slug" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} onBlur={() => setSlug(toCode(slug))} placeholder="my-new-single" />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="sl-art">Artwork URL (optional — uses the release cover if blank)</Label>
            <Input id="sl-art" value={artworkUrl} onChange={(e) => setArtworkUrl(e.target.value)} className="mt-1" placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label>Platform Links</Label>
            {platforms.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input list="sl-platforms" aria-label="Platform" value={p.name} onChange={(e) => { const n = [...platforms]; n[i] = { ...n[i], name: e.target.value }; setPlatforms(n); }} className="w-36" />
                <Input aria-label={`${p.name || "Platform"} link`} value={p.url} onChange={(e) => { const n = [...platforms]; n[i] = { ...n[i], url: e.target.value }; setPlatforms(n); }} placeholder="https://..." className="flex-1" />
                {platforms.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => setPlatforms(platforms.filter((_, j) => j !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
            <datalist id="sl-platforms">{PLATFORMS.map((p) => <option key={p} value={p} />)}</datalist>
            <Button variant="ghost" size="sm" onClick={() => setPlatforms([...platforms, { name: "", url: "" }])} className="gap-1">
              <Plus className="w-3 h-3" /> Add Platform
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              {creating ? "Creating..." : "Create Smart Link"}
            </Button>
            <Button
              variant="outline"
              disabled={copyAI.loading || !title}
              onClick={async () => {
                const res = await copyAI.invoke({ title, artist_name: user?.email?.split("@")[0] || "Artist" });
                if (res) setAiCopy(res);
              }}
              className="gap-2"
            >
              {copyAI.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Copy
            </Button>
          </div>
          {aiCopy && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-2">
                <p className="font-semibold text-sm">{aiCopy.headline}</p>
                <p className="text-sm text-muted-foreground">{aiCopy.subheadline}</p>
                <p className="text-xs"><span className="font-medium">CTA:</span> {aiCopy.cta_text}</p>
                <p className="text-xs"><span className="font-medium">Social:</span> {aiCopy.social_caption}</p>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(aiCopy.social_caption); toast.success("Copied!"); }}>
                  <Copy className="w-3 h-3 mr-1" /> Copy Caption
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Existing links */}
      {links.length > 0 && (
        <Card style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <CardHeader>
            <CardTitle className="text-foreground">Your Smart Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {links.map((link) => (
              <div key={link.id} className="p-4 rounded-xl bg-muted/20 border border-border/20">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{link.title}</p>
                    <p className="text-xs text-muted-foreground">/link/{link.short_code} — {link.clicks || 0} clicks</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" aria-label="Click breakdown" onClick={() => toggleStats(link.id)}><BarChart3 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" aria-label="Copy link" onClick={() => copyLink(link.short_code)}><Copy className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" aria-label="Open link" onClick={() => window.open(`/link/${link.short_code}`, "_blank")}><ExternalLink className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" aria-label="Delete link" onClick={() => remove(link.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                {stats[link.id] && (
                  <ul className="mt-3 text-sm grid gap-1">
                    {stats[link.id].length === 0 && <li className="text-muted-foreground">No visits yet.</li>}
                    {stats[link.id].map((r) => (
                      <li key={r.platform} className="flex justify-between"><span>{r.platform === "view" ? "Page views" : r.platform}</span><span>{r.clicks}</span></li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
