import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, GripVertical } from "lucide-react";

export const ArtistGalleryManager = () => {
  const [gallery, setGallery] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      loadGallery(user.id);
    }
  };

  const loadGallery = async (artistId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("artist_gallery")
      .select("*")
      .eq("artist_id", artistId)
      .order("display_order", { ascending: true });

    if (!error && data) {
      const galleryWithUrls = data.map(item => ({
        ...item,
        imageUrl: supabase.storage.from("artist-gallery").getPublicUrl(item.image_path).data.publicUrl
      }));
      setGallery(galleryWithUrls);
    }
    setLoading(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;

    setUploadingGallery(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("artist-gallery")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("artist_gallery")
        .insert({
          artist_id: user.id,
          image_path: fileName,
          caption: newCaption || null,
          display_order: gallery.length
        });

      if (dbError) throw dbError;

      toast.success("Photo added to gallery");
      setNewCaption("");
      loadGallery(user.id);
      
      // Reset file input
      e.target.value = '';
    } catch (error: any) {
      toast.error("Failed to upload photo: " + error.message);
    } finally {
      setUploadingGallery(false);
    }
  };

  const deleteGalleryPhoto = async (photoId: string, imagePath: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      await supabase.storage.from("artist-gallery").remove([imagePath]);
      await supabase.from("artist_gallery").delete().eq("id", photoId);
      toast.success("Photo deleted");
      if (user) loadGallery(user.id);
    } catch (error: any) {
      toast.error("Failed to delete photo: " + error.message);
    }
  };

  const updateCaption = async (photoId: string, newCaption: string) => {
    try {
      await supabase
        .from("artist_gallery")
        .update({ caption: newCaption })
        .eq("id", photoId);
      
      toast.success("Caption updated");
      if (user) loadGallery(user.id);
    } catch (error: any) {
      toast.error("Failed to update caption: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading gallery...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="glass-card-premium p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Photo to Gallery
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload photos that will be visible in your public artist profile gallery
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Textarea
              id="caption"
              placeholder="Add a caption for this photo..."
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          <div>
            <label>
              <Button 
                variant="default" 
                disabled={uploadingGallery} 
                className="w-full sm:w-auto shadow-glow"
                asChild
              >
                <span className="cursor-pointer flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  {uploadingGallery ? "Uploading..." : "Choose Photo"}
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleGalleryUpload}
                className="hidden"
                disabled={uploadingGallery}
              />
            </label>
          </div>
        </div>
      </Card>

      {/* Gallery Management */}
      <Card className="glass-card-premium p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Your Gallery ({gallery.length} photos)
        </h3>
        
        {gallery.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No photos in your gallery yet</p>
            <p className="text-sm mt-2">Upload photos to showcase in your artist profile</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map(photo => (
              <Card key={photo.id} className="glass-card overflow-hidden group relative">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || "Gallery photo"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                
                <div className="p-4 space-y-3">
                  <Textarea
                    value={photo.caption || ""}
                    onChange={(e) => {
                      const updated = gallery.map(p => 
                        p.id === photo.id ? { ...p, caption: e.target.value } : p
                      );
                      setGallery(updated);
                    }}
                    onBlur={(e) => updateCaption(photo.id, e.target.value)}
                    placeholder="Add a caption..."
                    className="resize-none text-sm"
                    rows={2}
                  />
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    onClick={() => deleteGalleryPhoto(photo.id, photo.image_path)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Delete Photo
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
