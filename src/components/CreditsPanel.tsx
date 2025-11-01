import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Music, Mic, Headphones, Radio, User } from "lucide-react";

interface CreditsPanelProps {
  open: boolean;
  onClose: () => void;
  trackId: string;
}

interface Credit {
  role: string;
  name: string;
  icon?: any;
}

export const CreditsPanel = ({ open, onClose, trackId }: CreditsPanelProps) => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && trackId) {
      loadCredits();
    }
  }, [open, trackId]);

  const loadCredits = async () => {
    setLoading(true);
    const { data: track } = await supabase
      .from("tracks")
      .select("*, artist:artist_id(*)")
      .eq("id", trackId)
      .single();

    if (track) {
      setMetadata({
        releaseDate: track.release_date,
        label: "Independent",
        genre: track.genre,
        duration: track.duration,
        bpm: track.bpm,
        key: track.key,
      });

      const creditsList: Credit[] = [
        { role: "Artist", name: track.artist_name, icon: Mic },
        { role: "Producer", name: "TDZ Production", icon: Music },
        { role: "Mixed by", name: "TDZ Studios", icon: Headphones },
        { role: "Mastered by", name: "TDZ Mastering", icon: Radio },
      ];

      setCredits(creditsList);
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto glass-card-premium border-primary/30">
        <SheetHeader>
          <SheetTitle className="text-2xl font-black glow-text">Track Credits</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading credits...</div>
          ) : (
            <>
              {/* Track Metadata */}
              {metadata && (
                <div className="space-y-3 p-4 rounded-lg glass-card">
                  <h3 className="font-semibold text-sm text-muted-foreground">Track Info</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {metadata.releaseDate && (
                      <div>
                        <p className="text-muted-foreground">Released</p>
                        <p className="font-medium">{new Date(metadata.releaseDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {metadata.label && (
                      <div>
                        <p className="text-muted-foreground">Label</p>
                        <p className="font-medium">{metadata.label}</p>
                      </div>
                    )}
                    {metadata.genre && (
                      <div>
                        <p className="text-muted-foreground">Genre</p>
                        <Badge variant="outline">{metadata.genre}</Badge>
                      </div>
                    )}
                    {metadata.bpm && (
                      <div>
                        <p className="text-muted-foreground">BPM</p>
                        <p className="font-medium">{metadata.bpm}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Credits List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Credits</h3>
                {credits.map((credit, index) => {
                  const Icon = credit.icon || User;
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{credit.role}</p>
                        <p className="font-semibold truncate">{credit.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
