import { sendAppEmail, sendTutorialEmail } from "@/lib/emails";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Music,
  Users,
  Headphones,
  ArrowRight,
  Loader2,
  Sparkles,
  Building2,
  Trophy,
  Zap,
  Star,
  Rocket,
} from "lucide-react";
import tdzLogo from "@/assets/tdz-logo.png";
import heroArtistStudio from "@/assets/hero-artist-studio.jpg";
import heroArtistStreet from "@/assets/hero-artist-street.jpg";
import heroArtistHeadphones from "@/assets/hero-artist-headphones.jpg";
import { RequireAuth } from "@/components/auth/AuthGuard";
import { openStripeCheckout, type CheckoutPlan } from "@/lib/subscription-checkout";
import { CreditCard, Banknote, CheckCircle2, ShieldCheck } from "lucide-react";

type Role = "artist" | "manager" | "listener";

const ROLE_META: Record<
  Role,
  {
    label: string;
    tagline: string;
    hero: string;
    accent: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    perks: string[];
    xp: number;
  }
> = {
  artist: {
    label: "THE ARTIST",
    tagline: "Drop tracks. Earn $1/stream. Build your empire.",
    hero: heroArtistStudio,
    accent: "#FF6347",
    icon: Music,
    perks: ["+1000 XP Boost", "Studio Unlocked", "Fan Tips ON"],
    xp: 1000,
  },
  manager: {
    label: "THE MOGUL",
    tagline: "Command your roster. White-label your empire.",
    hero: heroArtistStreet,
    accent: "#e879f9",
    icon: Building2,
    perks: ["+2500 XP Boost", "Manager HQ", "Enterprise Ready"],
    xp: 2500,
  },
  listener: {
    label: "THE TASTEMAKER",
    tagline: "Discover heat. Tip the artist. Shape the sound.",
    hero: heroArtistHeadphones,
    accent: "#a78bfa",
    icon: Headphones,
    perks: ["+500 XP Boost", "Early Access", "Vote On LSS"],
    xp: 500,
  },
};

function OnboardingFlow() {
  const { user, refreshRole, role: existingRole } = useAuthContext();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [hoveredRole, setHoveredRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [xp, setXp] = useState(0);
  const [levelUp, setLevelUp] = useState(false);

  // Artist fields
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");

  // Manager fields
  const [labelName, setLabelName] = useState("");

  // Stripe (step 3)
  const [payoutConnected, setPayoutConnected] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CheckoutPlan | null>(null);
  const [rosterEmails, setRosterEmails] = useState("");

  // Listener (tastemaker) fields
  const [fanName, setFanName] = useState("");
  const [favoriteGenres, setFavoriteGenres] = useState("");

  // Hydrate the flow from an existing role ONCE — never snap the user backwards
  // while they're mid-journey.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current || !existingRole) return;
    hydrated.current = true;
    if (existingRole === "artist" || existingRole === "verified_artist") {
      setRole("artist");
      setStep((s) => (s === 1 ? 2 : s));
    } else if (existingRole === "manager") {
      setRole("manager");
      setStep((s) => (s === 1 ? 2 : s));
    } else if (existingRole === "listener") {
      setRole("listener");
      setStep((s) => (s === 1 ? 2 : s));
    }
  }, [existingRole]);

  // Returning from Stripe (checkout or Connect onboarding) lands back here.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payout") || params.get("checkout")) {
      hydrated.current = true;
      setStep(3);
      if (params.get("checkout") === "success") toast.success("Subscription active. Welcome aboard.");
      if (params.get("payout") === "success") toast.success("Payout account connected.");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const [{ data: payout }, { data: sub }] = await Promise.all([
        supabase
          .from("artist_payout_details")
          .select("stripe_connect_id, payout_enabled")
          .eq("artist_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setPayoutConnected(Boolean(payout?.stripe_connect_id));
      setSubscribed(sub?.status === "active" || sub?.status === "trialing");
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, step]);

  const connectPayouts = async () => {
    setPayoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-artist-payout", {
        body: { returnTo: "/onboarding" },
      });
      if (error && !data) throw new Error(error.message || "Could not reach the payout service");
      if (data?.success && data?.onboardingUrl) {
        window.location.href = data.onboardingUrl;
        return;
      }
      throw new Error(data?.error || "Failed to start payout onboarding");
    } catch (e: any) {
      toast.error(e?.message || "Failed to connect Stripe");
      setPayoutLoading(false);
    }
  };

  const startPlanCheckout = async (plan: CheckoutPlan) => {
    setSelectedPlan(plan);
    await openStripeCheckout(plan, "/onboarding");
    setSelectedPlan(null);
  };

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;
  const activeRole = hoveredRole || role;
  const activeMeta = activeRole ? ROLE_META[activeRole] : null;

  const triggerXP = (amount: number) => {
    setLevelUp(true);
    const start = xp;
    const target = xp + amount;
    const dur = 900;
    const t0 = performance.now();
    const animate = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      setXp(Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(animate);
      else setTimeout(() => setLevelUp(false), 400);
    };
    requestAnimationFrame(animate);
  };

  const persistRole = async (chosen: Role) => {
    if (!user) return false;
    const dbRole = chosen === "listener" ? "listener" : chosen;
    // Insert-only (ignore duplicates): user_roles has no self-UPDATE policy, so a
    // real upsert would fail with RLS when the row already exists.
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: user.id, role: dbRole as any }, {
        onConflict: "user_id,role",
        ignoreDuplicates: true,
      });
    if (error) {
      toast.error("Could not save role", { description: error.message });
      return false;
    }
    if (user.email) {
      void sendAppEmail({
        templateName: "welcome",
        recipientEmail: user.email,
        idempotencyKey: `welcome-${user.id}`,
        templateData: {
          name:
            (user.user_metadata as any)?.full_name?.split(" ")?.[0] ||
            user.email.split("@")[0],
          role: dbRole,
        },
      });
    }
    return true;
  };


  const handlePickRole = async (chosen: Role) => {
    setSaving(true);
    setRole(chosen);
    triggerXP(ROLE_META[chosen].xp);
    const ok = await persistRole(chosen);
    setSaving(false);
    if (!ok) return;
    await refreshRole();
    if (chosen === "listener") {
      toast.success("🎧 CLASS SELECTED — TASTEMAKER", { description: "Welcome to the frontline." });
      if (user?.email) {
        void sendTutorialEmail({
          templateName: "tutorial-discovery",
          userId: user.id,
          recipientEmail: user.email,
          templateData: {
            name:
              (user.user_metadata as any)?.full_name?.split(" ")?.[0] ||
              user.email.split("@")[0],
          },
        });
      }
    }
    setTimeout(() => setStep(2), 700);
  };

  const finishListener = async () => {
    if (!user) return;
    const name =
      fanName.trim() ||
      (user.user_metadata as any)?.full_name ||
      (user.email ? user.email.split("@")[0] : "");
    if (!name) {
      toast.error("Pick a name the scene will know you by.");
      return;
    }
    setSaving(true);
    const genres = favoriteGenres
      .split(/[\n,;]+/)
      .map((g) => g.trim())
      .filter(Boolean);
    const { error } = await supabase.from("listener_profiles").upsert(
      {
        user_id: user.id,
        display_name: name,
        favorite_genres: genres.length ? genres : null,
      } as any,
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      toast.error("Could not save your taste profile", { description: error.message });
      return;
    }
    triggerXP(500);
    setStep(3);
  };

  const finishArtist = async () => {
    if (!user) return;
    if (!artistName.trim()) {
      toast.error("Every legend needs a name.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("artist_profiles").upsert(
      { user_id: user.id, artist_name: artistName.trim(), genre: genre.trim() || null },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      toast.error("Could not save artist profile", { description: error.message });
      return;
    }
    if (user.email) {
      void sendTutorialEmail({
        templateName: "tutorial-first-upload",
        userId: user.id,
        recipientEmail: user.email,
        templateData: { name: artistName.trim() },
      });
    }
    triggerXP(500);
    setStep(3);
  };

  const finishManager = async () => {
    if (!user) return;
    if (!labelName.trim()) {
      toast.error("Name your empire to continue.");
      return;
    }
    setSaving(true);
    await supabase.from("enterprise_branding").upsert(
      { user_id: user.id, label_name: labelName.trim() },
      { onConflict: "user_id" }
    );

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
      triggerXP(emails.length * 250);
      toast.success(`🚀 ${emails.length} recruit${emails.length > 1 ? "s" : ""} summoned.`);
    }

    setSaving(false);
    triggerXP(1000);
    setStep(3);
  };

  const handleFinish = () => {
    if (role === "manager") navigate("/manager-hq", { replace: true });
    else navigate("/studio", { replace: true });
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#050505" }}>
      {/* Cinematic backdrop */}
      <div className="absolute inset-0">
        {(Object.keys(ROLE_META) as Role[]).map((r) => (
          <div
            key={r}
            className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
            style={{ opacity: activeRole === r ? 0.55 : 0 }}
          >
            <img
              src={ROLE_META[r].hero}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: "saturate(1.2) contrast(1.1)", transform: "scale(1.08)" }}
            />
          </div>
        ))}
        {!activeRole && (
          <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[180px]" style={{ background: "rgba(255,99,71,0.25)" }} />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[150px]" style={{ background: "rgba(167,139,250,0.25)" }} />
          </>
        )}
        {/* Vignette + scanlines */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.85) 90%), linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.9) 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 3px)",
          }}
        />
      </div>

      {/* HUD frame */}
      <div className="relative z-10 min-h-screen flex flex-col p-4 sm:p-8">
        {/* Top HUD bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={tdzLogo} alt="TDZ" className="h-10 w-auto" style={{ mixBlendMode: "screen" }} />
            <div className="hidden sm:block">
              <div className="text-[10px] tracking-[0.3em] text-white/50" style={{ fontFamily: "'Raleway',sans-serif" }}>
                PLAYER SETUP
              </div>
              <div className="text-xs tracking-widest text-white/80 font-bold">STAGE {step} / {totalSteps}</div>
            </div>
          </div>

          {/* XP counter */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-xl transition-all"
              style={{
                borderColor: levelUp ? "#FF6347" : "rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.5)",
                boxShadow: levelUp ? "0 0 30px rgba(255,99,71,0.6)" : "none",
              }}
            >
              <Star className={`w-4 h-4 ${levelUp ? "animate-spin" : ""}`} style={{ color: "#FFD700", fill: "#FFD700" }} />
              <span className="tabular-nums font-bold text-white text-sm tracking-wider">
                {xp.toLocaleString()} XP
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar — game style */}
        <div className="mb-8 max-w-2xl mx-auto w-full">
          <div className="relative h-2 rounded-full overflow-hidden border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${activeMeta?.accent || "#FF6347"}, #a78bfa, ${activeMeta?.accent || "#FF6347"})`,
                backgroundSize: "200% 100%",
                animation: "shimmer 2s linear infinite",
                boxShadow: `0 0 20px ${activeMeta?.accent || "#FF6347"}`,
              }}
            />
          </div>
          <style>{`@keyframes shimmer { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }`}</style>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-5xl">
            {/* STEP 1 — Class selection */}
            {step === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-xl" style={{ background: "rgba(255,99,71,0.1)" }}>
                    <Zap className="w-3.5 h-3.5" style={{ color: "#FF6347" }} />
                    <span className="text-[10px] tracking-[0.3em] text-white/80 font-bold">SELECT YOUR CLASS</span>
                  </div>
                  <h1
                    className="text-5xl sm:text-6xl md:text-7xl text-white leading-none"
                    style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.02em" }}
                  >
                    WHO ARE YOU<br />
                    <span style={{ color: activeMeta?.accent || "#FF6347" }}>IN THIS GAME?</span>
                  </h1>
                  <p className="text-white/60 text-sm max-w-md mx-auto" style={{ fontFamily: "'Raleway',sans-serif" }}>
                    {activeMeta?.tagline || "Hover a class to preview. Click to lock in your journey."}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {(Object.keys(ROLE_META) as Role[]).map((r) => {
                    const meta = ROLE_META[r];
                    const Icon = meta.icon;
                    const isActive = activeRole === r;
                    return (
                      <button
                        key={r}
                        disabled={saving}
                        onMouseEnter={() => setHoveredRole(r)}
                        onMouseLeave={() => setHoveredRole(null)}
                        onClick={() => handlePickRole(r)}
                        className="group relative overflow-hidden rounded-2xl border text-left transition-all duration-500 disabled:opacity-50"
                        style={{
                          borderColor: isActive ? meta.accent : "rgba(255,255,255,0.12)",
                          background: "rgba(10,10,10,0.6)",
                          backdropFilter: "blur(24px)",
                          transform: isActive ? "translateY(-6px) scale(1.02)" : "translateY(0)",
                          boxShadow: isActive
                            ? `0 20px 60px -20px ${meta.accent}80, inset 0 0 40px ${meta.accent}20`
                            : "0 4px 20px rgba(0,0,0,0.4)",
                        }}
                      >
                        {/* Portrait */}
                        <div className="relative h-56 overflow-hidden">
                          <img
                            src={meta.hero}
                            alt={meta.label}
                            className="w-full h-full object-cover transition-transform duration-700"
                            style={{ transform: isActive ? "scale(1.12)" : "scale(1)", filter: "saturate(1.15) contrast(1.1)" }}
                          />
                          <div
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.95) 100%), linear-gradient(135deg, ${meta.accent}30 0%, transparent 60%)`,
                            }}
                          />
                          {/* Corner brackets — HUD style */}
                          <div className="absolute inset-3 pointer-events-none">
                            {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map((pos, k) => (
                              <div
                                key={k}
                                className={`absolute w-5 h-5 ${pos} transition-all duration-300`}
                                style={{ borderColor: isActive ? meta.accent : "rgba(255,255,255,0.4)" }}
                              />
                            ))}
                          </div>
                          <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-[9px] font-bold tracking-widest backdrop-blur-xl" style={{ background: "rgba(0,0,0,0.7)", color: meta.accent, border: `1px solid ${meta.accent}60` }}>
                            +{meta.xp} XP
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-5 space-y-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                              style={{
                                background: `${meta.accent}20`,
                                border: `1px solid ${meta.accent}60`,
                                boxShadow: isActive ? `0 0 20px ${meta.accent}80` : "none",
                              }}
                            >
                              <Icon className="w-5 h-5" style={{ color: meta.accent }} />
                            </div>
                            <div>
                              <div className="text-[9px] tracking-[0.3em] text-white/40 font-bold">CLASS</div>
                              <div className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: "'Six Caps',sans-serif", letterSpacing: "0.05em" }}>
                                {meta.label}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            {meta.perks.map((p) => (
                              <div key={p} className="flex items-center gap-2 text-xs text-white/70">
                                <div className="w-1 h-1 rounded-full" style={{ background: meta.accent }} />
                                <span style={{ fontFamily: "'Raleway',sans-serif" }}>{p}</span>
                              </div>
                            ))}
                          </div>

                          <div
                            className="flex items-center justify-between pt-3 border-t transition-colors"
                            style={{ borderColor: isActive ? `${meta.accent}40` : "rgba(255,255,255,0.08)" }}
                          >
                            <span className="text-[10px] tracking-[0.25em] font-bold" style={{ color: isActive ? meta.accent : "rgba(255,255,255,0.4)" }}>
                              {isActive ? "► PRESS TO SELECT" : "HOVER TO PREVIEW"}
                            </span>
                            <ArrowRight className="w-4 h-4 transition-transform" style={{ color: isActive ? meta.accent : "rgba(255,255,255,0.4)", transform: isActive ? "translateX(4px)" : "translateX(0)" }} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2 — Artist */}
            {step === 2 && role === "artist" && (
              <div className="max-w-xl mx-auto animate-fade-in">
                <QuestPanel accent={ROLE_META.artist.accent} icon={Music} chapter="CHAPTER 02" title="FORGE YOUR IDENTITY" subtitle="Every legend starts with a name.">
                  <div className="space-y-4">
                    <GameField label="Artist Name" value={artistName} onChange={setArtistName} placeholder="e.g. Ghost Signal" accent={ROLE_META.artist.accent} />
                    <GameField label="Primary Genre (optional)" value={genre} onChange={setGenre} placeholder="e.g. Alt R&B" accent={ROLE_META.artist.accent} />
                    <QuestButton onClick={finishArtist} saving={saving} accent={ROLE_META.artist.accent}>
                      Continue Quest → +500 XP
                    </QuestButton>
                  </div>
                </QuestPanel>
              </div>
            )}

            {/* STEP 2 — Manager */}
            {step === 2 && role === "manager" && (
              <div className="max-w-xl mx-auto animate-fade-in">
                <QuestPanel accent={ROLE_META.manager.accent} icon={Building2} chapter="CHAPTER 02" title="BUILD YOUR EMPIRE" subtitle="Command your roster. Own your brand.">
                  <div className="space-y-4">
                    <GameField label="Label / Company Name" value={labelName} onChange={setLabelName} placeholder="e.g. Midnight Records" accent={ROLE_META.manager.accent} />
                    <div className="space-y-2">
                      <Label className="text-[10px] tracking-[0.3em] text-white/60 font-bold">RECRUIT ROSTER (OPTIONAL)</Label>
                      <textarea
                        value={rosterEmails}
                        onChange={(e) => setRosterEmails(e.target.value)}
                        placeholder="artist1@example.com, artist2@example.com"
                        rows={3}
                        className="w-full rounded-lg border px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
                        style={{
                          background: "rgba(0,0,0,0.4)",
                          borderColor: "rgba(255,255,255,0.15)",
                          fontFamily: "'Raleway',sans-serif",
                        }}
                      />
                      <p className="text-[10px] text-white/40 tracking-wider">+250 XP per recruit summoned</p>
                    </div>
                    <QuestButton onClick={finishManager} saving={saving} accent={ROLE_META.manager.accent}>
                      Build Empire → +1000 XP
                    </QuestButton>
                  </div>
                </QuestPanel>
              </div>
            )}

            {/* STEP 3 — Victory */}
            {step === 3 && role && (
              <div className="max-w-2xl mx-auto animate-fade-in space-y-4">
                <QuestPanel
                  accent={ROLE_META[role].accent}
                  icon={CreditCard}
                  chapter="CHAPTER 03"
                  title="POWER UP"
                  subtitle="Activate your plan and connect payouts — both run on Stripe."
                >
                  <div className="space-y-6">
                    {/* Subscription */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] tracking-[0.3em] text-white/60 font-bold">
                          1 · CHOOSE YOUR PLAN
                        </span>
                        {subscribed && (
                          <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "#4ade80" }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {(role === "manager"
                          ? ([{ id: "enterprise", name: "ENTERPRISE", price: "$50/mo", perks: "Full roster, white-label, integrations" }] as const)
                          : ([
                              { id: "starter", name: "STARTER", price: "$10/mo", perks: "Upload, payouts, core analytics" },
                              { id: "pro", name: "PRO", price: "$20/mo", perks: "Advanced tools, AI, unlimited releases" },
                            ] as const)
                        ).map((p) => (
                          <button
                            key={p.id}
                            disabled={subscribed || selectedPlan !== null}
                            onClick={() => startPlanCheckout(p.id as CheckoutPlan)}
                            className="text-left rounded-xl border p-4 transition-all hover:scale-[1.02] disabled:opacity-50"
                            style={{
                              borderColor: `${ROLE_META[role].accent}60`,
                              background: "rgba(0,0,0,0.4)",
                            }}
                          >
                            <div className="flex items-baseline justify-between">
                              <span className="text-white font-bold tracking-widest text-sm">{p.name}</span>
                              <span className="text-white/80 text-sm">{p.price}</span>
                            </div>
                            <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "'Raleway',sans-serif" }}>
                              {p.perks}
                            </p>
                            <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold tracking-widest" style={{ color: ROLE_META[role].accent }}>
                              {selectedPlan === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                              {subscribed ? "SUBSCRIBED" : "SUBSCRIBE"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payouts */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] tracking-[0.3em] text-white/60 font-bold">
                          2 · GET PAID — $1 / STREAM
                        </span>
                        {payoutConnected && (
                          <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "#4ade80" }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> CONNECTED
                          </span>
                        )}
                      </div>
                      <button
                        onClick={connectPayouts}
                        disabled={payoutLoading}
                        className="w-full rounded-xl border p-4 flex items-center gap-3 transition-all hover:scale-[1.01] disabled:opacity-50"
                        style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.4)" }}
                      >
                        {payoutLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <Banknote className="w-5 h-5" style={{ color: ROLE_META[role].accent }} />
                        )}
                        <span className="text-left">
                          <span className="block text-white font-bold tracking-widest text-sm">
                            {payoutConnected ? "MANAGE PAYOUT ACCOUNT" : "CONNECT STRIPE PAYOUTS"}
                          </span>
                          <span className="block text-xs text-white/50" style={{ fontFamily: "'Raleway',sans-serif" }}>
                            Bank details are collected securely by Stripe. Auto-payouts at $50.
                          </span>
                        </span>
                      </button>
                      <p className="flex items-center gap-1.5 text-[10px] text-white/40 mt-2">
                        <ShieldCheck className="w-3 h-3" /> TDZ never sees or stores your bank credentials.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <QuestButton onClick={() => setStep(4)} saving={false} accent={ROLE_META[role].accent}>
                        CONTINUE
                      </QuestButton>
                    </div>
                    <button
                      onClick={() => setStep(4)}
                      className="w-full text-[10px] tracking-[0.3em] text-white/40 hover:text-white/70 transition-colors"
                    >
                      SKIP FOR NOW — SET UP LATER IN STUDIO
                    </button>
                  </div>
                </QuestPanel>
              </div>
            )}

            {step === 4 && role && (
              <div className="max-w-2xl mx-auto animate-fade-in">
                <div
                  className="relative overflow-hidden rounded-3xl border p-10 text-center"
                  style={{
                    borderColor: ROLE_META[role].accent,
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(24px)",
                    boxShadow: `0 30px 80px -20px ${ROLE_META[role].accent}80, inset 0 0 60px ${ROLE_META[role].accent}20`,
                  }}
                >
                  {/* Confetti dots */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full"
                        style={{
                          left: `${(i * 37) % 100}%`,
                          top: `${(i * 53) % 100}%`,
                          background: i % 2 ? ROLE_META[role].accent : "#FFD700",
                          opacity: 0.6,
                          animation: `float${i % 3} ${3 + (i % 4)}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                    <style>{`
                      @keyframes float0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
                      @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-30px)} }
                      @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
                    `}</style>
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border" style={{ borderColor: "#FFD700", background: "rgba(255,215,0,0.1)" }}>
                      <Trophy className="w-3.5 h-3.5" style={{ color: "#FFD700" }} />
                      <span className="text-[10px] tracking-[0.3em] font-bold" style={{ color: "#FFD700" }}>
                        ACHIEVEMENT UNLOCKED
                      </span>
                    </div>

                    <div
                      className="w-24 h-24 mx-auto rounded-full flex items-center justify-center border-4"
                      style={{
                        borderColor: ROLE_META[role].accent,
                        background: `radial-gradient(circle, ${ROLE_META[role].accent}40, transparent 70%)`,
                        boxShadow: `0 0 60px ${ROLE_META[role].accent}`,
                      }}
                    >
                      <Sparkles className="w-12 h-12" style={{ color: ROLE_META[role].accent }} />
                    </div>

                    <div>
                      <h2 className="text-5xl sm:text-6xl text-white leading-none" style={{ fontFamily: "'Six Caps',sans-serif", letterSpacing: "0.02em" }}>
                        LEVEL UP
                      </h2>
                      <p className="text-white/70 mt-3 max-w-md mx-auto text-sm" style={{ fontFamily: "'Raleway',sans-serif" }}>
                        {role === "manager"
                          ? "Manager HQ is online. Your empire awaits — roster tools, white-label branding, and enterprise integrations are all unlocked."
                          : "Studio is armed. Upload your first track and start banking $1 per qualified stream."}
                      </p>
                    </div>

                    <button
                      onClick={handleFinish}
                      className="group relative overflow-hidden rounded-xl px-8 py-4 font-bold text-white tracking-widest text-sm transition-all hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${ROLE_META[role].accent}, #a78bfa)`,
                        boxShadow: `0 10px 40px ${ROLE_META[role].accent}80`,
                      }}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Rocket className="w-4 h-4" />
                        {role === "manager" ? "ENTER MANAGER HQ" : "ENTER STUDIO"}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Sub-components ---------------- */

function QuestPanel({
  accent,
  icon: Icon,
  chapter,
  title,
  subtitle,
  children,
}: {
  accent: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  chapter: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-8"
      style={{
        borderColor: `${accent}60`,
        background: "rgba(5,5,5,0.75)",
        backdropFilter: "blur(24px)",
        boxShadow: `0 20px 60px -20px ${accent}60, inset 0 0 40px ${accent}10`,
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{
            background: `${accent}20`,
            border: `1px solid ${accent}80`,
            boxShadow: `0 0 20px ${accent}60`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div>
          <div className="text-[10px] tracking-[0.3em] font-bold" style={{ color: accent }}>
            {chapter}
          </div>
          <h2 className="text-3xl text-white leading-none" style={{ fontFamily: "'Six Caps',sans-serif", letterSpacing: "0.03em" }}>
            {title}
          </h2>
          <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "'Raleway',sans-serif" }}>
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

function GameField({
  label,
  value,
  onChange,
  placeholder,
  accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  accent: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] tracking-[0.3em] text-white/60 font-bold">{label.toUpperCase()}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 text-white placeholder:text-white/30 border-white/15 focus-visible:ring-0 transition-all"
        style={{
          background: "rgba(0,0,0,0.4)",
          fontFamily: "'Raleway',sans-serif",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = accent;
          e.currentTarget.style.boxShadow = `0 0 20px ${accent}40`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

function QuestButton({
  children,
  onClick,
  saving,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  saving: boolean;
  accent: string;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={saving}
      className="w-full h-12 font-bold tracking-widest text-sm text-white border-0 transition-all hover:scale-[1.02]"
      style={{
        background: `linear-gradient(135deg, ${accent}, #a78bfa)`,
        boxShadow: `0 10px 30px ${accent}60`,
      }}
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </Button>
  );
}

export default function Onboarding() {
  return (
    <RequireAuth>
      <OnboardingFlow />
    </RequireAuth>
  );
}
