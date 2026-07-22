import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Palette, Upload } from "lucide-react";

export function BrandingStudio() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [labelName, setLabelName] = useState("");
  const [accentColor, setAccentColor] = useState("#FF6347");
  const [backgroundColor, setBackgroundColor] = useState("#0D0D0D");
  const [sidebarColor, setSidebarColor] = useState("#141414");
  const [customFont, setCustomFont] = useState("");
  const [hideTdz, setHideTdz] = useState(false);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("enterprise_branding")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setLabelName(data.label_name || "");
        setAccentColor(data.accent_color || "#FF6347");
        setBackgroundColor(data.background_color || "#0D0D0D");
        setSidebarColor(data.sidebar_color || "#141414");
        setCustomFont(data.custom_font || "");
        setHideTdz(!!data.hide_tdz_branding);
        setLogoPath(data.logo_path || null);
        if (data.logo_path) {
          const { data: signed } = await supabase.storage
            .from("artist-images")
            .createSignedUrl(data.logo_path, 3600);
          setLogoUrl(signed?.signedUrl || null);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingLogo(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/brand-logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("artist-images").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed", { description: error.message });
    } else {
      setLogoPath(path);
      const { data: signed } = await supabase.storage.from("artist-images").createSignedUrl(path, 3600);
      setLogoUrl(signed?.signedUrl || null);
      toast.success("Logo uploaded");
    }
    setUploadingLogo(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("enterprise_branding").upsert(
      {
        user_id: user.id,
        label_name: labelName,
        accent_color: accentColor,
        background_color: backgroundColor,
        sidebar_color: sidebarColor,
        custom_font: customFont || null,
        hide_tdz_branding: hideTdz,
        logo_path: logoPath,
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      toast.error("Save failed", { description: error.message });
      return;
    }
    toast.success("Branding saved. It'll apply on next Manager HQ load.");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-5 glass-card space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">White-label branding</h3>
          </div>

          <div className="space-y-2">
            <Label>Label name</Label>
            <Input value={labelName} onChange={(e) => setLabelName(e.target.value)} placeholder="Midnight Records" />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              {logoUrl && <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded object-contain bg-muted/30 p-1" />}
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border/50 hover:bg-muted/40 text-sm">
                <Upload className="w-4 h-4" />
                {uploadingLogo ? "Uploading..." : "Upload logo"}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Accent</Label>
              <div className="flex gap-2">
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded border border-border/50" />
                <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Background</Label>
              <div className="flex gap-2">
                <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-10 h-10 rounded border border-border/50" />
                <Input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sidebar</Label>
              <div className="flex gap-2">
                <input type="color" value={sidebarColor} onChange={(e) => setSidebarColor(e.target.value)} className="w-10 h-10 rounded border border-border/50" />
                <Input value={sidebarColor} onChange={(e) => setSidebarColor(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom font (Google Font family)</Label>
            <Input value={customFont} onChange={(e) => setCustomFont(e.target.value)} placeholder="e.g. Inter" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Hide TDZ branding</Label>
              <p className="text-xs text-muted-foreground">Removes TDZ logo from your roster's artist pages.</p>
            </div>
            <Switch checked={hideTdz} onCheckedChange={setHideTdz} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save branding"}
          </Button>
        </Card>
      </div>

      <Card className="p-5 glass-card">
        <h4 className="font-semibold mb-3 text-sm">Live preview</h4>
        <div
          className="rounded-lg overflow-hidden border border-border/40"
          style={{ background: backgroundColor, fontFamily: customFont || undefined }}
        >
          <div style={{ background: sidebarColor }} className="p-4 flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-6 h-6 object-contain" />
            ) : (
              <div className="w-6 h-6 rounded" style={{ background: accentColor }} />
            )}
            <span className="text-sm text-white font-medium">{labelName || "Your Label"}</span>
          </div>
          <div className="p-4 space-y-2">
            <div className="h-2 rounded w-24" style={{ background: accentColor }} />
            <div className="h-2 rounded bg-white/10 w-40" />
            <div className="h-2 rounded bg-white/10 w-32" />
            <div className="mt-3 rounded p-3" style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}` }}>
              <div className="text-xs" style={{ color: accentColor }}>Featured artist</div>
              <div className="text-sm text-white mt-1">New release</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
