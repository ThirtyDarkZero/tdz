import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plug, Check } from "lucide-react";

interface Integration {
  id: string;
  provider: string;
  display_name: string | null;
  status: string;
  config: any;
}

const PROVIDERS = [
  { id: "google_ads", name: "Google Ads Manager", desc: "Run and track ad campaigns for your roster", field: "Customer ID + Developer Token" },
  { id: "meta_ads", name: "Meta Ads", desc: "Facebook & Instagram advertising", field: "Access Token" },
  { id: "tiktok_ads", name: "TikTok Ads", desc: "Reach Gen Z on TikTok", field: "Access Token" },
  { id: "google_analytics", name: "Google Analytics 4", desc: "Track roster website traffic", field: "Measurement ID + API secret" },
  { id: "mailchimp", name: "Mailchimp", desc: "Sync fan email lists", field: "API Key" },
  { id: "zapier", name: "Zapier Webhook", desc: "Send events to any tool", field: "Webhook URL" },
];

export function IntegrationsHub() {
  const { user } = useAuthContext();
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [openProvider, setOpenProvider] = useState<(typeof PROVIDERS)[number] | null>(null);
  const [credential, setCredential] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("manager_integrations")
      .select("*")
      .eq("manager_id", user.id);
    setItems((data || []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const existing = (id: string) => items.find((i) => i.provider === id);

  const handleConnect = async () => {
    if (!user || !openProvider || !credential.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("manager_integrations").upsert(
      {
        manager_id: user.id,
        provider: openProvider.id,
        display_name: openProvider.name,
        credentials: { primary: credential.trim() },
        config: {},
        status: "active",
      },
      { onConflict: "manager_id,provider" }
    );
    setSaving(false);
    if (error) {
      toast.error("Failed to save integration", { description: error.message });
      return;
    }
    toast.success(`${openProvider.name} connected`);
    setOpenProvider(null);
    setCredential("");
    load();
  };

  const handleDisconnect = async (id: string) => {
    const { error } = await supabase.from("manager_integrations").delete().eq("id", id);
    if (error) {
      toast.error("Disconnect failed", { description: error.message });
      return;
    }
    toast.success("Disconnected");
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDERS.map((p) => {
          const conn = existing(p.id);
          return (
            <Card key={p.id} className="p-5 glass-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Plug className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold">{p.name}</h4>
                    {conn && (
                      <Badge variant="outline" className="text-green-500 border-green-500/40">
                        <Check className="w-3 h-3 mr-1" /> Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {conn ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setOpenProvider(p)}>
                      Update
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDisconnect(conn.id)}>
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setOpenProvider(p)}>
                    Connect
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!openProvider} onOpenChange={(o) => !o && setOpenProvider(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {openProvider?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{openProvider?.field}</Label>
              <Input
                type="password"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="Paste your credential"
              />
              <p className="text-xs text-muted-foreground">
                Stored securely; only your account can read it.
              </p>
            </div>
            <Button onClick={handleConnect} disabled={saving || !credential.trim()} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Connect"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
