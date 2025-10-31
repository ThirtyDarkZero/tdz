import { X, GripVertical, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  duration: number;
  file_path: string;
  album?: {
    title: string;
    cover_art_path?: string;
  };
}

interface QueuePanelProps {
  open: boolean;
  onClose: () => void;
  queue: Track[];
  currentTrack: Track | null;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onReorderQueue: (fromIndex: number, toIndex: number) => void;
}

export const QueuePanel = ({
  open,
  onClose,
  queue,
  currentTrack,
  onPlayTrack,
  onRemoveFromQueue,
}: QueuePanelProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCoverUrl = (path?: string) => {
    if (!path) return '/placeholder.svg';
    return supabase.storage.from('album-covers').getPublicUrl(path).data.publicUrl;
  };

  const totalDuration = queue.reduce((acc, track) => acc + track.duration, 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Queue</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {queue.length} {queue.length === 1 ? 'track' : 'tracks'} · {totalMinutes} min
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-1">
            {/* Currently Playing */}
            {currentTrack && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Now Playing</h3>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <img
                    src={getCoverUrl(currentTrack.album?.cover_art_path)}
                    alt={currentTrack.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-primary">{currentTrack.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{currentTrack.artist_name}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatTime(currentTrack.duration)}</span>
                </div>
              </div>
            )}

            {/* Queue */}
            {queue.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Next Up</h3>
                <div className="space-y-1">
                  {queue.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8"
                        onClick={() => onPlayTrack(track)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      
                      <img
                        src={getCoverUrl(track.album?.cover_art_path)}
                        alt={track.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                      </div>
                      
                      <span className="text-xs text-muted-foreground">{formatTime(track.duration)}</span>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8"
                        onClick={() => onRemoveFromQueue(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {queue.length === 0 && !currentTrack && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Queue is empty</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add tracks to start playing
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};