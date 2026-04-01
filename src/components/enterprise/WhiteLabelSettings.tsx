import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Paintbrush, Upload, Eye, RotateCcw, Palette, Image as ImageIcon } from "lucide-react";

interface BrandConfig {
  logo_path: string | null;
  accent_color: string;
  background_color: string;
  sidebar_color: string;
  hide_tdz_branding: boolean;
  custom_font: string | null;
  label_name: string;
}

const DEFAULT_BRAND: BrandConfig = {
  logo_path: null,
  accent_color: "#00CFFF",
  background_color: "#141414",
  sidebar_color: "#0A0A1A",
  hide_tdz_branding: false,
  custom_font: null,
  label_name: "",
};

export function WhiteLabelSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("enterprise_branding")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setBrand({
          logo_path: data.logo_path,
          accent_color: data.accent_color || DEFAULT_BRAND.accent_color,
          background_color: data.background_color || DEFAULT_BRAND.background_color,
          sidebar_color: data.sidebar_color || DEFAULT_BRAND.sidebar_color,
          hide_tdz_branding: data.hide_tdz_branding || false,
          custom_font: data.custom_font,
          label_name: data.label_name || "",
        });
        if (data.logo_path) {
          const url = supabase.storage.from("artist-images").getPublicUrl(data.logo_path).data.publicUrl;
          setLogoPreview(url);
        }
      }
    };
    load();
  }, [user]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handlePreview = () => {
    setPreviewing(!previewing);
    if (!previewing) {
      document.documentElement.style.setProperty("--primary", hexToHSL(brand.accent_color));
      document.documentElement.style.setProperty("--background", hexToHSL(brand.background_color));
      document.documentElement.style.setProperty("--sidebar-background", hexToHSL(brand.sidebar_color));
    } else {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--background");
      document.documentElement.style.removeProperty("--sidebar-background");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let logoPath = brand.logo_path;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${user.id}/brand-logo.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("artist-images").upload(path, logoFile, { upsert: true });
        if (!uploadErr) logoPath = path;
      }

      const payload = {
        user_id: user.id,
        logo_path: logoPath,
        accent_color: brand.accent_color,
        background_color: brand.background_color,
        sidebar_color: brand.sidebar_color,
        hide_tdz_branding: brand.hide_tdz_branding,
        custom_font: brand.custom_font,
        label_name: brand.label_name,
      };

      const { error } = await (supabase as any)
        .from("enterprise_branding")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;

      toast({ title: "Branding Saved", description: "Your white-label settings have been updated." });
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setBrand(DEFAULT_BRAND);
    setLogoPreview(null);
    setLogoFile(null);
    if (previewing) {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--background");
      document.documentElement.style.removeProperty("--sidebar-background");
      setPreviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">White-Label Branding</h2>
          <p className="text-muted-foreground mt-1">Customize your dashboard with your own brand identity</p>
        </div>
        <Badge className="bg-accent/20 text-accent border-accent/30">Enterprise</Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Logo & Identity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="w-5 h-5 text-primary" />
              Logo & Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative w-32 h-32 rounded-2xl border-2 border-dashed border-muted cursor-pointer hover:border-primary transition-colors overflow-hidden flex items-center justify-center"
                style={{ background: "var(--glass-1)" }}
                onClick={() => logoInputRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload Logo</span>
                  </div>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
              <p className="text-xs text-muted-foreground">PNG, SVG, or JPG • Max 2MB</p>
            </div>

            <div>
              <Label>Label / Company Name</Label>
              <Input
                value={brand.label_name}
                onChange={(e) => setBrand({ ...brand, label_name: e.target.value })}
                placeholder="Your label name"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Hide TDZ Branding</Label>
                <p className="text-xs text-muted-foreground">Remove all ThirtyDarkZero logos</p>
              </div>
              <Switch
                checked={brand.hide_tdz_branding}
                onCheckedChange={(v) => setBrand({ ...brand, hide_tdz_branding: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Color Customization */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5 text-primary" />
              Color Scheme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4">
              {[
                { label: "Accent Color", key: "accent_color" as const, desc: "Buttons, links, highlights" },
                { label: "Background Color", key: "background_color" as const, desc: "Main content area" },
                { label: "Sidebar Color", key: "sidebar_color" as const, desc: "Navigation sidebar" },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl border border-border cursor-pointer relative overflow-hidden"
                    style={{ background: brand[item.key] }}
                  >
                    <input
                      type="color"
                      value={brand[item.key]}
                      onChange={(e) => setBrand({ ...brand, [item.key]: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Input
                    value={brand[item.key]}
                    onChange={(e) => setBrand({ ...brand, [item.key]: e.target.value })}
                    className="w-28 font-mono text-xs"
                  />
                </div>
              ))}
            </div>

            {/* Preview swatch */}
            <div className="rounded-xl overflow-hidden border border-border" style={{ height: 80 }}>
              <div className="flex h-full">
                <div className="w-16 flex items-center justify-center" style={{ background: brand.sidebar_color }}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="w-8 h-8 object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-full" style={{ background: brand.accent_color, opacity: 0.3 }} />
                  )}
                </div>
                <div className="flex-1 flex items-center justify-center" style={{ background: brand.background_color }}>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-3 rounded-full" style={{ background: brand.accent_color }} />
                    <div className="w-10 h-3 rounded-full" style={{ background: brand.accent_color, opacity: 0.3 }} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>
          <Button variant="outline" onClick={handlePreview} className="gap-2">
            <Eye className="w-4 h-4" />
            {previewing ? "Stop Preview" : "Live Preview"}
          </Button>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-gradient-to-r from-primary to-secondary">
          <Paintbrush className="w-4 h-4" />
          {saving ? "Saving..." : "Save Branding"}
        </Button>
      </div>
    </div>
  );
}

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "193 100% 50%";
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
