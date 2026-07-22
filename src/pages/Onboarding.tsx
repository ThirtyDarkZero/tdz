import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Music, Users, Headphones, ArrowRight, Loader2, Sparkles, Building2 } from "lucide-react";
import tdzLogo from "@/assets/tdz-logo.png";
import { RequireAuth } from "@/components/auth/AuthGuard";

type Role = "artist" | "manager" | "listener";

function OnboardingFlow() {
  const { user, refreshRole, role: existingRole } = useAuthContext();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  // Artist fields
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");

  // Manager fields
  const [labelName, setLabelName] = useState("");
  const [rosterEmails, setRosterEmails] = useState("");

  // If user already has a role, skip past step 1
  useEffect(() => {
    if (existingRole === "artist" || existingRole === "verified_artist") {
      setRole("artist");
      setStep(2);
    } else if (existingRole === "manager") {
      setRole("manager");
      setStep(2);
    } else if (existingRole === "listener") {
      // Already fully onboarded — send home
      navigate("/discover", { replace: true });
    }
  }, [existingRole, navigate]);

  const totalSteps = role === "listener" ? 1 : 3;
  const progress = (step / totalSteps) * 100;

  const persistRole = async (chosen: Role) => {
    if (!user) return false;
    const dbRole = chosen === "listener" ? "listener" : chosen;
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: user.id, role: dbRole as any }, { onConflict: "user_id,role" });
    if (error) {
      toast.error("Could not save role", { description: error.message });
      return false;
    }
    return true;
  };

  const handlePickRole = async (chosen: Role) => {
    setSaving(true);
    setRole(chosen);
    const ok = await persistRole(chosen);
    setSaving(false);
    if (!ok) return;
    await refreshRole();
    if (chosen === "listener") {
      toast.success("Welcome to TDZ.");
      navigate("/discover", { replace: true });
      return;
    }
    setStep(2);
  };

  const finishArtist = async () => {
    if (!user) return;
    if (!artistName.trim()) {
      toast.error("Enter an artist name to continue.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("artist_profiles").upsert(
      {
        user_id: user.id,
        artist_name: artistName.trim(),
        genre: genre.trim() || null,
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      toast.error("Could not save artist profile", { description: error.message });
      return;
    }
    setStep(3);
  };

  const finishManager = async () => {
    if (!user) return;
    if (!labelName.trim()) {
      toast.error("Enter a label or company name to continue.");
      return;
    }
    setSaving(true);
    // Save label name into enterprise_branding (used by ManagerHQ branding studio)
    await supabase.from("enterprise_branding").upsert(
      { user_id: user.id, label_name: labelName.trim() },
      { onConflict: "user_id" }
    );

    // Send roster invites (soft-fail if collaborator_invites schema differs)
    const emails = rosterEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (emails.length > 0) {
      for (const email of emails) {
        await supabase.from("collaborator_invites").insert({
          artist_id: user.id,
          invited_email: email,
          status: "pending",
          permissions: { manager: true },
        } as any);
      }
      toast.success(`${emails.length} roster invite${emails.length > 1 ? "s" : ""} queued.`);
    }

    setSaving(false);
    setStep(3);
  };

  const handleFinish = () => {
    if (role === "manager") navigate("/manager-hq", { replace: true });
    else navigate("/studio", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-[120px]" />
      </div>

      <Card className="glass-card p-8 w-full max-w-xl space-y-6 relative z-10">
        <div className="flex flex-col items-center gap-2">
          <img src={tdzLogo} alt="TDZ" className="h-14 w-auto" style={{ mixBlendMode: "screen" }} />
          <h1 className="text-2xl font-display font-bold">Welcome to TDZ</h1>
          <p className="text-sm text-muted-foreground">Let's get you set up in under a minute.</p>
        </div>

        <Progress value={progress} className="h-1" />

        {/* Step 1: Role */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">I'm here as a...</p>
            <button
              disabled={saving}
              onClick={() => handlePickRole("artist")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Artist</div>
                <div className="text-xs text-muted-foreground">Upload music, get paid $1/stream, grow your fanbase</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              disabled={saving}
              onClick={() => handlePickRole("manager")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-lg bg-fuchsia-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-fuchsia-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Manager / Label</div>
                <div className="text-xs text-muted-foreground">Manage an entire roster of artists (Enterprise features)</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              disabled={saving}
              onClick={() => handlePickRole("listener")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Fan / Listener</div>
                <div className="text-xs text-muted-foreground">Discover new artists and support them directly</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Step 2: Artist profile */}
        {step === 2 && role === "artist" && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="font-semibold">Tell us about your project</h2>
              <p className="text-xs text-muted-foreground">You can refine this later in Studio.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="artist-name">Artist name</Label>
              <Input id="artist-name" value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="e.g. Ghost Signal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Primary genre (optional)</Label>
              <Input id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. Alt R&B" />
            </div>
            <Button
              onClick={finishArtist}
              disabled={saving}
              className="w-full h-11 bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 font-semibold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
            </Button>
          </div>
        )}

        {/* Step 2: Manager profile */}
        {step === 2 && role === "manager" && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="font-semibold flex items-center justify-center gap-2">
                <Building2 className="w-4 h-4" /> Set up your label
              </h2>
              <p className="text-xs text-muted-foreground">Manager HQ unlocks full roster tools at Enterprise.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label-name">Label / company name</Label>
              <Input id="label-name" value={labelName} onChange={(e) => setLabelName(e.target.value)} placeholder="e.g. Midnight Records" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roster">Invite roster artists (optional)</Label>
              <textarea
                id="roster"
                value={rosterEmails}
                onChange={(e) => setRosterEmails(e.target.value)}
                placeholder="artist1@example.com, artist2@example.com"
                rows={3}
                className="w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">Comma or newline separated. They'll receive an invite to join your roster.</p>
            </div>
            <Button
              onClick={finishManager}
              disabled={saving}
              className="w-full h-11 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-primary font-semibold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
            </Button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">You're all set!</h2>
            <p className="text-sm text-muted-foreground">
              {role === "manager"
                ? "Manager HQ is ready. Enterprise unlocks full roster management, white-label branding, and custom integrations."
                : "Studio is ready. Upload your first track and start earning $1 per qualified stream."}
            </p>
            <Button
              onClick={handleFinish}
              className="w-full h-11 bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 font-semibold"
            >
              {role === "manager" ? "Open Manager HQ" : "Open Studio"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function Onboarding() {
  return (
    <RequireAuth>
      <OnboardingFlow />
    </RequireAuth>
  );
}
