import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Music, FileText, Loader2, User } from "lucide-react";
import { useRef } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

export const UploadPanel = () => {
  const { currentProject, updateProject, uploadAudio, uploadAITwin, loading } = useProject();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const twinInputRef = useRef<HTMLInputElement>(null);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    await uploadAudio(file);
  };

  const handleTwinUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload an image (JPG, PNG, WEBP) or video (MP4, MOV)');
      return;
    }

    await uploadAITwin(file);
  };

  const handleLyricsChange = async (lyrics: string) => {
    if (currentProject) {
      await updateProject({ lyrics });
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

        {/* AI Twin Upload */}
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="w-4 h-4 text-accent" />
            AI Twin (Optional)
          </div>
          <p className="text-xs text-muted-foreground">
            Upload your photo or video to appear in the music video
          </p>
          <input
            ref={twinInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime"
            onChange={handleTwinUpload}
            className="hidden"
          />
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:border-accent/50 transition-all"
            onClick={() => twinInputRef.current?.click()}
            disabled={loading || !currentProject}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {currentProject?.ai_twin_image_path ? "Change AI Twin" : "Upload Photo/Video"}
          </Button>
          {currentProject?.ai_twin_image_path && (
            <div className="text-xs text-accent font-mono truncate">
              ✓ AI Twin uploaded
            </div>
          )}
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
