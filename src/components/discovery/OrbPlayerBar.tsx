import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ListMusic,
  Mic2,
  Minimize2,
  Maximize2,
  X,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { usePlayer } from "@/contexts/PlayerContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LyricsPanel } from "@/components/LyricsPanel";
import { cn } from "@/lib/utils";

/* ── Visualizer bars driven by simulated frequency data ── */
function OrbVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const barsRef = useRef<number[]>(Array.from({ length: 32 }, () => Math.random() * 0.3));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const bars = barsRef.current;
    const barW = width / bars.length;

    for (let i = 0; i < bars.length; i++) {
      // Animate toward random targets when playing, decay when paused
      if (isPlaying) {
        const target = 0.15 + Math.random() * 0.85;
        bars[i] += (target - bars[i]) * 0.18;
      } else {
        bars[i] *= 0.92;
      }

      const h = bars[i] * height;
      const x = i * barW;

      // Cyan-to-purple gradient per bar
      const hue = 180 + (i / bars.length) * 90; // 180 (cyan) → 270 (purple)
      ctx.fillStyle = `hsla(${hue}, 100%, 65%, ${0.5 + bars[i] * 0.5})`;
      ctx.beginPath();
      ctx.roundRect(x + 1, height - h, barW - 2, h, 2);
      ctx.fill();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [isPlaying]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={40}
      className="w-full h-full rounded-lg opacity-80"
    />
  );
}

export function OrbPlayerBar() {
  const {
    currentTrack,
    queue,
    playTrack,
    isPlaying,
    pauseTrack,
    resumeTrack,
    nextTrack,
    previousTrack,
    currentTime,
    playerView,
    setPlayerView,
  } = usePlayer();
  const location = useLocation();

  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const autoMinTimerRef = useRef<number | null>(null);

  const togglePlay = () => (isPlaying ? pauseTrack() : resumeTrack());
  const duration = currentTrack?.duration || 0;
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  // Auto-minimize when paused (after 3s) unless hovered
  useEffect(() => {
    if (!currentTrack || !isPlaying || playerView !== "full" || isHovered) {
      return;
    }
    // Only auto-min when NOT playing
    return () => {};
  }, [currentTrack, isPlaying, playerView, isHovered]);

  useEffect(() => {
    if (!currentTrack) return;
    if (!isPlaying && playerView === "full" && !isHovered) {
      autoMinTimerRef.current = window.setTimeout(() => {
        setPlayerView("mini");
      }, 3000);
    }
    return () => {
      if (autoMinTimerRef.current) clearTimeout(autoMinTimerRef.current);
    };
  }, [currentTrack, isPlaying, playerView, isHovered, setPlayerView]);

  // Re-expand on play
  useEffect(() => {
    if (currentTrack && isPlaying && playerView === "mini") {
      setPlayerView("full");
    }
  }, [currentTrack, isPlaying, playerView, setPlayerView]);

  if (!currentTrack || location.pathname === "/discover") return null;

  /* ── Hidden state ── */
  if (playerView === "hidden") {
    return (
      <button
        onClick={() => setPlayerView("mini")}
        className="fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl text-primary-foreground shadow-[0_0_30px_rgba(0,207,255,0.15)] transition-all hover:scale-110 hover:shadow-[0_0_40px_rgba(0,207,255,0.3)]"
        aria-label="Open player"
      >
        <Maximize2 className="mx-auto h-5 w-5" />
      </button>
    );
  }

  /* ── Mini pill state ── */
  if (playerView === "mini") {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(0,207,255,0.08)] transition-all duration-500",
          "bg-black/50 backdrop-blur-2xl",
          isHovered ? "scale-105 border-white/20 shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(0,207,255,0.15)]" : ""
        )}
      >
        {/* Mini visualizer */}
        <div className="h-5 w-16 overflow-hidden rounded">
          <OrbVisualizer isPlaying={isPlaying} />
        </div>
        <button onClick={togglePlay} className="rounded-full p-2 text-foreground hover:bg-white/10 transition-colors" aria-label="Play pause">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="max-w-[120px] truncate text-xs font-medium text-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>
          {currentTrack.title}
        </div>
        <button onClick={() => setPlayerView("full")} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors" aria-label="Expand">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setPlayerView("hidden")} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors" aria-label="Hide">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  /* ── Full state with glassmorphic visualizer ── */
  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-[60]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mx-auto max-w-[520px] px-4 pb-3">
          {/* Glassmorphic card */}
          <div
            className="relative mb-2 overflow-hidden rounded-2xl border border-white/10 px-4 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_60px_rgba(0,207,255,0.06)]"
            style={{
              background: "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(10,10,30,0.65) 100%)",
              backdropFilter: "blur(24px) saturate(1.4)",
              WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            }}
          >
            {/* Visualizer background */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-40 pointer-events-none">
              <OrbVisualizer isPlaying={isPlaying} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-white/5 border border-white/10">
                {currentTrack.album_cover_path ? (
                  <img src={currentTrack.album_cover_path} alt="" className="h-full w-full object-cover" />
                ) : currentTrack.thumbnail ? (
                  <img src={currentTrack.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>
                  {currentTrack.title}
                </p>
                <p className="truncate text-[10px] text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>
                  {currentTrack.artist_name}
                </p>
              </div>

              <div className="flex items-center gap-0.5">
                <button onClick={previousTrack} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors" aria-label="Previous">
                  <SkipBack className="h-3.5 w-3.5" />
                </button>
                <button onClick={nextTrack} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors" aria-label="Next">
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setShowQueue(true)} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors" aria-label="Queue">
                  <ListMusic className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setShowLyrics(true)} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors" aria-label="Lyrics">
                  <Mic2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setPlayerView("mini")} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors" aria-label="Minimize">
                  <Minimize2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setPlayerView("hidden")} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors" aria-label="Hide">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 mt-1.5 h-[2px] rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Central orb play button */}
          <div className="flex justify-center">
            <div className="relative">
              <button
                onClick={togglePlay}
                className="relative flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground shadow-[0_0_30px_rgba(0,207,255,0.25)] transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(0,207,255,0.4)]"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
                }}
                aria-label="Play pause"
              >
                {isPlaying ? <Pause className="h-6 w-6" fill="currentColor" /> : <Play className="h-6 w-6 ml-0.5" fill="currentColor" />}
              </button>
              {/* Glow ring */}
              <div className="pointer-events-none absolute -inset-1.5 rounded-full border border-primary/30 animate-pulse" />
              <div className="pointer-events-none absolute -inset-3 rounded-full border border-primary/10" />
            </div>
          </div>

          <div className="mt-2 flex justify-center">
            <div className="h-1 w-32 rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      {/* Queue sheet */}
      <Sheet open={showQueue} onOpenChange={setShowQueue}>
        <SheetContent
          side="right"
          className="w-full max-w-md border-white/10 p-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(5,5,20,0.95) 100%)",
            backdropFilter: "blur(24px)",
          }}
        >
          <div className="p-4">
            <h2 className="mb-4 text-xl font-bold text-foreground" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.05em", fontSize: 28 }}>
              QUEUE
            </h2>
            <div className="space-y-1">
              {queue.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => {
                    playTrack(track, queue);
                    setShowQueue(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white/5 transition-colors",
                    track.id === currentTrack.id && "bg-primary/10 border border-primary/20"
                  )}
                >
                  <span className="w-6 text-sm text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>{track.title}</p>
                    <p className="truncate text-sm text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>{track.artist_name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <LyricsPanel
        open={showLyrics}
        onClose={() => setShowLyrics(false)}
        trackId={currentTrack.id || null}
        currentTime={currentTime}
        audioPath={currentTrack.file_path}
      />
    </>
  );
}
