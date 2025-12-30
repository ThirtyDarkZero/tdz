import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Youtube, AlertCircle } from "lucide-react";

interface YouTubeEQPanelProps {
  open: boolean;
  onClose: () => void;
}

// Visual-only EQ for YouTube (no actual audio filtering due to IFrame API limitations)
export const YouTubeEQPanel = ({ open, onClose }: YouTubeEQPanelProps) => {
  const [bands, setBands] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const [activePreset, setActivePreset] = useState<string | null>('flat');
  const labels = ["60Hz", "170Hz", "310Hz", "600Hz", "1kHz", "3kHz", "6kHz", "12kHz"];

  const handleBandChange = (index: number, value: number[]) => {
    const newBands = [...bands];
    newBands[index] = value[0];
    setBands(newBands);
    setActivePreset(null);
  };

  const resetEQ = () => {
    setBands([0, 0, 0, 0, 0, 0, 0, 0]);
    setActivePreset('flat');
  };

  const presets = {
    flat: [0, 0, 0, 0, 0, 0, 0, 0],
    bass: [8, 6, 4, 0, -2, 0, 2, 3],
    treble: [-2, 0, 2, 0, 4, 6, 8, 8],
    vocal: [-2, -1, 2, 4, 4, 3, 1, 0],
    rock: [6, 4, 2, -1, -2, 1, 4, 6],
  };

  const applyPreset = (name: string, values: number[]) => {
    setBands(values);
    setActivePreset(name);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto glass-card-premium border-red-500/30">
        <SheetHeader>
          <SheetTitle className="text-2xl font-black flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-500" />
            YouTube EQ
          </SheetTitle>
          <SheetDescription className="flex items-start gap-2 text-amber-400/80">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Visual preview only. Due to YouTube's IFrame API, audio filtering is not available for YouTube streams.
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Presets */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Presets</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(presets).map(([name, values]) => (
                <Button
                  key={name}
                  variant={activePreset === name ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(name, values)}
                  className={`capitalize ${activePreset === name ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-500/20'}`}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* EQ Bands (Visual Only) */}
          <div className="grid grid-cols-4 gap-4">
            {bands.map((value, index) => (
              <div key={index} className="space-y-2">
                <Badge variant="outline" className="w-full justify-center text-xs border-red-500/30">
                  {labels[index]}
                </Badge>
                <div className="h-48 flex flex-col items-center justify-end">
                  <Slider
                    value={[value]}
                    min={-12}
                    max={12}
                    step={1}
                    onValueChange={(val) => handleBandChange(index, val)}
                    orientation="vertical"
                    className="h-40"
                  />
                  <span className="text-xs font-mono mt-2 text-muted-foreground">
                    {value > 0 ? '+' : ''}{value}dB
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Indicator */}
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium">Visual Preview</span>
            </div>
            <div className="flex items-end gap-1 h-12">
              {bands.map((value, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-red-600 to-orange-500 rounded-t transition-all duration-200"
                  style={{ height: `${Math.max(10, ((value + 12) / 24) * 100)}%` }}
                />
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <Button onClick={resetEQ} variant="outline" className="w-full border-red-500/30 hover:bg-red-500/20">
            Reset to Flat
          </Button>

          {/* Note about TDZ */}
          <div className="text-xs text-muted-foreground text-center p-3 rounded-lg bg-muted/30">
            💡 For full audio EQ support, listen to TDZ-distributed tracks
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
