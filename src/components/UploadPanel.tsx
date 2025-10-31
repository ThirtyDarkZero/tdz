import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Music, FileText, Loader2, User, Gauge, Smile } from "lucide-react";
import { useRef } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";
import { CharactersGallery } from "./CharactersGallery";

export const UploadPanel = () => {
  const projectContext = useProject();
  const { currentProject, updateProject, uploadAudio, uploadCharacter, loading } = projectContext || {
    currentProject: null,
    updateProject: async () => {},
    uploadAudio: async () => {},
    uploadCharacter: async () => {},
    loading: false
  };
  const audioInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file', {
        description: 'Supported: MP3, WAV, M4A'
      });
      return;
    }

    // Check file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Maximum file size is 50MB'
      });
      return;
    }

    await uploadAudio(file);
  };

  const handleCharacterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload an image (JPG, PNG, WEBP) or video (MP4, MOV)');
      return;
    }

    await uploadCharacter(file);
    
    // Reset input to allow uploading the same file again
    if (characterInputRef.current) {
      characterInputRef.current.value = '';
    }
  };

  const handleLyricsChange = async (lyrics: string) => {
    if (currentProject) {
      await updateProject({ lyrics });
    }
  };

  const handleBpmChange = async (bpm: string) => {
    const bpmValue = parseInt(bpm);
    if (currentProject && !isNaN(bpmValue) && bpmValue > 0 && bpmValue <= 300) {
      await updateProject({ bpm: bpmValue });
    }
  };

  const handleMoodChange = async (mood: string) => {
    if (currentProject && mood.trim()) {
      await updateProject({ mood: mood.trim() });
    }
  };

  return (
    <div className="w-80 h-full glass-card border-r border-border/50 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary" />
        Media Inputs
      </h2>
      
      <div className="space-y-4">
        {/* Audio Upload */}
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Music className="w-4 h-4 text-primary" />
            Audio File
          </div>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
            onClick={() => audioInputRef.current?.click()}
            disabled={loading || !currentProject}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {currentProject?.audio_file_path ? "Change Song" : "Upload Song (MP3, WAV)"}
          </Button>
          {currentProject?.audio_file_path && (
            <div className="text-xs text-primary font-mono truncate">
              ✓ Audio uploaded
            </div>
          )}
        </Card>

        {/* Characters Upload */}
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="w-4 h-4 text-accent" />
            Characters (Optional)
          </div>
          <p className="text-xs text-muted-foreground">
            Upload photos or videos to feature in your music video
          </p>
          <input
            ref={characterInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime"
            onChange={handleCharacterUpload}
            className="hidden"
          />
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:border-accent/50 transition-all"
            onClick={() => characterInputRef.current?.click()}
            disabled={loading || !currentProject}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Add Character
          </Button>
          
          <CharactersGallery />
        </Card>

        {/* BPM and Mood Controls */}
        <Card className="glass-card p-4 space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Gauge className="w-4 h-4 text-primary" />
                BPM (Beats Per Minute)
              </Label>
              <Input
                type="number"
                min="1"
                max="300"
                placeholder="Auto-detected from audio..."
                value={currentProject?.bpm || ""}
                onChange={(e) => handleBpmChange(e.target.value)}
                className="bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                disabled={!currentProject}
              />
              {currentProject?.bpm && (
                <div className="text-xs text-primary mt-1">
                  ✓ {currentProject.bpm} BPM
                </div>
              )}
            </div>
            
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Smile className="w-4 h-4 text-accent" />
                Mood
              </Label>
              <Input
                type="text"
                placeholder="Auto-detected from audio..."
                value={currentProject?.mood || ""}
                onChange={(e) => handleMoodChange(e.target.value)}
                className="bg-background/50 border-border/50 focus:border-accent/50 transition-all"
                disabled={!currentProject}
              />
              {currentProject?.mood && (
                <div className="text-xs text-accent mt-1">
                  ✓ {currentProject.mood}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Lyrics Input */}
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText className="w-4 h-4 text-secondary" />
            Lyrics
          </div>
          <Textarea
            placeholder="Lyrics will auto-extract from audio, or paste manually..."
            value={currentProject?.lyrics || ""}
            onChange={(e) => handleLyricsChange(e.target.value)}
            className="min-h-[200px] bg-background/50 border-border/50 focus:border-primary/50 transition-all"
            disabled={!currentProject}
          />
          {currentProject?.lyrics && (
            <div className="text-xs text-secondary">
              ✓ {currentProject.lyrics.split('\n').length} lines
            </div>
          )}
        </Card>

        {!currentProject && (
          <Card className="glass-card p-4 bg-muted/30">
            <p className="text-sm text-muted-foreground text-center">
              Click "New Project" to get started
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
