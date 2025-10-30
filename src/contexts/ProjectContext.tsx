import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  audio_file_path: string | null;
  lyrics: string | null;
  bpm: number | null;
  mood: string | null;
  style_preset: string;
  emotion_intensity: number;
  camera_motion: number;
  fantasy_realism: number;
  status: string;
  ai_twin_image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: string;
  project_id: string;
  scene_order: number;
  scene_type: string;
  start_time: number;
  end_time: number;
  description: string;
  mood: string;
  intensity: number;
  camera_preset: string | null;
  generated_video_url: string | null;
  created_at: string;
}

interface ProjectContextType {
  currentProject: Project | null;
  scenes: Scene[];
  loading: boolean;
  createProject: () => Promise<Project | undefined>;
  updateProject: (updates: Partial<Project>) => Promise<void>;
  uploadAudio: (file: File) => Promise<void>;
  uploadAITwin: (file: File) => Promise<void>;
  generateScenes: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(false);

  const createProject = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: `Project ${new Date().toLocaleDateString()}`,
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentProject(data);
      toast.success("New project created!");
      return data;
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (updates: Partial<Project>) => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", currentProject.id)
        .select()
        .single();

      if (error) throw error;
      setCurrentProject(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadAudio = async (file: File) => {
    if (!user || !currentProject) return;

    setLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${currentProject.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("audio-files")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("audio-files")
        .getPublicUrl(fileName);

      await updateProject({ audio_file_path: fileName });
      
      toast.info('Analyzing audio and extracting lyrics...');

      // Analyze audio
      const { data: analysis, error: analysisError } = await supabase.functions.invoke("analyze-audio", {
        body: { audioUrl: publicUrl },
      });

      if (!analysisError && analysis) {
        await updateProject({
          bpm: analysis.bpm,
          mood: analysis.mood,
        });
      }

      // Extract lyrics
      const { data: lyricsData, error: lyricsError } = await supabase.functions.invoke("extract-lyrics", {
        body: { audioUrl: publicUrl },
      });

      if (!lyricsError && lyricsData?.lyrics) {
        await updateProject({ lyrics: lyricsData.lyrics });
        toast.success("Audio uploaded, analyzed, and lyrics extracted!");
      } else {
        toast.success("Audio uploaded and analyzed! Add lyrics manually for best results.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadAITwin = async (file: File) => {
    if (!user || !currentProject) return;

    setLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${currentProject.id}-twin.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("ai-twins")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      await updateProject({ ai_twin_image_path: fileName } as any);
      
      toast.success("AI Twin uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateScenes = async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("generate-scenes", {
        body: { projectId: currentProject.id },
      });

      if (error) throw error;

      await loadScenes();
      toast.success("Scenes generated successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadScenes = async () => {
    if (!currentProject) return;

    const { data, error } = await supabase
      .from("scenes")
      .select("*")
      .eq("project_id", currentProject.id)
      .order("scene_order", { ascending: true });

    if (error) {
      toast.error(error.message);
      return;
    }

    setScenes(data || []);
  };

  useEffect(() => {
    if (currentProject) {
      loadScenes();
    }
  }, [currentProject?.id]);

  useEffect(() => {
    if (user && !currentProject) {
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setCurrentProject(data);
          }
        });
    }
  }, [user]);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        scenes,
        loading,
        createProject,
        updateProject,
        uploadAudio,
        uploadAITwin,
        generateScenes,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
