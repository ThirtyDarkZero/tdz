import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Mic, Music } from "lucide-react";

interface LyricsPanelProps {
  open: boolean;
  onClose: () => void;
  trackId: string | null;
  currentTime: number;
}

interface LyricLine {
  time: number;
  text: string;
}

export const LyricsPanel = ({ open, onClose, trackId, currentTime }: LyricsPanelProps) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trackId) {
      loadLyrics(trackId);
    }
  }, [trackId]);

  const loadLyrics = async (id: string) => {
    setLoading(true);
    try {
      // TODO: Fetch actual lyrics from database or API
      // For now, show placeholder
      setLyrics([
        { time: 0, text: "Lyrics will appear here" },
        { time: 5, text: "As the track plays" },
        { time: 10, text: "Synced with the music" },
      ]);
    } catch (error) {
      console.error('Error loading lyrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLineIndex = () => {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        return i;
      }
    }
    return 0;
  };

  const currentLineIndex = getCurrentLineIndex();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Lyrics
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading lyrics...</p>
            </div>
          ) : lyrics.length > 0 ? (
            <div className="space-y-4">
              {lyrics.map((line, index) => (
                <p
                  key={index}
                  className={`text-lg leading-relaxed transition-all duration-300 ${
                    index === currentLineIndex
                      ? 'text-foreground font-semibold scale-105'
                      : index < currentLineIndex
                      ? 'text-muted-foreground/50'
                      : 'text-muted-foreground'
                  }`}
                >
                  {line.text}
                </p>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No lyrics available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Lyrics will be displayed here when available
              </p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};