import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, BarChart3, Megaphone, Check, Copy, Link2, Facebook, Music2 } from "lucide-react";

interface IntegrationRow {
  id: string;
  provider: string;
  display_name: string | null;
  status: string;
  config: any;
}

const PROVIDERS = [
  {
    id: "google_ads",
    name: "Google Ads",
    icon: Megaphone,
    desc: "Attribute paid traffic to releases and track cost per new listener.",
    primaryLabel: "Google Ads Customer ID",
    primaryPlaceholder: "123-456-7890",
    secondaryLabel: "Conversion Label (optional)",
    secondaryPlaceholder: "AW-XXXXXXXXX/abcDEfgh",
  },
  {
    id: "meta_ads",
    name: "Meta Ads (Facebook & Instagram)",
    icon: Facebook,
    desc: "Fire release and pre-save events to your Meta Pixel for retargeting fans.",
    primaryLabel: "Meta Pixel ID",
    primaryPlaceholder: "1234567890123456",
    secondaryLabel: "Ad Account ID (optional)",
    secondaryPlaceholder: "act_1234567890",
  },
  {
    id: "tiktok_ads",
    name: "TikTok Ads",
    icon: Music2,
    desc: "Track TikTok-driven listeners and optimize Spark Ads toward real plays.",
    primaryLabel: "TikTok Pixel ID",
    primaryPlaceholder: "C4A1B2C3D4E5F6G7H8",
    secondaryLabel: "Advertiser ID (optional)",
    secondaryPlaceholder: "7012345678901234567",
  },
  {
    id: "google_analytics",
    name: "Google Analytics 4",
    icon: BarChart3,
    desc: "Send release, smart link, and store events into your GA4 property.",
    primaryLabel: "Measurement ID",
    primaryPlaceholder: "G-XXXXXXXXXX",
    secondaryLabel: "Data Stream Name (optional)",
    secondaryPlaceholder: "TDZ Artist Page",
  },
] as const;


type Provider = (typeof PROVIDERS)[number];

export function AdsAnalyticsHub() {
  const { user } = useAuthContext();
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Provider | null>(null);
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [saving, setSaving] = useState(false);

  // Campaign tagger
  const [destination, setDestination] = useState("");
  const [source, setSource] = useState("google");
  const [medium, setMedium] = useState("cpc");
  const [campaign, setCampaign] = useState("");

  const load = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("manager_integrations")
      .select("id, provider, display_name, status, config")
      .eq("manager_id", user.id)
      .in("provider", ["google_ads", "google_analytics", "meta_ads", "tiktok_ads"]);
    setRows((data || []) as IntegrationRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const connected = (id: string) => rows.find((r) => r.provider === id);

  const openDialog = (p: Provider) => {
    const existing = connected(p.id);
    setPrimary(existing?.config?.primary_id ?? "");
    setSecondary(existing?.config?.secondary ?? "");
    setOpen(p);
  };

  const save = async () => {
    if (!user || !open || !primary.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("manager_integrations").upsert(
      {
        manager_id: user.id,
        provider: open.id,
        display_name: open.name,
        credentials: {},
        config: { primary_id: primary.trim(), secondary: secondary.trim() || null },
        status: "active",
      },
      { onConflict: "manager_id,provider" },
    );
    setSaving(false);
    if (error) {
      toast.error("Could not save integration", { description: error.message });
      return;
    }
    toast.success(`${open.name} connected`);
    setOpen(null);
    setPrimary("");
    setSecondary("");
    load();
  };

  const disconnect = async (rowId: string) => {
    const { error } = await supabase.from("manager_integrations").delete().eq("id", rowId);
    if (error) {
      toast.error("Disconnect failed", { description: error.message });
      return;
    }
    toast.success("Disconnected");
    load();
  };

  const taggedUrl = useMemo(() => {
    if (!destination.trim()) return "";
    try {
      const url = new URL(destination.trim());
      if (source) url.searchParams.set("utm_source", source);
      if (medium) url.searchParams.set("utm_medium", medium);
      if (campaign) url.searchParams.set("utm_campaign", campaign);
      url.searchParams.set("utm_content", "tdz_promote");
      return url.toString();
    } catch {
      return "";
    }
  }, [destination, source, medium, campaign]);

  const copyTagged = async () => {
    if (!taggedUrl) return;
    await navigator.clipboard.writeText(taggedUrl);
    toast.success("Tracking link copied");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDERS.map((p) => {
          const conn = connected(p.id);
          const Icon = p.icon;
          return (
            <Card key={p.id} className="glass-card p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{p.name}</h4>
                    {conn && (
                      <Badge variant="outline" className="text-green-500 border-green-500/40">
                        <Check className="w-3 h-3 mr-1" /> Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                  {conn?.config?.primary_id && (
                    <p className="text-xs mt-2 font-mono text-muted-foreground">
                      {conn.config.primary_id}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {conn ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => openDialog(p)}>
                      Update
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => disconnect(conn.id)}>
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => openDialog(p)}>
                    Connect
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Campaign Tracking Links</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Tag any release, smart link, or store URL so clicks show up in your Google Ads and GA4
          reporting.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1 md:col-span-2">
            <Label>Destination URL</Label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="https://tdz.lovable.app/track/..."
            />
          </div>
          <div className="space-y-1">
            <Label>Source</Label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="google" />
          </div>
          <div className="space-y-1">
            <Label>Medium</Label>
            <Input value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="cpc" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Campaign Name</Label>
            <Input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="summer_release_2026"
            />
          </div>
        </div>
        {taggedUrl && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3">
            <span className="text-xs font-mono break-all flex-1">{taggedUrl}</span>
            <Button size="sm" variant="outline" onClick={copyTagged}>
              <Copy className="w-3 h-3 mr-1" /> Copy
            </Button>
          </div>
        )}
      </Card>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {open?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{open?.primaryLabel}</Label>
              <Input
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                placeholder={open?.primaryPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{open?.secondaryLabel}</Label>
              <Input
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                placeholder={open?.secondaryPlaceholder}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              These IDs are public identifiers, stored privately on your account and only used to tag
              your campaigns.
            </p>
            <Button onClick={save} disabled={saving || !primary.trim()} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Connect"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
