import { useState, useMemo, useCallback } from "react";
import {
  Play, Pause, SkipForward, SkipBack,
  ListMusic, Mic2, Repeat, Shuffle, ChevronDown, MoreHorizontal, X, ChevronRight,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { usePlayer } from "@/contexts/PlayerContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LyricsPanel } from "@/components/LyricsPanel";
import { SongRow } from "./SongRow";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Generate static waveform bar heights
const WAVEFORM_BARS = 60;
const barHeights = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
  const base = 0.3 + Math.sin(i * 0.3) * 0.25 + Math.random() * 0.35;
  return Math.min(1, Math.max(0.15, base));
});

type PlayerState = "full" | "mini" | "pill";

export function OrbPlayerBar() {
  const {
    currentTrack, queue, playTrack, isPlaying, pauseTrack, resumeTrack,
    nextTrack, previousTrack, currentTime, playerView, setPlayerView,
  } = usePlayer();
  const location = useLocation();
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>("mini");

  const toggle = () => (isPlaying ? pauseTrack() : resumeTrack());
  const dur = currentTrack?.duration || 0;
  const pct = dur > 0 ? Math.min((currentTime / dur) * 100, 100) : 0;

  if (!currentTrack || location.pathname === "/discover") return null;

  const cover = currentTrack.album_cover_path || currentTrack.thumbnail || null;

  // Sync with context playerView
  const isFullScreen = playerView === "full";

  /* ─── STATE 3: FLOATING PILL ─── */
  if (!isFullScreen && playerState === "pill") {
    return (
      <div
        className="fixed z-[95] cursor-pointer"
        style={{
          bottom: "calc(var(--nav-height, 64px) + env(safe-area-inset-bottom, 0px) + 16px)",
          right: 20,
          width: 56, height: 56, borderRadius: "50%",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 24px var(--art-glow)",
        }}
        onClick={() => setPlayerState("mini")}
      >
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "hsl(var(--bg-surface))" }}>
            <span className="text-lg" style={{ color: "var(--text-3)" }}>♪</span>
          </div>
        )}
        {/* Play/pause overlay */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
          {isPlaying ? (
            <Pause className="h-[18px] w-[18px] text-white" fill="white" onClick={(e) => { e.stopPropagation(); pauseTrack(); }} />
          ) : (
            <Play className="h-[18px] w-[18px] text-white ml-0.5" fill="white" onClick={(e) => { e.stopPropagation(); resumeTrack(); }} />
          )}
        </div>
      </div>
    );
  }

  /* ─── STATE 2: MINI BAR ─── */
  if (!isFullScreen) {
    return (
      <div
        className="fixed z-[95]"
        style={{
          bottom: "calc(var(--nav-height, 64px) + env(safe-area-inset-bottom, 0px) + 8px)",
          left: 8, right: 8,
        }}
      >
        <div
          className="mx-auto max-w-[540px] flex items-center gap-3 relative overflow-hidden cursor-pointer"
          style={{
            background: "rgba(8, 8, 26, 0.94)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "var(--radius-lg)",
            backdropFilter: "blur(32px)",
            boxShadow: "0 -4px 40px rgba(0,0,0,0.4), 0 0 24px var(--art-glow)",
            padding: "10px 14px",
          }}
          onClick={() => setPlayerView("full")}
        >
          {/* Art */}
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden" style={{ borderRadius: "var(--radius-sm)", boxShadow: "0 4px 16px var(--art-glow)" }}>
            {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : (
              <div className="h-full w-full flex items-center justify-center" style={{ background: "hsl(var(--bg-surface))" }}>
                <span className="text-lg" style={{ color: "var(--text-3)" }}>♪</span>
              </div>
            )}
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-body" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{currentTrack.title}</p>
            <p className="truncate font-body" style={{ fontSize: 12, color: "var(--text-3)" }}>{currentTrack.artist_name}</p>
          </div>
          {/* Controls */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={toggle} className="flex h-[38px] w-[38px] items-center justify-center rounded-full" style={{ background: "var(--text-1)", color: "#000" }}>
              {isPlaying ? <Pause className="h-[14px] w-[14px]" fill="currentColor" /> : <Play className="h-[14px] w-[14px] ml-0.5" fill="currentColor" />}
            </button>
            <button onClick={nextTrack} className="p-1" style={{ color: "var(--text-2)" }}>
              <SkipForward className="h-[18px] w-[18px]" />
            </button>
            <button onClick={() => setPlayerState("pill")} className="p-1" style={{ color: "var(--text-3)" }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Progress line along bottom */}
          <div className="absolute bottom-0 left-0 h-[2px]" style={{
            width: `${pct}%`,
            borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
            background: "linear-gradient(90deg, #00CFFF, #8B5CF6)",
            transition: "width 0.5s linear",
          }} />
        </div>
      </div>
    );
  }

  /* ─── STATE 1: FULL SCREEN NOW PLAYING ─── */
  return (
    <>
      <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
        style={{ padding: "env(safe-area-inset-top, 44px) 0 calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
      >
        {/* Blurred art background */}
        {cover && (
          <div className="absolute" style={{
            inset: -40,
            backgroundImage: `url(${cover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(60px) saturate(1.4) brightness(0.25)",
            transform: "scale(1.1)",
            transition: "background-image 0.8s ease",
          }} />
        )}
        {!cover && <div className="absolute inset-0" style={{ background: "#03030F" }} />}

        {/* Dark vignette */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(3,3,15,0.4) 0%, transparent 60%), linear-gradient(to bottom, rgba(3,3,15,0.3) 0%, rgba(3,3,15,0.7) 70%, rgba(3,3,15,0.95) 100%)",
        }} />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pb-2">
          <button onClick={() => { setPlayerView("mini"); setPlayerState("mini"); }} className="p-2" style={{ color: "var(--text-2)" }}>
            <ChevronDown className="h-6 w-6" />
          </button>
          <p className="font-body" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Now Playing
          </p>
          <button className="p-2" style={{ color: "var(--text-2)" }}>
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Album art with glow */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-10">
          <div className="relative" style={{ width: "min(calc(100vw - 80px), 340px)", height: "min(calc(100vw - 80px), 340px)" }}>
            {/* Art glow shadow */}
            <div className="absolute inset-0" style={{
              borderRadius: 24,
              background: "var(--art-glow)",
              filter: "blur(40px)",
              animation: "artPulse 2s ease-in-out infinite alternate",
            }} />
            {/* Art image */}
            <div
              className="relative z-10 w-full h-full overflow-hidden transition-transform duration-300"
              style={{
                borderRadius: 24,
                boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)",
                transform: isPlaying ? "scale(1.02)" : "scale(0.98)",
              }}
            >
              {cover ? (
                <img src={cover} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a1a4e, #0d3b6e)" }}>
                  <span className="text-5xl" style={{ color: "rgba(255,255,255,0.15)" }}>♪</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Track info + earnings */}
        <div className="relative z-10 px-7 pb-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="font-display truncate" style={{ fontSize: 42, color: "var(--text-1)", lineHeight: 1 }}>{currentTrack.title}</h2>
              <p className="font-body truncate" style={{ fontSize: 16, color: "var(--text-2)", marginTop: 4 }}>{currentTrack.artist_name}</p>
            </div>
            {/* Earnings badge */}
            <div className="flex-shrink-0 ml-3 mt-2 px-3 py-1.5 rounded-full font-body" style={{
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#22C55E" }}>$0.00</span>
            </div>
          </div>
        </div>

        {/* Waveform progress bar */}
        <div className="relative z-10 px-7 pb-2">
          <div className="relative w-full flex items-center gap-[2px]" style={{ height: 48 }}>
            {barHeights.map((h, i) => {
              const barPct = ((i + 1) / WAVEFORM_BARS) * 100;
              const isPast = barPct <= pct;
              return (
                <div
                  key={i}
                  className="flex-1"
                  style={{
                    height: `${h * 100}%`,
                    borderRadius: 999,
                    background: isPast ? "#00CFFF" : "rgba(255,255,255,0.12)",
                    transition: "background 0.1s",
                  }}
                />
              );
            })}
            {/* Playhead dot */}
            <div
              className="absolute"
              style={{
                left: `${pct}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 14, height: 14,
                borderRadius: "50%",
                background: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                transition: "left 0.1s linear",
              }}
            />
          </div>
          <div className="flex justify-between mt-1 font-body">
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>{fmt(currentTime)}</span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>{dur > 0 ? fmt(dur) : "--:--"}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="relative z-10 flex items-center justify-between px-6 py-3">
          <button className="p-2.5" style={{ color: "var(--text-3)" }}><Shuffle className="h-[22px] w-[22px]" /></button>
          <button onClick={previousTrack} className="p-2.5" style={{ color: "var(--text-1)" }}><SkipBack className="h-7 w-7" fill="currentColor" /></button>
          <button
            onClick={toggle}
            className="flex items-center justify-center"
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#FFFFFF", color: "#000000",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 24px var(--art-glow)",
              transition: "transform 0.15s",
            }}
          >
            {isPlaying ? <Pause className="h-[26px] w-[26px]" fill="currentColor" /> : <Play className="h-[26px] w-[26px] ml-1" fill="currentColor" />}
          </button>
          <button onClick={nextTrack} className="p-2.5" style={{ color: "var(--text-1)" }}><SkipForward className="h-7 w-7" fill="currentColor" /></button>
          <button className="p-2.5" style={{ color: "var(--text-3)" }}><Repeat className="h-[22px] w-[22px]" /></button>
        </div>

        {/* Bottom actions */}
        <div className="relative z-10 flex items-center justify-center gap-10 px-8 pb-4 pt-1">
          <button onClick={() => setShowLyrics(true)} className="flex flex-col items-center gap-1">
            <Mic2 className="h-5 w-5" style={{ color: "var(--text-3)" }} />
            <span className="font-body" style={{ fontSize: 9, color: "var(--text-4)" }}>Lyrics</span>
          </button>
          <button onClick={() => setShowQueue(true)} className="flex flex-col items-center gap-1">
            <ListMusic className="h-5 w-5" style={{ color: "var(--text-3)" }} />
            <span className="font-body" style={{ fontSize: 9, color: "var(--text-4)" }}>Queue</span>
          </button>
        </div>
      </div>

      {/* Queue sheet */}
      <Sheet open={showQueue} onOpenChange={setShowQueue}>
        <SheetContent
          side="bottom"
          className="max-h-[75vh] p-0"
          style={{
            background: "rgba(8, 8, 26, 0.97)",
            borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div className="p-5">
            <div className="flex justify-center mb-3"><div className="h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} /></div>
            <div className="flex items-center justify-between pb-4 mb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-display" style={{ fontSize: 24, color: "var(--text-1)" }}>UP NEXT</h2>
            </div>
            <div className="space-y-0.5 max-h-[55vh] overflow-y-auto">
              {queue.map((track, i) => (
                <SongRow
                  key={track.id}
                  track={track}
                  index={i + 1}
                  isPlaying={track.id === currentTrack?.id}
                  onPlay={(t) => { playTrack(t, queue); setShowQueue(false); }}
                />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <LyricsPanel open={showLyrics} onClose={() => setShowLyrics(false)} trackId={currentTrack?.id || null} currentTime={currentTime} audioPath={currentTrack?.file_path || ""} />
    </>
  );
}
