import { Button } from "@/components/ui/button";
import { Sparkles, Play, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProject";
import { toast } from "sonner";

export const TopBar = () => {
  const { user, signOut } = useAuth();
  const { currentProject, createProject, generateScenes, loading } = useProject();

  const handleGenerate = async () => {
    if (!currentProject) {
      toast.error("Please create a project first");
      return;
    }

    if (!currentProject.lyrics) {
      toast.error("Please add lyrics to generate scenes");
      return;
    }

    await generateScenes();
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/auth";
  };

  return (
    <header className="h-16 glass-card flex items-center justify-between px-6 border-b border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold glow-text">
            {currentProject?.name || "AI Music Video Studio"}
          </h1>
          <p className="text-xs text-muted-foreground">Cinematic Generation Engine</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {currentProject && (
          <>
            {currentProject.bpm && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">BPM:</span>
                <span className="text-primary font-mono">{currentProject.bpm}</span>
              </div>
            )}
            {currentProject.mood && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Mood:</span>
                <span className="text-secondary font-medium">{currentProject.mood}</span>
              </div>
            )}
          </>
        )}
        
        <Button
          onClick={createProject}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>

        <Button
          onClick={handleGenerate}
          className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-glow transition-all"
          disabled={loading || !currentProject}
        >
          <Play className="w-4 h-4 mr-2" />
          {loading ? "Generating..." : "Generate Scenes"}
        </Button>

        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="icon"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};
