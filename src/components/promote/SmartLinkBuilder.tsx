import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SmartLink {
  id: string;
  slug: string;
  title: string;
  artwork_url: string | null;
  platforms: Record<string, string>;
  click_count: number;
  created_at: string;
}

export function SmartLinkBuilder() {
  const { user } = useAuth();
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [platforms, setPlatforms] = useState<{ name: string; url: string }[]>([
    { name: "Spotify", url: "" },
    { name: "Apple Music", url: "" },
    { name: "YouTube", url: "" },
  ]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) loadLinks();
  }, [user]);

  const loadLinks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("smart_links")
      .select("*")
      .eq("artist_id", user.id)
      .order("created_at", { ascending: false });
    setLinks((data as any[]) || []);
  };

  const handleCreate = async () => {
    if (!user || !title || !slug) { toast.error("Title and slug are required"); return; }
    setCreating(true);

    const platformMap: Record<string, string> = {};
    platforms.forEach(p => { if (p.url) platformMap[p.name] = p.url; });

    const { error } = await supabase.from("smart_links").insert({
      artist_id: user.id,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      title,
      artwork_url: artworkUrl || null,
      platforms: platformMap,
    } as any);

    if (error) {
      toast.error(error.message.includes("unique") ? "Slug already taken" : "Failed to create link");
    } else {
      toast.success("Smart Link created!");
      setTitle(""); setSlug(""); setArtworkUrl("");
      setPlatforms([{ name: "Spotify", url: "" }, { name: "Apple Music", url: "" }, { name: "YouTube", url: "" }]);
      loadLinks();
    }
    setCreating(false);
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/link/${slug}`);
    toast.success("Link copied!");
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
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Release Title</Label>
              <Input value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }} className="mt-1" placeholder="My New Single" />
            </div>
            <div>
              <Label>Custom Slug</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">/link/</span>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-new-single" />
              </div>
            </div>
          </div>
          <div>
            <Label>Artwork URL (optional)</Label>
            <Input value={artworkUrl} onChange={(e) => setArtworkUrl(e.target.value)} className="mt-1" placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label>Platform Links</Label>
            {platforms.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={p.name} onChange={(e) => { const n = [...platforms]; n[i].name = e.target.value; setPlatforms(n); }} className="w-32" />
                <Input value={p.url} onChange={(e) => { const n = [...platforms]; n[i].url = e.target.value; setPlatforms(n); }} placeholder="https://..." className="flex-1" />
                {platforms.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => setPlatforms(platforms.filter((_, j) => j !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setPlatforms([...platforms, { name: "", url: "" }])} className="gap-1">
              <Plus className="w-3 h-3" /> Add Platform
            </Button>
          </div>

          <Button onClick={handleCreate} disabled={creating} className="gap-2">
            {creating ? "Creating..." : "Create Smart Link"}
          </Button>
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
              <div key={link.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/20">
                <div>
                  <p className="font-semibold">{link.title}</p>
                  <p className="text-xs text-muted-foreground">/link/{link.slug} · {link.click_count || 0} clicks</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => copyLink(link.slug)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => window.open(`/link/${link.slug}`, "_blank")}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
