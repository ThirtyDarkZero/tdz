import { useState, useRef, useCallback } from "react";
import { Upload, Music, Sparkles, X, FileAudio, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

// Helper function to detect audio quality from file
const detectAudioQuality = (file: File): 'standard' | 'hd' | 'dolby_atmos' | 'hi_res' => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (['ec3', 'eac3', 'ac4'].includes(extension || '')) {
    return 'dolby_atmos';
  }
  
  if (['dsd', 'dsf', 'dff', 'aiff', 'aif'].includes(extension || '')) {
    return 'hi_res';
  }
  
  if (['flac', 'wav', 'alac'].includes(extension || '')) {
    return 'hd';
  }
  
  return 'standard';
};

export const UploadTrack = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [downloadPrice, setDownloadPrice] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/') || ['ec3', 'eac3', 'ac4', 'dsd', 'dsf', 'dff'].includes(file.name.split('.').pop()?.toLowerCase() || '')) {
        validateAndSetFile(file);
      } else {
        toast.error("Please select an audio file");
      }
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large - Maximum 500MB");
      return;
    }
    setSelectedFile(file);
    const quality = detectAudioQuality(file);
    toast.success(`Selected: ${file.name}`, {
      description: `Quality: ${quality.toUpperCase()} • ${(file.size / 1024 / 1024).toFixed(2)} MB`
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;

    if (!title?.trim() || !artist?.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate download price if provided
    const priceValue = downloadPrice ? parseFloat(downloadPrice) : null;
    if (downloadPrice && (isNaN(priceValue!) || priceValue! < 0.99)) {
      toast.error("Minimum download price is $0.99");
      return;
    }

    const audioQuality = detectAudioQuality(selectedFile);
    setUploading(true);
    setProgress(5);
    setProgressMessage("Authenticating...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated - please sign in");

      setProgress(10);
      setProgressMessage("Validating file...");

      // Client-side validation first
      const validExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'aiff', 'aif', 'ec3', 'eac3', 'ac4', 'dsd', 'dsf', 'dff', 'alac'];
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!extension || !validExtensions.includes(extension)) {
        throw new Error(`Unsupported format: .${extension}. Supported: ${validExtensions.join(', ')}`);
      }

      setProgress(20);
      setProgressMessage("Processing audio...");

      // Get audio duration
      const audio = new Audio();
      const duration = await new Promise<number>((resolve, reject) => {
        audio.onloadedmetadata = () => {
          URL.revokeObjectURL(audio.src);
          resolve(Math.floor(audio.duration));
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audio.src);
          reject(new Error("Could not read audio file"));
        };
        audio.src = URL.createObjectURL(selectedFile);
      });

      setProgress(30);
      setProgressMessage("Uploading to storage...");

      // Upload file
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${Date.now()}-${sanitizedFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('track-files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message || "Failed to upload file");
      }

      setProgress(60);
      setProgressMessage("Analyzing metadata with AI...");

      // AI analysis (optional - continue even if it fails)
      let aiData = null;
      try {
        const { data } = await supabase.functions.invoke('analyze-track-metadata', {
          body: { filePath, fileName: selectedFile.name }
        });
        aiData = data;
      } catch (err) {
        console.warn('AI analysis skipped:', err);
      }

      setProgress(80);
      setProgressMessage("Creating track record...");
      
      // Ensure artist profile exists
      const { data: existingProfile } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        await supabase.from('artist_profiles').insert({
          user_id: user.id,
          artist_name: artist.trim()
        });
      }

      // Create track record with download price
      const { error: dbError } = await supabase.from('tracks').insert({
        user_id: user.id,
        title: title.trim().slice(0, 200),
        artist_name: artist.trim().slice(0, 100),
        duration,
        file_path: filePath,
        genre: formData.get('genre') as string || null,
        is_published: false,
        audio_quality: audioQuality,
        ai_tags: aiData?.tags || null,
        bpm: aiData?.bpm || null,
        key: aiData?.key || null,
        mood: aiData?.mood || null,
        download_price: priceValue
      });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(dbError.message || "Failed to save track");
      }

      setProgress(100);
      setProgressMessage("Complete!");
      
      toast.success("Track uploaded successfully!", {
        description: priceValue 
          ? `Ready to publish! Download price: $${priceValue.toFixed(2)}`
          : "Your track is now in your library ready to publish"
      });
      
      setSelectedFile(null);
      setDownloadPrice("");
      (e.target as HTMLFormElement).reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error("Upload failed", {
        description: error.message || "An unexpected error occurred"
      });
    } finally {
      setUploading(false);
      setProgress(0);
      setProgressMessage("");
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-6">
      {/* Earnings Info Banner */}
      <Card className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
        <div className="flex items-center gap-3 text-sm">
          <DollarSign className="w-5 h-5 text-green-500" />
          <span>
            <span className="font-semibold text-green-500">$1.00 per stream</span> + 
            <span className="font-semibold text-blue-500"> 100% download revenue</span> when published
          </span>
        </div>
      </Card>

      {/* Drag & Drop Zone */}
      <div 
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer",
          isDragging ? "border-primary bg-primary/10 scale-[1.02]" : "border-primary/40 bg-gradient-to-br from-primary/5 via-transparent to-accent/5",
          selectedFile && "border-primary/60 bg-primary/5"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.ec3,.eac3,.ac4,.dsd,.dsf,.dff"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <FileAudio className="h-12 w-12 text-primary" />
              <div className="text-left">
                <p className="font-semibold text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {detectAudioQuality(selectedFile).toUpperCase()}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Music className="h-12 w-12 text-primary" />
              <Sparkles className="h-6 w-6 text-accent animate-pulse" />
            </div>
            <div className="text-lg font-medium mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {isDragging ? "Drop your audio file here!" : "Upload High-Fidelity Audio"}
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              <div className="font-semibold text-primary">✨ Dolby Atmos Supported</div>
              <div className="mt-1">EC-3, AC-4 • Immersive 3D Audio</div>
            </div>
            <div className="text-xs text-muted-foreground mb-4 space-y-1">
              <div>HD Audio: WAV, FLAC, ALAC • Up to 24-bit/192kHz</div>
              <div>Standard: MP3, AAC, OGG • Max 500MB</div>
            </div>
            <Button type="button" variant="default" disabled={uploading} className="bg-gradient-to-r from-primary to-accent shadow-glow">
              <Upload className="h-4 w-4 mr-2" />
              Choose Audio File
            </Button>
          </>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2 p-4 glass-card rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{progressMessage}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Form Fields */}
      <div className="grid gap-4">
        <div>
          <Label htmlFor="title">Track Title *</Label>
          <Input 
            id="title" 
            name="title" 
            placeholder="Song name" 
            required 
            disabled={uploading}
            defaultValue={selectedFile?.name.replace(/\.[^/.]+$/, "")}
          />
        </div>

        <div>
          <Label htmlFor="artist">Artist Name *</Label>
          <Input 
            id="artist" 
            name="artist" 
            placeholder="Your artist name" 
            required 
            disabled={uploading}
          />
        </div>

        <div>
          <Label htmlFor="genre">Genre</Label>
          <Select name="genre" disabled={uploading}>
            <SelectTrigger>
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hip Hop">Hip Hop</SelectItem>
              <SelectItem value="R&B">R&B</SelectItem>
              <SelectItem value="Pop">Pop</SelectItem>
              <SelectItem value="Rock">Rock</SelectItem>
              <SelectItem value="Electronic">Electronic</SelectItem>
              <SelectItem value="Jazz">Jazz</SelectItem>
              <SelectItem value="Classical">Classical</SelectItem>
              <SelectItem value="Country">Country</SelectItem>
              <SelectItem value="Reggae">Reggae</SelectItem>
              <SelectItem value="Indie">Indie</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Download Price Field */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
          <Label htmlFor="downloadPrice" className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            Download Price (Optional)
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">$</span>
            <Input 
              id="downloadPrice"
              type="number"
              step="0.01"
              min="0.99"
              placeholder="0.00"
              value={downloadPrice}
              onChange={(e) => setDownloadPrice(e.target.value)}
              disabled={uploading}
              className="max-w-32"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Set a price for fans to download your track (minimum $0.99). You keep 100% of download revenue.
            Leave blank for streaming-only.
          </p>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={uploading || !selectedFile} 
        className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-primary shadow-glow"
      >
        {uploading ? "Uploading..." : "Upload Track"}
      </Button>
    </form>
  );
};