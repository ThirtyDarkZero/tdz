import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Music, FileText, Image } from "lucide-react";
import { useState } from "react";

export const UploadPanel = () => {
  const [audioFile, setAudioFile] = useState<string>("");
  const [lyrics, setLyrics] = useState<string>("");

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
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Song (MP3, WAV)
          </Button>
          {audioFile && (
            <div className="text-xs text-primary font-mono truncate">
              {audioFile}
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
            placeholder="Paste your lyrics here or upload .txt file..."
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            className="min-h-[200px] bg-background/50 border-border/50 focus:border-primary/50 transition-all"
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
          >
            <Upload className="w-3 h-3 mr-2" />
            Import from file
          </Button>
        </Card>

        {/* Visual References */}
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Image className="w-4 h-4 text-accent" />
            Visual References
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:border-accent/50 transition-all"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Reference Images
          </Button>
          <p className="text-xs text-muted-foreground">
            Optional: Add style references, mood boards, or character images
          </p>
        </Card>
      </div>
    </div>
  );
};
