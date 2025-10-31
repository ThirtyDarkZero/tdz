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

export interface Character {
  id: string;
  project_id: string;
  name: string;
  media_path: string;
  media_type: 'image' | 'video';
  is_approved: boolean;
  display_order: number;
  created_at: string;
}

interface ProjectContextType {
  currentProject: Project | null;
  scenes: Scene[];
  characters: Character[];
  loading: boolean;
  createProject: () => Promise<Project | undefined>;
  updateProject: (updates: Partial<Project>) => Promise<void>;
  uploadAudio: (file: File) => Promise<void>;
  uploadCharacter: (file: File, name?: string) => Promise<void>;
  updateCharacter: (id: string, updates: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  generateScenes: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
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

      // Extract lyrics - pass the storage path instead of public URL
      const { data: lyricsData, error: lyricsError } = await supabase.functions.invoke("extract-lyrics", {
        body: { audioPath: fileName },
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

  const uploadCharacter = async (file: File, name?: string) => {
    if (!user || !currentProject) return;

    setLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const mediaType = file.type.startsWith('image') ? 'image' : 'video';
      const timestamp = Date.now();
      const fileName = `${user.id}/${currentProject.id}-${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("characters")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("characters")
        .insert({
          project_id: currentProject.id,
          name: name || `Character ${characters.length + 1}`,
          media_path: fileName,
          media_type: mediaType,
          display_order: characters.length,
        });

      if (dbError) throw dbError;

      await loadCharacters();
      toast.success("Character uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("characters")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      await loadCharacters();
      toast.success("Character updated!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCharacter = async (id: string) => {
    setLoading(true);
    try {
      const character = characters.find(c => c.id === id);
      if (!character) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("characters")
        .remove([character.media_path]);

      if (storageError) console.error('Storage deletion error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from("characters")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      await loadCharacters();
      toast.success("Character deleted!");
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
      const { data, error } = await supabase.functions.invoke("generate-scenes", {
        body: { projectId: currentProject.id },
      });

      if (error) throw error;

      await loadScenes();
      
      const sceneCount = data?.scenesCount || 'Multiple';
      toast.success("Scenes generated successfully!", {
        description: `${sceneCount} scenes created from your lyrics`
      });
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      toast.error("Failed to generate scenes", {
        description: errorMsg.includes('Unauthorized') 
          ? 'Please try logging out and back in'
          : errorMsg.includes('Lyrics are required')
          ? 'Add lyrics in the left panel first'
          : errorMsg
      });
      console.error('Scene generation error:', error);
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

  const loadCharacters = async () => {
    if (!currentProject) return;

    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("project_id", currentProject.id)
      .order("display_order", { ascending: true });

    if (error) {
      toast.error(error.message);
      return;
    }

    setCharacters((data || []) as Character[]);
  };

  useEffect(() => {
    if (currentProject) {
      loadScenes();
      loadCharacters();
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
        characters,
        loading,
        createProject,
        updateProject,
        uploadAudio,
        uploadCharacter,
        updateCharacter,
        deleteCharacter,
        generateScenes,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType | null => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    // Return null instead of throwing during initial render
    return null;
  }
  return context;
};
