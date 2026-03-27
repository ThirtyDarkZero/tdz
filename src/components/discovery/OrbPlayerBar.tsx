import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLocation } from "react-router-dom";

/**
 * Global orb-style player bar. Shows a mini now-playing strip + play orb
 * whenever a track is loaded. No navigation tabs — those live in BottomNavBar
 * inside the Discover page only.
 */
export function OrbPlayerBar() {
  const { currentTrack, isPlaying, pauseTrack, resumeTrack, nextTrack, previousTrack, currentTime } = usePlayer();

  const location = useLocation();

  // On /discover, BottomNavBar handles the player UI
  if (!currentTrack || location.pathname === '/discover') return null;

  const togglePlay = () => (isPlaying ? pauseTrack() : resumeTrack());

  // Calculate progress percentage
  const duration = currentTrack.duration || 0;
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60]">
      <div
        className="relative mx-auto"
        style={{
          maxWidth: 520,
          padding: "0 16px 12px",
        }}
      >
        {/* Now playing mini strip */}
        <div
          className="flex items-center gap-3 px-4 py-2 mb-2 rounded-2xl relative overflow-hidden"
          style={{
            background: "rgba(20,15,35,0.85)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Track art */}
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
            {currentTrack.album_cover_path ? (
              <img src={currentTrack.album_cover_path} alt="" className="w-full h-full object-cover" />
            ) : currentTrack.thumbnail ? (
              <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(0,207,255,0.4))" }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate" style={{ fontFamily: "'Raleway', sans-serif" }}>{currentTrack.title}</p>
            <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Raleway', sans-serif" }}>{currentTrack.artist_name}</p>
          </div>
          {/* Mini controls */}
          <div className="flex items-center gap-1">
            <button onClick={previousTrack} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <SkipBack className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
            <button onClick={nextTrack} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <SkipForward className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
          </div>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #00CFFF, #8B5CF6)" }} />
          </div>
        </div>

        {/* Centered play orb */}
        <div className="flex justify-center">
          <div className="relative">
            <button
              onClick={togglePlay}
              className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #6366F1, #00CFFF)",
                boxShadow: "0 4px 30px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <div
                className="absolute inset-1 rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(139,92,246,0.8), rgba(99,102,241,0.6))",
                  boxShadow: "inset 0 2px 8px rgba(255,255,255,0.15)",
                }}
              />
              <div className="relative z-10">
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" fill="white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                )}
              </div>
            </button>
            {/* Outer glow ring */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: -4,
                border: "1px solid rgba(139,92,246,0.3)",
                boxShadow: "0 0 20px rgba(139,92,246,0.15)",
              }}
            />
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center mt-2">
          <div className="w-32 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
      </div>
    </div>
  );
}
