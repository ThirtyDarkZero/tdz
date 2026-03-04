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
    <div className="relative w-full min-h-[60vh] overflow-hidden">
      {/* Cosmic gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ 
          background: `
            radial-gradient(ellipse 80% 60% at 20% 20%, rgba(139,92,246,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 30%, rgba(0,207,255,0.12) 0%, transparent 55%),
            radial-gradient(ellipse 70% 40% at 50% 80%, rgba(59,130,246,0.1) 0%, transparent 50%)
          `
        }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(3,3,8,1) 0%, transparent 40%, rgba(3,3,8,0.3) 100%)" }} />
        
        {/* Animated cosmic orbs */}
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full blur-[150px] animate-pulse" 
          style={{ background: "rgba(139,92,246,0.08)", animationDuration: "8s" }} />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] animate-pulse" 
          style={{ background: "rgba(0,207,255,0.06)", animationDuration: "12s", animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[180px]" 
          style={{ background: "rgba(59,130,246,0.05)", animation: "cosmicHeroPulse 15s ease-in-out infinite" }} />
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
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#888" }}>{tracks.length}+ Tracks</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4" style={{ color: "#00CFFF" }} />
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#888" }}>$1/Stream</span>
            </div>
          </div>

          {/* Headline with cosmic glow */}
          <h1 style={{ fontFamily: "'Six Caps', sans-serif", lineHeight: 0.9, letterSpacing: "0.04em" }}>
            <span className="block" style={{ 
              fontSize: "clamp(60px, 10vw, 140px)", 
              color: "#fff",
              textShadow: "0 0 40px rgba(139,92,246,0.3)"
            }}>DISCOVER</span>
            <span className="block" style={{ 
              fontSize: "clamp(60px, 10vw, 140px)", 
              background: "linear-gradient(135deg, #00CFFF 0%, #8B5CF6 50%, #00CFFF 100%)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "cosmicTextShift 6s ease-in-out infinite",
              filter: "drop-shadow(0 0 30px rgba(0,207,255,0.4))"
            }}>NEW TDZ RELEASES</span>
          </h1>

          <p className="mt-6 max-w-xl" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 16, color: "#999", lineHeight: 1.7, fontWeight: 300 }}>
            Stream unlimited music from independent artists worldwide. 
            Every play directly supports creators.
          </p>

          {/* Buttons */}
          {hasContent && (
            <div className="flex flex-wrap items-center gap-4 mt-10">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold hover:scale-105 transition-all"
                style={{ 
                  background: "linear-gradient(135deg, #fff 0%, #e0e0e0 100%)", 
                  color: "#000", 
                  fontFamily: "'Raleway', sans-serif", 
                  fontSize: 13, 
                  letterSpacing: "0.1em", 
                  textTransform: "uppercase",
                  boxShadow: "0 0 30px rgba(255,255,255,0.15)"
                }}
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Play All
              </button>
              <button
                onClick={handleShuffle}
                className="flex items-center gap-2 px-8 py-3 rounded-full hover:scale-105 transition-all"
                style={{ 
                  border: "1px solid rgba(139,92,246,0.3)", 
                  color: "#aaa", 
                  background: "rgba(139,92,246,0.05)", 
                  fontFamily: "'Raleway', sans-serif", 
                  fontSize: 13, 
                  letterSpacing: "0.1em", 
                  textTransform: "uppercase", 
                  backdropFilter: "blur(8px)" 
                }}
              >
                <Shuffle className="w-5 h-5" />
                Shuffle
              </button>
              <button
                onClick={() => navigate('/studio')}
                className="flex items-center gap-2 px-6 py-3 rounded-full hover:text-white transition-all"
                style={{ color: "#888", fontFamily: "'Raleway', sans-serif", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                <Sparkles className="w-5 h-5" />
                Upload Music
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom cosmic line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ 
        background: "linear-gradient(to right, transparent, rgba(139,92,246,0.3), rgba(0,207,255,0.3), rgba(139,92,246,0.3), transparent)" 
      }} />

      <style>{`
        @keyframes cosmicTextShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes cosmicHeroPulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}
