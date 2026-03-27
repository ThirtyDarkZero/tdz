import { useState } from "react";
import {
  Compass,
  Radio,
  Library,
  Search,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ListMusic,
  Mic2,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LyricsPanel } from "@/components/LyricsPanel";
import { cn } from "@/lib/utils";

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "trending", label: "Radio", icon: Radio },
  { id: "library", label: "Library", icon: Library },
  { id: "artists", label: "Search", icon: Search },
];

export function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
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

  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const hasTrack = Boolean(currentTrack);
  const togglePlay = () => (isPlaying ? pauseTrack() : resumeTrack());

  const duration = currentTrack?.duration || 0;
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const handleOrbClick = () => {
    if (!hasTrack) return;
    if (playerView === "hidden") {
      setPlayerView("mini");
      return;
    }
    togglePlay();
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="relative mx-auto max-w-[520px] px-4 pb-3">
          {hasTrack && playerView !== "hidden" && (
            <div className="relative mb-2 flex items-center gap-3 overflow-hidden rounded-2xl border border-border/50 bg-card/90 px-4 py-2 backdrop-blur-xl shadow-xl">
              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
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
                  <SkipBack className="h-3 w-3" />
                </button>
                <button onClick={nextTrack} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Next">
                  <SkipForward className="h-3 w-3" />
                </button>
                <button onClick={() => setShowQueue(true)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Queue">
                  <ListMusic className="h-3 w-3" />
                </button>
                <button onClick={() => setShowLyrics(true)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Lyrics">
                  <Mic2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setPlayerView(playerView === "mini" ? "full" : "mini")}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Minimize or expand"
                >
                  {playerView === "mini" ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                </button>
              </div>

              <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="relative flex h-[72px] items-center justify-around rounded-3xl border border-border/40 bg-card/90 backdrop-blur-2xl shadow-2xl">
            {NAV_ITEMS.slice(0, 2).map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center gap-1 px-4 py-2 transition-all"
              >
                <item.icon className={cn("h-5 w-5 transition-colors", activeTab === item.id ? "text-foreground" : "text-muted-foreground")} />
                <span className={cn("text-[10px] tracking-[0.03em]", activeTab === item.id ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>{item.label}</span>
              </button>
            ))}

            <div className="relative -mt-8">
              <button
                onClick={handleOrbClick}
                className={cn(
                  "relative flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground shadow-2xl transition-transform duration-300",
                  hasTrack ? "bg-gradient-to-br from-primary via-primary/80 to-accent hover:scale-110" : "bg-muted text-muted-foreground"
                )}
                aria-label="Play pause"
              >
                {hasTrack && isPlaying ? (
                  <Pause className="h-6 w-6" fill="currentColor" />
                ) : (
                  <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
                )}
              </button>
              <div className="pointer-events-none absolute -inset-1 rounded-full border border-primary/30" />
            </div>

            {NAV_ITEMS.slice(2).map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center gap-1 px-4 py-2 transition-all"
              >
                <item.icon className={cn("h-5 w-5 transition-colors", activeTab === item.id ? "text-foreground" : "text-muted-foreground")} />
                <span className={cn("text-[10px] tracking-[0.03em]", activeTab === item.id ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>{item.label}</span>
              </button>
            ))}
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
                    track.id === currentTrack?.id && "bg-primary/10"
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
        trackId={currentTrack?.id || null}
        currentTime={currentTime}
        audioPath={currentTrack?.file_path || ""}
      />
    </>
  );
}
