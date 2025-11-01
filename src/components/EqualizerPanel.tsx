import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface EqualizerPanelProps {
  open: boolean;
  onClose: () => void;
  audioElement: HTMLAudioElement | null;
}

export const EqualizerPanel = ({ open, onClose, audioElement }: EqualizerPanelProps) => {
  const [bands, setBands] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000];
  const labels = ["60Hz", "170Hz", "310Hz", "600Hz", "1kHz", "3kHz", "6kHz", "12kHz"];

  useEffect(() => {
    if (!audioElement || !open) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioElement);
      
      const filters = frequencies.map((freq, index) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = bands[index];
        return filter;
      });

      source.connect(filters[0]);
      filters.forEach((filter, index) => {
        if (index < filters.length - 1) {
          filter.connect(filters[index + 1]);
        } else {
          filter.connect(audioContext.destination);
        }
      });

      return () => {
        filters.forEach(filter => filter.disconnect());
        source.disconnect();
        audioContext.close();
      };
    } catch (error) {
      console.error("EQ setup failed:", error);
    }
  }, [audioElement, bands, open]);

  const handleBandChange = (index: number, value: number[]) => {
    const newBands = [...bands];
    newBands[index] = value[0];
    setBands(newBands);
  };

  const resetEQ = () => {
    setBands([0, 0, 0, 0, 0, 0, 0, 0]);
  };

  const presets = {
    flat: [0, 0, 0, 0, 0, 0, 0, 0],
    bass: [8, 6, 4, 0, -2, 0, 2, 3],
    treble: [-2, 0, 2, 0, 4, 6, 8, 8],
    vocal: [-2, -1, 2, 4, 4, 3, 1, 0],
    rock: [6, 4, 2, -1, -2, 1, 4, 6],
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto glass-card-premium border-primary/30">
        <SheetHeader>
          <SheetTitle className="text-2xl font-black glow-text">Equalizer</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Presets */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Presets</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(presets).map(([name, values]) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  onClick={() => setBands(values)}
                  className="capitalize hover:bg-primary/20"
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* EQ Bands */}
          <div className="grid grid-cols-4 gap-4">
            {bands.map((value, index) => (
              <div key={index} className="space-y-2">
                <Badge variant="outline" className="w-full justify-center text-xs">
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
                  <span className="text-xs font-mono mt-2">{value > 0 ? '+' : ''}{value}dB</span>
                </div>
              </div>
            ))}
          </div>

          {/* Reset Button */}
          <Button onClick={resetEQ} variant="outline" className="w-full">
            Reset to Flat
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
