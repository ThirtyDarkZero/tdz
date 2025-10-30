import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Wand2, Palette, Camera, Sparkles, Video } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { Badge } from "@/components/ui/badge";

const stylePresets = [
  { name: "Cinematic", color: "from-blue-600 to-indigo-800", desc: "Hollywood-style, dramatic lighting" },
  { name: "Tokyo Neon", color: "from-pink-500 to-purple-500", desc: "Cyberpunk, vibrant neon lights" },
  { name: "Golden Hour", color: "from-amber-500 to-orange-500", desc: "Warm sunset, natural beauty" },
  { name: "Shadow Realm", color: "from-slate-700 to-slate-900", desc: "Dark, mysterious atmosphere" },
  { name: "Eden Light", color: "from-emerald-400 to-cyan-400", desc: "Nature, ethereal glow" },
  { name: "Desert Dreams", color: "from-yellow-600 to-red-600", desc: "Arid landscapes, heat waves" },
  { name: "Arctic Freeze", color: "from-cyan-400 to-blue-200", desc: "Cold, icy, minimalist" },
  { name: "Synthwave", color: "from-purple-600 to-pink-500", desc: "80s retro, grid aesthetics" },
  { name: "Noir", color: "from-gray-900 to-gray-600", desc: "Black & white, high contrast" },
  { name: "Candy Pop", color: "from-pink-400 to-purple-300", desc: "Colorful, playful, bright" },
  { name: "Urban Grit", color: "from-stone-600 to-zinc-800", desc: "Street style, raw energy" },
  { name: "Cosmic", color: "from-indigo-900 to-purple-900", desc: "Space, stars, galaxies" },
];

const videoProviders = [
  { 
    id: "sora", 
    name: "Sora 2", 
    icon: "🎬",
    description: "OpenAI - Best for music videos with audio sync",
    features: ["Audio Sync", "20s clips", "Highest Quality"]
  },
  { 
    id: "runway", 
    name: "Runway Gen-3", 
    icon: "🎨",
    description: "Cinematic quality, fast generation",
    features: ["5-10s clips", "Professional", "Fast"]
  },
  { 
    id: "kling", 
    name: "Kling AI", 
    icon: "⚡",
    description: "Cost-effective 1080p generation",
    features: ["1080p 30fps", "Budget-friendly", "Good quality"]
  },
  { 
    id: "veo", 
    name: "Veo 3.1", 
    icon: "🌟",
    description: "Google - High quality video AI",
    features: ["8s clips", "Google AI", "High quality"]
  }
];

export const AIDirectorPanel = () => {
  const { currentProject, updateProject } = useProject();

  const handlePresetChange = (preset: string) => {
    if (currentProject) {
      updateProject({ style_preset: preset });
    }
  };

  const handleProviderChange = (provider: string) => {
    if (currentProject) {
      updateProject({ video_provider: provider } as any);
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
  
  const selectedProvider = (currentProject as any)?.video_provider || 'sora';

  return (
    <div className="w-80 h-full glass-card border-l border-border/50 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-primary" />
        AI Director
      </h2>
      
      <div className="space-y-6">
        {/* Video Provider Selection */}
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <Video className="w-4 h-4 text-primary" />
            Video AI Provider
          </div>
          <div className="grid grid-cols-2 gap-2">
            {videoProviders.map((provider) => (
              <Button
                key={provider.id}
                variant={selectedProvider === provider.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleProviderChange(provider.id)}
                disabled={!currentProject}
                className={`${
                  selectedProvider === provider.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:border-primary/50"
                } transition-all h-auto py-2 flex flex-col items-start gap-1`}
              >
                <div className="flex items-center gap-1 w-full">
                  <span className="text-base">{provider.icon}</span>
                  <span className="font-semibold text-xs">{provider.name}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {provider.features.map((feature, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-[10px] px-1 py-0 h-4"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {videoProviders.find(p => p.id === selectedProvider)?.description}
          </p>
        </Card>

        {/* Style Presets */}
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <Palette className="w-4 h-4 text-primary" />
            Style Preset
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
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
                } transition-all h-auto py-2 flex flex-col items-start gap-1`}
                title={preset.desc}
              >
                <span className="font-semibold text-xs">{preset.name}</span>
                <span className="text-[10px] opacity-70 font-normal text-left">{preset.desc}</span>
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
