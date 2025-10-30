import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Wand2, Palette, Camera, Sparkles } from "lucide-react";
import { useState } from "react";

const stylePresets = [
  { name: "Tokyo Neon", color: "from-pink-500 to-purple-500" },
  { name: "Golden Hour", color: "from-amber-500 to-orange-500" },
  { name: "Shadow Realm", color: "from-slate-700 to-slate-900" },
  { name: "Eden Light", color: "from-emerald-400 to-cyan-400" },
];

export const AIDirectorPanel = () => {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [emotionIntensity, setEmotionIntensity] = useState([70]);
  const [cameraMotion, setCameraMotion] = useState([50]);
  const [fantasyRealism, setFantasyRealism] = useState([60]);

  return (
    <div className="w-80 h-full glass-card border-l border-border/50 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-primary" />
        AI Director
      </h2>
      
      <div className="space-y-6">
        {/* Style Presets */}
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <Palette className="w-4 h-4 text-primary" />
            Style Preset
          </div>
          <div className="grid grid-cols-2 gap-2">
            {stylePresets.map((preset, idx) => (
              <Button
                key={idx}
                variant={selectedPreset === idx ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPreset(idx)}
                className={`${
                  selectedPreset === idx
                    ? `bg-gradient-to-r ${preset.color} text-white border-0`
                    : "hover:border-primary/50"
                } transition-all`}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </Card>

        {/* Emotion Control */}
        <Card className="glass-card p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-secondary" />
            Emotion Intensity
          </div>
          <div className="space-y-2">
            <Slider
              value={emotionIntensity}
              onValueChange={setEmotionIntensity}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtle</span>
              <span className="text-secondary font-mono">{emotionIntensity[0]}%</span>
              <span>Intense</span>
            </div>
          </div>
        </Card>

        {/* Camera Motion */}
        <Card className="glass-card p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Camera className="w-4 h-4 text-accent" />
            Camera Motion
          </div>
          <div className="space-y-2">
            <Slider
              value={cameraMotion}
              onValueChange={setCameraMotion}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Static</span>
              <span className="text-accent font-mono">{cameraMotion[0]}%</span>
              <span>Dynamic</span>
            </div>
          </div>
        </Card>

        {/* Fantasy vs Realism */}
        <Card className="glass-card p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wand2 className="w-4 h-4 text-primary" />
            Fantasy ↔ Realism
          </div>
          <div className="space-y-2">
            <Slider
              value={fantasyRealism}
              onValueChange={setFantasyRealism}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Realistic</span>
              <span className="text-primary font-mono">{fantasyRealism[0]}%</span>
              <span>Fantasy</span>
            </div>
          </div>
        </Card>

        {/* Camera Presets */}
        <Card className="glass-card p-4 space-y-3">
          <div className="text-sm font-medium mb-2">Camera Presets</div>
          <div className="space-y-2">
            {["Cinematic Dolly", "Drone Shot", "Handheld", "Orbit 360°"].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs hover:border-primary/50 transition-all"
              >
                {preset}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
