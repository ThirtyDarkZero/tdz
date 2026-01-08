import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, ListMusic, MoreVertical, Pencil, Trash2, 
  Globe, Lock, Play, Music, Sparkles, Upload, Video, Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image_path: string | null;
  play_count: number;
  created_at: string;
  track_count?: number;
  motion_cover?: {
    media_path: string;
    media_type: string;
  } | null;
}

interface PlaylistManagerProps {
  userId: string | null;
  onPlaylistSelect?: (playlistId: string) => void;
  onRefresh?: () => void;
}

export function PlaylistManager({ userId, onPlaylistSelect, onRefresh }: PlaylistManagerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole(user);
  const { hasFeature } = useSubscription(user);
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_public: true
  });
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [motionCoverFile, setMotionCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [motionCoverPreview, setMotionCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const motionInputRef = useRef<HTMLInputElement>(null);
  
  // Artists always have playlist access, fans need subscription
  const isArtist = role === 'artist' || role === 'verified_artist' || role === 'manager';
  const canCreatePlaylists = isArtist || hasFeature('playlists');

  useEffect(() => {
    if (userId) {
      loadPlaylists();
    }
  }, [userId]);

  const loadPlaylists = async () => {
    if (!userId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("playlists")
      .select(`
        *,
        playlist_tracks(count),
        playlist_motion_covers(media_path, media_type)
      `)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading playlists:", error);
      toast.error("Failed to load playlists");
    } else {
      const playlistsWithCount = (data || []).map(p => ({
        ...p,
        track_count: p.playlist_tracks?.[0]?.count || 0,
        motion_cover: p.playlist_motion_covers?.[0] || null
      }));
      setPlaylists(playlistsWithCount);
    }
    setLoading(false);
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleMotionCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      toast.error("Please select a video file");
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video must be less than 50MB");
      return;
    }
    
    setMotionCoverFile(file);
    setMotionCoverPreview(URL.createObjectURL(file));
  };

  const uploadCoverImage = async (playlistId: string): Promise<string | null> => {
    if (!coverFile) return null;
    
    const ext = coverFile.name.split('.').pop();
    const filePath = `${playlistId}/cover.${ext}`;
    
    const { error } = await supabase.storage
      .from('playlist-covers')
      .upload(filePath, coverFile, { upsert: true });
    
    if (error) {
      console.error('Cover upload error:', error);
      return null;
    }
    
    return filePath;
  };

  const uploadMotionCover = async (playlistId: string): Promise<{ path: string; type: string } | null> => {
    if (!motionCoverFile) return null;
    
    const ext = motionCoverFile.name.split('.').pop();
    const filePath = `${playlistId}/motion-cover.${ext}`;
    
    const { error } = await supabase.storage
      .from('motion-covers')
      .upload(filePath, motionCoverFile, { upsert: true });
    
    if (error) {
      console.error('Motion cover upload error:', error);
      return null;
    }
    
    return { path: filePath, type: motionCoverFile.type };
  };

  const handleCreate = async () => {
    if (!canCreatePlaylists) {
      toast.error("Subscribe to create playlists ($12/mo)", {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/auth?upgrade=true"),
        },
      });
      return;
    }
    
    if (!formData.name.trim() || !userId) return;
    
    setSaving(true);
    const { data, error } = await supabase
      .from("playlists")
      .insert({
        user_id: userId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_public: formData.is_public
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create playlist");
      setSaving(false);
      return;
    }
    
    // Upload cover image if provided
    if (coverFile) {
      const coverPath = await uploadCoverImage(data.id);
      if (coverPath) {
        await supabase.from("playlists").update({ cover_image_path: coverPath }).eq("id", data.id);
      }
    }
    
    // Upload motion cover if provided
    if (motionCoverFile) {
      const motionData = await uploadMotionCover(data.id);
      if (motionData) {
        await supabase.from("playlist_motion_covers").insert({
          playlist_id: data.id,
          media_path: motionData.path,
          media_type: motionData.type
        });
      }
    }
    
    toast.success(`Created "${formData.name}"`);
    resetForm();
    setShowCreateDialog(false);
    loadPlaylists();
    onRefresh?.();
    setSaving(false);
  };
  
  const resetForm = () => {
    setFormData({ name: "", description: "", is_public: true });
    setCoverFile(null);
    setMotionCoverFile(null);
    setCoverPreview(null);
    setMotionCoverPreview(null);
  };
  
  const handleCreateClick = () => {
    if (!canCreatePlaylists) {
      toast.error("Subscribe to create playlists ($12/mo)", {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/auth?upgrade=true"),
        },
      });
      return;
    }
    resetForm();
    setShowCreateDialog(true);
  };

  const handleEdit = async () => {
    if (!formData.name.trim() || !selectedPlaylist) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("playlists")
      .update({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_public: formData.is_public,
        updated_at: new Date().toISOString()
      })
      .eq("id", selectedPlaylist.id);

    if (error) {
      toast.error("Failed to update playlist");
    } else {
      toast.success("Playlist updated");
      setShowEditDialog(false);
      setSelectedPlaylist(null);
      loadPlaylists();
      onRefresh?.();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedPlaylist) return;
    
    setSaving(true);
    
    // First delete all tracks in the playlist
    await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", selectedPlaylist.id);

    // Then delete the playlist
    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", selectedPlaylist.id);

    if (error) {
      toast.error("Failed to delete playlist");
    } else {
      toast.success("Playlist deleted");
      setShowDeleteDialog(false);
      setSelectedPlaylist(null);
      loadPlaylists();
      onRefresh?.();
    }
    setSaving(false);
  };

  const openEditDialog = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setFormData({
      name: playlist.name,
      description: playlist.description || "",
      is_public: playlist.is_public ?? true
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setShowDeleteDialog(true);
  };

  if (!userId) {
    return (
      <Card className="glass-card p-8 text-center">
        <ListMusic className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">Sign in to manage playlists</p>
        <Button onClick={() => navigate("/auth")}>Sign In</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Your Playlists</h3>
        <Button 
          onClick={handleCreateClick}
          className={`gap-2 ${canCreatePlaylists ? 'bg-gradient-to-r from-primary to-secondary shadow-glow' : 'bg-muted'}`}
        >
          {canCreatePlaylists ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          Create Playlist
        </Button>
      </div>
      
      {/* Subscription notice */}
      {!canCreatePlaylists && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm">Subscribe to create unlimited playlists</span>
            </div>
            <Button size="sm" onClick={() => navigate("/auth?upgrade=true")} className="gap-1">
              <Sparkles className="w-3 h-3" />
              $12/mo
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="glass-card p-4 animate-pulse">
              <div className="aspect-square rounded-lg bg-muted mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <Card className="glass-card-premium p-12 text-center">
          <ListMusic className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 className="text-2xl font-bold mb-2">No Playlists Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first playlist to organize your favorite tracks
          </p>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-primary to-secondary shadow-glow"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Playlist
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <Card 
              key={playlist.id} 
              className="glass-card-premium p-4 hover:border-primary/50 transition-all hover-lift cursor-pointer group"
              onClick={() => onPlaylistSelect?.(playlist.id)}
            >
              <div className="relative">
                <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 mb-3 flex items-center justify-center overflow-hidden">
                  {playlist.motion_cover?.media_path ? (
                    <video
                      src={supabase.storage.from("motion-covers").getPublicUrl(playlist.motion_cover.media_path).data.publicUrl}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : playlist.cover_image_path ? (
                    <img 
                      src={supabase.storage.from("playlist-covers").getPublicUrl(playlist.cover_image_path).data.publicUrl}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ListMusic className="w-12 h-12 text-primary-foreground/50" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="icon" className="rounded-full h-12 w-12">
                      <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                    </Button>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(playlist);
                    }}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Playlist
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(playlist);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Playlist
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <h4 className="font-bold truncate mb-1">{playlist.name}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{playlist.track_count || 0} tracks</span>
                <span>•</span>
                {playlist.is_public ? (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Add a name and description for your playlist
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Awesome Playlist"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What's this playlist about?"
                rows={3}
              />
            </div>
            
            {/* Cover Image Upload */}
            <div>
              <Label>Cover Image</Label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                onChange={handleCoverSelect}
                className="hidden"
              />
              <div 
                onClick={() => coverInputRef.current?.click()}
                className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" className="w-24 h-24 mx-auto rounded-lg object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm">Click to upload cover image</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Motion Cover Upload */}
            <div>
              <Label>Motion Cover (Video)</Label>
              <input
                ref={motionInputRef}
                type="file"
                accept="video/*"
                onChange={handleMotionCoverSelect}
                className="hidden"
              />
              <div 
                onClick={() => motionInputRef.current?.click()}
                className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {motionCoverPreview ? (
                  <video src={motionCoverPreview} className="w-24 h-24 mx-auto rounded-lg object-cover" autoPlay loop muted />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Video className="w-8 h-8" />
                    <span className="text-sm">Click to upload motion cover</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Public Playlist</Label>
                <p className="text-sm text-muted-foreground">Others can find and follow this playlist</p>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formData.name.trim()}>
              {saving ? "Creating..." : "Create Playlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Public Playlist</Label>
                <p className="text-sm text-muted-foreground">Others can find and follow</p>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving || !formData.name.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Playlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPlaylist?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete Playlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
