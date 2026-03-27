import { useState } from "react";
import {
  Play, Pause, SkipForward, SkipBack, Heart,
  ListMusic, Mic2, Repeat, Shuffle, ChevronDown, MoreHorizontal, Share2,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { usePlayer } from "@/contexts/PlayerContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LyricsPanel } from "@/components/LyricsPanel";
import { cn } from "@/lib/utils";

/* ── Circular Progress Ring (Loopster signature) ── */
function CircularProgress({ progress, size = 300, strokeWidth = 3 }: { progress: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90 pointer-events-none">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function OrbPlayerBar() {
  const {
    currentTrack, queue, playTrack, isPlaying, pauseTrack, resumeTrack,
    nextTrack, previousTrack, currentTime, playerView, setPlayerView,
  } = usePlayer();
  const location = useLocation();
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const toggle = () => (isPlaying ? pauseTrack() : resumeTrack());
  const dur = currentTrack?.duration || 0;
  const pct = dur > 0 ? Math.min((currentTime / dur) * 100, 100) : 0;

  if (!currentTrack || location.pathname === "/discover") return null;

  const cover = currentTrack.album_cover_path || currentTrack.thumbnail || null;

  /* ─── MINI BAR (above bottom nav) ─── */
  if (playerView !== "full") {
    return (
      <div className="fixed bottom-[76px] left-0 right-0 z-[55] px-3">
        <div
          className="mx-auto max-w-[540px] flex items-center gap-3 rounded-2xl px-3 py-2.5 relative overflow-hidden"
          style={{
            background: "rgba(24,24,24,0.96)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
          onClick={() => setPlayerView("full")}
        >
          {/* Art */}
          <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : (
              <div className="h-full w-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.3), hsl(var(--secondary)/0.3))" }}>
                <span className="text-lg" style={{ color: "rgba(255,255,255,0.3)" }}>♪</span>
              </div>
            )}
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold" style={{ color: "#fff" }}>{currentTrack.title}</p>
            <p className="truncate text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{currentTrack.artist_name}</p>
          </div>
          {/* Controls */}
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button onClick={previousTrack} className="p-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              <SkipBack className="h-4 w-4" />
            </button>
            <button onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "hsl(var(--primary))" }}>
              {isPlaying ? <Pause className="h-4 w-4 text-white" fill="white" /> : <Play className="h-4 w-4 text-white ml-0.5" fill="white" />}
            </button>
            <button onClick={nextTrack} className="p-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
          {/* Progress line */}
          <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: "hsl(var(--primary))" }} />
          </div>
        </div>
      </div>
    );
  }

  /* ─── FULL SCREEN PLAYER (Loopster-faithful) ─── */
  return (
    <>
      <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: "#0D0D0D" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,48px)] pb-2">
          <button onClick={() => setPlayerView("mini")} className="p-2" style={{ color: "rgba(255,255,255,0.6)" }}>
            <ChevronDown className="h-6 w-6" />
          </button>
          <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Now Playing
          </p>
          <button className="p-2" style={{ color: "rgba(255,255,255,0.6)" }}>
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Album art with circular progress ring */}
        <div className="flex-1 flex items-center justify-center px-10">
          <div className="relative" style={{ width: 300, height: 300 }}>
            <CircularProgress progress={pct} size={300} strokeWidth={3} />
            <div
              className="absolute overflow-hidden rounded-full"
              style={{ top: 15, left: 15, width: 270, height: 270, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
            >
              {cover ? (
                <img src={cover} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)" }}>
                  <span className="text-5xl" style={{ color: "rgba(255,255,255,0.15)" }}>♪</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Track info + like */}
        <div className="px-8 pb-5 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.2 }} className="truncate">{currentTrack.title}</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginTop: 2 }} className="truncate">{currentTrack.artist_name}</p>
          </div>
          <button onClick={() => setIsLiked(!isLiked)} className="p-2 mt-0.5 flex-shrink-0">
            <Heart className={cn("h-6 w-6", isLiked ? "fill-primary text-primary" : "")} style={{ color: isLiked ? undefined : "rgba(255,255,255,0.4)" }} />
          </button>
        </div>

        {/* Progress bar (linear, like Loopster) */}
        <div className="px-8 pb-1">
          <div className="h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: "hsl(var(--primary))" }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{fmt(currentTime)}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{dur > 0 ? fmt(dur) : "--:--"}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-7 px-8 py-4">
          <button className="p-2" style={{ color: "rgba(255,255,255,0.4)" }}><Shuffle className="h-5 w-5" /></button>
          <button onClick={previousTrack} className="p-2" style={{ color: "#fff" }}><SkipBack className="h-6 w-6" fill="currentColor" /></button>
          <button
            onClick={toggle}
            className="flex h-[64px] w-[64px] items-center justify-center rounded-full transition-transform hover:scale-105"
            style={{ background: "hsl(var(--primary))", boxShadow: "0 8px 30px hsl(var(--primary) / 0.4)" }}
          >
            {isPlaying ? <Pause className="h-7 w-7 text-white" fill="white" /> : <Play className="h-7 w-7 text-white ml-1" fill="white" />}
          </button>
          <button onClick={nextTrack} className="p-2" style={{ color: "#fff" }}><SkipForward className="h-6 w-6" fill="currentColor" /></button>
          <button className="p-2" style={{ color: "rgba(255,255,255,0.4)" }}><Repeat className="h-5 w-5" /></button>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-center gap-10 px-8 pb-10 pt-2">
          <button onClick={() => setShowLyrics(true)} className="flex flex-col items-center gap-1">
            <Mic2 className="h-5 w-5" style={{ color: "rgba(255,255,255,0.4)" }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Lyrics</span>
          </button>
          <button onClick={() => setShowQueue(true)} className="flex flex-col items-center gap-1">
            <ListMusic className="h-5 w-5" style={{ color: "rgba(255,255,255,0.4)" }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Queue</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Share2 className="h-5 w-5" style={{ color: "rgba(255,255,255,0.4)" }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Share</span>
          </button>
        </div>
      </div>

      {/* Queue sheet */}
      <Sheet open={showQueue} onOpenChange={setShowQueue}>
        <SheetContent
          side="bottom"
          className="max-h-[80vh] rounded-t-3xl border-t p-0"
          style={{ background: "rgba(18,18,18,0.98)", backdropFilter: "blur(24px)", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="p-5">
            <div className="flex justify-center mb-3"><div className="h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} /></div>
            <h2 className="mb-4" style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Queue</h2>
            <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
              {queue.map((track) => (
                <button
                  key={track.id}
                  onClick={() => { playTrack(track, queue); setShowQueue(false); }}
                  className={cn("flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors", track.id === currentTrack?.id && "bg-primary/10")}
                  style={{ background: track.id === currentTrack?.id ? undefined : "transparent" }}
                >
                  <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
                    {track.thumbnail ? <img src={track.thumbnail} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: "rgba(255,255,255,0.05)" }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "#fff" }}>{track.title}</p>
                    <p className="truncate text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{track.artist_name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <LyricsPanel open={showLyrics} onClose={() => setShowLyrics(false)} trackId={currentTrack?.id || null} currentTime={currentTime} audioPath={currentTrack?.file_path || ""} />
    </>
  );
}
