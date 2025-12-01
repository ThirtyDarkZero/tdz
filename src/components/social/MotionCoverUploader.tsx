import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Video, 
  Sparkles, 
  X, 
  Check,
  Loader2,
  Film
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MotionCoverUploaderProps {
  playlistId: string;
  currentCover?: string | null;
  onUploadComplete?: (path: string) => void;
  className?: string;
}

export function MotionCoverUploader({ 
  playlistId, 
  currentCover, 
  onUploadComplete,
  className 
}: MotionCoverUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validTypes = ['video/mp4', 'video/webm', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload MP4, WebM, GIF, or WebP files',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive'
      });
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Upload file
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Please sign in', variant: 'destructive' });
      setUploading(false);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${playlistId}/motion-cover.${fileExt}`;

    // Determine media type
    let mediaType = 'video';
    if (file.type === 'image/gif') mediaType = 'gif';
    else if (file.type === 'image/webp') mediaType = 'animated_webp';

    try {
      // Simulate progress (actual progress would need XHR or fetch with progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('motion-covers')
        .upload(fileName, file, { upsert: true });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase
        .from('playlist_motion_covers')
        .upsert({
          playlist_id: playlistId,
          media_path: fileName,
          media_type: mediaType,
          is_ai_generated: false
        });

      if (dbError) throw dbError;

      setProgress(100);
      toast({ title: 'Motion cover uploaded!' });
      onUploadComplete?.(fileName);
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('playlist_motion_covers')
      .delete()
      .eq('playlist_id', playlistId);

    setPreview(null);
    toast({ title: 'Motion cover removed' });
  };

  const getMotionCoverUrl = (path: string) => {
    return supabase.storage.from('motion-covers').getPublicUrl(path).data.publicUrl;
  };

  return (
    <Card className={cn("bg-card/50 backdrop-blur-sm border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          Motion Cover
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Area */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-accent/30 border border-border/50">
          {preview || currentCover ? (
            <>
              {(preview || currentCover)?.includes('gif') || (preview || currentCover)?.includes('webp') ? (
                <img 
                  src={preview || (currentCover && getMotionCoverUrl(currentCover))} 
                  alt="Motion cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  src={preview || (currentCover && getMotionCoverUrl(currentCover))} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Video className="w-12 h-12 mb-2" />
              <p className="text-sm">No motion cover</p>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Upload Button */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.webm,.gif,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload Motion Cover
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            disabled={uploading}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>
        </div>

        {/* Format Info */}
        <p className="text-xs text-muted-foreground text-center">
          Supports MP4, WebM, GIF, WebP • Max 10MB
        </p>
      </CardContent>
    </Card>
  );
}
