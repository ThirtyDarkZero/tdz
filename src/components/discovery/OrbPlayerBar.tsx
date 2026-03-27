import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Play, Pause, SkipForward, SkipBack,
  ListMusic, Mic2, Repeat, Shuffle, ChevronDown, MoreHorizontal, X, ChevronRight,
  Heart, SlidersHorizontal,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { usePlayer } from "@/contexts/PlayerContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LyricsPanel } from "@/components/LyricsPanel";
import { SongRow } from "./SongRow";
import { supabase } from "@/integrations/supabase/client";

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

// EQ bands
const EQ_BANDS = [
  { label: "60", freq: 60 },
  { label: "150", freq: 150 },
  { label: "400", freq: 400 },
  { label: "1K", freq: 1000 },
  { label: "2.4K", freq: 2400 },
  { label: "6K", freq: 6000 },
  { label: "15K", freq: 15000 },
];

type PlayerState = "full" | "mini" | "pill";
type FullView = "artwork" | "lyrics" | "visualizer" | "eq";

export function OrbPlayerBar() {
  const {
    currentTrack, queue, playTrack, isPlaying, pauseTrack, resumeTrack,
    nextTrack, previousTrack, currentTime, playerView, setPlayerView,
  } = usePlayer();
  const location = useLocation();
  const [showQueue, setShowQueue] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>("mini");
  const [fullView, setFullView] = useState<FullView>("artwork");
  const [eqValues, setEqValues] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [isLiked, setIsLiked] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();

  const toggle = () => (isPlaying ? pauseTrack() : resumeTrack());
  const dur = currentTrack?.duration || 0;
  const pct = dur > 0 ? Math.min((currentTime / dur) * 100, 100) : 0;

  // Simple visualizer animation
  useEffect(() => {
    if (fullView !== "visualizer" || !canvasRef.current || !isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      ctx.fillStyle = "rgba(3,3,15,0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const bars = 48;
      const barW = (canvas.width / bars) * 0.7;
      const gap = canvas.width / bars;
      for (let i = 0; i < bars; i++) {
        const h = (Math.sin(Date.now() * 0.003 + i * 0.4) * 0.3 + 0.5 + Math.random() * 0.2) * canvas.height * 0.8;
        const gradient = ctx.createLinearGradient(0, canvas.height - h, 0, canvas.height);
        gradient.addColorStop(0, "#00CFFF");
        gradient.addColorStop(1, "#8B5CF6");
        ctx.fillStyle = gradient;
        ctx.fillRect(i * gap + (gap - barW) / 2, canvas.height - h, barW, h);
      }
    };
    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [fullView, isPlaying]);

  // Lyrics data for inline display
  const [lyricsLines, setLyricsLines] = useState<Array<{ time: number; text: string }>>([]);
  useEffect(() => {
    if (fullView !== "lyrics" || !currentTrack?.id) return;
    const load = async () => {
      const { data } = await supabase.from("track_lyrics").select("synced_lyrics").eq("track_id", currentTrack.id).maybeSingle();
      if (data?.synced_lyrics && Array.isArray(data.synced_lyrics)) {
        setLyricsLines((data.synced_lyrics as any[]).map((l: any) => ({ time: l.time || 0, text: l.text || "" })));
      } else {
        setLyricsLines([{ time: 0, text: "No lyrics available" }]);
      }
    };
    load();
  }, [fullView, currentTrack?.id]);

  if (!currentTrack) return null;

  const cover = currentTrack.album_cover_path || currentTrack.thumbnail || null;
  const isFullScreen = playerView === "full";
  const CORAL = "#FF6347";

  /* ─── STATE 3: FLOATING PILL ─── */
  if (!isFullScreen && playerState === "pill") {
    return (
      <div
        className="fixed z-[95] cursor-pointer"
        style={{
          bottom: "calc(var(--nav-height, 64px) + env(safe-area-inset-bottom, 0px) + 16px)",
          right: 20, width: 56, height: 56, borderRadius: "50%",
          overflow: "hidden",
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 24px ${CORAL}40`,
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
      <div className="fixed z-[95]" style={{ bottom: "calc(var(--nav-height, 64px) + env(safe-area-inset-bottom, 0px) + 8px)", left: 8, right: 8 }}>
        <div
          className="mx-auto max-w-[540px] flex items-center gap-3 relative overflow-hidden cursor-pointer"
          style={{
            background: "rgba(8, 8, 26, 0.94)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "var(--radius-lg)",
            backdropFilter: "blur(32px)",
            boxShadow: `0 -4px 40px rgba(0,0,0,0.4), 0 0 24px ${CORAL}20`,
            padding: "10px 14px",
          }}
          onClick={() => setPlayerView("full")}
        >
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden" style={{ borderRadius: "var(--radius-sm)", boxShadow: `0 4px 16px ${CORAL}30` }}>
            {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : (
              <div className="h-full w-full flex items-center justify-center" style={{ background: "hsl(var(--bg-surface))" }}>
                <span className="text-lg" style={{ color: "var(--text-3)" }}>♪</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-body" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{currentTrack.title}</p>
            <p className="truncate font-body" style={{ fontSize: 12, color: "var(--text-3)" }}>{currentTrack.artist_name}</p>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={toggle} className="flex h-[38px] w-[38px] items-center justify-center rounded-full" style={{ background: CORAL, color: "#000" }}>
              {isPlaying ? <Pause className="h-[14px] w-[14px]" fill="currentColor" /> : <Play className="h-[14px] w-[14px] ml-0.5" fill="currentColor" />}
            </button>
            <button onClick={nextTrack} className="p-1" style={{ color: "var(--text-2)" }}>
              <SkipForward className="h-[18px] w-[18px]" />
            </button>
            <button onClick={() => setPlayerState("pill")} className="p-1" style={{ color: "var(--text-3)" }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 h-[2px]" style={{
            width: `${pct}%`, borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
            background: `linear-gradient(90deg, ${CORAL}, #8B5CF6)`,
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
            inset: -40, backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center",
            filter: "blur(60px) saturate(1.4) brightness(0.25)", transform: "scale(1.1)", transition: "background-image 0.8s ease",
          }} />
        )}
        {!cover && <div className="absolute inset-0" style={{ background: "#03030F" }} />}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(3,3,15,0.4) 0%, transparent 60%), linear-gradient(to bottom, rgba(3,3,15,0.3) 0%, rgba(3,3,15,0.7) 70%, rgba(3,3,15,0.95) 100%)",
        }} />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pb-2">
          <button onClick={() => { setPlayerView("mini"); setPlayerState("mini"); }} className="p-2" style={{ color: "var(--text-2)" }}>
            <ChevronDown className="h-6 w-6" />
          </button>
          <p className="font-body" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {fullView === "lyrics" ? "Lyrics" : fullView === "visualizer" ? "Visualizer" : fullView === "eq" ? "Equalizer" : "Now Playing"}
          </p>
          <button className="p-2" style={{ color: "var(--text-2)" }}>
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Main content area — switches between artwork, lyrics, visualizer, EQ */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 overflow-hidden">
          {fullView === "artwork" && (
            <div className="relative" style={{ width: "min(calc(100vw - 80px), 340px)", height: "min(calc(100vw - 80px), 340px)" }}>
              <div className="absolute inset-0" style={{ borderRadius: 24, background: `${CORAL}40`, filter: "blur(40px)" }} />
              <div
                className="relative z-10 w-full h-full overflow-hidden transition-transform duration-300"
                style={{ borderRadius: 24, boxShadow: `0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)`, transform: isPlaying ? "scale(1.02)" : "scale(0.98)" }}
              >
                {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a1a4e, #0d3b6e)" }}>
                    <span className="text-5xl" style={{ color: "rgba(255,255,255,0.15)" }}>♪</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {fullView === "lyrics" && (
            <div className="w-full h-full overflow-y-auto px-4 py-6 space-y-4">
              {lyricsLines.map((line, i) => {
                const isActive = i < lyricsLines.length - 1
                  ? currentTime >= line.time && currentTime < lyricsLines[i + 1].time
                  : currentTime >= line.time;
                return (
                  <p key={i} className="font-body transition-all duration-300" style={{
                    fontSize: isActive ? 28 : 20, fontWeight: isActive ? 700 : 400,
                    color: isActive ? "var(--text-1)" : "rgba(255,255,255,0.3)",
                    lineHeight: 1.3,
                  }}>
                    {line.text}
                  </p>
                );
              })}
            </div>
          )}

          {fullView === "visualizer" && (
            <canvas ref={canvasRef} width={400} height={300} className="w-full h-full rounded-2xl" style={{ maxHeight: 340 }} />
          )}

          {fullView === "eq" && (
            <div className="w-full max-w-sm space-y-6">
              <h3 className="font-display text-center" style={{ fontSize: 28, color: "var(--text-1)" }}>EQUALIZER</h3>
              <div className="flex items-end justify-between gap-2" style={{ height: 200 }}>
                {EQ_BANDS.map((band, i) => (
                  <div key={band.label} className="flex flex-col items-center gap-2 flex-1">
                    <div className="relative w-full flex justify-center" style={{ height: 160 }}>
                      <input
                        type="range" min={-12} max={12} step={1}
                        value={eqValues[i]}
                        onChange={(e) => { const v = [...eqValues]; v[i] = Number(e.target.value); setEqValues(v); }}
                        className="eq-slider"
                        style={{
                          writingMode: "vertical-lr" as any,
                          direction: "rtl",
                          width: 32, height: 160,
                          accentColor: CORAL,
                        }}
                      />
                    </div>
                    <span className="font-body" style={{ fontSize: 9, color: "var(--text-3)" }}>{band.label}</span>
                    <span className="font-body" style={{ fontSize: 10, fontWeight: 700, color: eqValues[i] > 0 ? "#22C55E" : eqValues[i] < 0 ? CORAL : "var(--text-4)" }}>
                      {eqValues[i] > 0 ? `+${eqValues[i]}` : eqValues[i]}dB
                    </span>
                  </div>
                ))}
              </div>
              {/* Presets */}
              <div className="flex flex-wrap gap-2 justify-center">
                {["FLAT", "BASS BOOST", "VOCAL", "ROCK", "ELECTRONIC"].map(preset => (
                  <button key={preset} className="px-3 py-1.5 font-body transition-all" style={{
                    fontSize: 10, fontWeight: 600, borderRadius: "var(--radius-pill)",
                    background: "var(--glass-1)", border: "1px solid var(--glass-border)", color: "var(--text-3)",
                  }}
                    onClick={() => {
                      const presets: Record<string, number[]> = {
                        "FLAT": [0,0,0,0,0,0,0],
                        "BASS BOOST": [8,6,3,0,-1,-1,0],
                        "VOCAL": [-2,-1,0,4,6,4,0],
                        "ROCK": [4,2,0,-1,2,4,6],
                        "ELECTRONIC": [6,4,0,-2,0,4,8],
                      };
                      setEqValues(presets[preset] || [0,0,0,0,0,0,0]);
                    }}
                  >{preset}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="relative z-10 px-7 pb-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="font-display truncate" style={{ fontSize: 42, color: "var(--text-1)", lineHeight: 1 }}>{currentTrack.title}</h2>
              <p className="font-body truncate" style={{ fontSize: 16, color: "var(--text-2)", marginTop: 4 }}>{currentTrack.artist_name}</p>
            </div>
            <button onClick={() => setIsLiked(!isLiked)} className="flex-shrink-0 ml-3 mt-2 p-2">
              <Heart className="h-6 w-6" style={{ color: isLiked ? CORAL : "var(--text-3)", fill: isLiked ? CORAL : "none" }} />
            </button>
          </div>
        </div>

        {/* Coral circular progress + controls (reference style) */}
        <div className="relative z-10 flex flex-col items-center gap-2 pb-2">
          {/* Coral ring play button */}
          <div className="relative flex items-center justify-center">
            {/* Track ring */}
            <svg width={140} height={140} className="absolute">
              <circle cx={70} cy={70} r={60} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
              <circle cx={70} cy={70} r={60} fill="none" stroke={CORAL} strokeWidth={6}
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - pct / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                style={{ transition: "stroke-dashoffset 0.5s linear" }}
              />
            </svg>
            {/* Play controls row */}
            <div className="flex items-center gap-4">
              <button onClick={previousTrack} style={{ color: CORAL }}>
                <SkipBack className="h-5 w-5" fill="currentColor" />
              </button>
              <button
                onClick={toggle}
                className="flex items-center justify-center"
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: CORAL, color: "#000",
                  boxShadow: `0 8px 32px ${CORAL}60`,
                }}
              >
                {isPlaying ? <Pause className="h-[26px] w-[26px]" fill="currentColor" /> : <Play className="h-[26px] w-[26px] ml-1" fill="currentColor" />}
              </button>
              <button onClick={nextTrack} style={{ color: CORAL }}>
                <SkipForward className="h-5 w-5" fill="currentColor" />
              </button>
            </div>
          </div>

          {/* Time display */}
          <span className="font-body" style={{ fontSize: 13, color: CORAL, fontWeight: 600 }}>
            {fmt(currentTime)}
          </span>
        </div>

        {/* Bottom action bar — view switchers */}
        <div className="relative z-10 flex items-center justify-center gap-8 px-8 pb-4 pt-1">
          <button onClick={() => setFullView("artwork")} className="flex flex-col items-center gap-1">
            <Repeat className="h-5 w-5" style={{ color: fullView === "artwork" ? CORAL : "var(--text-3)" }} />
            <span className="font-body" style={{ fontSize: 9, color: fullView === "artwork" ? CORAL : "var(--text-4)" }}>Cover</span>
          </button>
          <button onClick={() => setFullView("lyrics")} className="flex flex-col items-center gap-1">
            <Mic2 className="h-5 w-5" style={{ color: fullView === "lyrics" ? CORAL : "var(--text-3)" }} />
            <span className="font-body" style={{ fontSize: 9, color: fullView === "lyrics" ? CORAL : "var(--text-4)" }}>Lyrics</span>
          </button>
          <button onClick={() => setFullView("visualizer")} className="flex flex-col items-center gap-1">
            <SlidersHorizontal className="h-5 w-5" style={{ color: fullView === "visualizer" ? CORAL : "var(--text-3)" }} />
            <span className="font-body" style={{ fontSize: 9, color: fullView === "visualizer" ? CORAL : "var(--text-4)" }}>Visual</span>
          </button>
          <button onClick={() => setFullView("eq")} className="flex flex-col items-center gap-1">
            <SlidersHorizontal className="h-5 w-5 rotate-90" style={{ color: fullView === "eq" ? CORAL : "var(--text-3)" }} />
            <span className="font-body" style={{ fontSize: 9, color: fullView === "eq" ? CORAL : "var(--text-4)" }}>EQ</span>
          </button>
          <button onClick={() => setShowQueue(true)} className="flex flex-col items-center gap-1">
            <ListMusic className="h-5 w-5" style={{ color: "var(--text-3)" }} />
            <span className="font-body" style={{ fontSize: 9, color: "var(--text-4)" }}>Queue</span>
          </button>
        </div>

        <style>{`
          @keyframes artPulse { from { opacity: 0.4; } to { opacity: 0.7; } }
        `}</style>
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
              <h2 className="font-display" style={{ fontSize: 24, color: "var(--text-1)" }}>PLAYBACK QUEUE</h2>
              <button onClick={() => setShowQueue(false)} className="p-1" style={{ color: "var(--text-3)" }}>
                <X className="h-5 w-5" />
              </button>
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
              {queue.length === 0 && (
                <div className="py-10 text-center">
                  <ListMusic className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-4)" }} />
                  <p className="font-body" style={{ fontSize: 13, color: "var(--text-3)" }}>Queue is empty</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
