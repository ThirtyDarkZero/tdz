import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Shuffle, Sparkles, TrendingUp, Headphones } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";

interface PremiumHeroProps {
  tracks: any[];
  featuredTrack?: any;
}

// Premium BPM Supreme-style hero with bold typography
export function PremiumHero({ tracks, featuredTrack }: PremiumHeroProps) {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();

  const heroTrack = featuredTrack || tracks[0];
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
    <div className="relative w-full min-h-[60vh] overflow-hidden bg-[#030303]">
      {/* Abstract gradient background */}
      <div className="absolute inset-0">
        {/* Primary gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-[#030303] to-purple-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/50" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2.5s' }} />
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center min-h-[60vh] px-6 md:px-12 lg:px-20 py-16">
        <div className="max-w-5xl">
          {/* Stats bar */}
          <div className="flex items-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-white/50 text-sm font-medium uppercase tracking-wider">Live</span>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span>{tracks.length}+ Tracks</span>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Headphones className="w-4 h-4 text-cyan-400" />
              <span>$1/Stream</span>
            </div>
          </div>

          {/* Main headline - BPM Supreme style massive type */}
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white leading-[0.85] tracking-tight mb-6">
            <span className="block">discover</span>
            <span className="block bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 bg-clip-text text-transparent">
              new TDZ releases
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/60 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-light">
            Stream unlimited music from independent artists worldwide. 
            Every play directly supports creators.
          </p>

          {/* Action buttons */}
          {hasContent && (
            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={handlePlayAll}
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-bold px-8 py-6 text-base rounded-full transition-all duration-300 hover:scale-105 shadow-2xl shadow-white/20"
              >
                <Play className="w-5 h-5 mr-2" fill="currentColor" />
                Play All
              </Button>
              
              <Button
                onClick={handleShuffle}
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 px-8 py-6 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Shuffle
              </Button>
              
              <Button
                onClick={() => navigate('/studio')}
                size="lg"
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/5 px-6 py-6 rounded-full transition-all duration-300"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Upload Music
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Decorative bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
