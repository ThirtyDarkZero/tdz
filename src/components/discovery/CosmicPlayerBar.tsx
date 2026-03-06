import { SkipBack, SkipForward, Play, Pause, Volume2 } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useState } from "react";

export function CosmicPlayerBar() {
  const { currentTrack, isPlaying, pauseTrack, resumeTrack, nextTrack, previousTrack } = usePlayer();
  const [volume, setVolume] = useState(80);

  if (!currentTrack) return null;

  const togglePlayPause = () => (isPlaying ? pauseTrack() : resumeTrack());

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        height: 80,
        background: "rgba(5,5,16,0.92)",
        backdropFilter: "blur(32px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="max-w-7xl mx-auto h-full grid items-center px-4 sm:px-6"
        style={{ gridTemplateColumns: "1fr 2fr 1fr" }}
      >
        {/* Left: Track info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0"
            style={{ boxShadow: "0 4px 20px rgba(0,207,255,0.2)" }}
          >
            {currentTrack.album_cover_path ? (
              <img src={currentTrack.album_cover_path} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(0,207,255,0.3))" }} />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 13, color: "#FFFFFF" }}>
              {currentTrack.title}
            </p>
            <p className="truncate" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              {currentTrack.artist_name}
            </p>
          </div>
        </div>

        {/* Center: Controls + progress */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-5">
            <button onClick={previousTrack} className="transition-all hover:scale-110" style={{ color: "rgba(255,255,255,0.6)" }}>
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{ background: "#FFFFFF" }}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-black" fill="black" />
              ) : (
                <Play className="w-4 h-4 text-black ml-0.5" fill="black" />
              )}
            </button>
            <button onClick={nextTrack} className="transition-all hover:scale-110" style={{ color: "rgba(255,255,255,0.6)" }}>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="w-full max-w-md h-1 rounded-full cursor-pointer" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: "35%",
                background: "linear-gradient(90deg, #00CFFF, #7C3AED)",
              }}
            />
          </div>
        </div>

        {/* Right: Volume */}
        <div className="hidden md:flex items-center justify-end gap-3">
          <Volume2 className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
          <div className="w-24 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full" style={{ width: `${volume}%`, background: "rgba(255,255,255,0.6)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
