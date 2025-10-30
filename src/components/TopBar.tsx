import { Button } from "@/components/ui/button";
import { Sparkles, Play } from "lucide-react";

export const TopBar = () => {
  return (
    <header className="h-16 glass-card flex items-center justify-between px-6 border-b border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold glow-text">AI Music Video Studio</h1>
          <p className="text-xs text-muted-foreground">Cinematic Generation Engine</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">BPM:</span>
          <span className="text-primary font-mono">120</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Mood:</span>
          <span className="text-secondary font-medium">Cinematic</span>
        </div>
        <Button className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-glow transition-all">
          <Play className="w-4 h-4 mr-2" />
          Generate Video
        </Button>
      </div>
    </header>
  );
};
