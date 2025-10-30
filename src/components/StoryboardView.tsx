import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, Music2, Zap } from "lucide-react";
import { useProject } from "@/hooks/useProject";

export const StoryboardView = () => {
  const { scenes, currentProject } = useProject();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentProject) {
    return (
      <div className="flex-1 h-full p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Film className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-xl font-semibold">No Project Selected</h3>
          <p className="text-muted-foreground">Create a new project to get started</p>
        </div>
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="flex-1 h-full p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Film className="w-16 h-16 text-primary mx-auto opacity-50" />
          <h3 className="text-xl font-semibold">No Scenes Yet</h3>
          <p className="text-muted-foreground">
            Upload audio and lyrics, then click "Generate Scenes"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Film className="w-6 h-6 text-primary" />
          AI Storyboard
        </h2>
        <p className="text-muted-foreground text-sm">
          {scenes.length} scenes generated for your music video
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {scenes.map((scene) => (
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
                    {scene.scene_type}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatTime(scene.start_time)} - {formatTime(scene.end_time)}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {scene.mood}
              </Badge>
            </div>

            <div className="aspect-video bg-gradient-to-br from-background/80 to-muted/50 rounded-lg mb-3 flex items-center justify-center border border-border/50">
              <span className="text-xs text-muted-foreground">Scene Preview</span>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
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
