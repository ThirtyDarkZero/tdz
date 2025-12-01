import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MoreHorizontal, 
  ListPlus, 
  Heart, 
  ListMusic, 
  User, 
  Users, 
  Share2,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrackOptionsMenuProps {
  track: {
    id: string;
    title: string;
    artist_name: string;
    user_id?: string;
    artist_user_id?: string;
  };
  playlists: Array<{ id: string; name: string }>;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onAddToQueue?: () => void;
  onPlaylistUpdate?: () => void;
  variant?: "icon" | "dots";
}

export function TrackOptionsMenu({
  track,
  playlists,
  isLiked,
  onToggleLike,
  onAddToQueue,
  onPlaylistUpdate,
  variant = "dots"
}: TrackOptionsMenuProps) {
  const navigate = useNavigate();
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);

  const artistId = track.artist_user_id || track.user_id;

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      // Get current max position
      const { data: existing } = await supabase
        .from("playlist_tracks")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

      const { error } = await supabase
        .from("playlist_tracks")
        .insert({
          playlist_id: playlistId,
          track_id: track.id,
          position: nextPosition
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Track already in playlist");
        } else {
          throw error;
        }
      } else {
        toast.success(`Added "${track.title}" to playlist`);
        
        // Notify artist about playlist addition
        // This would be a real notification system in production
        onPlaylistUpdate?.();
      }
    } catch (error) {
      console.error("Error adding to playlist:", error);
      toast.error("Failed to add to playlist");
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: playlist, error } = await supabase
        .from("playlists")
        .insert({
          user_id: user.id,
          name: newPlaylistName.trim(),
          is_public: true
        })
        .select()
        .single();

      if (error) throw error;

      // Add track to new playlist
      await supabase
        .from("playlist_tracks")
        .insert({
          playlist_id: playlist.id,
          track_id: track.id,
          position: 0
        });

      toast.success(`Created playlist "${newPlaylistName}" with "${track.title}"`);
      setShowNewPlaylist(false);
      setNewPlaylistName("");
      onPlaylistUpdate?.();
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast.error("Failed to create playlist");
    } finally {
      setCreating(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/track/${track.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: track.title,
          text: `Listen to "${track.title}" by ${track.artist_name} on TDZ`,
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ListPlus className="w-4 h-4 mr-2" />
              Add to Playlist
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuItem onClick={() => setShowNewPlaylist(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Playlist
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {playlists.length === 0 ? (
                <DropdownMenuItem disabled>
                  No playlists yet
                </DropdownMenuItem>
              ) : (
                playlists.map((playlist) => (
                  <DropdownMenuItem 
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                  >
                    <ListMusic className="w-4 h-4 mr-2" />
                    {playlist.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem onClick={onToggleLike}>
            <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current text-red-500" : ""}`} />
            {isLiked ? "Remove from Liked" : "Save to Liked Songs"}
          </DropdownMenuItem>

          {onAddToQueue && (
            <DropdownMenuItem onClick={onAddToQueue}>
              <ListMusic className="w-4 h-4 mr-2" />
              Add to Queue
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {artistId && (
            <DropdownMenuItem onClick={() => navigate(`/artist/${artistId}`)}>
              <User className="w-4 h-4 mr-2" />
              Go to Artist
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => navigate(`/track/${track.id}`)}>
            <Users className="w-4 h-4 mr-2" />
            View Credits
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showNewPlaylist} onOpenChange={setShowNewPlaylist}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPlaylist(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlaylist} disabled={creating || !newPlaylistName.trim()}>
              {creating ? "Creating..." : "Create & Add Track"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
