import { useState, useMemo, useEffect, useRef } from "react";
import {
  Play, Pause, SkipForward, SkipBack,
  ListMusic, Mic2, Repeat, Shuffle, ChevronDown, MoreHorizontal, X,
  Heart, SlidersHorizontal, Music,
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SongRow } from "./SongRow";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const CORAL = "#FF6347";

const EQ_BANDS = [
  { label: "60" }, { label: "150" }, { label: "400" },
  { label: "1K" }, { label: "2.4K" }, { label: "6K" }, { label: "15K" },
];

type FullView = "artwork" | "lyrics" | "visualizer" | "eq";

export function OrbPlayerBar() {
  const {
    currentTrack, queue, playTrack, isPlaying, pauseTrack, resumeTrack,
    nextTrack, previousTrack, currentTime, playerView, setPlayerView,
  } = usePlayer();
  const [showQueue, setShowQueue] = useState(false);
  const [isPill, setIsPill] = useState(false);
  const [fullView, setFullView] = useState<FullView>("artwork");
  const [eqValues, setEqValues] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [isLiked, setIsLiked] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();

  const toggle = () => (isPlaying ? pauseTrack() : resumeTrack());
  const dur = currentTrack?.duration || 0;
  const pct = dur > 0 ? Math.min((currentTime / dur) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 62;

  // Visualizer
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
      ctx.fillStyle = "rgba(3,3,15,0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const bars = 48;
      const gap = canvas.width / bars;
      const barW = gap * 0.65;
      for (let i = 0; i < bars; i++) {
        const h = (Math.sin(Date.now() * 0.003 + i * 0.4) * 0.3 + 0.5 + Math.random() * 0.2) * canvas.height * 0.8;
        const g = ctx.createLinearGradient(0, canvas.height - h, 0, canvas.height);
        g.addColorStop(0, "#00CFFF");
        g.addColorStop(1, "#8B5CF6");
        ctx.fillStyle = g;
        ctx.fillRect(i * gap + (gap - barW) / 2, canvas.height - h, barW, h);
      }
    };
    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [fullView, isPlaying]);

  // Lyrics from track
  const lyricsLines = useMemo(() => {
    if (!currentTrack?.lyrics) return [{ time: 0, text: "No lyrics available" }];
    return currentTrack.lyrics.split("\n").filter(Boolean).map((line, i) => ({ time: i * 4, text: line }));
  }, [currentTrack?.lyrics]);

  if (!currentTrack) return null;

  const cover = currentTrack.album_cover_path || currentTrack.thumbnail || null;
  const isFullScreen = playerView === "full";

  /* ─── PILL ─── */
  if (!isFullScreen && isPill) {
    return (
      <div
        className="fixed z-[95] cursor-pointer"
        style={{
          bottom: "calc(var(--nav-height, 64px) + env(safe-area-inset-bottom, 0px) + 16px)",
          right: 20, width: 56, height: 56, borderRadius: "50%", overflow: "hidden",
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${CORAL}40`,
        }}
        onClick={() => setIsPill(false)}
      >
        {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "#1a1a2e" }}><Music className="h-5 w-5" style={{ color: "var(--text-4)" }} /></div>
        )}
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          {isPlaying
            ? <Pause className="h-4 w-4 text-white" fill="white" onClick={e => { e.stopPropagation(); pauseTrack(); }} />
            : <Play className="h-4 w-4 text-white ml-0.5" fill="white" onClick={e => { e.stopPropagation(); resumeTrack(); }} />
          }
        </div>
      </div>
    );
  }

  /* ─── MINI BAR ─── */
  if (!isFullScreen) {
    return (
      <div className="fixed z-[95]" style={{ bottom: "calc(var(--nav-height, 64px) + env(safe-area-inset-bottom, 0px) + 8px)", left: 8, right: 8 }}>
        <div
          className="mx-auto max-w-[540px] flex items-center gap-3 relative overflow-hidden cursor-pointer"
          style={{
            background: "rgba(8,8,26,0.94)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "var(--radius-lg)", backdropFilter: "blur(32px)",
            boxShadow: `0 -4px 40px rgba(0,0,0,0.4), 0 0 20px ${CORAL}15`, padding: "10px 14px",
          }}
          onClick={() => setPlayerView("full")}
        >
          {/* Art */}
          <div className="h-11 w-11 flex-shrink-0 rounded-lg overflow-hidden" style={{ boxShadow: `0 4px 16px ${CORAL}25` }}>
            {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : (
              <div className="h-full w-full flex items-center justify-center" style={{ background: "#1a1a2e" }}><Music className="h-4 w-4" style={{ color: "var(--text-4)" }} /></div>
            )}
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{currentTrack.title}</p>
            <p className="truncate font-body" style={{ fontSize: 11, color: "var(--text-3)" }}>{currentTrack.artist_name}</p>
          </div>
          {/* Controls */}
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <button onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: CORAL, color: "#000" }}>
              {isPlaying ? <Pause className="h-3.5 w-3.5" fill="currentColor" /> : <Play className="h-3.5 w-3.5 ml-0.5" fill="currentColor" />}
            </button>
            <button onClick={nextTrack} className="p-1" style={{ color: "var(--text-2)" }}><SkipForward className="h-4 w-4" /></button>
            <button onClick={() => setIsPill(true)} className="p-1" style={{ color: "var(--text-3)" }}><X className="h-3.5 w-3.5" /></button>
          </div>
          {/* Progress line */}
          <div className="absolute bottom-0 left-0 h-[2px]" style={{
            width: `${pct}%`, background: `linear-gradient(90deg, ${CORAL}, #8B5CF6)`, transition: "width 0.5s linear",
          }} />
        </div>
      </div>
    );
  }

  /* ─── FULL SCREEN ─── */
  return (
    <>
      <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "#03030F" }}>
        {/* Blurred art BG */}
        {cover && (
          <div className="absolute" style={{
            inset: -60, backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center",
            filter: "blur(80px) saturate(1.5) brightness(0.2)", transform: "scale(1.15)",
          }} />
        )}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(3,3,15,0.5) 0%, rgba(3,3,15,0.85) 60%, rgba(3,3,15,0.98) 100%)",
        }} />

        {/* ── Top bar ── */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-3 pb-2" style={{ paddingTop: "max(env(safe-area-inset-top, 12px), 12px)" }}>
          <button onClick={() => { setPlayerView("mini"); setIsPill(false); }} className="p-2 -ml-2" style={{ color: "var(--text-2)" }}>
            <ChevronDown className="h-6 w-6" />
          </button>
          <p className="font-body" style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {fullView === "lyrics" ? "Lyrics" : fullView === "visualizer" ? "Visualizer" : fullView === "eq" ? "Equalizer" : "Now Playing"}
          </p>
          <button className="p-2 -mr-2" style={{ color: "var(--text-2)" }}><MoreHorizontal className="h-5 w-5" /></button>
        </div>

        {/* ── Main content area ── */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-8 min-h-0 overflow-hidden">
          {/* Artwork view */}
          {fullView === "artwork" && (
            <div className="relative w-full" style={{ maxWidth: 340, aspectRatio: "1" }}>
              {/* Glow */}
              <div className="absolute -inset-6 rounded-3xl" style={{ background: `${CORAL}25`, filter: "blur(50px)" }} />
              <div className="relative w-full h-full overflow-hidden" style={{
                borderRadius: 20,
                boxShadow: `0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)`,
                transform: isPlaying ? "scale(1)" : "scale(0.96)",
                transition: "transform 0.4s ease",
              }}>
                {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a1a4e, #0d3b6e)" }}>
                    <Music className="w-16 h-16" style={{ color: "rgba(255,255,255,0.1)" }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lyrics view */}
          {fullView === "lyrics" && (
            <div className="w-full h-full overflow-y-auto px-2 py-8 space-y-5 scrollbar-hide">
              {lyricsLines.map((line, i) => {
                const isActive = i < lyricsLines.length - 1
                  ? currentTime >= line.time && currentTime < lyricsLines[i + 1].time
                  : currentTime >= line.time;
                return (
                  <p key={i} className="font-body transition-all duration-500" style={{
                    fontSize: isActive ? 30 : 22, fontWeight: isActive ? 800 : 400,
                    color: isActive ? "var(--text-1)" : "rgba(255,255,255,0.25)",
                    lineHeight: 1.25,
                  }}>{line.text}</p>
                );
              })}
            </div>
          )}

          {/* Visualizer */}
          {fullView === "visualizer" && (
            <div className="w-full flex items-center justify-center">
              <canvas ref={canvasRef} width={500} height={320} className="w-full rounded-2xl" style={{ maxWidth: 500, maxHeight: 320 }} />
            </div>
          )}

          {/* EQ */}
          {fullView === "eq" && (
            <div className="w-full max-w-md space-y-5">
              <h3 className="font-display text-center" style={{ fontSize: 28, color: "var(--text-1)" }}>EQUALIZER</h3>
              <div className="flex items-end justify-between gap-1.5" style={{ height: 200 }}>
                {EQ_BANDS.map((band, i) => (
                  <div key={band.label} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="flex justify-center" style={{ height: 150 }}>
                      <input type="range" min={-12} max={12} step={1} value={eqValues[i]}
                        onChange={e => { const v = [...eqValues]; v[i] = +e.target.value; setEqValues(v); }}
                        style={{ writingMode: "vertical-lr" as any, direction: "rtl", width: 28, height: 150, accentColor: CORAL }}
                      />
                    </div>
                    <span className="font-body" style={{ fontSize: 8, color: "var(--text-3)" }}>{band.label}</span>
                    <span className="font-body" style={{ fontSize: 9, fontWeight: 700, color: eqValues[i] > 0 ? "#22C55E" : eqValues[i] < 0 ? CORAL : "var(--text-4)" }}>
                      {eqValues[i] > 0 ? "+" : ""}{eqValues[i]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { n: "FLAT", v: [0,0,0,0,0,0,0] },
                  { n: "BASS", v: [8,6,3,0,-1,-1,0] },
                  { n: "VOCAL", v: [-2,-1,0,4,6,4,0] },
                  { n: "ROCK", v: [4,2,0,-1,2,4,6] },
                  { n: "EDM", v: [6,4,0,-2,0,4,8] },
                ].map(p => (
                  <button key={p.n} onClick={() => setEqValues(p.v)} className="px-3 py-1.5 font-body" style={{
                    fontSize: 10, fontWeight: 600, borderRadius: "var(--radius-pill)",
                    background: "var(--glass-1)", border: "1px solid var(--glass-border)", color: "var(--text-3)",
                  }}>{p.n}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Track info ── */}
        <div className="relative z-10 px-7 pt-4 pb-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-3">
              <h2 className="font-display truncate" style={{ fontSize: 32, color: "var(--text-1)", lineHeight: 1 }}>{currentTrack.title}</h2>
              <p className="font-body truncate mt-1" style={{ fontSize: 14, color: "var(--text-2)" }}>{currentTrack.artist_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsLiked(!isLiked)} className="p-1.5">
                <Heart className="h-5 w-5" style={{ color: isLiked ? CORAL : "var(--text-3)", fill: isLiked ? CORAL : "none" }} />
              </button>
              <button className="p-1.5" style={{ color: "var(--text-3)" }}><MoreHorizontal className="h-5 w-5" /></button>
            </div>
          </div>
        </div>

        {/* ── Coral ring transport ── */}
        <div className="relative z-10 flex flex-col items-center py-3">
          <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
            {/* Background ring */}
            <svg className="absolute inset-0" width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="62" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle cx="80" cy="80" r="62" fill="none" stroke={CORAL} strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
                style={{ transition: "stroke-dashoffset 0.5s linear" }}
              />
            </svg>
            {/* Controls inside ring */}
            <div className="relative flex items-center gap-5">
              <button onClick={previousTrack} style={{ color: CORAL }}><SkipBack className="h-5 w-5" fill="currentColor" /></button>
              <button onClick={toggle} className="flex items-center justify-center" style={{
                width: 64, height: 64, borderRadius: "50%", background: CORAL, color: "#000",
                boxShadow: `0 6px 28px ${CORAL}50`,
              }}>
                {isPlaying ? <Pause className="h-6 w-6" fill="currentColor" /> : <Play className="h-6 w-6 ml-0.5" fill="currentColor" />}
              </button>
              <button onClick={nextTrack} style={{ color: CORAL }}><SkipForward className="h-5 w-5" fill="currentColor" /></button>
            </div>
          </div>
          {/* Time */}
          <span className="font-body mt-1" style={{ fontSize: 13, color: CORAL, fontWeight: 600 }}>{fmt(currentTime)}</span>
        </div>

        {/* ── Bottom toolbar ── */}
        <div className="relative z-10 flex items-center justify-around px-6 pb-4 pt-1" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)" }}>
          {([
            { id: "artwork" as const, icon: Repeat, label: "Cover" },
            { id: "lyrics" as const, icon: Mic2, label: "Lyrics" },
            { id: "visualizer" as const, icon: SlidersHorizontal, label: "Visual" },
            { id: "eq" as const, icon: SlidersHorizontal, label: "EQ", rotate: true },
            { id: "queue" as const, icon: ListMusic, label: "Queue" },
          ] as const).map(item => {
            const isActive = item.id !== "queue" && fullView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "queue") { setShowQueue(true); return; }
                  setFullView(item.id);
                }}
                className="flex flex-col items-center gap-0.5"
              >
                <Icon className={`h-5 w-5 ${item.id === "eq" ? "rotate-90" : ""}`} style={{ color: isActive ? CORAL : "var(--text-3)" }} />
                <span className="font-body" style={{ fontSize: 9, fontWeight: 600, color: isActive ? CORAL : "var(--text-4)" }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Queue Sheet */}
      <Sheet open={showQueue} onOpenChange={setShowQueue}>
        <SheetContent
          side="bottom"
          className="max-h-[75vh] p-0"
          style={{ background: "rgba(8,8,26,0.97)", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="p-5">
            <div className="flex justify-center mb-3"><div className="h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} /></div>
            <div className="flex items-center justify-between pb-3 mb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-display" style={{ fontSize: 24, color: "var(--text-1)" }}>PLAYBACK QUEUE</h2>
              <button onClick={() => setShowQueue(false)} className="p-1" style={{ color: "var(--text-3)" }}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-0.5 max-h-[55vh] overflow-y-auto scrollbar-hide">
              {queue.length > 0 ? queue.map((track, i) => (
                <SongRow key={track.id} track={track} index={i + 1} isPlaying={track.id === currentTrack?.id} onPlay={t => { playTrack(t, queue); setShowQueue(false); }} />
              )) : (
                <div className="py-12 text-center">
                  <ListMusic className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-4)" }} />
                  <p className="font-body" style={{ fontSize: 13, color: "var(--text-3)" }}>Queue is empty — play a track to start</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
