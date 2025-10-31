import { useState } from "react";
import { Upload, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export const UploadTrack = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    
    if (!file) {
      toast({ title: "Please select a file", variant: "destructive" });
      return;
    }

    // Client-side file size check (200MB)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ 
        title: "File too large", 
        description: "Maximum file size is 200MB",
        variant: "destructive" 
      });
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Server-side validation
      const { data: validationResult, error: validationError } = await supabase.functions.invoke(
        'validate-track-upload',
        {
          body: {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            title: formData.get('title') as string || file.name.replace(/\.[^/.]+$/, ""),
            artistName: formData.get('artist') as string
          }
        }
      );

      if (validationError || !validationResult?.valid) {
        throw new Error(validationResult?.errors?.[0] || 'File validation failed');
      }

      setProgress(20);

      // Get audio duration
      const audio = new Audio();
      const duration = await new Promise<number>((resolve) => {
        audio.onloadedmetadata = () => resolve(Math.floor(audio.duration));
        audio.src = URL.createObjectURL(file);
      });

      // Upload file to storage
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${Date.now()}-${sanitizedFileName}`;
      
      setProgress(30);
      const { error: uploadError } = await supabase.storage
        .from('track-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      setProgress(60);

      // Call AI for metadata analysis
      setProgress(70);
      const { data: aiData } = await supabase.functions.invoke('analyze-track-metadata', {
        body: { filePath, fileName: file.name }
      });

      setProgress(85);
      
      // Create track record
      const { error: dbError } = await supabase.from('tracks').insert({
        user_id: user.id,
        title: (formData.get('title') as string || file.name.replace(/\.[^/.]+$/, "")).slice(0, 200),
        artist_name: (formData.get('artist') as string).slice(0, 100),
        duration,
        file_path: filePath,
        genre: formData.get('genre') as string,
        is_published: false,
        ai_tags: aiData?.tags || null,
        bpm: aiData?.bpm || null,
        key: aiData?.key || null,
        mood: aiData?.mood || null
      });

      if (dbError) throw dbError;

      setProgress(100);
      toast({ 
        title: "Track uploaded successfully!",
        description: "Your track is now in your library"
      });
      (e.target as HTMLFormElement).reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-6">
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <Label htmlFor="file" className="cursor-pointer">
          <div className="text-lg font-medium mb-2">Upload Track</div>
          <div className="text-sm text-muted-foreground mb-4">
            MP3, WAV, FLAC, M4A, AAC, OGG · Max 200MB
          </div>
          <Input
            id="file"
            name="file"
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/m4a,audio/aac,audio/ogg"
            className="hidden"
            disabled={uploading}
            required
          />
          <Button type="button" variant="outline" disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </Button>
        </Label>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center text-muted-foreground">
            Uploading... {Math.round(progress)}%
          </p>
        </div>
      )}

      <div className="grid gap-4">
        <div>
          <Label htmlFor="title">Track Title</Label>
          <Input id="title" name="title" placeholder="Song name" required />
        </div>

        <div>
          <Label htmlFor="artist">Artist Name</Label>
          <Input id="artist" name="artist" placeholder="Your artist name" required />
        </div>

        <div>
          <Label htmlFor="genre">Genre</Label>
          <Select name="genre">
            <SelectTrigger>
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pop">Pop</SelectItem>
              <SelectItem value="rock">Rock</SelectItem>
              <SelectItem value="hip-hop">Hip Hop</SelectItem>
              <SelectItem value="electronic">Electronic</SelectItem>
              <SelectItem value="jazz">Jazz</SelectItem>
              <SelectItem value="classical">Classical</SelectItem>
              <SelectItem value="country">Country</SelectItem>
              <SelectItem value="r&b">R&B</SelectItem>
              <SelectItem value="indie">Indie</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={uploading} className="w-full">
        {uploading ? "Uploading..." : "Upload Track"}
      </Button>
    </form>
  );
};