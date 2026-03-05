import { SkipBack, SkipForward, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";

export function CosmicPlayerBar() {
  const { currentTrack, isPlaying, pauseTrack, resumeTrack, nextTrack, previousTrack } = usePlayer();
  const togglePlayPause = () => isPlaying ? pauseTrack() : resumeTrack();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50" style={{
      background: "rgba(3,3,8,0.85)",
      backdropFilter: "blur(24px) saturate(150%)",
      borderTop: "1px solid rgba(139,92,246,0.15)",
    }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mini album art */}
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(0,207,255,0.3))",
          }}>
            {currentTrack.album_cover_path && (
              <img src={currentTrack.album_cover_path} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
            <p className="text-xs truncate" style={{ color: "#888" }}>{currentTrack.artist_name}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button onClick={previousTrack} className="text-white/60 hover:text-white transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, rgba(0,207,255,0.9), rgba(139,92,246,0.9))",
              boxShadow: "0 0 20px rgba(0,207,255,0.3)",
            }}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-white" fill="white" /> : <Play className="w-4 h-4 text-white ml-0.5" fill="white" />}
          </button>
          <button onClick={nextTrack} className="text-white/60 hover:text-white transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Progress placeholder */}
        <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
          <div className="w-32 h-1 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.15)" }}>
            <div className="h-full rounded-full" style={{
              width: "35%",
              background: "linear-gradient(to right, #00CFFF, #8B5CF6)",
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
