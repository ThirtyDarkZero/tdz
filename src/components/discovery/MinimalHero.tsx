import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Shuffle, Sparkles } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";

interface MinimalHeroProps {
  tracks: any[];
  featuredTrack?: any;
}

// Stunning hero backgrounds
const HERO_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1920&q=80",
  "https://images.unsplash.com/photo-1571266028243-d220c6e3d9ec?w=1920&q=80",
];

export function MinimalHero({ tracks, featuredTrack }: MinimalHeroProps) {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();

  const heroTrack = featuredTrack || tracks[0];
  const hasContent = tracks.length > 0;
  
  // Pick a random background
  const heroBackground = HERO_BACKGROUNDS[Math.floor(Math.random() * HERO_BACKGROUNDS.length)];

  const normalizeTrack = (t: any) => ({
    ...t,
    duration: t?.duration || 0,
    file_path: t?.file_path || "",
    play_count: t?.play_count || 0,
  });

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      const normalized = tracks.map(normalizeTrack);
      if (import.meta.env.DEV) console.debug("[MinimalHero] Play All", { count: normalized.length });
      playTrack(normalized[0], normalized);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const normalized = tracks.map(normalizeTrack);
      const shuffled = [...normalized].sort(() => Math.random() - 0.5);
      if (import.meta.env.DEV) console.debug("[MinimalHero] Shuffle", { count: shuffled.length });
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="relative w-full h-[55vh] min-h-[450px] max-h-[650px] -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
      {/* Background Image with parallax effect */}
      <div className="absolute inset-0">
        {heroTrack?.album_cover_path ? (
          <img
            src={`https://rcjzvfskkoqygnlolrcs.supabase.co/storage/v1/object/public/${heroTrack.album_cover_bucket || 'album-covers'}/${heroTrack.album_cover_path}`}
            alt=""
            className="w-full h-full object-cover scale-105"
          />
        ) : (
          <img
            src={heroBackground}
            alt=""
            className="w-full h-full object-cover scale-105"
          />
        )}
        
        {/* Multiple gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/90 via-transparent to-[#0a0a0a]/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end px-4 sm:px-6 lg:px-8 pb-10">
        <div className="max-w-2xl">
          {/* Label */}
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <p className="text-cyan-400 font-semibold uppercase tracking-widest text-sm">
              TDZ Streaming
            </p>
          </div>
          
          {/* Title with gradient */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-5 leading-[0.9] tracking-tight">
            <span className="text-gradient-aurora">Discover</span>
            <br />
            <span className="text-white">New Music</span>
          </h1>
          
          {/* Description */}
          <p className="text-white/70 text-lg mb-10 max-w-md leading-relaxed">
            Stream unlimited music from independent artists. Support creators directly with every play.
          </p>

          {/* Actions */}
          {hasContent && (
            <div className="flex items-center gap-4">
              <Button
                onClick={handlePlayAll}
                className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-bold px-8 py-6 text-base rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 transition-all duration-300 hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2" fill="currentColor" />
                Play All
              </Button>
              
              <Button
                onClick={handleShuffle}
                variant="outline"
                className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:border-white/50 px-6 py-6 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Shuffle
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-1/2 right-10 w-1 h-32 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent hidden lg:block" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </div>
  );
}
