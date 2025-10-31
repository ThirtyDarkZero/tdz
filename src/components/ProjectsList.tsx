import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Trash2, Clock } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  status: string;
  mood: string | null;
  bpm: number | null;
  audio_file_path: string | null;
}

export const ProjectsList = () => {
  const { user } = useAuth();
  const { currentProject, updateProject } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      
      toast.success("Project deleted");
      loadProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const loadProject = async (project: Project) => {
    try {
      // This will trigger the ProjectContext to load this project
      window.location.reload();
    } catch (error) {
      console.error("Error loading project:", error);
      toast.error("Failed to load project");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No projects yet</p>
          <p className="text-sm text-muted-foreground">Upload audio to create your first project</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {projects.map((project) => (
        <Card key={project.id} className="p-4 hover:shadow-lg transition-shadow">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(project.updated_at)}</span>
                </div>
              </div>
              {currentProject?.id === project.id && (
                <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                  Active
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {project.status && (
                <span className="px-2 py-1 rounded bg-muted">
                  {project.status}
                </span>
              )}
              {project.mood && (
                <span className="px-2 py-1 rounded bg-muted">
                  {project.mood}
                </span>
              )}
              {project.bpm && (
                <span className="px-2 py-1 rounded bg-muted">
                  {project.bpm} BPM
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => loadProject(project)}
                disabled={currentProject?.id === project.id}
              >
                <Play className="w-4 h-4 mr-1" />
                {currentProject?.id === project.id ? "Current" : "Open"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteProject(project.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
