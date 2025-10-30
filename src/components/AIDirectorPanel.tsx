import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Wand2, Palette, Camera, Sparkles } from "lucide-react";
import { useProject } from "@/hooks/useProject";

const stylePresets = [
  { name: "Tokyo Neon", color: "from-pink-500 to-purple-500" },
  { name: "Golden Hour", color: "from-amber-500 to-orange-500" },
  { name: "Shadow Realm", color: "from-slate-700 to-slate-900" },
  { name: "Eden Light", color: "from-emerald-400 to-cyan-400" },
];

export const AIDirectorPanel = () => {
  const { currentProject, updateProject } = useProject();

  const handlePresetChange = (preset: string) => {
    if (currentProject) {
      updateProject({ style_preset: preset });
    }
  };

  const handleSliderChange = (field: string, value: number[]) => {
    if (currentProject) {
      updateProject({ [field]: value[0] });
    }
  };

  const selectedPresetIndex = stylePresets.findIndex(
    (p) => p.name === currentProject?.style_preset
  );

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
                variant={selectedPresetIndex === idx ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange(preset.name)}
                disabled={!currentProject}
                className={`${
                  selectedPresetIndex === idx
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
              value={[currentProject?.emotion_intensity || 70]}
              onValueChange={(val) => handleSliderChange('emotion_intensity', val)}
              max={100}
              step={1}
              disabled={!currentProject}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtle</span>
              <span className="text-secondary font-mono">
                {currentProject?.emotion_intensity || 70}%
              </span>
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
              value={[currentProject?.camera_motion || 50]}
              onValueChange={(val) => handleSliderChange('camera_motion', val)}
              max={100}
              step={1}
              disabled={!currentProject}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Static</span>
              <span className="text-accent font-mono">
                {currentProject?.camera_motion || 50}%
              </span>
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
              value={[currentProject?.fantasy_realism || 60]}
              onValueChange={(val) => handleSliderChange('fantasy_realism', val)}
              max={100}
              step={1}
              disabled={!currentProject}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Realistic</span>
              <span className="text-primary font-mono">
                {currentProject?.fantasy_realism || 60}%
              </span>
              <span>Fantasy</span>
            </div>
          </div>
        </Card>

        {!currentProject && (
          <Card className="glass-card p-4 bg-muted/30">
            <p className="text-sm text-muted-foreground text-center">
              Create a project to use AI controls
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
