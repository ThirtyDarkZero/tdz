import { useState } from "react";
import { SpaceBackground } from "@/components/discovery/SpaceBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import {
  User, CreditCard, Headphones, Shield, Link2, LifeBuoy,
  Trash2, AlertTriangle, ArrowLeft, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "account", label: "Account", icon: User },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "listening", label: "Listening", icon: Headphones },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "connected", label: "Connected Apps", icon: Link2 },
  { id: "support", label: "Support", icon: LifeBuoy },
  { id: "danger", label: "Danger Zone", icon: Trash2 },
];

export default function FanSettings() {
  const { user } = useAuth();
  const { subscription } = useSubscription(user);
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("account");

  // Settings state
  const [displayName, setDisplayName] = useState(user?.email?.split("@")[0] || "");
  const [audioQuality, setAudioQuality] = useState("high");
  const [crossfade, setCrossfade] = useState([0]);
  const [autoPlay, setAutoPlay] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showListening, setShowListening] = useState(true);
  const [allowDMs, setAllowDMs] = useState(true);

  const renderPanel = () => {
    switch (activeCategory) {
      case "account":
        return (
          <div className="space-y-6">
            <GlassCard title="Profile" description="Your public profile information">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-20 h-20 border-2 border-white/10">
                  <AvatarImage />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-white text-xl">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                  Change Photo
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label style={{ color: "rgba(255,255,255,0.7)" }}>Display Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }} />
                </div>
                <div>
                  <Label style={{ color: "rgba(255,255,255,0.7)" }}>Email</Label>
                  <Input value={user?.email || ""} disabled className="mt-1"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }} />
                </div>
              </div>
            </GlassCard>
            <GlassCard title="Password & Security" description="Protect your account">
              <Button variant="outline" className="w-full" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                Change Password
              </Button>
            </GlassCard>
          </div>
        );
      case "subscription":
        return (
          <GlassCard title="My Plan" description="Your current subscription">
            <div className="p-6 rounded-xl" style={{ background: "rgba(0,207,255,0.05)", border: "1px solid rgba(0,207,255,0.15)" }}>
              <div className="flex items-center justify-between mb-4">
                <SubscriptionBadge />
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Active</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                Your plan renews automatically. Manage billing in the app.
              </p>
              <Button className="mt-4" onClick={() => navigate("/pricing")}
                style={{ background: "rgba(0,207,255,0.15)", color: "#00CFFF", border: "1px solid rgba(0,207,255,0.3)" }}>
                Upgrade Plan
              </Button>
            </div>
          </GlassCard>
        );
      case "listening":
        return (
          <div className="space-y-6">
            <GlassCard title="Audio Quality" description="Choose your streaming quality">
              <div className="space-y-4">
                {[
                  { value: "auto", label: "Auto", desc: "Adjusts based on connection" },
                  { value: "low", label: "Low", desc: "96 kbps — saves data" },
                  { value: "medium", label: "Normal", desc: "160 kbps" },
                  { value: "high", label: "High", desc: "320 kbps — best quality" },
                  { value: "lossless", label: "Lossless", desc: "FLAC — studio quality" },
                ].map((q) => (
                  <label key={q.value} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: audioQuality === q.value ? "rgba(0,207,255,0.08)" : "transparent",
                      border: audioQuality === q.value ? "1px solid rgba(0,207,255,0.2)" : "1px solid transparent",
                    }}>
                    <input type="radio" name="quality" value={q.value} checked={audioQuality === q.value}
                      onChange={(e) => setAudioQuality(e.target.value)} className="sr-only" />
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: audioQuality === q.value ? "#00CFFF" : "rgba(255,255,255,0.2)" }}>
                      {audioQuality === q.value && <div className="w-2 h-2 rounded-full" style={{ background: "#00CFFF" }} />}
                    </div>
                    <div>
                      <p style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{q.label}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{q.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </GlassCard>
            <GlassCard title="Playback" description="Customize your listening experience">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label style={{ color: "rgba(255,255,255,0.7)" }}>Crossfade</Label>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{crossfade[0]}s</span>
                  </div>
                  <Slider value={crossfade} onValueChange={setCrossfade} min={0} max={12} step={1} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label style={{ color: "rgba(255,255,255,0.7)" }}>Auto-Play</Label>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Play similar tracks when queue ends</p>
                  </div>
                  <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
                </div>
              </div>
            </GlassCard>
          </div>
        );
      case "privacy":
        return (
          <GlassCard title="Privacy" description="Control who sees your activity">
            <div className="space-y-4">
              <SettingToggle label="Private Profile" desc="Only followers can see your activity" checked={privateProfile} onChange={setPrivateProfile} />
              <SettingToggle label="Show Listening Activity" desc="Let friends see what you're playing" checked={showListening} onChange={setShowListening} />
              <SettingToggle label="Allow Direct Messages" desc="Receive messages from other users" checked={allowDMs} onChange={setAllowDMs} />
            </div>
          </GlassCard>
        );
      case "connected":
        return (
          <GlassCard title="Connected Apps" description="Third-party services linked to your account">
            <div className="space-y-3">
              {[
                { name: "Stripe Payouts", status: "Not connected", color: "rgba(255,255,255,0.3)" },
                { name: "Shopify Store", status: "Not connected", color: "rgba(255,255,255,0.3)" },
              ].map((app) => (
                <div key={app.name} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{app.name}</p>
                    <p style={{ color: app.color, fontSize: 12 }}>{app.status}</p>
                  </div>
                  <Button variant="outline" size="sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          </GlassCard>
        );
      case "support":
        return (
          <GlassCard title="Support" description="Get help with your account">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                onClick={() => navigate("/faq")}>
                <LifeBuoy className="w-4 h-4" /> Help Center
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                onClick={() => navigate("/support")}>
                <LifeBuoy className="w-4 h-4" /> Submit a Ticket
              </Button>
            </div>
          </GlassCard>
        );
      case "danger":
        return (
          <GlassCard title="Danger Zone" description="Irreversible actions" destructive>
            <div className="space-y-4">
              <Button variant="outline" className="w-full" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                onClick={() => toast.success("Data export request submitted")}>
                Export My Data
              </Button>
              <Button variant="destructive" className="w-full"
                onClick={() => toast.error("Contact support@thirtydarkzero.com to delete your account")}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </Button>
            </div>
          </GlassCard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative" style={{ background: "#050510" }}>
      <SpaceBackground />
      <div className="relative z-[1] min-h-screen">
        {/* Header */}
        <div className="px-6 py-6 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg transition-all hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" style={{ color: "rgba(255,255,255,0.7)" }} />
          </button>
          <h1 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: "#FFFFFF", letterSpacing: "0.04em" }}>SETTINGS</h1>
        </div>

        <div className="px-6 pb-24 flex gap-6 max-w-5xl mx-auto">
          {/* Sidebar */}
          <div className="hidden md:block w-[220px] flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: activeCategory === cat.id ? "rgba(0,207,255,0.08)" : "transparent",
                    color: activeCategory === cat.id ? "#00CFFF" : "rgba(255,255,255,0.5)",
                    border: activeCategory === cat.id ? "1px solid rgba(0,207,255,0.15)" : "1px solid transparent",
                  }}
                >
                  <cat.icon className="w-4 h-4" />
                  <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 13 }}>{cat.label}</span>
                  {activeCategory === cat.id && <ChevronRight className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile category selector */}
          <div className="md:hidden w-full">
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="px-4 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition-all"
                  style={{
                    background: activeCategory === cat.id ? "rgba(0,207,255,0.15)" : "rgba(255,255,255,0.04)",
                    color: activeCategory === cat.id ? "#00CFFF" : "rgba(255,255,255,0.45)",
                    border: activeCategory === cat.id ? "1px solid rgba(0,207,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {renderPanel()}
          </div>

          {/* Desktop panel */}
          <div className="hidden md:block flex-1">{renderPanel()}</div>
        </div>
      </div>
    </div>
  );
}

// Reusable glass card
function GlassCard({ title, description, children, destructive }: { title: string; description: string; children: React.ReactNode; destructive?: boolean }) {
  return (
    <div className="rounded-2xl p-6" style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${destructive ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}`,
      backdropFilter: "blur(20px)",
    }}>
      <h3 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 18, color: destructive ? "#EF4444" : "#FFFFFF", marginBottom: 4 }}>{title}</h3>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 20 }}>{description}</p>
      {children}
    </div>
  );
}

// Toggle setting row
function SettingToggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div>
        <p style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{label}</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
