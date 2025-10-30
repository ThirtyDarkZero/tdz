import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
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

export const useProject = () => {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(false);

  // Create a new project
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

  // Update project
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

  // Upload audio file
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
      
      // Analyze audio
      const { data: analysis } = await supabase.functions.invoke("analyze-audio", {
        body: { audioUrl: publicUrl },
      });

      if (analysis) {
        await updateProject({
          bpm: analysis.bpm,
          mood: analysis.mood,
        });
      }

      toast.success("Audio uploaded and analyzed!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate scenes
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

  // Load scenes for current project
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

  // Load scenes when project changes
  useEffect(() => {
    if (currentProject) {
      loadScenes();
    }
  }, [currentProject?.id]);

  // Initialize with a project on mount
  useEffect(() => {
    if (user && !currentProject) {
      // Try to load the most recent project
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) {
            setCurrentProject(data);
          }
        });
    }
  }, [user]);

  return {
    currentProject,
    scenes,
    loading,
    createProject,
    updateProject,
    uploadAudio,
    generateScenes,
  };
};
