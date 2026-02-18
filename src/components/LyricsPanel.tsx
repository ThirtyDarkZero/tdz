import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Mic, Music, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LyricsPanelProps {
  open: boolean;
  onClose: () => void;
  trackId: string | null;
  currentTime: number;
  audioPath?: string;
}

interface LyricLine {
  time: number;
  text: string;
}

export const LyricsPanel = ({ open, onClose, trackId, currentTime, audioPath }: LyricsPanelProps) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trackId && open) {
      loadLyrics(trackId);
    }
  }, [trackId, open]);

  // Auto-scroll to current lyric
  useEffect(() => {
    if (lyrics.length > 0 && scrollRef.current) {
      const currentIndex = getCurrentLineIndex();
      const lineElement = scrollRef.current.querySelector(`[data-line="${currentIndex}"]`);
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, lyrics]);

  const loadLyrics = async (id: string) => {
    setLoading(true);
    try {
      // 1. Try track_lyrics_sync first (new synced lyrics)
      const { data: syncData } = await supabase
        .from('track_lyrics_sync')
        .select('lyrics_data')
        .eq('track_id', id)
        .eq('is_published', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (syncData?.lyrics_data) {
        const parsed = syncData.lyrics_data as any;
        if (parsed?.lines?.length) {
          setLyrics(parsed.lines);
          return;
        }
      }

      // 2. Fall back to lyric_alignments
      const { data: alignments, error } = await supabase
        .from('lyric_alignments')
        .select('*')
        .eq('project_id', id)
        .order('line_index', { ascending: true })
        .order('word_index', { ascending: true });

      if (!error && alignments && alignments.length > 0) {
        const lineMap = new Map<number, { time: number; words: string[] }>();
        alignments.forEach(a => {
          if (!lineMap.has(a.line_index)) {
            lineMap.set(a.line_index, { time: a.start_time, words: [] });
          }
          lineMap.get(a.line_index)!.words.push(a.word);
        });

        const parsedLyrics = Array.from(lineMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([_, data]) => ({ time: data.time, text: data.words.join(' ') }));

        setLyrics(parsedLyrics);
        return;
      }

      setLyrics([]);
    } catch (error) {
      console.error('Error loading lyrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractLyrics = async () => {
    if (!audioPath) {
      toast.error("No audio file available");
      return;
    }
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-lyrics', {
        body: { audioPath }
      });
      if (error) throw error;
      if (data?.lyrics) {
        const lines = data.lyrics.split('\n').filter((l: string) => l.trim());
        const estimatedDuration = 180;
        const timePerLine = estimatedDuration / lines.length;
        const timedLyrics = lines.map((text: string, i: number) => ({
          time: i * timePerLine,
          text: text.trim()
        }));
        setLyrics(timedLyrics);
        toast.success("Lyrics extracted successfully!");
      } else {
        toast.info("Could not extract lyrics from this track");
      }
    } catch (error: any) {
      console.error('Error extracting lyrics:', error);
      toast.error("Failed to extract lyrics");
    } finally {
      setExtracting(false);
    }
  };

  const getCurrentLineIndex = () => {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) return i;
    }
    return 0;
  };

  const currentLineIndex = getCurrentLineIndex();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px] glass-card-premium border-primary/30">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-2xl font-black glow-text">
            <Mic className="h-5 w-5" />
            Lyrics
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 h-[calc(100vh-150px)]" ref={scrollRef}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading lyrics...</p>
            </div>
          ) : lyrics.length > 0 ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 py-8">
                {lyrics.map((line, index) => {
                  const isCurrent = index === currentLineIndex;
                  const isPast = index < currentLineIndex;
                  return (
                    <p
                      key={index}
                      data-line={index}
                      className={`text-lg leading-relaxed transition-all duration-500 cursor-pointer hover:text-foreground ${
                        isCurrent
                          ? 'text-primary font-bold text-xl scale-[1.03] origin-left'
                          : isPast
                          ? 'text-muted-foreground/30'
                          : 'text-muted-foreground/60'
                      }`}
                      style={{
                        textShadow: isCurrent ? '0 0 20px hsl(var(--primary) / 0.4)' : 'none',
                      }}
                    >
                      {line.text}
                    </p>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
              <Music className="h-16 w-16 text-muted-foreground/50" />
              <div>
                <p className="text-lg font-semibold mb-2">No lyrics available</p>
                <p className="text-sm text-muted-foreground">
                  Lyrics will be displayed here when available
                </p>
              </div>
              {audioPath && (
                <Button onClick={extractLyrics} disabled={extracting} className="gap-2">
                  {extracting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Extracting...</>
                  ) : (
                    <><RefreshCw className="h-4 w-4" />Auto-detect Lyrics</>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
