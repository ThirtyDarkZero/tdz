import { useState, useCallback, useRef } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Maximize2, ListMusic, Mic2, Radio, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MusicPlayer } from '@/components/MusicPlayer';
import { LyricsPanel } from '@/components/LyricsPanel';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PREVIEW_DURATION_SECONDS = 30;

type PlayerMode = 'mini' | 'full' | 'fullscreen';

export function FloatingPlayer() {
  const { user } = useAuth();
  const { role } = useUserRole(user);
  const { hasFeature } = useSubscription(user);
  const { currentTrack, queue, isPlaying, nextTrack, previousTrack, setIsPlaying } = usePlayer();
  
  const [mode, setMode] = useState<PlayerMode>('mini');
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [infinitePlay, setInfinitePlay] = useState(false);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  
  // Track current time from audio for lyrics sync
  const audioTimeRef = useRef<number>(0);
  
  const isArtist = role === 'artist' || role === 'verified_artist' || role === 'manager';
  const hasUnlimitedStreaming = hasFeature('unlimitedStreaming') || isArtist;

  const handleTrackEnd = useCallback(() => {
    nextTrack();
  }, [nextTrack]);

  const handlePreviewEnd = useCallback(() => {
    setShowSubscriptionModal(true);
    setIsPlaying(false);
    toast.info("Preview ended - Subscribe for unlimited streaming!");
  }, [setIsPlaying]);

  if (!currentTrack) {
    return null;
  }

  // Cast to expected type
  const playerTrack = currentTrack as unknown as {
    id: string;
    title: string;
    artist_name: string;
    duration: number;
    file_path: string;
    play_count: number;
    album_cover_path?: string;
    album_cover_bucket?: string;
    motion_cover_path?: string;
    motion_cover_bucket?: string;
    album?: { title: string; cover_art_path?: string; };
    ai_tags?: { metadata?: { isMotionCover?: boolean; artworkUrl?: string; }; };
  };

  const playerQueue = queue as unknown as typeof playerTrack[];

  // Fullscreen mode
  if (mode === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10"
          onClick={() => setMode('mini')}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Full player content */}
        <div className="flex-1 overflow-hidden">
          <MusicPlayer
            currentTrack={playerTrack}
            queue={playerQueue}
            onNext={nextTrack}
            onPrevious={previousTrack}
            onTrackEnd={handleTrackEnd}
            maxDuration={!hasUnlimitedStreaming ? PREVIEW_DURATION_SECONDS : undefined}
            onPreviewEnd={!hasUnlimitedStreaming ? handlePreviewEnd : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Mini Player */}
      <div className={cn(
        "fixed z-50 transition-all duration-300",
        mode === 'mini' ? "bottom-0 left-0 right-0" : "bottom-4 right-4 w-96 rounded-2xl overflow-hidden shadow-2xl"
      )}>
        <div className="glass-ultra border-t border-white/10">
          <MusicPlayer
            currentTrack={playerTrack}
            queue={playerQueue}
            onNext={nextTrack}
            onPrevious={previousTrack}
            onTrackEnd={handleTrackEnd}
            maxDuration={!hasUnlimitedStreaming ? PREVIEW_DURATION_SECONDS : undefined}
            onPreviewEnd={!hasUnlimitedStreaming ? handlePreviewEnd : undefined}
          />
        </div>

        {/* Quick Actions Bar - PHP style */}
        <div className="absolute -top-12 right-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('fullscreen')}
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQueue(!showQueue)}
            className={cn(
              "bg-background/80 backdrop-blur-sm hover:bg-background",
              showQueue && "text-primary"
            )}
          >
            <ListMusic className="h-4 w-4 mr-2" />
            Queue
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLyrics(!showLyrics)}
            className={cn(
              "bg-background/80 backdrop-blur-sm hover:bg-background",
              showLyrics && "text-primary"
            )}
          >
            <Mic2 className="h-4 w-4 mr-2" />
            Lyrics
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setInfinitePlay(!infinitePlay);
              toast.success(infinitePlay ? "Infinite play disabled" : "Infinite play enabled");
            }}
            className={cn(
              "bg-background/80 backdrop-blur-sm hover:bg-background",
              infinitePlay && "text-primary"
            )}
          >
            <Radio className="h-4 w-4 mr-2" />
            Infinite Play
          </Button>
        </div>
      </div>

      {/* Queue Sheet */}
      <Sheet open={showQueue} onOpenChange={setShowQueue}>
        <SheetContent side="right" className="w-full max-w-md p-0">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Queue</h2>
            <div className="space-y-2">
              {playerQueue.map((track, i) => (
                <div key={track.id} className={cn(
                  "flex items-center gap-3 p-2 rounded-lg",
                  track.id === playerTrack.id && "bg-primary/10"
                )}>
                  <span className="text-sm text-muted-foreground w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Lyrics Panel */}
      <LyricsPanel
        open={showLyrics}
        onClose={() => setShowLyrics(false)}
        trackId={currentTrack?.id || null}
        currentTime={playerCurrentTime}
        audioPath={playerTrack.file_path}
      />

      <SubscriptionModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
      />
    </>
  );
}
