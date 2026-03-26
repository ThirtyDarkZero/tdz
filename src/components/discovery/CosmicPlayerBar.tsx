import { SkipBack, SkipForward, Play, Pause, Volume2, Minimize2, Maximize2, X, GripHorizontal } from "lucide-react";
import { usePlayer, PlayerViewState } from "@/contexts/PlayerContext";
import { useState, useRef, useCallback, useEffect } from "react";

export function CosmicPlayerBar() {
  const { currentTrack, isPlaying, pauseTrack, resumeTrack, nextTrack, previousTrack, playerView, setPlayerView } = usePlayer();
  const [volume, setVolume] = useState(80);
  
  // Draggable mini pill state
  const [pillPos, setPillPos] = useState({ x: 24, y: window.innerHeight - 120 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (playerView !== 'mini') return;
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pillPos.x, y: e.clientY - pillPos.y };
    e.preventDefault();
  }, [playerView, pillPos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPillPos({
        x: Math.max(0, Math.min(window.innerWidth - 220, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y)),
      });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  if (!currentTrack || playerView === 'hidden') return null;

  const togglePlayPause = () => (isPlaying ? pauseTrack() : resumeTrack());

  // ─── Mini Pill ───
  if (playerView === 'mini') {
    return (
      <div
        className="fixed z-50 select-none"
        style={{
          left: pillPos.x,
          top: pillPos.y,
          width: 220,
          height: 52,
          background: "rgba(5,5,16,0.95)",
          backdropFilter: "blur(24px)",
          borderRadius: 26,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          transition: dragging.current ? 'none' : 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          cursor: dragging.current ? 'grabbing' : 'grab',
        }}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-2 h-full px-2">
          {/* Tiny art */}
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
            {currentTrack.album_cover_path ? (
              <img src={currentTrack.album_cover_path} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(0,207,255,0.4))" }} />
            )}
          </div>
          {/* Title */}
          <p className="flex-1 truncate text-[11px] font-medium" style={{ color: "#fff" }}>
            {currentTrack.title}
          </p>
          {/* Play/Pause */}
          <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="p-1">
            {isPlaying ? <Pause className="w-4 h-4 text-white" fill="white" /> : <Play className="w-4 h-4 text-white ml-0.5" fill="white" />}
          </button>
          {/* Expand */}
          <button onClick={(e) => { e.stopPropagation(); setPlayerView('full'); }} className="p-1 text-white/50 hover:text-white">
            <Maximize2 className="w-3 h-3" />
          </button>
          {/* Close */}
          <button onClick={(e) => { e.stopPropagation(); setPlayerView('hidden'); }} className="p-1 text-white/50 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Full Bar ───
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        height: 80,
        background: "rgba(5,5,16,0.92)",
        backdropFilter: "blur(32px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        animation: "slideUpPlayer 0.3s cubic-bezier(0.4,0,0.2,1)",
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
                background: "linear-gradient(90deg, var(--mood-accent, #00CFFF), #7C3AED)",
              }}
            />
          </div>
        </div>

        {/* Right: Volume + view controls */}
        <div className="hidden md:flex items-center justify-end gap-3">
          <Volume2 className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
          <div className="w-20 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full" style={{ width: `${volume}%`, background: "rgba(255,255,255,0.6)" }} />
          </div>
          <button
            onClick={() => setPlayerView('mini')}
            className="ml-2 p-1.5 rounded-lg transition-all hover:bg-white/10"
            title="Minimize"
          >
            <Minimize2 className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
          <button
            onClick={() => setPlayerView('hidden')}
            className="p-1.5 rounded-lg transition-all hover:bg-white/10"
            title="Close"
          >
            <X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUpPlayer {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
