import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Film, Loader2, Trash2 } from "lucide-react";

export const CanvasManager = () => {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTracks(data);
    }
    setLoading(false);
  };

  const handleCanvasUpload = async (trackId: string, file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error("Please upload a video file");
      return;
    }

    setUploading(trackId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload video to motion-covers bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${trackId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("motion-covers")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("motion-covers")
        .getPublicUrl(fileName);

      // Update track with canvas URL
      const track = tracks.find(t => t.id === trackId);
      const updatedAiTags = {
        ...track?.ai_tags,
        metadata: {
          ...track?.ai_tags?.metadata,
          isMotionCover: true,
          artworkUrl: publicUrl
        }
      };

      const { error: updateError } = await supabase
        .from("tracks")
        .update({ ai_tags: updatedAiTags })
        .eq("id", trackId);

      if (updateError) throw updateError;

      toast.success("Canvas uploaded successfully!");
      loadTracks();
    } catch (error: any) {
      console.error("Error uploading canvas:", error);
      toast.error("Failed to upload canvas");
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveCanvas = async (trackId: string) => {
    try {
      const track = tracks.find(t => t.id === trackId);
      const updatedAiTags = {
        ...track?.ai_tags,
        metadata: {
          ...track?.ai_tags?.metadata,
          isMotionCover: false,
          artworkUrl: null
        }
      };

      const { error } = await supabase
        .from("tracks")
        .update({ ai_tags: updatedAiTags })
        .eq("id", trackId);

      if (error) throw error;

      toast.success("Canvas removed");
      loadTracks();
    } catch (error: any) {
      console.error("Error removing canvas:", error);
      toast.error("Failed to remove canvas");
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading tracks...</div>;
  }

  return (
    <Card className="glass-card-premium">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 md:w-6 md:h-6" />
          <CardTitle className="text-lg md:text-xl">Canvas Manager</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Add looping visual art to your tracks (like Spotify Canvas). Videos should be 3-8 seconds, vertical format (9:16).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:space-y-4">
          {tracks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm md:text-base">
              No tracks yet. Upload your first track!
            </p>
          ) : (
            tracks.map(track => (
              <div key={track.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 md:p-4 rounded-lg border">
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                  <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {track.ai_tags?.metadata?.isMotionCover && track.ai_tags?.metadata?.artworkUrl ? (
                      <video 
                        src={track.ai_tags.metadata.artworkUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                        <Film className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm md:text-base truncate">{track.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{track.artist_name}</p>
                  </div>
                  {track.ai_tags?.metadata?.isMotionCover && (
                    <Badge className="bg-primary/20 text-xs hidden sm:inline-flex">Canvas Active</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {track.ai_tags?.metadata?.isMotionCover ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveCanvas(track.id)}
                      className="flex-1 sm:flex-initial text-xs md:text-sm"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      Remove
                    </Button>
                  ) : null}
                  <label className="flex-1 sm:flex-initial">
                    <Button 
                      size="sm" 
                      disabled={uploading === track.id}
                      asChild
                      className="cursor-pointer w-full text-xs md:text-sm"
                    >
                      <span>
                        {uploading === track.id ? (
                          <>
                            <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 animate-spin" />
                            <span className="hidden sm:inline">Uploading...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                            <span className="hidden sm:inline">{track.ai_tags?.metadata?.isMotionCover ? "Replace" : "Upload"} Canvas</span>
                            <span className="sm:hidden">{track.ai_tags?.metadata?.isMotionCover ? "Replace" : "Upload"}</span>
                          </>
                        )}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="video/*,image/*,.heic,.heif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCanvasUpload(track.id, file);
                      }}
                      className="hidden"
                      disabled={uploading === track.id}
                    />
                  </label>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
