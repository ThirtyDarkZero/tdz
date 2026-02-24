import { useNavigate } from "react-router-dom";
import { Play, Shuffle, Sparkles, TrendingUp, Headphones } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";

interface PremiumHeroProps {
  tracks: any[];
  featuredTrack?: any;
}

export function PremiumHero({ tracks, featuredTrack }: PremiumHeroProps) {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();

  const hasContent = tracks.length > 0;

  const normalizeTrack = (t: any) => ({
    ...t,
    duration: t?.duration || 0,
    file_path: t?.file_path || "",
    play_count: t?.play_count || 0,
  });

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      const normalized = tracks.map(normalizeTrack);
      playTrack(normalized[0], normalized);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const normalized = tracks.map(normalizeTrack);
      const shuffled = [...normalized].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="relative w-full min-h-[60vh] overflow-hidden" style={{ background: "#030303" }}>
      {/* Gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,30,40,0.4) 0%, #030303 50%, rgba(20,0,40,0.3) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #030303 0%, transparent 50%, rgba(0,0,0,0.5) 100%)" }} />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse" style={{ background: "rgba(0,207,255,0.08)" }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse" style={{ background: "rgba(139,92,246,0.06)", animationDelay: "1.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center min-h-[60vh] px-6 md:px-12 lg:px-20 py-16">
        <div className="max-w-5xl">
          {/* Stats bar */}
          <div className="flex items-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22C55E" }} />
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#22C55E", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase" }}>Live</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: "#22C55E" }} />
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666" }}>{tracks.length}+ Tracks</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4" style={{ color: "#00CFFF" }} />
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#666" }}>$1/Stream</span>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Six Caps', sans-serif", lineHeight: 0.9, letterSpacing: "0.04em" }}>
            <span className="block" style={{ fontSize: "clamp(60px, 10vw, 140px)", color: "#fff" }}>DISCOVER</span>
            <span className="block" style={{ fontSize: "clamp(60px, 10vw, 140px)", color: "#00CFFF" }}>NEW TDZ RELEASES</span>
          </h1>

          <p className="mt-6 max-w-xl" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 16, color: "#777", lineHeight: 1.7, fontWeight: 300 }}>
            Stream unlimited music from independent artists worldwide. 
            Every play directly supports creators.
          </p>

          {/* Buttons */}
          {hasContent && (
            <div className="flex flex-wrap items-center gap-4 mt-10">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-2xl"
                style={{ background: "#fff", color: "#000", fontFamily: "'Raleway', sans-serif", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Play All
              </button>
              <button
                onClick={handleShuffle}
                className="flex items-center gap-2 px-8 py-3 rounded-full hover:scale-105 transition-all"
                style={{ border: "1px solid #333", color: "#888", background: "rgba(255,255,255,0.03)", fontFamily: "'Raleway', sans-serif", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", backdropFilter: "blur(8px)" }}
              >
                <Shuffle className="w-5 h-5" />
                Shuffle
              </button>
              <button
                onClick={() => navigate('/studio')}
                className="flex items-center gap-2 px-6 py-3 rounded-full hover:text-white transition-all"
                style={{ color: "#666", fontFamily: "'Raleway', sans-serif", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                <Sparkles className="w-5 h-5" />
                Upload Music
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)" }} />
    </div>
  );
}
