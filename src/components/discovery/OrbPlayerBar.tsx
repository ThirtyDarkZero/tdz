import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  ListMusic,
  Mic2,
  Repeat,
  Shuffle,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { usePlayer } from "@/contexts/PlayerContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LyricsPanel } from "@/components/LyricsPanel";
import { cn } from "@/lib/utils";

/* ── Circular Progress Ring ── */
function CircularProgress({ progress, size = 240, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-300"
      />
    </svg>
  );
}

/* ── Format time ── */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  const [isLiked, setIsLiked] = useState(false);

  const togglePlay = () => (isPlaying ? pauseTrack() : resumeTrack());
  const duration = currentTrack?.duration || 0;
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  // Don't show on certain routes
  if (!currentTrack || location.pathname === "/discover") return null;

  const coverUrl = currentTrack.album_cover_path || currentTrack.thumbnail || null;

  /* ── Mini bar (above bottom nav) ── */
  if (playerView === "mini" || playerView === "hidden") {
    if (!currentTrack) return null;
    return (
      <div className="fixed bottom-[72px] left-0 right-0 z-[55] px-2">
        <div
          className="mx-auto max-w-[520px] flex items-center gap-3 rounded-xl px-3 py-2"
          style={{
            background: "rgba(30,30,30,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
          onClick={() => setPlayerView("full")}
        >
          {/* Album art */}
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/30 to-secondary/30" />
            )}
          </div>

          {/* Track info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{currentTrack.title}</p>
            <p className="truncate text-xs text-muted-foreground">{currentTrack.artist_name}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={previousTrack} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="Previous">
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
              aria-label="Play pause"
            >
              {isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4 ml-0.5" fill="currentColor" />}
            </button>
            <button onClick={nextTrack} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="Next">
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Mini progress */}
          <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-white/10">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    );
  }

  /* ── Full-screen Loopster-style player ── */
  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex flex-col"
        style={{
          background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
        }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-14 pb-2">
          <button onClick={() => setPlayerView("mini")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className="h-6 w-6" />
          </button>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Popular tracks
          </span>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Album art with circular progress */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="relative" style={{ width: 280, height: 280 }}>
            {/* Progress ring */}
            <CircularProgress progress={progress} size={280} strokeWidth={3} />

            {/* Album art circle */}
            <div
              className="absolute overflow-hidden rounded-full"
              style={{
                top: 20,
                left: 20,
                width: 240,
                height: 240,
              }}
            >
              {coverUrl ? (
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-muted to-card flex items-center justify-center">
                  <span className="text-4xl text-muted-foreground">♪</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Track info */}
        <div className="px-8 pb-4">
          <h2 className="text-xl font-bold text-foreground truncate">{currentTrack.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{currentTrack.artist_name}</p>
        </div>

        {/* Main controls ring */}
        <div className="flex items-center justify-center gap-6 px-8 pb-2">
          <button onClick={() => setIsLiked(!isLiked)} className="p-2 transition-colors" aria-label="Like">
            <Heart className={cn("h-5 w-5", isLiked ? "text-primary fill-primary" : "text-muted-foreground")} />
          </button>
          <button onClick={previousTrack} className="p-2 text-foreground hover:text-primary transition-colors" aria-label="Previous">
            <SkipBack className="h-6 w-6" fill="currentColor" />
          </button>
          <button
            onClick={togglePlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
            aria-label="Play pause"
          >
            {isPlaying ? <Pause className="h-7 w-7" fill="currentColor" /> : <Play className="h-7 w-7 ml-1" fill="currentColor" />}
          </button>
          <button onClick={nextTrack} className="p-2 text-foreground hover:text-primary transition-colors" aria-label="Next">
            <SkipForward className="h-6 w-6" fill="currentColor" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Like">
            <Heart className="h-5 w-5" />
          </button>
        </div>

        {/* Time */}
        <div className="flex items-center justify-between px-8 pb-2 text-[11px] text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-around px-8 pb-10 pt-2">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Repeat">
            <Repeat className="h-5 w-5" />
          </button>
          <button onClick={() => setShowLyrics(true)} className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Lyrics">
            <Mic2 className="h-5 w-5" />
          </button>
          <button onClick={() => setShowQueue(true)} className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Queue">
            <ListMusic className="h-5 w-5" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Shuffle">
            <Shuffle className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Queue sheet */}
      <Sheet open={showQueue} onOpenChange={setShowQueue}>
        <SheetContent
          side="bottom"
          className="max-h-[80vh] rounded-t-3xl border-t border-white/10 p-0"
          style={{
            background: "rgba(18,18,18,0.98)",
            backdropFilter: "blur(24px)",
          }}
        >
          <div className="p-5">
            <div className="flex justify-center mb-3">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            <h2 className="mb-4 text-lg font-bold text-foreground">Playback Queue</h2>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {queue.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => {
                    playTrack(track, queue);
                    setShowQueue(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-white/5 transition-colors",
                    track.id === currentTrack?.id && "bg-primary/10"
                  )}
                >
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {track.thumbnail ? (
                      <img src={track.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-muted to-card" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{track.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{track.artist_name}</p>
                  </div>
                  <button className="p-1 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <LyricsPanel
        open={showLyrics}
        onClose={() => setShowLyrics(false)}
        trackId={currentTrack?.id || null}
        currentTime={currentTime}
        audioPath={currentTrack?.file_path || ""}
      />
    </>
  );
}
