import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, Music2, Zap } from "lucide-react";

const sceneData = [
  {
    id: 1,
    type: "Intro",
    time: "0:00 - 0:15",
    description: "Palace exterior at night, gold lighting, slow dolly",
    mood: "Luxury",
    intensity: 40,
  },
  {
    id: 2,
    type: "Verse 1",
    time: "0:15 - 0:45",
    description: "Interior throne room, dramatic shadows, character close-up",
    mood: "Authority",
    intensity: 60,
  },
  {
    id: 3,
    type: "Hook",
    time: "0:45 - 1:00",
    description: "Beat drop - strobe lights, fast cuts, car scenes",
    mood: "Energy",
    intensity: 95,
  },
  {
    id: 4,
    type: "Verse 2",
    time: "1:00 - 1:30",
    description: "Rooftop panorama, city lights, slow motion walk",
    mood: "Cinematic",
    intensity: 70,
  },
];

export const StoryboardView = () => {
  return (
    <div className="flex-1 h-full p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Film className="w-6 h-6 text-primary" />
          AI Storyboard
        </h2>
        <p className="text-muted-foreground text-sm">
          AI-generated scene breakdown synced to your music
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sceneData.map((scene) => (
          <Card
            key={scene.id}
            className="glass-card p-4 hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Music2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {scene.type}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {scene.time}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {scene.mood}
              </Badge>
            </div>

            <div className="aspect-video bg-gradient-to-br from-background/80 to-muted/50 rounded-lg mb-3 flex items-center justify-center border border-border/50">
              <span className="text-xs text-muted-foreground">AI Preview</span>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {scene.description}
            </p>

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <div className="flex-1 h-2 bg-background/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-secondary to-accent rounded-full transition-all"
                  style={{ width: `${scene.intensity}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {scene.intensity}%
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
