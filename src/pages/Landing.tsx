import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageCircle, Play, Palette, Heart, Star, SkipBack, SkipForward, Shuffle, Compass, BarChart3, Globe, User, Bookmark, Settings, Moon, Crown, Music, Upload, TrendingUp, LayoutDashboard, BookOpen, Zap, Check, Pause, Volume2 } from "lucide-react";
import tdzLogo from "@/assets/tdz-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { MotionCover } from "@/components/MotionCover";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay, Navigation } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/effect-coverflow";
// @ts-ignore
import "swiper/css/navigation";
import { openSquareCheckout, isCheckoutPlan } from "@/lib/subscription-checkout";

// ─── Types ───
interface Track {
  id: string;
  title: string;
  artist_name: string;
  album_cover_path: string | null;
  album_cover_bucket: string | null;
  motion_cover_path: string | null;
  motion_cover_bucket: string | null;
  file_path: string | null;
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

// ─── Title helpers ───
function ChromeTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={className} style={{
      fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(40px, 6vw, 88px)", letterSpacing: "0.04em", textTransform: "uppercase",
      background: "linear-gradient(180deg, #D0D0D0 0%, #FFFFFF 25%, #9A9A9A 55%, #404040 100%)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1.1,
    }}>{children}</h2>
  );
}

function WhiteTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={className} style={{
      fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(40px, 6vw, 88px)", color: "#FFFFFF",
      letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.1,
    }}>{children}</h2>
  );
}

function TDZBadge({ size = 38 }: { size?: number }) {
  return <img src={tdzLogo} alt="TDZ" className="mx-auto" style={{ width: size, height: size, objectFit: "contain" }} />;
}

function SubscribeButton({ onClick, label = "SUBSCRIBE ›" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="mt-4 flex items-center gap-2 mx-auto transition-all hover:border-white/30"
      style={{ background: "rgba(45,45,45,0.85)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "999px", padding: "12px 36px",
        color: "#AAA", fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: "13px", letterSpacing: "0.12em", textTransform: "uppercase" as const, cursor: "pointer" }}>
      {label}
    </button>
  );
}

// ─── Audio Preview Player ───
function useAudioPreview() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const play = useCallback((trackId: string, filePath: string | null) => {
    // Stop current
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!filePath) { setPlayingId(null); return; }
    if (playingId === trackId) { setPlayingId(null); return; }

    const url = supabase.storage.from("tracks").getPublicUrl(filePath).data.publicUrl;
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingId(trackId);
    audio.play().catch(() => setPlayingId(null));

    // Stop after 10 seconds
    timerRef.current = setTimeout(() => {
      audio.pause();
      setPlayingId(null);
    }, 10000);

    audio.onended = () => setPlayingId(null);
  }, [playingId]);

  const stop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlayingId(null);
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  return { playingId, play, stop };
}

// ═══════════════════════════════════════
// MAIN LANDING COMPONENT
// ═══════════════════════════════════════
export default function Landing() {
  const [latestReleases, setLatestReleases] = useState<Track[]>([]);
  const navigate = useNavigate();
  const audioPreview = useAudioPreview();

  useEffect(() => {
    // Only load true singles (tracks not part of an album) for the carousel
    supabase
      .from("tracks")
      .select("id, title, artist_name, album_cover_path, album_cover_bucket, motion_cover_path, motion_cover_bucket, file_path, created_at, play_count, is_published, album_id")
      .eq("is_published", true)
      .is("album_id", null)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => { if (data) setLatestReleases(data as Track[]); });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#000", overflowX: "hidden" }}>
      <Section1Hero />
      <Section2Mockups />
      <Ticker text="AI FRIENDLY. ARTIST FIRST. YOUR MUSIC, YOUR PROFITS 100% OF DOWNLOAD REVENUE, $1 FOR EVERY STREAM, AND REAL TIME EARNINGS." />
      <Section4Studio navigate={navigate} />
      <Ticker text="EARN REAL MONEY FOR YOUR MUSIC $1 PER STREAM.  SET YOUR OWN DOWNLOAD PRICES. KEEP 100% OF DOWNLOAD REVENUE." />
      <Section6Cards />
      <SectionWhyTDZ navigate={navigate} />
      <SectionHowPaymentsWork />
      <SectionAIAgents />
      <Section7ArtistPlans navigate={navigate} />
      <Section8Releases tracks={latestReleases} audioPreview={audioPreview} navigate={navigate} />
      <Section9Discovery navigate={navigate} />
      <Section10FanPlan navigate={navigate} />
      <Section11Footer navigate={navigate} />

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 45s linear infinite; }
        @keyframes auroraShift { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
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
      <div className="relative flex flex-col items-center justify-start pt-12 pb-0"
        style={{
          minHeight: "48vh",
          backgroundImage: `repeating-linear-gradient(90deg,transparent 0px,rgba(139,92,246,0.25) 2px,transparent 5px,rgba(59,130,246,0.2) 10px,transparent 14px,rgba(20,184,166,0.25) 18px,transparent 22px),linear-gradient(160deg,#5B21B6 0%,#1D4ED8 20%,#0891B2 38%,#059669 55%,#7C3AED 72%,#DB2777 90%)`,
          backgroundSize: "200% 200%", animation: "auroraShift 8s ease-in-out infinite alternate",
          maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
        }}>
        <img src={tdzLogo} alt="TDZ Distribution" className="w-24 sm:w-28 h-auto mb-6 drop-shadow-2xl" />
        <NavPill />
      </div>
      <div className="text-center pt-12 pb-20 px-4" style={{ background: "#000" }}>
        <Reveal>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: "14px", color: "#666", letterSpacing: "0.4em", textTransform: "uppercase" as const, marginBottom: "8px" }}>INTRODUCING</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 style={{
            fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(72px, 11vw, 170px)", letterSpacing: "0.06em", textTransform: "uppercase",
            background: "linear-gradient(180deg, #D0D0D0 0%, #FFFFFF 25%, #9A9A9A 55%, #404040 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1,
          }}>TDZ DISTRIBUTION</h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: "17px", color: "#CCC", marginTop: "16px" }}>THE FIRST PLATFORM</p>
        </Reveal>
        <Reveal delay={0.25}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "19px", color: "#CCC", marginTop: "4px" }}>
            THAT PAYS <span style={{ color: "#FFF" }}>$1</span> PER STREAM
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: "14px", color: "#777", marginTop: "20px", maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
            Independent artists earn 333x more than Spotify. AI music welcome. 100% of download revenue goes to artists. Keep your rights. Build your legacy.
          </p>
        </Reveal>
        <Reveal delay={0.35}>
          <div className="mt-8"><TDZBadge size={30} /></div>
        </Reveal>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
// SECTION 2 — APP MOCKUPS (Interactive Demos)
// ═══════════════════════════════════════
function PhoneFrame({ children, style, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={`relative flex-shrink-0 ${className}`}
      style={{ width: 240, height: 490, background: "#1A1A1A", borderRadius: 44, border: "2px solid #2A2A2A", boxShadow: "0 40px 80px rgba(0,0,0,0.8)", overflow: "hidden", ...style }}>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-black rounded-full z-10" />
      <div className="absolute inset-1 rounded-[40px] overflow-hidden overflow-y-auto scrollbar-hide" style={{ background: "#111" }}>
        {children}
      </div>
    </div>
  );
}

function Section2Mockups() {
  return (
    <section className="py-16 pb-20 px-4" style={{ background: "#000" }}>
      <Reveal>
        <p className="text-center mb-8" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 12, color: "#666", letterSpacing: "0.2em", textTransform: "uppercase" as const }}>
          INTERACTIVE DEMOS — TAP TO EXPLORE
        </p>
        <div className="flex items-center justify-center gap-0" style={{ perspective: 1200 }}>
          <PhoneFrame className="hidden md:block" style={{ transform: "rotateY(18deg) rotateZ(-2deg) translateX(-30px)", zIndex: 1, opacity: 0.85 }}>
            <StudioDemoMockup />
          </PhoneFrame>
          <PhoneFrame style={{ transform: "rotateY(0deg) scale(1.08)", zIndex: 3 }}>
            <InsightsDemoMockup />
          </PhoneFrame>
          <PhoneFrame className="hidden md:block" style={{ transform: "rotateY(-18deg) rotateZ(2deg) translateX(30px)", zIndex: 1, opacity: 0.85 }}>
            <DiscoveryDemoMockup />
          </PhoneFrame>
        </div>
      </Reveal>
    </section>
  );
}

function StudioDemoMockup() {
  const [activeTab, setActiveTab] = useState("promote");
  const tabs = ["promote", "insights", "content"];
  return (
    <div className="p-4 pt-8 h-full" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#888" }}>
      <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 22, color: "#FFF", letterSpacing: "0.04em" }}>ARTIST STUDIO</p>
      <div className="flex gap-1 mt-2 mb-3">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className="px-2 py-1 rounded-full text-[8px] transition-all"
            style={{ background: activeTab === t ? "#22C55E" : "#1C1C1C", color: activeTab === t ? "#000" : "#666" }}>{t.toUpperCase()}</button>
        ))}
      </div>
      {activeTab === "promote" && (
        <div className="space-y-2">
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
      )}
      {activeTab === "insights" && (
        <div className="space-y-2">
          <div className="p-3 rounded-xl" style={{ background: "#1C1C1C" }}>
            <span className="px-2 py-0.5 rounded-full text-[8px]" style={{ background: "#22C55E", color: "#000" }}>Earnings</span>
            <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: "#22C55E", lineHeight: 1.2, marginTop: 4 }}>$12,000</p>
            <p style={{ fontSize: 9, color: "#555" }}>12,000 streams • $1/stream</p>
          </div>
          <div className="p-2 rounded-lg" style={{ background: "#1C1C1C" }}>
            <span style={{ fontSize: 9, color: "#555" }}>Followers</span>
            <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 24, color: "#FFF" }}>9,000</p>
          </div>
        </div>
      )}
      {activeTab === "content" && (
        <div className="space-y-2">
          {["Upload Tracks", "Manage Albums", "Lyrics Sync", "Territory Rights"].map((t, i) => (
            <div key={i} className="p-2 rounded-lg flex items-center gap-2" style={{ background: "#1C1C1C" }}>
              <Music className="w-4 h-4" style={{ color: "#22C55E" }} />
              <span style={{ color: "#AAA", fontSize: 10 }}>{t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightsDemoMockup() {
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
        <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 42, color: "#22C55E", letterSpacing: "0.03em", lineHeight: 1.2, marginTop: 4 }}>$12,000</p>
        <p style={{ fontSize: 9, color: "#555", marginTop: 2 }}>12,000 streams • 100% download revenue</p>
      </div>
      <div className="mt-2 p-2 rounded-lg flex items-center gap-2" style={{ background: "#1C1C1C" }}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#22C55E" }}>
          <Play className="w-3 h-3" style={{ color: "#000" }} />
        </div>
        <span style={{ color: "#AAA", fontSize: 10 }}>Streaming Revenue</span>
        <span className="ml-auto" style={{ color: "#22C55E", fontSize: 11, fontWeight: 600 }}>$12,000</span>
      </div>
      <div className="mt-2 p-2 rounded-lg flex items-center gap-2" style={{ background: "#1C1C1C" }}>
        <Users className="w-4 h-4" style={{ color: "#00CFFF" }} />
        <span style={{ color: "#AAA", fontSize: 10 }}>Followers</span>
        <span className="ml-auto" style={{ color: "#00CFFF", fontSize: 11, fontWeight: 600 }}>9,000</span>
      </div>
    </div>
  );
}

function DiscoveryDemoMockup() {
  const [activeGenre, setActiveGenre] = useState("All");
  return (
    <div className="p-4 pt-8 h-full" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#888" }}>
      <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 22, color: "#FFF", letterSpacing: "0.04em" }}>DISCOVER</p>
      <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 18, color: "#00CFFF", letterSpacing: "0.04em", lineHeight: 1 }}>NEW TDZ RELEASES</p>
      <div className="flex gap-1 mt-2 mb-3 overflow-x-auto scrollbar-hide">
        {["All", "Pop", "Hip-Hop", "R&B"].map(g => (
          <button key={g} onClick={() => setActiveGenre(g)} className="px-2 py-1 rounded-full text-[8px] whitespace-nowrap transition-all"
            style={{ background: activeGenre === g ? "#FFF" : "transparent", color: activeGenre === g ? "#000" : "#666", border: activeGenre === g ? "none" : "1px solid #333" }}>{g}</button>
        ))}
      </div>
      <div className="space-y-1.5">
        {["Stream unlimited music", "Every play supports creators", "$1 per stream to artists", "AI-powered playlists"].map((t, i) => (
          <div key={i} className="p-2 rounded-lg flex items-center gap-2" style={{ background: "#1C1C1C" }}>
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${["#c0392b", "#3498db", "#9b59b6", "#2ecc71"][i]}, #333)` }}>
              <Play className="w-2.5 h-2.5" style={{ color: "#FFF" }} />
            </div>
            <span style={{ color: "#AAA", fontSize: 9 }}>{t}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="flex-1 py-1.5 rounded-full text-[9px]" style={{ background: "#FFF", color: "#000", fontWeight: 600 }}>▶ Play All</button>
        <button className="flex-1 py-1.5 rounded-full text-[9px]" style={{ border: "1px solid #333", color: "#666" }}>⇄ Shuffle</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SECTION 4 — ARTISTS STUDIO (Interactive Demo with Video)
// ═══════════════════════════════════════
function Section4Studio({ navigate }: { navigate: (p: string) => void }) {
  const [showVideo, setShowVideo] = useState(false);
  return (
    <section className="py-16 px-4" style={{ background: "#000" }}>
      <Reveal>
        <TDZBadge />
        <ChromeTitle className="text-center mt-4 mb-4">ARTISTS STUDIO</ChromeTitle>
        <p className="text-center mb-2" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#666" }}>
          Everything you need to release, promote, and monetize your music
        </p>
        <div className="flex justify-center gap-3 mb-8">
          <button onClick={() => setShowVideo(!showVideo)} className="px-4 py-2 rounded-full text-xs transition-all"
            style={{ background: showVideo ? "#22C55E" : "transparent", color: showVideo ? "#000" : "#22C55E", border: "1px solid #22C55E", fontFamily: "'Raleway', sans-serif", fontWeight: 600 }}>
            {showVideo ? "Hide Demo" : "▶ Watch Demo"}
          </button>
          <button onClick={() => navigate("/studio")} className="px-4 py-2 rounded-full text-xs"
            style={{ border: "1px solid #333", color: "#888", fontFamily: "'Raleway', sans-serif", fontWeight: 600 }}>
            Open Studio →
          </button>
        </div>
      </Reveal>

      {showVideo && (
        <Reveal>
          <div className="mx-auto mb-8 rounded-2xl overflow-hidden" style={{ maxWidth: 900, border: "1px solid #222" }}>
            <video src="/videos/studio-demo.mp4" controls autoPlay muted className="w-full" style={{ background: "#000" }} />
          </div>
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <div className="mx-auto overflow-hidden flex flex-col lg:flex-row"
          style={{ maxWidth: 1100, border: "1px solid #222", borderRadius: 20, background: "#141414", minHeight: 520 }}>
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
            <button onClick={() => navigate("/studio")} className="w-full py-2 rounded-full text-center mb-4"
              style={{ background: "#22C55E", color: "#000", fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13 }}>
              + New Release
            </button>
            <div className="mb-4">
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 9, color: "#555", letterSpacing: "0.2em", marginBottom: 6 }}>QUICK STATS</p>
              {[
                { icon: "🔵", label: "Total Plays", val: "12,000" },
                { icon: "📈", label: "This Week", val: "+340" },
                { icon: "💰", label: "Earnings", val: "$12,000" },
                { icon: "👥", label: "Followers", val: "9,000" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#888" }}>
                  <span>{s.icon} {s.label}</span>
                  <span style={{ color: s.label === "Earnings" ? "#22C55E" : "#FFF" }}>{s.val}</span>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 9, color: "#555", letterSpacing: "0.2em", marginBottom: 6 }}>QUICK ACTIONS</p>
              {[
                { label: "Schedule Release", path: "/studio" },
                { label: "View Analytics", path: "/studio" },
                { label: "Promote Track", path: "/studio" },
                { label: "Payout Settings", path: "/studio" },
              ].map((a, i) => (
                <p key={i} onClick={() => navigate(a.path)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 12, color: "#888", cursor: "pointer", padding: "3px 0" }}
                  className="hover:text-white transition-colors">{a.label}</p>
              ))}
            </div>
            <div className="mt-auto space-y-1">
              {[
                { icon: LayoutDashboard, label: "Dashboard", active: true },
                { icon: Music, label: "Content", active: false },
                { icon: BarChart3, label: "Analytics", active: false },
                { icon: TrendingUp, label: "Promote", active: false },
                { icon: BookOpen, label: "Academy", active: false },
                { icon: Settings, label: "Settings", active: false },
              ].map((n, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ background: n.active ? "rgba(255,255,255,0.06)" : "transparent" }}
                  onClick={() => navigate("/studio")}>
                  <n.icon className="w-4 h-4" style={{ color: n.active ? "#FFF" : "#444" }} />
                  <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: n.active ? "#FFF" : "#444" }}>{n.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 px-3 py-1.5 cursor-pointer" onClick={() => navigate("/ceo")}>
                <Crown className="w-4 h-4" style={{ color: "#D4A017" }} />
                <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#D4A017" }}>Admin</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-5 sm:p-7 overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 400, fontSize: 11, color: "#666", letterSpacing: "0.2em", textTransform: "uppercase" as const }}>GOOD AFTERNOON </span>
                <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 38, color: "#FFF" }}>ROBHAYES</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => navigate("/studio")} className="px-4 py-1.5 rounded-full text-xs"
                  style={{ border: "1px solid #22C55E", color: "#22C55E", fontFamily: "'Raleway', sans-serif", fontWeight: 600, background: "transparent" }}>
                  🎵 Release Music
                </button>
                <button onClick={() => navigate("/studio")} className="px-4 py-1.5 rounded-full text-xs"
                  style={{ border: "1px solid #333", color: "#888", fontFamily: "'Raleway', sans-serif", fontWeight: 600, background: "transparent" }}>
                  View All Releases
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: "IMPACT", value: "12,000", sub: "Intentional plays" },
                { label: "RELEASES", value: "24", sub: "Total tracks" },
                { label: "EARNINGS", value: "$12,000", sub: "Pending payout", green: true },
                { label: "COMMUNITY", value: "9,000", sub: "Invested in your journey" },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: "#1C1C1C" }}>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 400, fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{s.label}</p>
                  <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: s.green ? "#22C55E" : "#FFF", lineHeight: 1.2, letterSpacing: "0.03em" }}>{s.value}</p>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 11, color: "#555" }}>{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-3">
              <div>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13, color: "#FFF" }}>YOUR STORY SO FAR</p>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 11, color: "#555" }}>Recent releases and performance</p>
              </div>
              <span onClick={() => navigate("/studio")} className="cursor-pointer hover:text-white transition-colors"
                style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 12, color: "#22C55E" }}>View All →</span>
            </div>
            <div className="space-y-2">
              {[
                { title: "To Arthur for U2", date: "Jan 23, 2026", streams: 9 },
                { title: "HEM! ft Richfriend, Dazesowavy", date: "Jan 7, 2026", streams: 0 },
                { title: "Bad Mon ft Notorious Note, Toos", date: "Jan 7, 2026", streams: 0 },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ background: "#1C1C1C" }} onClick={() => navigate("/studio")}>
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

          {/* Notifications panel */}
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
      <Reveal><TDZBadge /><WhiteTitle className="text-center mt-4">MUSIC IS MORE THAN DATA</WhiteTitle></Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1160px] mx-auto mt-12">
        {cards.map((c, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <div className="flex flex-col justify-between p-7 transition-all hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
              style={{ background: "#1C1C1C", borderRadius: 22, minHeight: 210 }}>
              <div>
                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(24px, 2.8vw, 40px)", color: "#FFF", letterSpacing: "0.03em" }}>{c.title}</h3>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 400, fontSize: 12, color: "#777", textTransform: "uppercase" as const, letterSpacing: "0.1em", lineHeight: 1.8, marginTop: 8 }}>{c.body}</p>
              </div>
              <div className="flex justify-center mt-4"><c.Icon className="w-7 h-7" style={{ color: c.color }} /></div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
// WHY TDZ — Benefits Breakdown
// ═══════════════════════════════════════
function SectionWhyTDZ({ navigate }: { navigate: (p: string) => void }) {
  const features = [
    { title: "$1 PER STREAM", desc: "Artists earn 333x more than Spotify's $0.003. Every stream = $1 directly to the creator.", color: "#22C55E", icon: "💰" },
    { title: "100% DOWNLOAD REVENUE", desc: "Set your own download prices. Keep every cent. No middlemen, no hidden fees.", color: "#00CFFF", icon: "📥" },
    { title: "AI MUSIC WELCOME", desc: "First major platform to embrace AI-generated music. AI artists earn the same $1/stream.", color: "#8B5CF6", icon: "🤖" },
    { title: "ARTIST STUDIO", desc: "Upload tracks, manage albums, sync lyrics, set territory rights, collaborate with other artists—all in one dashboard.", color: "#D4A017", icon: "🎵" },
    { title: "AI VIDEO CREATION", desc: "Generate professional music videos with AI (Kling, Runway, Sora, Veo). Reduce production costs by 95%.", color: "#00CFFF", icon: "🎬" },
    { title: "ADVANCED ANALYTICS", desc: "Real-time streaming data, fan demographics, geographic heat maps, and revenue tracking.", color: "#22C55E", icon: "📊" },
    { title: "FAN TIPPING", desc: "Fans can tip artists directly from Discovery. Every dollar goes straight to the creator.", color: "#D4A017", icon: "❤️" },
    { title: "TERRITORY RIGHTS", desc: "Manage your music rights across 200+ territories. Full control over where and how your music is distributed.", color: "#8B5CF6", icon: "🌍" },
  ];

  const comparison = [
    { feature: "Per-stream payout", tdz: "$1.00", spotify: "$0.003", apple: "$0.008" },
    { feature: "Download revenue", tdz: "100%", spotify: "N/A", apple: "~70%" },
    { feature: "AI music support", tdz: "✓ Full", spotify: "✗ Banned", apple: "✗ Limited" },
    { feature: "AI video creation", tdz: "✓ Built-in", spotify: "✗", apple: "✗" },
    { feature: "Fan tipping", tdz: "✓ Inline", spotify: "✗", apple: "✗" },
    { feature: "Artist owns rights", tdz: "✓ 100%", spotify: "Partial", apple: "Partial" },
    { feature: "Real-time earnings", tdz: "✓", spotify: "✗ Delayed", apple: "✗ Delayed" },
  ];

  return (
    <section className="py-20 px-6" style={{ background: "#000" }}>
      <Reveal><TDZBadge /><ChromeTitle className="text-center mt-4">WHY TDZ?</ChromeTitle></Reveal>
      <Reveal delay={0.1}>
        <p className="text-center mx-auto mt-4 mb-12" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 15, color: "#777", maxWidth: 700 }}>
          TDZ isn't just another streaming platform. It's a revolution in how artists get paid, how fans engage, and how music is valued.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1160px] mx-auto">
        {features.map((f, i) => (
          <Reveal key={i} delay={i * 0.06}>
            <div className="p-6 rounded-2xl transition-all hover:-translate-y-1" style={{ background: "#1C1C1C", minHeight: 180 }}>
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3" style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: f.color, letterSpacing: "0.03em" }}>{f.title}</h3>
              <p className="mt-2" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#777", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Comparison Table */}
      <Reveal delay={0.3}>
        <div className="max-w-[900px] mx-auto mt-16">
          <WhiteTitle className="text-center mb-8">TDZ VS THE COMPETITION</WhiteTitle>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #222" }}>
            <div className="grid grid-cols-4 gap-0 text-center py-3" style={{ background: "#1A1A1A" }}>
              <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#666", letterSpacing: "0.15em" }}>FEATURE</div>
              <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 22, color: "#22C55E" }}>TDZ</div>
              <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#666" }}>SPOTIFY</div>
              <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#666" }}>APPLE</div>
            </div>
            {comparison.map((row, i) => (
              <div key={i} className="grid grid-cols-4 gap-0 text-center py-3" style={{ background: i % 2 === 0 ? "#111" : "#141414", borderTop: "1px solid #1A1A1A" }}>
                <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#888" }}>{row.feature}</div>
                <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#22C55E", fontWeight: 700 }}>{row.tdz}</div>
                <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#555" }}>{row.spotify}</div>
                <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#555" }}>{row.apple}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ═══════════════════════════════════════
// HOW PAYMENTS WORK
// ═══════════════════════════════════════
function SectionHowPaymentsWork() {
  const steps = [
    { step: "1", title: "UPLOAD YOUR MUSIC", desc: "Upload tracks to your Artist Studio. Set download prices, add metadata, and choose territories.", color: "#00CFFF" },
    { step: "2", title: "FANS STREAM & BUY", desc: "Every stream earns you $1. Every download purchase goes 100% to you. Fans can also tip directly.", color: "#22C55E" },
    { step: "3", title: "REAL-TIME EARNINGS", desc: "Watch your earnings grow in real-time on your dashboard. No 90-day delays like traditional DSPs.", color: "#D4A017" },
    { step: "4", title: "GET PAID", desc: "Cash out via Square once you reach the $50 minimum payout threshold. Direct deposit to your bank.", color: "#8B5CF6" },
  ];

  return (
    <section className="py-20 px-6" style={{ background: "#000" }}>
      <Reveal><TDZBadge /><ChromeTitle className="text-center mt-4">HOW PAYMENTS WORK</ChromeTitle></Reveal>
      <div className="flex flex-col md:flex-row items-start justify-center gap-6 max-w-[1000px] mx-auto mt-12">
        {steps.map((s, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <div className="flex-1 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ border: `2px solid ${s.color}`, background: `${s.color}10` }}>
                <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: s.color }}>{s.step}</span>
              </div>
              <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 24, color: "#FFF", letterSpacing: "0.03em" }}>{s.title}</h3>
              <p className="mt-2" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#777", lineHeight: 1.7 }}>{s.desc}</p>
              {i < steps.length - 1 && <div className="hidden md:block mx-auto mt-4 w-px h-0" />}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
// AI MUSIC AGENTS
// ═══════════════════════════════════════
function SectionAIAgents() {
  const agents = [
    { name: "QUANTUM ADVISOR", desc: "AI-powered career advisor that analyzes your data in real-time. Get actionable insights for revenue optimization, release timing, and audience growth.", icon: "🧠", color: "#8B5CF6" },
    { name: "MOOD MIX GENERATOR", desc: "Tell the AI how you're feeling and it generates a personalized playlist from TDZ's catalog. Unique to our platform.", icon: "🎵", color: "#00CFFF" },
    { name: "SMART PROMO", desc: "AI identifies optimal promotion windows, suggests collaboration opportunities, and automates social media scheduling.", icon: "📣", color: "#22C55E" },
    { name: "STORYTELLING STUDIO", desc: "Generate AI music videos using Kling, Runway, Sora, and Veo. Create professional visual content in minutes, not months.", icon: "🎬", color: "#D4A017" },
    { name: "LABEL STAFF AI", desc: "Virtual A&R, marketing manager, and distribution coordinator. Get label-quality support without the label contract.", icon: "👔", color: "#00CFFF" },
    { name: "TERRITORY OPTIMIZER", desc: "AI analyzes global streaming patterns to recommend optimal release territories and timing for maximum impact.", icon: "🌐", color: "#8B5CF6" },
  ];

  return (
    <section className="py-20 px-6" style={{ background: "#000" }}>
      <Reveal><TDZBadge /><WhiteTitle className="text-center mt-4">AI MUSIC AGENTS</WhiteTitle></Reveal>
      <Reveal delay={0.1}>
        <p className="text-center mx-auto mt-4 mb-12" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 15, color: "#777", maxWidth: 700 }}>
          Six AI-powered agents work for you 24/7. No other platform offers this level of intelligent artist support.
        </p>
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1100px] mx-auto">
        {agents.map((a, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <div className="p-6 rounded-2xl transition-all hover:-translate-y-1" style={{ background: "#1C1C1C", minHeight: 200 }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{a.icon}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: `${a.color}20`, color: a.color }}>AI AGENT</span>
              </div>
              <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: a.color, letterSpacing: "0.03em" }}>{a.name}</h3>
              <p className="mt-2" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#777", lineHeight: 1.7 }}>{a.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}


// SECTION 7 — ARTIST SUBSCRIPTION PLANS (with features)
// ═══════════════════════════════════════
function Section7ArtistPlans({ navigate }: { navigate: (p: string) => void }) {
  const plans = [
    { name: "STARTER", price: "$9.99", plan: "starter" as const, features: [
      "Upload up to 50 tracks", "5 albums maximum", "Advanced analytics", "HD audio quality", "1 AI video per month", "Priority support", "$1 per stream payout"
    ]},
    { name: "PRO", price: "$19.99", plan: "pro" as const, popular: true, features: [
      "Unlimited tracks & albums", "Full analytics suite", "Dolby Atmos support", "5 AI videos per month", "Collaboration tools", "Custom branding", "Territory rights management", "$1 per stream payout"
    ]},
    { name: "ENTERPRISE", price: "$49.99", plan: "enterprise" as const, features: [
      "Everything in Pro", "Unlimited AI videos", "Multi-artist management", "API access", "Dedicated account manager", "Custom integrations", "White-label options", "$1 per stream payout"
    ]},
  ];

  const handleSubscribe = async (plan: "starter" | "pro" | "enterprise") => {
    if (isCheckoutPlan(plan)) { openSquareCheckout(plan); }
    else { navigate("/auth"); }
  };

  return (
    <section className="py-20 px-6" style={{ background: "#000" }}>
      <Reveal><WhiteTitle className="text-center">ARTIST SUBSCRIPTION PLANS</WhiteTitle></Reveal>
      <div className="flex flex-col md:flex-row items-start justify-center gap-7 mt-12 max-w-[1080px] mx-auto">
        {plans.map((p, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <div className="flex flex-col items-center">
              {p.popular && <span className="mb-2 px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: "#22C55E", color: "#000" }}>MOST POPULAR</span>}
              <div className="flex flex-col justify-start items-center pt-8 w-full relative"
                style={{ background: "linear-gradient(180deg, #2a2a2a 0%, #5a5a5a 40%, #b0b0b0 75%, #d8d8d8 100%)", borderRadius: 28, width: 310, minHeight: 460, padding: "30px 26px" }}>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 16, color: "#FFFFFF", letterSpacing: "0.2em", textTransform: "uppercase" as const }}>{p.name}</p>
                <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 68, color: "#FFFFFF", letterSpacing: "0.04em", marginTop: 8 }}>{p.price}</p>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#999", marginTop: 4 }}>/month</p>
                <div className="mt-6 space-y-2 w-full">
                  {p.features.map((f, fi) => (
                    <div key={fi} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#333" }} />
                      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#555", lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <SubscribeButton onClick={() => handleSubscribe(p.plan)} />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
// SECTION 8 — LATEST RELEASES (Real data + Audio Preview)
// ═══════════════════════════════════════
function Section8Releases({ tracks, audioPreview, navigate }: { tracks: Track[]; audioPreview: ReturnType<typeof useAudioPreview>; navigate: (p: string) => void }) {
  const placeholders = [
    "linear-gradient(135deg, #c0392b, #2c3e50)", "linear-gradient(135deg, #3498db, #2ecc71)",
    "linear-gradient(135deg, #1abc9c, #2c3e50)", "linear-gradient(135deg, #f39c12, #e74c3c)",
    "linear-gradient(135deg, #9b59b6, #3498db)", "linear-gradient(135deg, #2ecc71, #27ae60)",
  ];
  const slides = tracks.length > 0 ? tracks : Array.from({ length: 6 }, (_, i) => ({ id: String(i), placeholder: true, gradient: placeholders[i] } as any));
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <section className="py-20 px-4" style={{ background: "#000" }}>
      <Reveal><TDZBadge /><WhiteTitle className="text-center mt-4">LATEST RELEASES FROM TDZ ARTISTS</WhiteTitle></Reveal>
      <Reveal delay={0.1}>
        <div className="mt-12 max-w-[900px] mx-auto">
          <Swiper
            modules={[EffectCoverflow, Autoplay, Navigation]}
            effect="coverflow"
            grabCursor
            centeredSlides
            slidesPerView="auto"
            loop={slides.length > 3}
            autoplay={{ delay: 4000, disableOnInteraction: true }}
            coverflowEffect={{ rotate: 30, stretch: 0, depth: 200, modifier: 1.2, slideShadows: true }}
            navigation
            onSlideChange={(s) => setActiveSlide(s.realIndex)}
          >
            {slides.map((s: any, i: number) => (
              <SwiperSlide key={s.id} style={{ width: 220, height: 220 }}>
                {s.placeholder ? (
                  <div className="w-full h-full rounded-lg" style={{ background: s.gradient }} />
                ) : (
                  <div className="relative w-full h-full group cursor-pointer" onClick={() => navigate(`/track/${s.id}`)}>
                    <MotionCover
                      staticCoverPath={s.album_cover_path} staticCoverBucket={s.album_cover_bucket}
                      motionCoverPath={s.motion_cover_path} motionCoverBucket={s.motion_cover_bucket}
                      alt={s.title} className="w-full h-full object-cover rounded-lg"
                    />
                    {/* Play/preview overlay */}
                    <button
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                      onClick={(e) => { e.stopPropagation(); audioPreview.play(s.id, s.file_path); }}
                    >
                      {audioPreview.playingId === s.id ?
                        <Pause className="w-10 h-10" style={{ color: "#FFF" }} /> :
                        <Play className="w-10 h-10" style={{ color: "#FFF" }} />
                      }
                    </button>
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Reveal>

      {/* Track info for active slide */}
      {tracks.length > 0 && tracks[activeSlide] && (
        <Reveal delay={0.15}>
          <div className="text-center mt-4">
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 14, color: "#FFF" }}>{tracks[activeSlide]?.title}</p>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666" }}>{tracks[activeSlide]?.artist_name}</p>
            {audioPreview.playingId === tracks[activeSlide]?.id && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Volume2 className="w-3 h-3 animate-pulse" style={{ color: "#22C55E" }} />
                <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#22C55E" }}>Playing 10s preview...</span>
              </div>
            )}
          </div>
        </Reveal>
      )}

      {/* Playback controls */}
      <Reveal delay={0.2}>
        <div className="flex items-center justify-center gap-5 mt-6">
          {[
            { Icon: SkipBack, color: "#00CFFF", action: () => {} },
            { Icon: audioPreview.playingId ? Pause : Play, color: "#D4A017", action: () => {
              if (tracks.length > 0) { const t = tracks[activeSlide]; audioPreview.play(t.id, t.file_path); }
            }},
            { Icon: SkipForward, color: "#00CFFF", action: () => {} },
            { Icon: Shuffle, color: "#D4A017", action: () => {} },
          ].map((b, i) => (
            <button key={i} onClick={b.action}
              className="rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ width: 52, height: 52, border: `1px solid ${b.color}66`, background: "rgba(0,0,0,0.6)" }}>
              <b.Icon className="w-5 h-5" style={{ color: b.color }} />
            </button>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ═══════════════════════════════════════
// SECTION 9 — TDZ DISCOVERY (Interactive with Video)
// ═══════════════════════════════════════
function Section9Discovery({ navigate }: { navigate: (p: string) => void }) {
  const [showVideo, setShowVideo] = useState(false);
  return (
    <section className="py-20 px-4 relative overflow-hidden" style={{ background: "#030308" }}>
      {/* Cosmic nebula background */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.6 }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 80% at 20% 10%, rgba(10,0,40,0.9) 0%, transparent 60%), radial-gradient(ellipse 100% 60% at 80% 20%, rgba(0,20,50,0.7) 0%, transparent 55%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 40% at 30% 30%, rgba(139,92,246,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 70% 60%, rgba(0,207,255,0.1) 0%, transparent 65%)" }} />
      </div>

      <div className="relative z-10">
        <Reveal>
          <ChromeTitle className="text-center">TDZ DISCOVERY</ChromeTitle>
          <p className="text-center mt-2" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#888", letterSpacing: "0.15em" }}>IMMERSIVE MUSIC EXPLORATION</p>
          <div className="flex justify-center gap-3 mt-4 mb-8">
            <button onClick={() => setShowVideo(!showVideo)} className="px-4 py-2 rounded-full text-xs transition-all"
              style={{ background: showVideo ? "#00CFFF" : "transparent", color: showVideo ? "#000" : "#00CFFF", border: "1px solid #00CFFF", fontFamily: "'Raleway', sans-serif", fontWeight: 600 }}>
              {showVideo ? "Hide Demo" : "▶ Watch Demo"}
            </button>
            <button onClick={() => navigate("/discover")} className="px-4 py-2 rounded-full text-xs"
              style={{ border: "1px solid #333", color: "#888", fontFamily: "'Raleway', sans-serif", fontWeight: 600 }}>
              Open Discovery →
            </button>
          </div>
        </Reveal>

        {showVideo && (
          <Reveal>
            <div className="mx-auto mb-8 rounded-2xl overflow-hidden" style={{ maxWidth: 900, border: "1px solid #222" }}>
              <video src="/videos/discovery-demo.mp4" controls autoPlay muted className="w-full" style={{ background: "#000" }} />
            </div>
          </Reveal>
        )}

        <Reveal delay={0.1}>
          <div className="mx-auto mt-4 overflow-hidden" style={{ maxWidth: 1100, borderRadius: 18, border: "1px solid rgba(139,92,246,0.2)", background: "rgba(5,5,15,0.85)", backdropFilter: "blur(20px)", minHeight: 480 }}>
            <div className="flex">
              {/* Cosmic sidebar */}
              <div className="hidden sm:flex flex-col items-center gap-6 py-5 flex-shrink-0" style={{ width: 50, background: "rgba(5,5,15,0.9)", borderRight: "1px solid rgba(139,92,246,0.15)" }}>
                {[
                  { Icon: Compass, active: true },
                  { Icon: BarChart3, active: false },
                  { Icon: Globe, active: false },
                  { Icon: User, active: false },
                  { Icon: Heart, active: false },
                ].map((n, i) => (
                  <button key={i} onClick={() => navigate("/discover")} className="transition-colors hover:opacity-80">
                    <n.Icon className="w-4 h-4" style={{ color: n.active ? "#00CFFF" : "#333" }} />
                  </button>
                ))}
                <div className="mt-auto"><Settings className="w-4 h-4" style={{ color: "#333" }} /></div>
              </div>

              {/* Main cosmic content */}
              <div className="flex-1 p-6 sm:p-8 lg:p-10">
                {/* Top nav tabs */}
                <div className="flex items-center gap-6 mb-6 pb-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
                  {["HOME", "EXPLORE", "LIBRARY", "RADIO"].map((tab, i) => (
                    <span key={tab} className="text-xs font-semibold tracking-widest cursor-pointer"
                      style={{ fontFamily: "'Raleway', sans-serif", color: i === 0 ? "#fff" : "#555", borderBottom: i === 0 ? "2px solid #00CFFF" : "none", paddingBottom: 4, letterSpacing: "0.15em" }}>
                      {tab}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-5 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22C55E" }} />
                    <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 12, color: "#22C55E", letterSpacing: "0.15em" }}>LIVE</span>
                  </div>
                  <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666" }}>🎧 $1/Stream</span>
                </div>

                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 56, color: "#FFF", letterSpacing: "0.04em", lineHeight: 1, textShadow: "0 0 30px rgba(139,92,246,0.3)" }}>DISCOVER</h3>
                <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 56, letterSpacing: "0.04em", lineHeight: 1, background: "linear-gradient(135deg, #00CFFF, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>NEW TDZ RELEASES</h3>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 15, color: "#777", marginTop: 12 }}>Stream unlimited music. Every play directly supports creators.</p>

                <div className="flex flex-wrap gap-3 mt-6">
                  <button onClick={() => navigate("/discover")} className="px-6 py-2.5 rounded-full flex items-center gap-2 hover:scale-105 transition-transform"
                    style={{ background: "linear-gradient(135deg, #fff, #e0e0e0)", color: "#000", fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 13, boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                    <Play className="w-4 h-4" /> Play All
                  </button>
                  <button onClick={() => navigate("/discover")} className="px-6 py-2.5 rounded-full hover:border-white/30 transition-colors"
                    style={{ border: "1px solid rgba(139,92,246,0.3)", color: "#888", fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 13, background: "rgba(139,92,246,0.05)" }}>
                    ⇄ Shuffle
                  </button>
                </div>

                {/* Orbital category bubbles */}
                <div className="flex items-center gap-8 mt-8">
                  {["Moodscapes", "Genre Odysseys", "Artist Portals"].map((cat, i) => (
                    <div key={cat} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => navigate("/discover")}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                        style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(0,207,255,0.2)", backdropFilter: "blur(8px)" }}>
                        <span className="text-lg">{["🌌", "🎸", "👤"][i]}</span>
                      </div>
                      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: "#666", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
// SECTION 10 — FAN SUBSCRIPTION PLAN (with features)
// ═══════════════════════════════════════
function Section10FanPlan({ navigate }: { navigate: (p: string) => void }) {
  const fanFeatures = [
    "Unlimited streaming", "HD & Dolby Atmos audio", "Offline downloads", "Ad-free experience",
    "Exclusive content access", "Support your favorite artists", "AI-powered playlists",
  ];
  return (
    <section className="py-20 px-6" style={{ background: "#000" }}>
      <Reveal><TDZBadge /><WhiteTitle className="text-center mt-4">FAN SUBSCRIPTION PLAN</WhiteTitle></Reveal>
      <Reveal delay={0.1}>
        <div className="flex flex-col items-center mt-10">
          <div className="flex flex-col items-center pt-10"
            style={{ background: "linear-gradient(180deg, #2a2a2a 0%, #5a5a5a 40%, #b0b0b0 75%, #d8d8d8 100%)",
              borderRadius: 28, width: 380, maxWidth: "100%", minHeight: 520, padding: "36px 32px" }}>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 16, color: "#FFFFFF", letterSpacing: "0.2em", textTransform: "uppercase" as const, textAlign: "center" }}>
              UNLIMITED STREAMING
            </p>
            <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 78, color: "#FFFFFF", letterSpacing: "0.04em", marginTop: 12 }}>$12.00</p>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#888", marginTop: 4 }}>/month</p>
            <div className="mt-8 space-y-2 w-full">
              {fanFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#333" }} />
                  <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#555", lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <SubscribeButton onClick={() => { if (isCheckoutPlan("fan")) openSquareCheckout("fan"); else navigate("/auth"); }} />
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
          { label: "SIGNUP", path: "/auth" }, { label: "STUDIO", path: "/studio" },
          { label: "DISCOVERY", path: "/discover" }, { label: "STORE", path: "/pricing" },
          { label: "INVESTORS", path: "/investors" }, { label: "ABOUT", path: "/faq" },
          { label: "CONTACT", path: "/support" },
        ].map((l) => (
          <span key={l.label} onClick={() => navigate(l.path)}
            className="cursor-pointer transition-colors hover:text-[#888]"
            style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 13, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
            {l.label}
          </span>
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-6">
        <span onClick={() => navigate("/terms")} className="cursor-pointer hover:text-[#666] transition-colors"
          style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#333" }}>Terms</span>
        <span onClick={() => navigate("/privacy")} className="cursor-pointer hover:text-[#666] transition-colors"
          style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#333" }}>Privacy</span>
      </div>
      <div className="mx-auto mt-8 mb-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", maxWidth: 600 }} />
      <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 12, color: "#333" }}>
        © 2026 TDZ Distribution. All rights reserved.
      </p>
    </footer>
  );
}
