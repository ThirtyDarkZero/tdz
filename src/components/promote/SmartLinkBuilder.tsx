import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Copy, ExternalLink, Trash2, Sparkles, Loader2, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAIFeature } from "@/hooks/useAIFeature";
import { isValidCode, linkStats, smartLinkUrl, toCode } from "@/lib/smartLinks";
import { AlbumCoverUploader } from "@/components/AlbumCoverUploader";
import { ReleaseCard } from "@/components/promote/ReleaseCard";
import { DEFAULT_PLATFORMS, PlatformLinksEditor, platformMap, type PlatformLink } from "@/components/promote/PlatformLinksEditor";

interface SmartLink {
  id: string;
  short_code: string;
  title: string | null;
  clicks: number | null;
  created_at: string;
}

interface Release { id: string; type: "track" | "album"; title: string }

const coverUrl = async (r: Release): Promise<string | null> => {
  if (r.type === "track") {
    const { data: t } = await supabase.from("tracks").select("album_cover_path, album_cover_bucket").eq("id", r.id).maybeSingle();
    return t?.album_cover_path ? supabase.storage.from(t.album_cover_bucket || "album-covers").getPublicUrl(t.album_cover_path).data.publicUrl : null;
  }
  const { data: a } = await supabase.from("albums").select("cover_art_path").eq("id", r.id).maybeSingle();
  return a?.cover_art_path ? supabase.storage.from("album-covers").getPublicUrl(a.cover_art_path).data.publicUrl : null;
};

/** Turns database errors into something an artist can act on. */
export function linkError(e: { code?: string; message: string }, code: string): string {
  if (e.code === "23505") return `/link/${code} is taken. Try another name.`;
  if (/schema cache|column .* does not exist/i.test(e.message)) return "Smart links aren't set up on the server yet (a database update is pending). Try again once it's applied.";
  return `Couldn't create the link: ${e.message}`;
}

export function SmartLinkBuilder() {
  const { user } = useAuth();
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [release, setRelease] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [artPath, setArtPath] = useState<string | null>(null);
  const [artUrl, setArtUrl] = useState<string | null>(null);
  const [releaseArt, setReleaseArt] = useState<string | null>(null);
  const [artistName, setArtistName] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<PlatformLink[]>(DEFAULT_PLATFORMS);
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
    supabase.from("artist_profiles").select("artist_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setArtistName(data?.artist_name ?? null));
    Promise.all([
      supabase.from("tracks").select("id, title").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("albums").select("id, title").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]).then(([t, a]) => setReleases([
      ...((a.data ?? []) as { id: string; title: string }[]).map((r) => ({ ...r, type: "album" as const })),
      ...((t.data ?? []) as { id: string; title: string }[]).map((r) => ({ ...r, type: "track" as const })),
    ]));
  }, [user, loadLinks]);

  const pickRelease = async (key: string) => {
    setRelease(key);
    setReleaseArt(null);
    const r = releases.find((x) => `${x.type}:${x.id}` === key);
    if (!r) return;
    setTitle(r.title);
    if (!slugTouched) setSlug(toCode(r.title));
    setReleaseArt(await coverUrl(r));
  };

  const reset = () => {
    setTitle(""); setSlug(""); setSlugTouched(false); setArtPath(null); setArtUrl(null); setReleaseArt(null); setRelease("");
    setPlatforms(DEFAULT_PLATFORMS);
  };

  const handleCreate = async () => {
    if (!user) return;
    const code = toCode(slug || title);
    if (!title.trim()) { toast.error("Add a title."); return; }
    if (!isValidCode(code)) { toast.error("The link name needs at least 2 letters or numbers."); return; }
    const map = platformMap(platforms);
    if (typeof map === "string") { toast.error(map); return; }
    const target = releases.find((x) => `${x.type}:${x.id}` === release);
    if (!target && Object.keys(map).length === 0) {
      toast.error("Pick a TDZ release or add at least one streaming link.");
      return;
    }

    setCreating(true);
    const { error } = await supabase.from("smart_links").insert({
      user_id: user.id,
      short_code: code,
      title: title.trim(),
      target_type: target?.type ?? null,
      target_id: target?.id ?? null,
      artwork_url: artUrl,
      platforms: map,
    } as never);
    setCreating(false);

    if (error) { toast.error(linkError(error, code)); return; }
    await navigator.clipboard?.writeText(smartLinkUrl(code)).catch(() => {});
    toast.success("Smart link created and copied");
    reset();
    loadLinks();
  };

  const target = releases.find((x) => `${x.type}:${x.id}` === release);
  const previewLinks = platforms.filter((p) => p.name.trim() && p.url.trim()).map((p) => ({ name: p.name.trim(), href: "#" }));

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
            <Link2 className="w-5 h-5" /> Create a smart link
          </CardTitle>
          <CardDescription>One card with your artwork and every place to listen. Clicks are counted per service.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4 min-w-0">
            <div>
              <Label htmlFor="sl-release">TDZ release (optional)</Label>
              <select id="sl-release" value={release} onChange={(e) => pickRelease(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">None — streaming links only</option>
                {releases.map((r) => <option key={`${r.type}:${r.id}`} value={`${r.type}:${r.id}`}>{r.type === "album" ? "Album" : "Track"}: {r.title}</option>)}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sl-title">Song or release title</Label>
                <Input id="sl-title" value={title} onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(toCode(e.target.value)); }} className="mt-1" placeholder="My New Single" />
              </div>
              <div>
                <Label htmlFor="sl-slug">Link name</Label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground shrink-0">/link/</span>
                  <Input id="sl-slug" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} onBlur={() => setSlug(toCode(slug))} placeholder="my-new-single" />
                </div>
              </div>
            </div>
            <div>
              <Label>Artwork</Label>
              <div className="mt-2 flex items-center gap-4">
                <AlbumCoverUploader coverPath={artPath} bucket="album-covers" size="sm"
                  onUpload={(path, url) => { setArtPath(path); setArtUrl(url); }} />
                <p className="text-xs text-muted-foreground">
                  {artUrl ? "Using your upload." : releaseArt ? "Using the release cover. Upload to replace it." : "Square JPG or PNG, 3000×3000 recommended."}
                </p>
              </div>
            </div>
            <PlatformLinksEditor value={platforms} onChange={setPlatforms} idPrefix="sl" />

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCreate} disabled={creating} className="gap-2">
                {creating ? "Creating…" : "Create smart link"}
              </Button>
              <Button
                variant="outline"
                disabled={copyAI.loading || !title}
                onClick={async () => {
                  const res = await copyAI.invoke({ title, artist_name: artistName || user?.email?.split("@")[0] || "Artist" });
                  if (res) setAiCopy(res);
                }}
                className="gap-2"
              >
                {copyAI.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Write a caption
              </Button>
            </div>
            {aiCopy && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 space-y-2">
                  <p className="font-semibold text-sm">{aiCopy.headline}</p>
                  <p className="text-sm text-muted-foreground">{aiCopy.subheadline}</p>
                  <p className="text-xs"><span className="font-medium">Social:</span> {aiCopy.social_caption}</p>
                  <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(aiCopy.social_caption); toast.success("Caption copied"); }}>
                    <Copy className="w-3 h-3 mr-1" /> Copy caption
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium mb-2">Preview</p>
            <div className="rounded-3xl bg-black p-3 flex justify-center relative overflow-hidden">
              {(artUrl || releaseArt) && <img src={artUrl || releaseArt || ""} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125" />}
              <div className="relative w-full flex justify-center">
                <ReleaseCard preview art={artUrl || releaseArt} title={title || "Your title"} artist={artistName}
                  tdz={target ? { name: "TDZ", href: "#" } : null} links={previewLinks} />
              </div>
            </div>
          </div>
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
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="min-w-0 flex-1 basis-48">
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
