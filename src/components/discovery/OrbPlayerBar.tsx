import { useState } from "react";
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

  if (!currentTrack || location.pathname === "/discover") return null;

  const togglePlay = () => (isPlaying ? pauseTrack() : resumeTrack());
  const duration = currentTrack.duration || 0;
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  if (playerView === "hidden") {
    return (
      <button
        onClick={() => setPlayerView("mini")}
        className="fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full bg-gradient-to-br from-primary via-primary/80 to-accent text-primary-foreground shadow-2xl transition-transform hover:scale-105"
        aria-label="Open player"
      >
        <Maximize2 className="mx-auto h-5 w-5" />
      </button>
    );
  }

  if (playerView === "mini") {
    return (
      <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full border border-border/60 bg-card/95 px-2 py-2 backdrop-blur-xl shadow-2xl">
        <button onClick={togglePlay} className="rounded-full p-2 text-foreground hover:bg-muted" aria-label="Play pause">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="max-w-[120px] truncate text-xs font-medium text-foreground">{currentTrack.title}</div>
        <button onClick={() => setPlayerView("full")} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Expand player">
          <Maximize2 className="h-4 w-4" />
        </button>
        <button onClick={() => setPlayerView("hidden")} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Hide player">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[60]">
        <div className="relative mx-auto max-w-[520px] px-4 pb-3">
          <div className="relative mb-2 flex items-center gap-3 overflow-hidden rounded-2xl border border-border/50 bg-card/90 px-4 py-2 backdrop-blur-xl shadow-xl">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              {currentTrack.album_cover_path ? (
                <img src={currentTrack.album_cover_path} alt="" className="h-full w-full object-cover" />
              ) : currentTrack.thumbnail ? (
                <img src={currentTrack.thumbnail} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{currentTrack.title}</p>
              <p className="truncate text-[10px] text-muted-foreground">{currentTrack.artist_name}</p>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={previousTrack} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Previous">
                <SkipBack className="h-3.5 w-3.5" />
              </button>
              <button onClick={nextTrack} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Next">
                <SkipForward className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setShowQueue(true)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Queue">
                <ListMusic className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setShowLyrics(true)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Lyrics">
                <Mic2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setPlayerView("mini")} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Minimize">
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setPlayerView("hidden")} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Hide">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <button
                onClick={togglePlay}
                className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary/80 to-accent text-primary-foreground shadow-2xl transition-transform hover:scale-105"
                aria-label="Play pause"
              >
                {isPlaying ? <Pause className="h-6 w-6" fill="currentColor" /> : <Play className="h-6 w-6 ml-0.5" fill="currentColor" />}
              </button>
              <div className="pointer-events-none absolute -inset-1 rounded-full border border-primary/40" />
            </div>
          </div>

          <div className="mt-2 flex justify-center">
            <div className="h-1 w-32 rounded-full bg-muted-foreground/30" />
          </div>
        </div>
      </div>

      <Sheet open={showQueue} onOpenChange={setShowQueue}>
        <SheetContent side="right" className="w-full max-w-md border-border/70 bg-card p-0">
          <div className="p-4">
            <h2 className="mb-4 text-xl font-bold text-foreground">Queue</h2>
            <div className="space-y-2">
              {queue.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => {
                    playTrack(track, queue);
                    setShowQueue(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted",
                    track.id === currentTrack.id && "bg-primary/10"
                  )}
                >
                  <span className="w-6 text-sm text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{track.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{track.artist_name}</p>
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
