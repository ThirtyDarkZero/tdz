import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageCircle, Play, Palette, Heart, Star, SkipBack, SkipForward, Shuffle, Compass, BarChart3, Globe, User, Bookmark, Settings, Moon, Crown, Music, Upload, TrendingUp, LayoutDashboard, BookOpen, Zap } from "lucide-react";
import tdzLogo from "@/assets/tdz-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { MotionCover } from "@/components/MotionCover";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

// ─── Types ───
interface Track {
  id: string;
  title: string;
  artist_name: string;
  album_cover_path: string | null;
  album_cover_bucket: string | null;
  motion_cover_path: string | null;
  motion_cover_bucket: string | null;
  created_at: string;
  play_count: number | null;
  is_published: boolean | null;
}

// ─── Scroll reveal hook ───
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Ticker ───
function Ticker({ text }: { text: string }) {
  const repeated = `${text}  •  `.repeat(6);
  return (
    <div className="py-7 overflow-hidden whitespace-nowrap" style={{ background: "#000" }}>
      <div className="inline-flex animate-marquee">
        <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(22px, 2.8vw, 34px)", color: "#5A5A5A", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {repeated}
        </span>
        <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(22px, 2.8vw, 34px)", color: "#5A5A5A", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {repeated}
        </span>
      </div>
    </div>
  );
}

// ─── Nav Pill ───
function NavPill() {
  const navigate = useNavigate();
  const items = [
    { sub: "START HERE", main: "SIGNUP", path: "/auth" },
    { sub: "ARTISTS", main: "STUDIO", path: "/studio" },
    { sub: "FANS", main: "DISCOVERY", path: "/discover" },
    { sub: "SHOP", main: "STORE", path: "/pricing" },
  ];
  return (
    <div className="flex gap-0 mx-auto w-fit rounded-full px-2 py-2.5" style={{ background: "rgba(55,55,55,0.5)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => navigate(item.path)}
          className="flex flex-col items-center gap-0.5 px-5 sm:px-7 py-2 rounded-full transition-colors"
          style={i === 0 ? { background: "rgba(80,80,80,0.5)" } : {}}
        >
          <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: "9px", color: "#888", letterSpacing: "0.18em", textTransform: "uppercase" as const }}>{item.sub}</span>
          <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "22px", color: "#FFF", letterSpacing: "0.06em" }}>{item.main}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Section Title with chrome gradient ───
function ChromeTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={className}
      style={{
        fontFamily: "'Six Caps', sans-serif",
        fontSize: "clamp(40px, 6vw, 88px)",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background: "linear-gradient(180deg, #D0D0D0 0%, #FFFFFF 25%, #9A9A9A 55%, #404040 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        lineHeight: 1.1,
      }}
    >
      {children}
    </h2>
  );
}

function WhiteTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={className}
      style={{
        fontFamily: "'Six Caps', sans-serif",
        fontSize: "clamp(40px, 6vw, 88px)",
        color: "#FFFFFF",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        lineHeight: 1.1,
      }}
    >
      {children}
    </h2>
  );
}

function TDZBadge({ size = 38 }: { size?: number }) {
  return <img src={tdzLogo} alt="TDZ" className="mx-auto" style={{ width: size, height: size, objectFit: "contain" }} />;
}

// ─── Subscribe Button ───
function SubscribeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-4 flex items-center gap-2 mx-auto transition-all hover:border-white/30"
      style={{
        background: "rgba(45,45,45,0.85)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "999px",
        padding: "12px 36px",
        color: "#AAA",
        fontFamily: "'Raleway', sans-serif",
        fontWeight: 600,
        fontSize: "13px",
        letterSpacing: "0.12em",
        textTransform: "uppercase" as const,
        cursor: "pointer",
      }}
    >
      SUBSCRIBE ›
    </button>
  );
}

// ═══════════════════════════════════════
// MAIN LANDING COMPONENT
// ═══════════════════════════════════════
export default function Landing() {
  const [latestReleases, setLatestReleases] = useState<Track[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("tracks")
      .select("id, title, artist_name, album_cover_path, album_cover_bucket, motion_cover_path, motion_cover_bucket, created_at, play_count, is_published")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => { if (data) setLatestReleases(data); });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#000", overflowX: "hidden" }}>
      {/* SECTION 1 — HERO */}
      <Section1Hero />

      {/* SECTION 2 — APP MOCKUPS */}
      <Section2Mockups />

      {/* SECTION 3 — TICKER 1 */}
      <Ticker text="AI FRIENDLY. ARTIST FIRST. YOUR MUSIC, YOUR PROFITS 100% OF DOWNLOAD REVENUE, $1 FOR EVERY STREAM, AND REAL TIME EARNINGS." />

      {/* SECTION 4 — ARTISTS STUDIO */}
      <Section4Studio />

      {/* SECTION 5 — TICKER 2 */}
      <Ticker text="EARN REAL MONEY FOR YOUR MUSIC $1 PER STREAM.  SET YOUR OWN DOWNLOAD PRICES. KEEP 100% OF DOWNLOAD REVENUE." />

      {/* SECTION 6 — MUSIC IS MORE THAN DATA */}
      <Section6Cards />

      {/* SECTION 7 — ARTIST SUBSCRIPTION PLANS */}
      <Section7ArtistPlans navigate={navigate} />

      {/* SECTION 8 — LATEST RELEASES */}
      <Section8Releases tracks={latestReleases} />

      {/* SECTION 9 — TDZ DISCOVERY */}
      <Section9Discovery />

      {/* SECTION 10 — FAN SUBSCRIPTION */}
      <Section10FanPlan navigate={navigate} />

      {/* SECTION 11 — FOOTER */}
      <Section11Footer navigate={navigate} />

      {/* Marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 45s linear infinite;
        }
        @keyframes auroraShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════
// SECTION 1 — HERO
// ═══════════════════════════════════════
function Section1Hero() {
  return (
    <section>
      {/* Aurora top half */}
      <div
        className="relative flex flex-col items-center justify-start pt-12 pb-0"
        style={{
          minHeight: "48vh",
          backgroundImage: `
            repeating-linear-gradient(90deg,
              transparent 0px, rgba(139,92,246,0.25) 2px, transparent 5px,
              rgba(59,130,246,0.2) 10px, transparent 14px,
              rgba(20,184,166,0.25) 18px, transparent 22px
            ),
            linear-gradient(160deg, #5B21B6 0%, #1D4ED8 20%, #0891B2 38%, #059669 55%, #7C3AED 72%, #DB2777 90%)
          `,
          backgroundSize: "200% 200%",
          animation: "auroraShift 8s ease-in-out infinite alternate",
          maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
        }}
      >
        {/* Logo badge */}
        <img src={tdzLogo} alt="TDZ Distribution" className="w-24 sm:w-28 h-auto mb-6 drop-shadow-2xl" />
        {/* Nav pill */}
        <NavPill />
      </div>

      {/* Black bottom half */}
      <div className="text-center pt-12 pb-20 px-4" style={{ background: "#000" }}>
        <Reveal>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: "14px", color: "#666", letterSpacing: "0.4em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
            INTRODUCING
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h1
            style={{
              fontFamily: "'Six Caps', sans-serif",
              fontSize: "clamp(72px, 11vw, 170px)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "linear-gradient(180deg, #D0D0D0 0%, #FFFFFF 25%, #9A9A9A 55%, #404040 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1,
            }}
          >
            TDZ DISTRIBUTION
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: "17px", color: "#CCC", marginTop: "16px" }}>
            THE FIRST PLATFORM
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "19px", color: "#CCC", marginTop: "4px" }}>
            THAT PAYS <span style={{ color: "#FFF" }}>$1</span> PER STREAM
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-8">
            <TDZBadge size={30} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
// SECTION 2 — APP MOCKUPS (3 iPhones)
// ═══════════════════════════════════════
function PhoneFrame({ children, style, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{
        width: 240,
        height: 490,
        background: "#1A1A1A",
        borderRadius: 44,
        border: "2px solid #2A2A2A",
        boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Notch */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-black rounded-full z-10" />
      {/* Screen */}
      <div className="absolute inset-1 rounded-[40px] overflow-hidden" style={{ background: "#111" }}>
        {children}
      </div>
    </div>
  );
}

function Section2Mockups() {
  return (
    <section className="py-16 pb-20 px-4" style={{ background: "#000" }}>
      <Reveal>
        <div className="flex items-center justify-center gap-0" style={{ perspective: 1200 }}>
          {/* Left phone — PROMOTE */}
          <PhoneFrame
            className="hidden md:block"
            style={{ transform: "rotateY(18deg) rotateZ(-2deg) translateX(-30px)", zIndex: 1, opacity: 0.85 }}
          >
            <PromoteMockup />
          </PhoneFrame>

          {/* Center phone — INSIGHTS */}
          <PhoneFrame style={{ transform: "rotateY(0deg) scale(1.08)", zIndex: 3 }}>
            <InsightsMockup />
          </PhoneFrame>

          {/* Right phone — STORYTELLING */}
          <PhoneFrame
            className="hidden md:block"
            style={{ transform: "rotateY(-18deg) rotateZ(2deg) translateX(30px)", zIndex: 1, opacity: 0.85 }}
          >
            <StorytellingMockup />
          </PhoneFrame>
        </div>
      </Reveal>
    </section>
  );
}

function PromoteMockup() {
  return (
    <div className="p-4 pt-8 h-full" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#888" }}>
      <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 24, color: "#FFF", letterSpacing: "0.04em" }}>PROMOTE</p>
      <div className="mt-3 space-y-2">
        {["AI Smart Promo", "Social Campaign", "Playlist Pitch", "Pre-Save Setup"].map((t, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#1C1C1C" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: i === 0 ? "#8B5CF6" : "#222" }}>
              <Zap className="w-3 h-3" style={{ color: i === 0 ? "#FFF" : "#555" }} />
            </div>
            <span style={{ color: "#AAA", fontSize: 11 }}>{t}</span>
            {i === 0 && <span className="ml-auto px-2 py-0.5 rounded-full text-[8px]" style={{ background: "#8B5CF6", color: "#FFF" }}>AI</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsMockup() {
  return (
    <div className="p-4 pt-8 h-full" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#888" }}>
      <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 24, color: "#FFF", letterSpacing: "0.04em" }}>INSIGHTS</p>
      <p style={{ fontSize: 9, color: "#555", marginTop: 2 }}>Track your performance, audience, and growth</p>
      <div className="flex gap-1 mt-3">
        {["Streams", "Demographics", "Revenue", "Tour"].map((t, i) => (
          <span key={i} className="px-2 py-1 rounded-full text-[8px]" style={{ background: i === 0 ? "#22C55E" : "#1C1C1C", color: i === 0 ? "#000" : "#666" }}>{t}</span>
        ))}
      </div>
      <div className="mt-3 p-3 rounded-xl" style={{ background: "#1C1C1C" }}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[8px]" style={{ background: "#22C55E", color: "#000" }}>Artist Earnings</span>
        </div>
        <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 42, color: "#22C55E", letterSpacing: "0.03em", lineHeight: 1.2, marginTop: 4 }}>$25.00</p>
        <p style={{ fontSize: 9, color: "#555", marginTop: 2 }}>21 streams • 80% download revenue</p>
      </div>
      <div className="mt-2 p-2 rounded-lg flex items-center gap-2" style={{ background: "#1C1C1C" }}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#22C55E" }}>
          <Play className="w-3 h-3" style={{ color: "#000" }} />
        </div>
        <span style={{ color: "#AAA", fontSize: 10 }}>Streaming Revenue</span>
        <span className="ml-auto" style={{ color: "#22C55E", fontSize: 11, fontWeight: 600 }}>$25.00</span>
      </div>
    </div>
  );
}

function StorytellingMockup() {
  return (
    <div className="p-4 pt-8 h-full" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#888" }}>
      <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 24, color: "#FFF", letterSpacing: "0.04em" }}>STORYTELLING</p>
      <p style={{ fontSize: 9, color: "#555", marginTop: 2 }}>Build your narrative</p>
      <div className="mt-3 space-y-2">
        {["Origin Story", "Current Chapter", "Future Vision"].map((t, i) => (
          <div key={i} className="p-2 rounded-lg" style={{ background: "#1C1C1C" }}>
            <p style={{ color: "#AAA", fontSize: 10, fontWeight: 600 }}>{t}</p>
            <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#222" }}>
              <div className="h-full rounded-full" style={{ width: `${60 + i * 15}%`, background: i === 0 ? "#22C55E" : i === 1 ? "#00CFFF" : "#8B5CF6" }} />
            </div>
          </div>
        ))}
        <div className="p-2 rounded-lg" style={{ background: "#1C1C1C" }}>
          <p style={{ fontSize: 9, color: "#555" }}>Narrative Strength</p>
          <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#22C55E", letterSpacing: "0.03em" }}>85%</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SECTION 4 — ARTISTS STUDIO DASHBOARD
// ═══════════════════════════════════════
function Section4Studio() {
  return (
    <section className="py-16 px-4" style={{ background: "#000" }}>
      <Reveal>
        <TDZBadge />
        <ChromeTitle className="text-center mt-4 mb-10">ARTISTS STUDIO</ChromeTitle>
      </Reveal>

      <Reveal delay={0.1}>
        <div
          className="mx-auto overflow-hidden flex flex-col lg:flex-row"
          style={{ maxWidth: 1100, border: "1px solid #222", borderRadius: 20, background: "#141414", minHeight: 520 }}
        >
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0 p-4 flex flex-col" style={{ background: "#1A1A1A", borderRight: "1px solid #222" }}>
            <div className="flex items-center justify-between mb-4">
              <TDZBadge size={24} />
              <span style={{ color: "#555", fontSize: 14 }}>×</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ border: "2px solid #22C55E", color: "#22C55E" }}>R</div>
              <div>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 13, color: "#FFF" }}>RobHayes</p>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#888" }}>Artist Studio</p>
              </div>
            </div>
            <button className="w-full py-2 rounded-full text-center mb-4" style={{ background: "#22C55E", color: "#000", fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13 }}>
              + New Release
            </button>
            {/* Quick Stats */}
            <div className="mb-4">
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 9, color: "#555", letterSpacing: "0.2em", marginBottom: 6 }}>QUICK STATS</p>
              {[
                { icon: "🔵", label: "Total Plays", val: "36" },
                { icon: "📈", label: "This Week", val: "+0" },
                { icon: "💰", label: "Earnings", val: "$39" },
                { icon: "👥", label: "Followers", val: "2" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#888" }}>
                  <span>{s.icon} {s.label}</span>
                  <span style={{ color: "#FFF" }}>{s.val}</span>
                </div>
              ))}
            </div>
            {/* Quick Actions */}
            <div className="mb-4">
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 9, color: "#555", letterSpacing: "0.2em", marginBottom: 6 }}>QUICK ACTIONS</p>
              {["Schedule Release", "View Analytics", "Promote Track", "Payout Settings"].map((a, i) => (
                <p key={i} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 12, color: "#888", cursor: "pointer", padding: "3px 0" }}>{a}</p>
              ))}
            </div>
            {/* Icon Nav */}
            <div className="mt-auto space-y-1">
              {[
                { icon: LayoutDashboard, label: "Dashboard", active: true },
                { icon: Music, label: "Content", active: false },
                { icon: BarChart3, label: "Analytics", active: false },
                { icon: TrendingUp, label: "Promote", active: false },
                { icon: BookOpen, label: "Academy", active: false },
                { icon: Settings, label: "Settings", active: false },
              ].map((n, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: n.active ? "rgba(255,255,255,0.06)" : "transparent" }}>
                  <n.icon className="w-4 h-4" style={{ color: n.active ? "#FFF" : "#444" }} />
                  <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: n.active ? "#FFF" : "#444" }}>{n.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 px-3 py-1.5">
                <Crown className="w-4 h-4" style={{ color: "#D4A017" }} />
                <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#D4A017" }}>Admin</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 mt-2">
                <Moon className="w-3 h-3" style={{ color: "#555" }} />
                <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#555" }}>Dark Mode</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-5 sm:p-7 overflow-y-auto">
            {/* Greeting */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 400, fontSize: 11, color: "#666", letterSpacing: "0.2em", textTransform: "uppercase" as const }}>GOOD AFTERNOON </span>
                <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 38, color: "#FFF" }}>ROBHAYES</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button className="px-4 py-1.5 rounded-full text-xs" style={{ border: "1px solid #22C55E", color: "#22C55E", fontFamily: "'Raleway', sans-serif", fontWeight: 600, background: "transparent" }}>
                  🎵 Release Music
                </button>
                <button className="px-4 py-1.5 rounded-full text-xs" style={{ border: "1px solid #333", color: "#888", fontFamily: "'Raleway', sans-serif", fontWeight: 600, background: "transparent" }}>
                  View All Releases
                </button>
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: "IMPACT", value: "40", sub: "Intentional plays" },
                { label: "RELEASES", value: "24", sub: "Total tracks" },
                { label: "EARNINGS", value: "$39.00", sub: "Pending payout", green: true },
                { label: "COMMUNITY", value: "0", sub: "Invested in your journey" },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: "#1C1C1C" }}>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 400, fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{s.label}</p>
                  <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: s.green ? "#22C55E" : "#FFF", lineHeight: 1.2, letterSpacing: "0.03em" }}>{s.value}</p>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 11, color: "#555" }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Your Story So Far */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13, color: "#FFF" }}>YOUR STORY SO FAR</p>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 11, color: "#555" }}>Recent releases and performance</p>
              </div>
              <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 12, color: "#22C55E", cursor: "pointer" }}>View All →</span>
            </div>
            <div className="space-y-2">
              {[
                { title: "To Arthur for U2", date: "Jan 23, 2026", streams: 9 },
                { title: "HEM! ft Richfriend, Dazesowavy", date: "Jan 7, 2026", streams: 0 },
                { title: "Bad Mon ft Notorious Note, Toos", date: "Jan 7, 2026", streams: 0 },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#1C1C1C" }}>
                  <div className="w-10 h-10 rounded-md flex-shrink-0" style={{ background: "linear-gradient(135deg, #333, #555)" }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 12, color: "#FFF" }} className="truncate">{t.title}</p>
                    <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#555" }}>{t.date}</p>
                  </div>
                  <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#888" }}>{t.streams} STREAMS</span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold" style={{ background: "rgba(34,197,94,0.2)", color: "#22C55E" }}>LIVE</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications panel (desktop only) */}
          <div className="hidden xl:block w-64 flex-shrink-0 p-5" style={{ background: "#111", borderLeft: "1px solid #1A1A1A" }}>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 12, color: "#FFF", letterSpacing: "0.15em" }}>NOTIFICATIONS</p>
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(34,197,94,0.2)" }}>
                <span style={{ color: "#22C55E", fontSize: 16 }}>✓</span>
              </div>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#666", textAlign: "center" }}>You're all caught up!</p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ═══════════════════════════════════════
// SECTION 6 — MUSIC IS MORE THAN DATA
// ═══════════════════════════════════════
function Section6Cards() {
  const cards = [
    { title: "BUILD CULTURE", body: "ARTISTS BUILD CULTURE, CONTEXT, AND COMMUNITY NOT JUST MONTHLY LISTENERS.", Icon: Users, color: "#00CFFF" },
    { title: "SHARE & DISCUSS", body: "MUSIC ISN'T JUST STREAMED IT'S SHARED, DISCUSSED, AND EXPLORED TOGETHER.", Icon: MessageCircle, color: "#00CFFF" },
    { title: "ACTIVE LISTENING", body: "LISTENING IS ACTIVE, INTENTIONAL, IMMERSIVE NOT PASSIVE CONSUMPTION.", Icon: Play, color: "#00CFFF" },
    { title: "ARTIST IDENTITY", body: "TECHNOLOGY AMPLIFIES DEPTH OVER DISTRACTION, ARTIST IDENTITY OVER UTILITY.", Icon: Palette, color: "#D4A017" },
    { title: "HUMAN EXPRESSION", body: "HUMAN EXPRESSION SHOULD BE THE POINT NOT JUST ANOTHER DATA POINT.", Icon: Heart, color: "#D4A017" },
    { title: "BE IN THE STORY", body: "FANS AREN'T \"USERS\" THEY'RE PARTICIPANTS IN THE STORY.", Icon: Star, color: "#D4A017" },
  ];

  return (
    <section className="py-20 px-6" style={{ background: "#000" }}>
      <Reveal>
        <TDZBadge />
        <WhiteTitle className="text-center mt-4">MUSIC IS MORE THAN DATA</WhiteTitle>
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1160px] mx-auto mt-12">
        {cards.map((c, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <div
              className="flex flex-col justify-between p-7 transition-all hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
              style={{ background: "#1C1C1C", borderRadius: 22, minHeight: 210 }}
            >
              <div>
                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(24px, 2.8vw, 40px)", color: "#FFF", letterSpacing: "0.03em" }}>{c.title}</h3>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 400, fontSize: 12, color: "#777", textTransform: "uppercase" as const, letterSpacing: "0.1em", lineHeight: 1.8, marginTop: 8 }}>{c.body}</p>
              </div>
              <div className="flex justify-center mt-4">
                <c.Icon className="w-7 h-7" style={{ color: c.color }} />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
// SECTION 7 — ARTIST SUBSCRIPTION PLANS
// ═══════════════════════════════════════
function Section7ArtistPlans({ navigate }: { navigate: (p: string) => void }) {
  const plans = [
    { name: "STARTER", price: "$9.99" },
    { name: "PRO", price: "$19.99" },
    { name: "ENTERPRISE", price: "$49.99" },
  ];

  return (
    <section className="py-20 px-6" style={{ background: "#000" }}>
      <Reveal>
        <WhiteTitle className="text-center">ARTIST SUBSCRIPTION PLANS</WhiteTitle>
      </Reveal>
      <div className="flex flex-col md:flex-row items-center justify-center gap-7 mt-12 max-w-[1080px] mx-auto">
        {plans.map((p, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <div className="flex flex-col items-center">
              <div
                className="flex flex-col justify-start items-center pt-8 w-full"
                style={{
                  background: "linear-gradient(180deg, #2a2a2a 0%, #5a5a5a 40%, #b0b0b0 75%, #d8d8d8 100%)",
                  borderRadius: 28,
                  width: 310,
                  minHeight: 460,
                  padding: "30px 26px",
                }}
              >
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 15, color: "#BBB", letterSpacing: "0.2em", textTransform: "uppercase" as const }}>{p.name}</p>
                <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 68, color: "#FFF", letterSpacing: "0.04em", marginTop: 8 }}>{p.price}</p>
              </div>
              <SubscribeButton onClick={() => navigate("/auth")} />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
// SECTION 8 — LATEST RELEASES
// ═══════════════════════════════════════
function Section8Releases({ tracks }: { tracks: Track[] }) {
  // Placeholder album gradients if not enough tracks
  const placeholders = [
    "linear-gradient(135deg, #c0392b, #2c3e50)",
    "linear-gradient(135deg, #3498db, #2ecc71)",
    "linear-gradient(135deg, #1abc9c, #2c3e50)",
    "linear-gradient(135deg, #f39c12, #e74c3c)",
    "linear-gradient(135deg, #9b59b6, #3498db)",
    "linear-gradient(135deg, #2ecc71, #27ae60)",
  ];

  const slides = tracks.length > 0 ? tracks : Array.from({ length: 6 }, (_, i) => ({ id: String(i), placeholder: true, gradient: placeholders[i] }));

  return (
    <section className="py-20 px-4" style={{ background: "#000" }}>
      <Reveal>
        <TDZBadge />
        <WhiteTitle className="text-center mt-4">LATEST RELEASES FROM TDZ ARTISTS</WhiteTitle>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-12 max-w-[900px] mx-auto">
          <Swiper
            modules={[EffectCoverflow, Autoplay]}
            effect="coverflow"
            grabCursor
            centeredSlides
            slidesPerView="auto"
            loop={slides.length > 3}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            coverflowEffect={{ rotate: 30, stretch: 0, depth: 200, modifier: 1.2, slideShadows: true }}
          >
            {slides.map((s: any, i) => (
              <SwiperSlide key={s.id} style={{ width: 220, height: 220 }}>
                {s.placeholder ? (
                  <div className="w-full h-full rounded-lg" style={{ background: s.gradient }} />
                ) : (
                  <MotionCover
                    staticCoverPath={s.album_cover_path}
                    staticCoverBucket={s.album_cover_bucket}
                    motionCoverPath={s.motion_cover_path}
                    motionCoverBucket={s.motion_cover_bucket}
                    alt={s.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Reveal>

      {/* Playback control icons */}
      <Reveal delay={0.2}>
        <div className="flex items-center justify-center gap-5 mt-8">
          {[
            { Icon: SkipBack, color: "#00CFFF" },
            { Icon: Play, color: "#D4A017" },
            { Icon: SkipForward, color: "#00CFFF" },
            { Icon: Shuffle, color: "#D4A017" },
          ].map((b, i) => (
            <button
              key={i}
              className="w-13 h-13 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{
                width: 52,
                height: 52,
                border: `1px solid ${b.color}66`,
                background: "rgba(0,0,0,0.6)",
              }}
            >
              <b.Icon className="w-5 h-5" style={{ color: b.color }} />
            </button>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ═══════════════════════════════════════
// SECTION 9 — TDZ DISCOVERY
// ═══════════════════════════════════════
function Section9Discovery() {
  return (
    <section className="py-20 px-4" style={{ background: "#000" }}>
      <Reveal>
        <ChromeTitle className="text-center">TDZ DISCOVERY</ChromeTitle>
      </Reveal>
      <Reveal delay={0.1}>
        <div
          className="mx-auto mt-10 flex overflow-hidden"
          style={{ maxWidth: 1100, border: "1px solid #1E1E1E", borderRadius: 18, background: "#0E0E0E", minHeight: 480 }}
        >
          {/* Icon sidebar */}
          <div className="hidden sm:flex flex-col items-center gap-6 py-5 flex-shrink-0" style={{ width: 50, background: "#0A0A0A", borderRight: "1px solid #1A1A1A" }}>
            {[
              { Icon: Compass, active: true },
              { Icon: BarChart3, active: false },
              { Icon: Globe, active: false },
              { Icon: User, active: false },
              { Icon: MessageCircle, active: false },
              { Icon: Bookmark, active: false },
              { Icon: Heart, active: false },
            ].map((n, i) => (
              <n.Icon key={i} className="w-4 h-4" style={{ color: n.active ? "#00CFFF" : "#333" }} />
            ))}
            <div className="mt-auto">
              <Settings className="w-4 h-4" style={{ color: "#333" }} />
            </div>
          </div>

          {/* Main panel */}
          <div className="flex-1 p-6 sm:p-8 lg:p-10">
            {/* Status bar */}
            <div className="flex flex-wrap items-center gap-5 mb-6">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} />
                <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 12, color: "#22C55E", letterSpacing: "0.15em" }}>LIVE</span>
              </div>
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666" }}>↗ 31+ Tracks</span>
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666" }}>🎧 $1/Stream</span>
            </div>

            {/* Hero text */}
            <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 56, color: "#FFF", letterSpacing: "0.04em", lineHeight: 1 }}>DISCOVER</h3>
            <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 56, color: "#00CFFF", letterSpacing: "0.04em", lineHeight: 1 }}>NEW TDZ RELEASES</h3>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 15, color: "#777", marginTop: 12 }}>Stream unlimited music from independent artists worldwide.</p>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 15, color: "#777", marginTop: 4 }}>Every play directly supports creators.</p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button className="px-6 py-2.5 rounded-full flex items-center gap-2" style={{ background: "#FFF", color: "#000", fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 13 }}>
                <Play className="w-4 h-4" /> Play All
              </button>
              <button className="px-6 py-2.5 rounded-full" style={{ border: "1px solid #333", color: "#888", fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 13, background: "transparent" }}>
                ⇄ Shuffle
              </button>
              <button className="px-6 py-2.5 rounded-full" style={{ border: "1px solid #333", color: "#888", fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 13, background: "transparent" }}>
                <Upload className="w-4 h-4 inline mr-1" /> Upload Music
              </button>
            </div>

            {/* Top Releases section */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 11, color: "#AAA", letterSpacing: "0.2em" }}>TOP TDZ RELEASES</p>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#555", marginTop: 2 }}>8 Releases</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px]" style={{ border: "1px solid #333", color: "#888", fontFamily: "'Raleway', sans-serif" }}>ALL</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {["All", "Pop", "Hip-Hop", "R&B", "Electronic"].map((g, i) => (
                  <span
                    key={g}
                    className="px-4 py-1.5 rounded-full text-xs cursor-pointer transition-colors"
                    style={{
                      background: i === 0 ? "#FFF" : "transparent",
                      color: i === 0 ? "#000" : "#666",
                      border: i === 0 ? "none" : "1px solid #333",
                      fontFamily: "'Raleway', sans-serif",
                      fontWeight: i === 0 ? 600 : 400,
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ═══════════════════════════════════════
// SECTION 10 — FAN SUBSCRIPTION PLAN
// ═══════════════════════════════════════
function Section10FanPlan({ navigate }: { navigate: (p: string) => void }) {
  return (
    <section className="py-20 px-6" style={{ background: "#000" }}>
      <Reveal>
        <TDZBadge />
        <WhiteTitle className="text-center mt-4">FAN SUBSCRIPTION PLAN</WhiteTitle>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="flex flex-col items-center mt-10">
          <div
            className="flex flex-col items-center pt-10"
            style={{
              background: "linear-gradient(180deg, #2a2a2a 0%, #5a5a5a 40%, #b0b0b0 75%, #d8d8d8 100%)",
              borderRadius: 28,
              width: 380,
              maxWidth: "100%",
              minHeight: 520,
              padding: "36px 32px",
            }}
          >
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 15, color: "#BBB", letterSpacing: "0.18em", textTransform: "uppercase" as const, textAlign: "center" }}>
              UNLIMITED STREAMING
            </p>
            <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 78, color: "#FFF", letterSpacing: "0.04em", marginTop: 12 }}>$12.00</p>
          </div>
          <SubscribeButton onClick={() => navigate("/auth")} />
        </div>
      </Reveal>
    </section>
  );
}

// ═══════════════════════════════════════
// SECTION 11 — FOOTER
// ═══════════════════════════════════════
function Section11Footer({ navigate }: { navigate: (p: string) => void }) {
  return (
    <footer className="pt-16 pb-10 px-4 text-center" style={{ background: "#000" }}>
      <img src={tdzLogo} alt="TDZ Distribution" className="mx-auto w-14 h-14 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
      <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 20, color: "#444", letterSpacing: "0.08em", marginTop: 12 }}>
        THE FIRST PLATFORM THAT PAYS $1 PER STREAM
      </p>

      <div className="flex flex-wrap justify-center gap-8 mt-6">
        {[
          { label: "SIGNUP", path: "/auth" },
          { label: "STUDIO", path: "/studio" },
          { label: "DISCOVERY", path: "/discover" },
          { label: "STORE", path: "/pricing" },
          { label: "ABOUT", path: "/faq" },
          { label: "CONTACT", path: "/support" },
        ].map((l) => (
          <span
            key={l.label}
            onClick={() => navigate(l.path)}
            className="cursor-pointer transition-colors hover:text-[#888]"
            style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 13, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase" as const }}
          >
            {l.label}
          </span>
        ))}
      </div>

      <div className="mx-auto mt-8 mb-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", maxWidth: 600 }} />

      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 12, color: "#333" }}>
        © 2026 TDZ Distribution. All rights reserved.
      </p>
    </footer>
  );
}
