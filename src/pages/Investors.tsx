import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Users, DollarSign, Sparkles, Music, Video,
  LineChart, Target, Rocket, Globe, Zap, Brain, Star,
  ArrowRight, CheckCircle2, Crown, Shield, AlertTriangle,
  Swords, TrendingDown, CreditCard, Download, Radio,
  Layers, PiggyBank, Tv, Trophy
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import tdzLogo from "@/assets/tdz-logo.png";
import { Play } from "lucide-react";
import { LineChart as RechartsLine, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { JargonProvider, useJargon } from "@/components/investor/JargonContext";
import { StickyDeckNav } from "@/components/investor/StickyDeckNav";

import { LastStageStanding } from "@/components/investor/LastStageStanding";
import { FounderBio } from "@/components/investor/FounderBio";

/* ─── Scroll reveal ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1) rotateX(0deg)" : "translateY(70px) scale(0.88) rotateX(8deg)", filter: visible ? "blur(0px)" : "blur(6px)", perspective: "1200px", transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, filter 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s` }}>
      {children}
    </div>
  );
}

function ScreenPopReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = 1 - Math.max(0, Math.min(1, (rect.top - vh * 0.15) / (vh * 0.65)));
      setProgress(raw);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div ref={ref} className={className} style={{
      transform: `scale(${0.65 + progress * 0.35}) perspective(1200px) rotateX(${(1 - progress) * 10}deg)`,
      opacity: Math.min(1, progress * 1.6),
      borderRadius: `${40 - progress * 28}px`,
      filter: `blur(${(1 - progress) * 8}px)`,
      transition: "transform 0.06s linear, opacity 0.06s linear, border-radius 0.06s linear, filter 0.06s linear",
      willChange: "transform, opacity, filter",
    }}>
      {children}
    </div>
  );
}

/* ─── Chrome gradient text ─── */
const chromeStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #D0D0D0 0%, #FFFFFF 25%, #9A9A9A 55%, #404040 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

/* ─── TDZ Badge ─── */
function TDZBadge({ size = 38 }: { size?: number }) {
  return <img src={tdzLogo} alt="TDZ" style={{ width: size, height: size }} className="mx-auto object-contain" />;
}

/* ─── Section Title ─── */
function SectionTitle({ children, chrome = false }: { children: React.ReactNode; chrome?: boolean }) {
  return (
    <h2
      style={{
        fontFamily: "'Six Caps', sans-serif",
        fontSize: "clamp(40px, 6vw, 88px)",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        lineHeight: 1,
        ...(chrome ? chromeStyle : { color: "#FFFFFF" }),
      }}
      className="text-center"
    >
      {children}
    </h2>
  );
}

/* ─── Investor Phone Demo Mockups (Landing-page style) ─── */
function InvestorStudioDemo() {
  return (
    <div className="p-3 pt-7 h-full" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#888", background: "linear-gradient(180deg, #0a0a1a, #050510)" }}>
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-4 h-4 rounded-full" style={{ border: "1.5px solid #FF6347", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 6, color: "#FF6347", fontWeight: 900 }}>R</span>
        </div>
        <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 18, color: "#FFF", letterSpacing: "0.04em" }}>ARTIST STUDIO</p>
      </div>
      <div className="flex gap-1 mt-1 mb-2">
        {["MUSIC", "ANALYTICS", "PROMOTE"].map((t, i) => (
          <span key={t} className="px-2 py-0.5 rounded-full text-[7px]"
            style={{ background: i === 0 ? "#FF6347" : "rgba(255,255,255,0.04)", color: i === 0 ? "#000" : "#666", border: `1px solid ${i === 0 ? "#FF6347" : "rgba(255,255,255,0.06)"}` }}>{t}</span>
        ))}
      </div>
      <div className="space-y-1.5">
        {["Upload Tracks", "Manage Albums", "Lyrics Sync", "Territory Rights"].map((t, i) => (
          <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Music className="w-2.5 h-2.5" style={{ color: i === 0 ? "#FF6347" : "#555" }} />
            <span style={{ color: "#AAA", fontSize: 9 }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvestorInsightsDemo() {
  return (
    <div className="p-3 pt-7 h-full" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#888", background: "linear-gradient(180deg, #0a0a1a, #050510)" }}>
      <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 20, color: "#FFF", letterSpacing: "0.04em" }}>REAL-TIME INSIGHTS</p>
      <p style={{ fontSize: 8, color: "#555", marginTop: 1 }}>Track performance & revenue</p>
      <div className="flex gap-1 mt-2">
        {["Streams", "Geographic", "Revenue"].map((t, i) => (
          <span key={i} className="px-1.5 py-0.5 rounded-full text-[7px]" style={{ background: i === 0 ? "#FF6347" : "rgba(255,255,255,0.04)", color: i === 0 ? "#FFF" : "#666", border: `1px solid ${i === 0 ? "#FF6347" : "rgba(255,255,255,0.06)"}` }}>{t}</span>
        ))}
      </div>
      <div className="mt-2 p-2 rounded-lg" style={{ background: "rgba(255,99,71,0.06)", border: "1px solid rgba(255,99,71,0.12)" }}>
        <span className="px-1.5 py-0.5 rounded-full text-[7px]" style={{ background: "#FF6347", color: "#FFF" }}>$1/Stream</span>
        <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: "#FF6347", letterSpacing: "0.03em", lineHeight: 1.2, marginTop: 3 }}>$12,750</p>
        <p style={{ fontSize: 8, color: "#555", marginTop: 1 }}>12,750 streams • Real-time</p>
      </div>
      <div className="mt-1.5 p-1.5 rounded-lg flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <Globe className="w-3.5 h-3.5" style={{ color: "#00CFFF" }} />
        <span style={{ color: "#AAA", fontSize: 9 }}>Top: United States</span>
        <span className="ml-auto" style={{ color: "#FF6347", fontSize: 9, fontWeight: 600 }}>45%</span>
      </div>
      <div className="mt-1.5 p-1.5 rounded-lg flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <Users className="w-3.5 h-3.5" style={{ color: "#8B5CF6" }} />
        <span style={{ color: "#AAA", fontSize: 9 }}>Unique Listeners</span>
        <span className="ml-auto" style={{ color: "#00CFFF", fontSize: 9, fontWeight: 600 }}>89,200</span>
      </div>
      <div className="mt-1.5 p-1.5 rounded-lg flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <TrendingUp className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />
        <span style={{ color: "#AAA", fontSize: 9 }}>AI Analysis</span>
        <span className="ml-auto px-1.5 py-0.5 rounded-full text-[7px]" style={{ background: "#8B5CF6", color: "#FFF" }}>AI</span>
      </div>
    </div>
  );
}

function InvestorDiscoveryDemo() {
  return (
    <div className="p-3 pt-7 h-full" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#888", background: "linear-gradient(180deg, #050515, #030310)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <img src={tdzLogo} alt="TDZ" className="w-4 h-4 object-contain" />
        <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 18, color: "#FFF", letterSpacing: "0.04em" }}>DISCOVERY</p>
      </div>
      <p style={{ fontSize: 8, color: "#555", marginBottom: 6 }}>GOOD AFTERNOON</p>
      <div className="flex gap-1 mb-3">
        {["All", "Pop", "Hip-Hop", "R&B"].map((g, i) => (
          <span key={g} className="px-2 py-0.5 rounded-full text-[7px]"
            style={{ background: i === 0 ? "rgba(255,99,71,0.2)" : "transparent", color: i === 0 ? "#FF6347" : "#666", border: `1px solid ${i === 0 ? "rgba(255,99,71,0.3)" : "rgba(255,255,255,0.06)"}` }}>{g}</span>
        ))}
      </div>
      <div className="flex gap-1 mb-3">
        {[1,2,3].map(i => (
          <div key={i} className="flex-1 aspect-square rounded-lg" style={{ background: `linear-gradient(135deg, ${["#c0392b","#3498db","#9b59b6"][i-1]}40, #111)`, border: "1px solid rgba(255,255,255,0.05)" }} />
        ))}
      </div>
      <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 14, color: "#FFF", letterSpacing: "0.03em", textAlign: "center" }}>POPULAR TRACKS</p>
      <div className="space-y-1 mt-1">
        {["Stream unlimited music", "Every play = $1 to artists", "AI-powered playlists"].map((t, i) => (
          <div key={i} className="p-1.5 rounded-lg flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${["#c0392b","#3498db","#2ecc71"][i]}60, #222)` }}>
              <Play className="w-2 h-2" style={{ color: "#FFF" }} />
            </div>
            <span style={{ color: "#AAA", fontSize: 8 }}>{t}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 p-1.5 rounded-full flex items-center gap-1.5" style={{ background: "rgba(255,99,71,0.08)", border: "1px solid rgba(255,99,71,0.15)" }}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#FF6347" }}>
          <Play className="w-2.5 h-2.5" style={{ color: "#FFF" }} />
        </div>
        <span style={{ fontSize: 7, color: "#FF6347", fontWeight: 600 }}>NOW PLAYING</span>
      </div>
    </div>
  );
}

export default function InvestorsPage() {
  return (
    <JargonProvider>
      <Investors />
    </JargonProvider>
  );
}

function Investors() {
  const navigate = useNavigate();
  const { t } = useJargon();
  const [activeGraph, setActiveGraph] = useState("revenue");

  // ─── DATA (preserved exactly) ───
  const revenueData = [
    { year: "Year 1", revenue: 8, streams: 6, profit: 2, arps: 1.33 },
    { year: "Year 2", revenue: 20, streams: 15, profit: 5, arps: 1.33 },
    { year: "Year 3", revenue: 45, streams: 38, profit: 7, arps: 1.18 },
    { year: "Year 4", revenue: 70, streams: 55, profit: 15, arps: 1.27 },
    { year: "Year 5", revenue: 200, streams: 150, profit: 50, arps: 1.33 }
  ];

  const yearlyBreakdown = [
    { year: "Year 1", target: "$8M", maxStreams: "6M", cumulative: "$8M", arps: "$1.33" },
    { year: "Year 2", target: "$20M", maxStreams: "15M", cumulative: "$28M", arps: "$1.33" },
    { year: "Year 3", target: "$45M", maxStreams: "38M", cumulative: "$73M", arps: "$1.18" },
    { year: "Year 4", target: "$70M", maxStreams: "55M", cumulative: "$143M", arps: "$1.27" },
    { year: "Year 5", target: "$200M", maxStreams: "150M", cumulative: "$200M+", arps: "$1.33" }
  ];

  const revenueStreamsYear5 = [
    { source: "Artist Subscriptions", amount: "$120M", detail: "400K artists × $25/mo" },
    { source: "Fan Subscriptions", amount: "$144M", detail: "1M fans × $12/mo" },
    { source: "Ads Revenue", amount: "$20M", detail: "3-5M free users" },
    { source: "Premium AI Tools", amount: "$18M", detail: "150K pro users × $10/mo" },
    { source: "Marketplace Fees", amount: "$5M", detail: "Sync, collabs, gigs" },
    { source: "Download Fees", amount: "$1.8M", detail: "1M downloads × $0.15 fee" },
    { source: "Sponsorships", amount: "$6M", detail: "Brand partnerships" }
  ];

  const marketShareData = [
    { year: "2024", tdz: 0.5, spotify: 31, apple: 15, amazon: 13, others: 40.5 },
    { year: "2025", tdz: 2.8, spotify: 30, apple: 14.5, amazon: 12.5, others: 40.2 },
    { year: "2026", tdz: 6.2, spotify: 29, apple: 14, amazon: 12, others: 38.8 },
    { year: "2027", tdz: 11.5, spotify: 28, apple: 13.5, amazon: 11.5, others: 35.5 },
    { year: "2028", tdz: 18.3, spotify: 27, apple: 13, amazon: 11, others: 30.7 }
  ];

  const revenuePoolData = [
    { name: "Fan Subscriptions", value: 46, color: "#00CFFF" },
    { name: "Artist Subscriptions", value: 38, color: "#22C55E" },
    { name: "Ads & Sponsors", value: 8, color: "#D4A017" },
    { name: "Premium AI Tools", value: 6, color: "#8B5CF6" },
    { name: "Downloads & Other", value: 2, color: "#888888" }
  ];

  const userGrowthData = [
    { month: "Jan", artists: 5000, listeners: 50000, engagement: 72 },
    { month: "Feb", artists: 8500, listeners: 95000, engagement: 75 },
    { month: "Mar", artists: 14000, listeners: 168000, engagement: 78 },
    { month: "Apr", artists: 22000, listeners: 286000, engagement: 81 },
    { month: "May", artists: 32000, listeners: 448000, engagement: 84 },
    { month: "Jun", artists: 45000, listeners: 675000, engagement: 87 },
    { month: "Jul", artists: 50000, listeners: 850000, engagement: 89 }
  ];

  const unicornFeatures = [
    { icon: DollarSign, title: "$1 Per Stream Payout", description: "Revolutionary artist payout model. Artists earn $1.00 for every stream—not $0.003 like Spotify.", impact: "333x higher payout than traditional DSPs", category: "Revenue Model" },
    { icon: Download, title: "Artist-Set Download Pricing", description: "Artists set their own download prices. Fans buy tracks directly. 100% of download revenue goes to the artist.", impact: "New revenue stream with 100% artist retention", category: "Revenue Model" },
    { icon: Brain, title: "Quantum-Powered AI Advisor", description: "AI that analyzes artist data in real-time to provide actionable insights for revenue optimization and career planning.", impact: "30% average revenue increase for artists using AI", category: "AI Innovation" },
    { icon: Video, title: "Storytelling Studio", description: "AI video generation platform supporting Kling, Runway, Sora, and Veo. Artists create professional music videos.", impact: "Reduces video production costs by 95%", category: "Content Creation" },
    { icon: Music, title: "Standalone Streaming Platform", description: "TDZ is an independent streaming ecosystem competing directly with Spotify and Apple Music.", impact: "No middlemen, no gatekeepers, artists own everything", category: "Streaming" },
    { icon: Layers, title: "AI Music Welcome", description: "First major platform to fully embrace AI-generated music. AI artists earn the same $1 per stream.", impact: "First-mover in $1B+ AI music market", category: "Market Position" },
    { icon: Users, title: "Fan Engagement Hub", description: "Real-time fan analytics, engagement tracking, and AI-powered sentiment analysis.", impact: "3x fan engagement rates with AI-driven strategies", category: "Engagement" },
    { icon: Target, title: "Opportunities Marketplace", description: "AI-matched opportunities for sync licensing, brand partnerships, collaborations, and gigs.", impact: "Opens $500K+ annual revenue opportunities per artist", category: "Revenue" },
    { icon: Globe, title: "Tour Management System", description: "AI-powered tour recommendations based on fan density, venue analytics, and revenue optimization.", impact: "35% increase in tour profitability", category: "Live Performance" }
  ];

  const metrics = [
    { label: "Year 5 Revenue", value: "$200M+", sublabel: "With $314M total pool capacity" },
    { label: "Target ARPS", value: "$1.35", sublabel: "Average Revenue Per Stream" },
    { label: "Artist Retention", value: "94%", sublabel: "Industry-leading loyalty" },
    { label: "Per-Stream Payout", value: "$1.00", sublabel: "333x more than Spotify" }
  ];

  const investmentUse = [
    { area: "AI & Product Development", amount: "$3M", purpose: "Enhance AI capabilities, new features, UX improvements" },
    { area: "Marketing & Growth", amount: "$2M", purpose: "User acquisition, partnerships, brand building" },
    { area: "Team Expansion", amount: "$2M", purpose: "Top talent in engineering, data science, support" },
    { area: "Infrastructure", amount: "$2M", purpose: "Scalability, security, global expansion" },
    { area: "Strategic Partnerships", amount: "$1M", purpose: "Industry integrations, distribution deals" }
  ];

  const competitiveAdvantages = [
    "$1 per stream vs $0.003 industry average—333x higher payouts",
    "First platform to fully embrace and monetize AI music",
    "Artists set their own download prices, keep 100% revenue",
    "Standalone streaming platform competing directly with Spotify",
    "Revolutionary AI video creation capabilities",
    "Quantum AI advisor - market exclusive",
    "Direct artist-to-listener relationship with no middlemen"
  ];

  const graphBtnClass = (id: string) =>
    `px-5 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wider transition-all ${
      activeGraph === id
        ? "bg-white text-black"
        : "border border-[#333] text-[#888] hover:border-[#555] hover:text-white"
    }`;

  return (
    <div className="min-h-screen" style={{ background: "#000", fontFamily: "'Raleway', sans-serif" }}>
      {/* ─── NAV BAR ─── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
        <img src={tdzLogo} alt="TDZ" className="h-10 w-auto cursor-pointer" onClick={() => navigate("/")} />
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#22C55E", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>
            Investor Portal
          </span>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-full text-sm border border-[#333] text-[#888] hover:text-white hover:border-[#555] transition-all"
            style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            Home
          </button>
        </div>
      </div>

      <StickyDeckNav />

      {/* ─── HERO — ONE LINE, ONE NUMBER ─── */}
      <section className="py-20 md:py-28 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "radial-gradient(ellipse at top, rgba(34,197,94,0.15), transparent 60%)" }} />
        <div className="max-w-6xl mx-auto text-center relative">
          <Reveal>
            <TDZBadge size={48} />
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#22C55E", letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 700 }} className="mt-6 mb-6">
              Seed Round · {t("Music streaming, rebuilt for the artists who already earn", "Independent DSP for the >$500/yr ARP cohort")}
            </p>
            <h1 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(56px, 10vw, 140px)", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 0.88, color: "#fff" }}>
              We Pay Artists{" "}
              <span style={{ color: "#22C55E" }}>333×</span>{" "}
              {t("More", "Above ARPS")}
            </h1>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 18, color: "#aaa", fontWeight: 400, maxWidth: 760 }} className="mx-auto mt-8">
              Spotify pays <span className="text-[#EF4444] font-bold">$0.003</span> per stream. We pay <span className="text-[#22C55E] font-bold">$1.00</span>. Built for the <span className="text-white font-bold">187,000 working independent artists</span> who already earn over $500/yr in royalties — and the fans who fund them.
            </p>
            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              <a href="#problem" className="px-6 py-3 rounded-full bg-white text-black font-semibold text-sm uppercase tracking-wider hover:scale-105 transition-transform" style={{ fontFamily: "'Raleway', sans-serif", letterSpacing: "0.18em" }}>
                See The Problem →
              </a>
              <a href="#show" className="px-6 py-3 rounded-full border border-[#FF6347] text-[#FF6347] font-semibold text-sm uppercase tracking-wider hover:bg-[#FF6347]/10 transition-all" style={{ fontFamily: "'Raleway', sans-serif", letterSpacing: "0.18em" }}>
                The $250K GTM
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── ① PROBLEM OVERVIEW ─── */}
      <section id="problem" className="py-20 px-4 md:px-6 border-y border-[#111]" style={{ background: "linear-gradient(180deg, #050505, #000)" }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#666", letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 700 }} className="text-center">
              Section 01 · Problem Overview
            </p>
            <h2 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(44px, 7vw, 88px)", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 0.9, color: "#fff" }} className="text-center mt-3">
              The Middle Class of Music Is <span style={{ color: "#EF4444" }}>Disappearing</span>
            </h2>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 16, color: "#888", maxWidth: 760 }} className="mx-auto text-center mt-5">
              Streaming pays artists <span className="text-[#EF4444] font-bold">$0.003</span> per play. The economics are structurally designed to reward scale, not craft — and the working artist is being left behind.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Reveal>
              <div className="rounded-2xl border border-[#222] bg-[#111] p-8 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 flex items-center justify-center mb-6">
                  <AlertTriangle className="w-6 h-6" style={{ color: "#EF4444" }} />
                </div>
                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>STRUCTURAL PROBLEM</h3>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#777", lineHeight: 1.7, marginTop: 12, flex: 1 }}>
                  The pro-rata royalty model pools all subscriber revenue and pays artists by share of total streams. A Spotify stream is worth roughly <span style={{ color: "#EF4444", fontWeight: 700 }}>$0.003</span>. Labels and platforms capture the margin; creators absorb the risk.
                </p>
                <div className="mt-6 p-4 rounded-xl" style={{ background: "#EF444408", border: "1px solid #EF444420" }}>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#aaa" }}>
                    <span style={{ color: "#EF4444", fontWeight: 700 }}>187,000</span> artists earn &gt;$500/yr, but only <span style={{ color: "#EF4444", fontWeight: 700 }}>11,000</span> earn &gt;$10K.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-[#222] bg-[#111] p-8 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-[#00CFFF]/10 flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6" style={{ color: "#00CFFF" }} />
                </div>
                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>LARGE MARKET</h3>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#777", lineHeight: 1.7, marginTop: 12, flex: 1 }}>
                  Global music streaming will reach <span style={{ color: "#00CFFF", fontWeight: 700 }}>$106.6B by 2029</span>. Independent and AI-generated music are the fastest-growing segments, with a combined CAGR of 28%. Demand is massive — and underserved.
                </p>
                <div className="mt-6 space-y-2">
                  {[
                    ["2024 Market", "$43.7B"],
                    ["2029 Projection", "$106.6B"],
                    ["Indie + AI CAGR", "28%"]
                  ].map(([label, value], i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-[#1A1A1A]">
                      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666" }}>{label}</span>
                      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#00CFFF", fontWeight: 700 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="rounded-2xl border border-[#222] bg-[#111] p-8 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-[#D4A017]/10 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6" style={{ color: "#D4A017" }} />
                </div>
                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>WHY IT HASN'T BEEN SOLVED</h3>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#777", lineHeight: 1.7, marginTop: 12, flex: 1 }}>
                  Incumbents are locked into long-term label agreements, ad-supported freemium models, and legacy cost structures. Paying $1/stream would vaporize their margins and violate their label economics. They cannot pivot without imploding their existing business.
                </p>
                <div className="mt-6 p-4 rounded-xl" style={{ background: "#D4A01708", border: "1px solid #D4A01720" }}>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#aaa" }}>
                    TDZ was built from a blank sheet: <span style={{ color: "#D4A017", fontWeight: 700 }}>artist-owned, AI-native, subscription-pool first</span>.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── ② UNFAIR ADVANTAGE ─── */}
      <section id="advantage" className="py-20 px-4 md:px-6" style={{ background: "#000" }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#666", letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 700 }} className="text-center">
              Section 02 · Unfair Advantage
            </p>
            <h2 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(44px, 7vw, 88px)", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 0.9, color: "#fff" }} className="text-center mt-3">
              A Business Model They <span style={{ color: "#22C55E" }}>Can't Copy</span>
            </h2>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 16, color: "#888", maxWidth: 760 }} className="mx-auto text-center mt-5">
              Subscription pool + AI cost reduction = <span className="text-[#22C55E] font-bold">$1 per stream</span>. We make the math work by redesigning both sides of the equation.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-6 mt-12">
            <Reveal className="lg:col-span-1">
              <div className="rounded-2xl border border-[#1A3A1A] bg-[#0A1A0A] p-8 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center mb-6">
                  <DollarSign className="w-6 h-6" style={{ color: "#22C55E" }} />
                </div>
                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>BUSINESS MODEL INNOVATION</h3>
                <div className="mt-4 space-y-3 flex-1">
                  {[
                    ["Fan subscription pool", "$12/mo × 1M fans = $144M/yr"],
                    ["Artist subscriptions", "$25/mo × 400K artists = $120M/yr"],
                    ["AI cost reduction", "95% cheaper video, lyrics, promo"],
                    ["ARPS target", "$1.35 — $0.35 cushion above payout"]
                  ].map(([title, desc], i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#050A05] border border-[#1A3A1A]">
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#fff", fontWeight: 600 }}>{title}</p>
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#777" }}>{desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-xl text-center" style={{ background: "#22C55E10", border: "1px solid #22C55E30" }}>
                  <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 48, color: "#22C55E" }}>$1.35</div>
                  <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#888", letterSpacing: "0.15em", textTransform: "uppercase" }}>Target ARPS</div>
                </div>
              </div>
            </Reveal>

            <Reveal className="lg:col-span-2" delay={0.1}>
              <div className="rounded-2xl border border-[#222] bg-[#111] p-8 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-[#FF6347]/10 flex items-center justify-center mb-6">
                  <Target className="w-6 h-6" style={{ color: "#FF6347" }} />
                </div>
                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>WHAT COULD GO WRONG + MITIGATIONS</h3>
                <div className="grid md:grid-cols-2 gap-4 mt-6 flex-1">
                  {[
                    { risk: "ARPS falls below $1", mitigation: "Diversified revenue, fraud detection, controlled stream ramp, and dynamic pricing keep ARPS above payout.", color: "#EF4444" },
                    { risk: "Spotify/Apple copy us", mitigation: "They can't abandon pro-rata label deals. TDZ is natively artist-owned and AI-first — a clean-sheet advantage.", color: "#00CFFF" },
                    { risk: "AI copyright disputes", mitigation: "Rights verification, fingerprinting, transparent reporting, and opt-in AI licensing protect the platform.", color: "#D4A017" },
                    { risk: "Fan subscription churn", mitigation: "Exclusive content, Last Stage Standing, direct artist connection, and fan rewards drive 94% retention.", color: "#22C55E" }
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A]">
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: item.color, fontWeight: 700, marginBottom: 6 }}>{item.risk}</p>
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#777", lineHeight: 1.6 }}>{item.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-12">
            <div className="rounded-2xl border border-[#222] bg-[#111] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
                  <Star className="w-6 h-6" style={{ color: "#8B5CF6" }} />
                </div>
                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>THIRD-PARTY VALIDATION</h3>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { label: "Suno / Udio", value: "$125M+", sub: "AI music generation funding" },
                  { label: "Mogul", value: "Acquired", sub: "Artist financial services" },
                  { label: "Major Labels", value: "AI Arms", sub: "Investing in AI music tools" },
                  { label: "Indie Market", value: "19.8%", sub: "CAGR through 2029" }
                ].map((item, i) => (
                  <div key={i} className="text-center p-5 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A]">
                    <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#666", letterSpacing: "0.15em", textTransform: "uppercase" }}>{item.label}</div>
                    <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 40, color: "#8B5CF6", marginTop: 8 }}>{item.value}</div>
                    <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#555", marginTop: 4 }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── THE CUSTOMER ─── */}
      <section id="customer" className="py-20 px-4 md:px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#666", letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 700 }} className="text-center">
              Section 03 · The Customer
            </p>
            <h2 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(44px, 7vw, 88px)", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 0.9, color: "#fff" }} className="text-center mt-3">
              A Two-Sided Movement: <span style={{ color: "#00CFFF" }}>Artists</span> + <span style={{ color: "#FF6347" }}>Fans</span>
            </h2>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 16, color: "#888", maxWidth: 760 }} className="mx-auto text-center mt-5">
              Our customers are not just artists. They are also the fans and music streamers actively looking for an alternative to Spotify and Apple Music — listeners who want their money to reach the creators they love.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Reveal>
              <div className="rounded-2xl border border-[#00CFFF]/20 bg-[#0a0a0a] p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#00CFFF]/10 flex items-center justify-center">
                    <Users className="w-6 h-6" style={{ color: "#00CFFF" }} />
                  </div>
                  <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>THE ARTISTS</h3>
                </div>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#888", lineHeight: 1.7 }}>
                  Not the majors. Not bedroom hobbyists. The working middle: artists already earning <span className="text-white font-semibold">$500–$50,000/yr</span> in royalties — the cohort Spotify abandoned and labels ignore.
                </p>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[
                    { stat: "187K", label: "Earn >$500/yr", color: "#00CFFF" },
                    { stat: "11K", label: "Earn >$10K/yr", color: "#D4A017" },
                    { stat: "20K", label: "TDZ streams = $20K", color: "#22C55E" },
                  ].map((x, i) => (
                    <div key={i} className="rounded-xl border border-[#222] bg-[#111] p-4 text-center">
                      <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: x.color, lineHeight: 1 }}>{x.stat}</div>
                      <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" }} className="mt-2">{x.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-[#FF6347]/20 bg-[#0a0a0a] p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#FF6347]/10 flex items-center justify-center">
                    <Music className="w-6 h-6" style={{ color: "#FF6347" }} />
                  </div>
                  <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>THE FANS</h3>
                </div>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#888", lineHeight: 1.7 }}>
                  Music streamers tired of watching their subscription fees disappear into opaque royalty pools. They want transparency, direct artist connection, exclusive content, and the knowledge that <span className="text-white font-semibold">every stream pays $1</span>.
                </p>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[
                    { stat: "616M", label: "Paid music subs globally", color: "#FF6347" },
                    { stat: "$12/mo", label: "Fan subscription", color: "#E8C76A" },
                    { stat: "94%", label: "Target retention", color: "#22C55E" },
                  ].map((x, i) => (
                    <div key={i} className="rounded-xl border border-[#222] bg-[#111] p-4 text-center">
                      <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: x.color, lineHeight: 1 }}>{x.stat}</div>
                      <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" }} className="mt-2">{x.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-10">
            <div className="rounded-2xl border border-[#222] bg-[#111] p-8 text-center">
              <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 16, color: "#aaa", lineHeight: 1.8 }}>
                TDZ is the first platform where <span className="text-[#00CFFF] font-semibold">the customer is also the product's champion</span>. Artists bring fans. Fans bring artists. The flywheel is built into the business model.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FOUNDER & TEAM ─── */}
      <section id="team" className="py-20 px-4 md:px-6 border-y border-[#111] scroll-mt-20" style={{ background: "linear-gradient(180deg, #050505, #000)" }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#D4A017", letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 700 }} className="text-center">
              Section 04 · Founder & Team
            </p>
            <h2 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(44px, 7vw, 88px)", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 0.9, color: "#fff" }} className="text-center mt-3">
              Lived Experience, <span style={{ color: "#D4A017" }}>Not Theory</span>
            </h2>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 16, color: "#888", maxWidth: 760 }} className="mx-auto text-center mt-5">
              Marine → Live Nation → Roc Nation → Artist → Builder. This company was built from the inside of the industry, not from a whiteboard.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-6 mt-12">
            <Reveal>
              <div className="rounded-2xl border border-[#D4A017]/20 bg-[#0a0a0a] p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#D4A017]/10 flex items-center justify-center">
                    <Crown className="w-6 h-6" style={{ color: "#D4A017" }} />
                  </div>
                  <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>THE FOUNDER'S PATH</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { stage: "U.S. Marine Corps", detail: "Discipline, logistics, and execution under pressure." },
                    { stage: "Live Nation", detail: "Global arena tour operations at the highest scale." },
                    { stage: "Roc Nation / Three Six Zero", detail: "Artist management strategy for A-list talent." },
                    { stage: "Working Artist", detail: "Lived the payout problem firsthand." },
                    { stage: "Builder", detail: "Building the infrastructure artists were never given." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-[#D4A017]" />
                        {i < 4 && <div className="w-px h-full bg-[#D4A017]/20" style={{ minHeight: 40 }} />}
                      </div>
                      <div className="pb-4">
                        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#fff", fontWeight: 600 }}>{item.stage}</p>
                        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666", marginTop: 2 }}>{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-[#222] bg-[#111] p-8 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#00CFFF]/10 flex items-center justify-center">
                    <Shield className="w-6 h-6" style={{ color: "#00CFFF" }} />
                  </div>
                  <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>HONEST GAPS</h3>
                </div>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#888", lineHeight: 1.7 }}>
                  We don't pretend to have every answer. Here is where we are strong, where we are building, and where a strategic partner changes the game.
                </p>
                <div className="space-y-3 mt-6 flex-1">
                  {[
                    { label: "Operational strength", status: "Proven", color: "#22C55E", desc: "Tour ops, artist relations, logistics, and execution." },
                    { label: "Product & engineering", status: "Building", color: "#00CFFF", desc: "Platform is live; scaling to millions requires capital and senior hires." },
                    { label: "Capital markets", status: "Seeking partner", color: "#D4A017", desc: "We need a lead who understands media, fintech, and marketplace scale." },
                    { label: "AI / data science", status: "Partner-ready", color: "#8B5CF6", desc: "Architecture in place; ready to integrate best-in-class models." },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#0a0a0a] border border-[#222]">
                      <div className="flex items-center justify-between">
                        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#ccc", fontWeight: 600 }}>{item.label}</p>
                        <span className="px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold" style={{ background: `${item.color}15`, color: item.color, fontFamily: "'Raleway', sans-serif" }}>{item.status}</span>
                      </div>
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#666", marginTop: 4 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-10">
            <div className="rounded-2xl border border-[#D4A017]/20 p-8 md:p-12 text-center" style={{ background: "linear-gradient(180deg, #0F0E08 0%, #050505 100%)" }}>
              <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#E8C76A", letterSpacing: "0.04em", lineHeight: 1.2, textTransform: "uppercase" }}>
                We Are Looking For A Partner, Not Just A Check.
              </p>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 15, color: "#888", lineHeight: 1.8, maxWidth: 700 }} className="mx-auto mt-4">
                The right investor brings more than capital. They bring operating experience in streaming, payments, or AI; they open doors to talent and enterprise partnerships; and they help us scale without losing the artist-first mission.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── GTM HERO — LAST STAGE STANDING ─── */}
      <section id="show" className="py-20 px-4 md:px-6 border-y border-[#111]" style={{ background: "linear-gradient(180deg, #000, #060000, #000)" }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#FF6347", letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 700 }} className="text-center">
              Section 05 · {t("The Go-To-Market", "GTM Wedge")}
            </p>
            <h2 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(44px, 7vw, 88px)", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 0.9, color: "#fff" }} className="text-center mt-3 mb-12">
              The Show That Builds The Audience
            </h2>
          </Reveal>
          <LastStageStanding />
        </div>
      </section>

      <div id="ask-anchor" className="hidden" />


      {/* ─── THE SOLUTION ─── */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <TDZBadge />
            <SectionTitle chrome>THE $1 PER STREAM REVOLUTION</SectionTitle>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 17, color: "#888", textAlign: "center", maxWidth: 700 }} className="mx-auto mt-6">
              We pay artists <span style={{ color: "#22C55E", fontWeight: 700 }}>$1.00 per stream</span>. Artists keep <span style={{ color: "#00CFFF", fontWeight: 700 }}>100% of download revenue</span>. AI music is welcome.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-4 mt-12">
            {[
              { v: "$1.00", l: "Per Stream" },
              { v: "100%", l: "Download Revenue" },
              { v: "AI+Human", l: "Both Welcome" },
              { v: "100%", l: "Rights Retained" }
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="rounded-2xl p-6 border border-[#1A3A1A] bg-[#0A1A0A] text-center">
                  <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 42, color: "#22C55E" }}>{item.v}</div>
                  <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#888", letterSpacing: "0.15em", textTransform: "uppercase" }}>{item.l}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MARKET OPPORTUNITY (TAM/SAM/SOM) ─── */}
      <section id="market" className="py-20 px-4 md:px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#666", letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 700 }} className="text-center">
              Section 06 · Market / Competition
            </p>
            <SectionTitle>$100B+ MARKET OPPORTUNITY</SectionTitle>
            <p className="text-center mt-4" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 15, color: "#777" }}>
              The global music streaming market is exploding—and independent + AI music is the fastest-growing segment.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { abbr: "TAM", value: "$106B", desc: "Global Music Streaming (2029)", color: "#00CFFF", stats: ["2024: $43.7B", "2029: $106.6B", "CAGR: 19.5%"] },
              { abbr: "SAM", value: "$38B", desc: "Independent + AI Music (2029)", color: "#8B5CF6", stats: ["Independent: $26B", "AI Music: $12B", "Combined CAGR: 28%"] },
              { abbr: "SOM", value: "$2.5B", desc: "TDZ Target (Year 5)", color: "#22C55E", stats: ["Market Share: 6.5%", "Artists: 400K+", "Fans: 5M+"] }
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div className="rounded-2xl border border-[#222] bg-[#111] overflow-hidden hover:-translate-y-1 transition-transform">
                  <div className="px-5 py-3 border-b border-[#222] flex items-center justify-between" style={{ background: `${item.color}10` }}>
                    <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: item.color, letterSpacing: "0.04em" }}>{item.abbr}</span>
                    <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#666", letterSpacing: "0.15em", textTransform: "uppercase" }}>{item.desc.split("(")[0]}</span>
                  </div>
                  <div className="p-6 text-center">
                    <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 64, color: item.color }}>{item.value}</div>
                    <div className="space-y-2 mt-4">
                      {item.stats.map((s, si) => (
                        <p key={si} style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#666" }}>{s}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Competition Moat */}
          <Reveal className="mt-12">
            <div className="rounded-2xl border border-[#222] bg-[#111] p-8 md:p-10">
              <div className="text-center mb-10">
                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 48, color: "#fff", letterSpacing: "0.04em", lineHeight: 1 }}>
                  Why They Can't Copy Us
                </h3>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#888", maxWidth: 700 }} className="mx-auto mt-3">
                  Spotify and Apple Music are not competitors we out-feature. They are structurally trapped.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: "The Data Moat", icon: Brain, color: "#8B5CF6", desc: "Every stream, tip, download, share, and comment on TDZ is tied to a real fan identity and a real artist wallet. That first-party data trains our discovery engine and makes the platform stickier with every play." },
                  { title: "Why They Missed It", icon: Target, color: "#00CFFF", desc: "Incumbents optimized for ad-supported scale and major-label catalogs. They built a royalty system that punishes independents. Fixing it would collapse their label deals and ad model." },
                  { title: "Why They Can't Copy", icon: Shield, color: "#22C55E", desc: "Paying $1/stream would vaporize Spotify's ~25% gross margin and violate pro-rata label contracts. They cannot pivot without destroying their own business." },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="rounded-2xl border border-[#222] bg-[#0a0a0a] p-6">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${item.color}10` }}>
                        <Icon className="w-6 h-6" style={{ color: item.color }} />
                      </div>
                      <h4 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#fff", letterSpacing: "0.03em" }}>{item.title}</h4>
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#777", lineHeight: 1.7, marginTop: 8 }}>{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 p-6 rounded-2xl border border-[#D4A017]/20" style={{ background: "#0a0a0a" }}>
                <h4 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#D4A017", letterSpacing: "0.03em", marginBottom: 16 }}>
                  Competitive Validation — Market Signals, Not Our Claims
                </h4>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { label: "Spotify Loud & Clear", value: "187K", sub: "artists earn >$500/yr; only 11K earn >$10K", color: "#00CFFF" },
                    { label: "Suno / Udio", value: "$125M+", sub: "AI music funding validates creator demand", color: "#8B5CF6" },
                    { label: "Major Labels", value: "AI Arms", sub: "labels investing in AI tools, not artist economics", color: "#D4A017" },
                    { label: "Indie Market", value: "19.8%", sub: "CAGR through 2029 — fastest-growing segment", color: "#22C55E" },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-4 rounded-xl border border-[#222] bg-[#111]">
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#666", letterSpacing: "0.15em", textTransform: "uppercase" }}>{item.label}</p>
                      <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: item.color, marginTop: 8 }}>{item.value}</p>
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#555", marginTop: 4, lineHeight: 1.4 }}>{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Market Growth Chart */}
          <ScreenPopReveal className="mt-12">
            <div className="rounded-2xl border border-[#222] bg-[#111] p-8">
              <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: "#fff", textAlign: "center", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                GLOBAL MUSIC MARKET 5-YEAR PROJECTION
              </h3>
              <div className="h-80 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { year: "2024", total: 43.7, independent: 12.5, ai: 1.2 },
                    { year: "2025", total: 52.2, independent: 15.8, ai: 2.8 },
                    { year: "2026", total: 62.4, independent: 19.2, ai: 5.1 },
                    { year: "2027", total: 74.5, independent: 22.8, ai: 7.8 },
                    { year: "2028", total: 89.0, independent: 26.5, ai: 10.2 },
                    { year: "2029", total: 106.6, independent: 30.8, ai: 12.4 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="year" stroke="#555" />
                    <YAxis stroke="#555" tickFormatter={(v) => `$${v}B`} />
                    <Tooltip contentStyle={{ backgroundColor: "#1C1C1C", border: "1px solid #333", borderRadius: 12 }} />
                    <Legend />
                    <Area type="monotone" dataKey="total" stroke="#00CFFF" fill="#00CFFF" fillOpacity={0.1} strokeWidth={2} name="Total Market" />
                    <Area type="monotone" dataKey="independent" stroke="#D4A017" fill="#D4A017" fillOpacity={0.15} strokeWidth={2} name="Independent Music" />
                    <Area type="monotone" dataKey="ai" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.15} strokeWidth={2} name="AI Music" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ScreenPopReveal>

          {/* Independent + AI Details */}
          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <Reveal>
              <div className="rounded-2xl border border-[#222] bg-[#111] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#D4A017]/10 flex items-center justify-center">
                    <Music className="w-6 h-6" style={{ color: "#D4A017" }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>INDEPENDENT MUSIC</h3>
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666" }}>The fastest-growing segment</p>
                  </div>
                </div>
                {[
                  ["2024 Market Size", "$12.5B"],
                  ["2029 Projected", "$30.8B"],
                  ["CAGR", "19.8%"],
                  ["Share of Total Streams", "35%+ by 2029"],
                  ["Active Independent Artists", "120M+ globally"]
                ].map(([l, v], i) => (
                  <div key={i} className="flex justify-between py-3 border-b border-[#1A1A1A]">
                    <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#666" }}>{l}</span>
                    <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#D4A017", fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
                <div className="mt-4 p-4 rounded-xl" style={{ background: "#D4A01710" }}>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#D4A017" }}>
                    <strong>Key Insight:</strong> Independent artists want higher payouts, ownership, and direct fan relationships—exactly what TDZ offers.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="rounded-2xl border border-[#222] bg-[#111] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#00CFFF]/10 flex items-center justify-center">
                    <Brain className="w-6 h-6" style={{ color: "#00CFFF" }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>AI-GENERATED MUSIC</h3>
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666" }}>The next frontier</p>
                  </div>
                </div>
                {[
                  ["2024 Market Size", "$1.2B"],
                  ["2029 Projected", "$12.4B"],
                  ["CAGR", "59.4%"],
                  ["AI Tracks on DSPs (2024)", "100M+ tracks"],
                  ["Daily AI Track Uploads", "150K+ per day"]
                ].map(([l, v], i) => (
                  <div key={i} className="flex justify-between py-3 border-b border-[#1A1A1A]">
                    <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#666" }}>{l}</span>
                    <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#00CFFF", fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
                <div className="mt-4 p-4 rounded-xl" style={{ background: "#00CFFF10" }}>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#00CFFF" }}>
                    <strong>First-Mover Advantage:</strong> TDZ is the ONLY platform paying AI artists $1/stream. We capture a $12B+ market.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── THE GOLDEN RULE: ARPS > $1.00 ─── */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <TDZBadge />
            <SectionTitle chrome>THE GOLDEN RULE</SectionTitle>
            <div className="text-center mt-4">
              <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(50px, 8vw, 100px)", color: "#22C55E", letterSpacing: "0.04em" }}>ARPS &gt; $1.00</span>
            </div>
            <p className="mx-auto text-center mt-4" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 15, color: "#777", maxWidth: 700 }}>
              Average Revenue Per Stream must always exceed $1.00 to stay profitable. TDZ achieves this through diversified revenue streams.
            </p>
          </Reveal>

          {/* Profit Formula */}
          <ScreenPopReveal className="mt-10">
            <div className="rounded-2xl border border-[#1A3A1A] bg-[#0A1A0A] p-8 text-center">
              <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase" }}>THE PROFIT FORMULA</div>
              <div className="mt-4" style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(28px, 4vw, 48px)", color: "#22C55E", letterSpacing: "0.04em" }}>
                PROFIT = (TOTAL REVENUE) – (TOTAL STREAMS × $1)
              </div>
              <p className="mt-4" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#777" }}>
                You win when: <span style={{ color: "#22C55E", fontWeight: 700 }}>ARPS &gt; $1.00</span>
              </p>
            </div>
          </ScreenPopReveal>

          {/* $200M by Year 5 */}
          <Reveal className="mt-12">
            <div className="text-center mb-8">
              <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 48, color: "#fff", letterSpacing: "0.04em" }}>$200 MILLION REVENUE BY YEAR 5</h3>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#666" }}>40-50% annual growth curve</p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-5 gap-4">
            {yearlyBreakdown.map((year, idx) => (
              <Reveal key={idx} delay={idx * 0.08}>
                <div className={`rounded-2xl border p-6 text-center ${idx === 4 ? 'border-[#22C55E]/40 bg-[#22C55E]/5' : 'border-[#222] bg-[#111]'}`}>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666", letterSpacing: "0.15em", textTransform: "uppercase" }}>{year.year}</p>
                  <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 48, color: "#22C55E", letterSpacing: "0.04em" }}>{year.target}</p>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#555" }}>Revenue Target</p>
                  <div className="mt-3 pt-3 border-t border-[#222]">
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#888" }}>{year.maxStreams} streams</p>
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#00CFFF" }}>ARPS: {year.arps}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Year 5 Revenue Streams + Why $1/Stream Works */}
          <div className="grid lg:grid-cols-2 gap-6 mt-12">
            <Reveal>
              <div className="rounded-2xl border border-[#222] bg-[#111] p-8">
                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>YEAR 5 REVENUE STREAMS</h3>
                <div className="space-y-3 mt-6">
                  {revenueStreamsYear5.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0A]">
                      <div>
                        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#ccc", fontWeight: 500 }}>{item.source}</p>
                        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#555" }}>{item.detail}</p>
                      </div>
                      <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#22C55E" }}>{item.amount}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#22C55E]/30" style={{ background: "#22C55E10" }}>
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#fff", fontWeight: 700 }}>Total Revenue Capacity</p>
                    <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: "#22C55E" }}>$314M</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="rounded-2xl border border-[#222] bg-[#111] p-8">
                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em" }}>WHY $1/STREAM WORKS</h3>
                <div className="space-y-4 mt-6">
                  {[
                    { title: "Higher Artist Retention", desc: "94% retention vs 60% industry average" },
                    { title: "Premium Fan Engagement", desc: "Fans who pay more, engage more" },
                    { title: "Viral Artist Acquisition", desc: "Artists recruit other artists" },
                    { title: "Lower Marketing Costs", desc: "Word-of-mouth drives growth" },
                    { title: "Multiple Revenue Streams", desc: "Diversified income reduces risk" },
                    { title: "Controlled Stream Volume", desc: "TDZ streams ramp slower, giving room to scale" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "#22C55E" }} />
                      <div>
                        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#ccc", fontWeight: 600 }}>{item.title}</p>
                        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666" }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Streaming Cost Model */}
          <ScreenPopReveal className="mt-8">
            <div className="rounded-2xl border border-[#222] bg-[#111] p-8">
              <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", textAlign: "center", letterSpacing: "0.04em" }}>STREAMING COST MODEL</h3>
              <div className="grid md:grid-cols-4 gap-4 mt-6">
                {[
                  { streams: "10M", payout: "$10M", revenue: "$13.5M", profit: "$3.5M" },
                  { streams: "50M", payout: "$50M", revenue: "$67.5M", profit: "$17.5M" },
                  { streams: "100M", payout: "$100M", revenue: "$135M", profit: "$35M" },
                  { streams: "200M", payout: "$200M", revenue: "$270M", profit: "$70M" }
                ].map((item, idx) => (
                  <div key={idx} className="text-center p-5 rounded-xl bg-[#0A0A0A]">
                    <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: "#00CFFF" }}>{item.streams}</div>
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase" }}>Streams</p>
                    <div className="space-y-1 mt-3 text-sm">
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#EF4444" }}>Payout: {item.payout}</p>
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#22C55E" }}>Revenue: {item.revenue}</p>
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#22C55E", fontWeight: 700 }}>Profit: {item.profit}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6 p-4 rounded-xl border border-[#22C55E]/30" style={{ background: "#22C55E08" }}>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#ccc" }}>
                  At ARPS = $1.35, TDZ can support <span style={{ color: "#22C55E", fontWeight: 700 }}>200M+ streams annually</span> while generating <span style={{ color: "#22C55E", fontWeight: 700 }}>$300M+ revenue</span>
                </p>
              </div>
            </div>
          </ScreenPopReveal>
        </div>
      </section>

      {/* ─── BATTLE PLAN ─── */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <TDZBadge />
            <SectionTitle>HOW WE WIN THE WAR</SectionTitle>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { icon: Swords, title: "FRONT 1: ARTIST REVOLUTION", desc: "$1/stream attracts the best independent and AI talent globally. Artists become ambassadors.", color: "#22C55E" },
              { icon: Users, title: "FRONT 2: FAN ARMY", desc: "Fans who pay $12/month know their money goes directly to artists. Engagement is 3x higher.", color: "#00CFFF" },
              { icon: Brain, title: "FRONT 3: AI DOMINANCE", desc: "First platform to welcome AI music. 150K+ AI tracks uploaded daily—and we monetize every one.", color: "#8B5CF6" }
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div className="rounded-2xl border border-[#222] bg-[#111] p-8 hover:-translate-y-1 transition-transform">
                  <item.icon className="w-8 h-8 mb-4" style={{ color: item.color }} />
                  <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#fff", letterSpacing: "0.03em" }}>{item.title}</h3>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#777", marginTop: 8, lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── UNICORN FEATURES ─── */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <TDZBadge />
            <SectionTitle chrome>PLATFORM CAPABILITIES</SectionTitle>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 mt-12">
            {unicornFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Reveal key={idx} delay={idx * 0.08}>
                  <div className="rounded-2xl border border-[#222] bg-[#111] p-6 hover:-translate-y-1 transition-transform h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#00CFFF10" }}>
                        <Icon className="w-5 h-5" style={{ color: "#00CFFF" }} />
                      </div>
                      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase" }}>{feature.category}</span>
                    </div>
                    <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 26, color: "#fff", letterSpacing: "0.03em" }}>{feature.title.toUpperCase()}</h3>
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#777", lineHeight: 1.7, marginTop: 8, flex: 1 }}>{feature.description}</p>
                    <div className="mt-4 p-3 rounded-xl" style={{ background: "#22C55E08", border: "1px solid #22C55E20" }}>
                      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#22C55E", fontWeight: 600 }}>
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        {feature.impact}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Phone Mockups (Landing-style) ─── */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <TDZBadge />
            <SectionTitle chrome>PLATFORM EXPERIENCE</SectionTitle>
            <p className="text-center mt-4 mb-12" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 15, color: "#777" }}>
              Interactive demos — artist studio, real-time insights, and fan discovery
            </p>
          </Reveal>
          <ScreenPopReveal>
            <div className="flex items-center justify-center gap-0" style={{ perspective: 1200 }}>
              {/* Studio Phone */}
              <div className="hidden md:block relative flex-shrink-0" style={{ width: 220, height: 450, background: "#1A1A1A", borderRadius: 40, border: "2px solid #2A2A2A", boxShadow: "0 40px 80px rgba(0,0,0,0.8)", overflow: "hidden", transform: "rotateY(18deg) rotateZ(-2deg) translateX(-30px)", zIndex: 1, opacity: 0.85 }}>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-black rounded-full z-10" />
                <div className="absolute inset-1 rounded-[36px] overflow-hidden overflow-y-auto scrollbar-hide" style={{ background: "#111" }}>
                  <InvestorStudioDemo />
                </div>
              </div>
              {/* Center — Insights */}
              <div className="relative flex-shrink-0" style={{ width: 220, height: 450, background: "#1A1A1A", borderRadius: 40, border: "2px solid #2A2A2A", boxShadow: "0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(0,207,255,0.1)", overflow: "hidden", transform: "rotateY(0deg) scale(1.08)", zIndex: 3 }}>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-black rounded-full z-10" />
                <div className="absolute inset-1 rounded-[36px] overflow-hidden overflow-y-auto scrollbar-hide" style={{ background: "#111" }}>
                  <InvestorInsightsDemo />
                </div>
              </div>
              {/* Discovery Phone */}
              <div className="hidden md:block relative flex-shrink-0" style={{ width: 220, height: 450, background: "#1A1A1A", borderRadius: 40, border: "2px solid #2A2A2A", boxShadow: "0 40px 80px rgba(0,0,0,0.8)", overflow: "hidden", transform: "rotateY(-18deg) rotateZ(2deg) translateX(30px)", zIndex: 1, opacity: 0.85 }}>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-black rounded-full z-10" />
                <div className="absolute inset-1 rounded-[36px] overflow-hidden overflow-y-auto scrollbar-hide" style={{ background: "#111" }}>
                  <InvestorDiscoveryDemo />
                </div>
              </div>
            </div>
          </ScreenPopReveal>
        </div>
      </section>

      {/* ─── COMPETITIVE ADVANTAGES ─── */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <TDZBadge />
            <SectionTitle>WHY WE WIN</SectionTitle>
          </Reveal>
          <Reveal className="mt-10">
            <div className="rounded-2xl border border-[#222] bg-[#111] p-8">
              <div className="grid md:grid-cols-2 gap-4">
                {competitiveAdvantages.map((advantage, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "#22C55E" }} />
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#888" }}>{advantage}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FINANCIAL PROJECTIONS (Interactive Graphs) ─── */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <TDZBadge />
            <SectionTitle chrome>FINANCIAL PROJECTIONS</SectionTitle>
          </Reveal>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4 mt-12">
            {metrics.map((metric, idx) => (
              <Reveal key={idx} delay={idx * 0.1}>
                <div className="rounded-2xl border border-[#222] bg-[#111] p-6 text-center">
                  <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 48, color: "#00CFFF" }}>{metric.value}</div>
                  <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#ccc", fontWeight: 600 }}>{metric.label}</div>
                  <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#555" }}>{metric.sublabel}</div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Graph Navigation */}
          <div className="flex flex-wrap gap-3 justify-center mt-10 mb-8">
            {[
              { id: "revenue", label: "Revenue Growth", icon: TrendingUp },
              { id: "users", label: "User Growth", icon: Users },
              { id: "market", label: "Market Share", icon: Target },
              { id: "pool", label: "Revenue Pool", icon: PiggyBank }
            ].map(btn => (
              <button key={btn.id} onClick={() => setActiveGraph(btn.id)} className={graphBtnClass(btn.id)}>
                <btn.icon className="w-4 h-4 inline mr-2" />{btn.label}
              </button>
            ))}
          </div>

          {/* Graph Display */}
          <Reveal>
            <div className="rounded-2xl border border-[#222] bg-[#111] p-8">
              {activeGraph === "revenue" && (
                <>
                  <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", textAlign: "center", letterSpacing: "0.04em" }}>5-YEAR REVENUE & PROFIT TRAJECTORY</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="year" stroke="#555" />
                      <YAxis stroke="#555" label={{ value: 'Revenue ($M)', angle: -90, position: 'insideLeft', fill: '#555' }} />
                      <Tooltip contentStyle={{ backgroundColor: "#1C1C1C", border: "1px solid #333", borderRadius: 12 }} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#00CFFF" fill="#00CFFF" fillOpacity={0.1} strokeWidth={2} name="Revenue ($M)" />
                      <Area type="monotone" dataKey="profit" stroke="#22C55E" fill="#22C55E" fillOpacity={0.1} strokeWidth={2} name="Profit ($M)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}

              {activeGraph === "users" && (
                <>
                  <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", textAlign: "center", letterSpacing: "0.04em" }}>FIRST YEAR USER ACQUISITION</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="month" stroke="#555" />
                      <YAxis yAxisId="left" stroke="#555" />
                      <YAxis yAxisId="right" orientation="right" stroke="#555" />
                      <Tooltip contentStyle={{ backgroundColor: "#1C1C1C", border: "1px solid #333", borderRadius: 12 }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="artists" fill="#00CFFF" name="Artists" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="listeners" fill="#22C55E" name="Listeners" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}

              {activeGraph === "market" && (
                <>
                  <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", textAlign: "center", letterSpacing: "0.04em" }}>PROJECTED MARKET SHARE GROWTH</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={marketShareData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="year" stroke="#555" />
                      <YAxis stroke="#555" label={{ value: 'Market Share (%)', angle: -90, position: 'insideLeft', fill: '#555' }} />
                      <Tooltip contentStyle={{ backgroundColor: "#1C1C1C", border: "1px solid #333", borderRadius: 12 }} />
                      <Legend />
                      <Area type="monotone" dataKey="tdz" stroke="#00CFFF" fill="#00CFFF" fillOpacity={0.15} strokeWidth={3} name="TDZ" />
                      <Area type="monotone" dataKey="spotify" stroke="#1DB954" fill="#1DB954" fillOpacity={0.1} strokeWidth={2} name="Spotify" />
                      <Area type="monotone" dataKey="apple" stroke="#FC3C44" fill="#FC3C44" fillOpacity={0.1} strokeWidth={2} name="Apple Music" />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}

              {activeGraph === "pool" && (
                <>
                  <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", textAlign: "center", letterSpacing: "0.04em" }}>REVENUE POOL DISTRIBUTION</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie data={revenuePoolData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={150} fill="#8884d8" dataKey="value">
                        {revenuePoolData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#1C1C1C", border: "1px solid #333", borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          </Reveal>

          {/* Investment Allocation */}
          <Reveal className="mt-12">
            <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 42, color: "#fff", textAlign: "center", letterSpacing: "0.04em" }}>INVESTMENT ALLOCATION</h3>
          </Reveal>
          <div className="grid md:grid-cols-5 gap-4 mt-6">
            {investmentUse.map((item, idx) => (
              <Reveal key={idx} delay={idx * 0.08}>
                <div className="rounded-2xl border border-[#222] bg-[#111] p-6 text-center hover:-translate-y-1 transition-transform">
                  <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: "#00CFFF" }}>{item.amount}</div>
                  <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#ccc", fontWeight: 600, marginTop: 4 }}>{item.area}</div>
                  <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#555", marginTop: 4 }}>{item.purpose}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOUNDER BIO ─── */}
      <FounderBio />

      {/* ─── INVESTOR SUMMARY (THE ASK) ─── */}
      <section id="ask" className="py-20 px-4 md:px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="rounded-2xl border border-[#22C55E]/30 p-10 md:p-14 text-center" style={{ background: "linear-gradient(180deg, #0A1A0A 0%, #111 100%)" }}>
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#22C55E", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>INVESTOR SUMMARY</span>
              <blockquote className="mt-6" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 17, color: "#aaa", lineHeight: 1.8, fontStyle: "italic" }}>
                "TDZ generates an average of <span style={{ color: "#22C55E", fontWeight: 700, fontStyle: "normal" }}>$1.35–$1.80</span> per stream in revenue from subscriptions, ads, premium tools, and marketplace activity. We pay artists <span style={{ color: "#22C55E", fontWeight: 700, fontStyle: "normal" }}>$1.00</span> per stream. The margin between ARPS and artist payout ensures profitability even at high streaming volume."
              </blockquote>
              <p className="mt-4" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 15, color: "#777" }}>
                "At scale, TDZ can support <span style={{ color: "#22C55E", fontWeight: 600 }}>200M+ streams annually</span> while generating <span style={{ color: "#22C55E", fontWeight: 600 }}>$300M+ revenue</span>."
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-10 pt-8 border-t border-[#22C55E]/20">
                {[
                  { v: "$314M", l: "Year 5 Revenue Pool" },
                  { v: "40-50%", l: "Annual Growth Rate" },
                  { v: "$200M+", l: "Year 5 Target" }
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 48, color: "#22C55E" }}>{s.v}</div>
                    <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-4 md:px-6 text-center">
        <Reveal>
          <TDZBadge size={60} />
          <SectionTitle chrome>JOIN THE REVOLUTION</SectionTitle>
          <p className="mx-auto mt-6 text-center" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 17, color: "#888", maxWidth: 700 }}>
            We're raising <span style={{ color: "#E8C76A", fontWeight: 600 }}>$10M for 15%</span> to scale the platform that will change how artists get paid forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <button
              onClick={() => navigate("/investors/cap-table")}
              className="px-10 py-4 rounded-full text-black font-semibold hover:scale-105 transition-transform"
              style={{ background: "#E8C76A", fontFamily: "'Raleway', sans-serif", fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              See Cap Table →
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-10 py-4 rounded-full border border-[#333] hover:border-[#555] transition-all"
              style={{ color: "#888", fontFamily: "'Raleway', sans-serif", fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              Explore Platform
            </button>
          </div>
          <p className="mt-8" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#444" }}>
            Contact: invest@thirtydarkzero.com
          </p>
        </Reveal>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-16 text-center border-t border-[#111]">
        <TDZBadge size={50} />
        <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 20, color: "#444", letterSpacing: "0.08em", marginTop: 12 }}>
          THE FIRST PLATFORM THAT PAYS $1 PER STREAM
        </p>
        <div className="flex flex-wrap gap-8 justify-center mt-6">
          {[
            { label: "HOME", href: "/" },
            { label: "STUDIO", href: "/studio" },
            { label: "DISCOVERY", href: "/discover" },
            { label: "FAQ", href: "/faq" },
            { label: "PRICING", href: "/pricing" },
          ].map(link => (
            <button key={link.label} onClick={() => navigate(link.href)} style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }} className="hover:text-[#888] transition-colors">
              {link.label}
            </button>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-[600px] h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#333", marginTop: 24 }}>
          © 2026 TDZ Distribution. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
