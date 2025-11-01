import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Music, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddToPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
}

export const AddToPlaylistDialog = ({
  open,
  onOpenChange,
  trackId,
}: AddToPlaylistDialogProps) => {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [addedPlaylists, setAddedPlaylists] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      loadUser();
    }
  }, [open]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      loadPlaylists(user.id);
      checkExistingPlaylists(user.id);
    }
  };

  const loadPlaylists = async (userId: string) => {
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setPlaylists(data);
    }
  };

  const checkExistingPlaylists = async (userId: string) => {
    const { data } = await supabase
      .from("playlist_tracks")
      .select("playlist_id")
      .eq("track_id", trackId);

    if (data) {
      setAddedPlaylists(new Set(data.map(pt => pt.playlist_id)));
    }
  };

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;

    setCreatingPlaylist(true);
    const { data: playlist, error } = await supabase
      .from("playlists")
      .insert({
        user_id: user.id,
        name: newPlaylistName.trim(),
        is_public: false,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create playlist");
    } else {
      await addToPlaylist(playlist.id);
      setNewPlaylistName("");
      loadPlaylists(user.id);
    }
    setCreatingPlaylist(false);
  };

  const addToPlaylist = async (playlistId: string) => {
    if (!user) return;

    // Get the highest position in the playlist
    const { data: existingTracks } = await supabase
      .from("playlist_tracks")
      .select("position")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existingTracks && existingTracks.length > 0 
      ? existingTracks[0].position + 1 
      : 0;

    const { error } = await supabase
      .from("playlist_tracks")
      .insert({
        playlist_id: playlistId,
        track_id: trackId,
        position: nextPosition,
        added_by: user.id,
      });

    if (error) {
      if (error.code === "23505") {
        toast.info("Track already in playlist");
      } else {
        toast.error("Failed to add track");
      }
    } else {
      toast.success("Added to playlist!");
      setAddedPlaylists(prev => new Set(prev).add(playlistId));
    }
  };

  const removeFromPlaylist = async (playlistId: string) => {
    const { error } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("track_id", trackId);

    if (error) {
      toast.error("Failed to remove from playlist");
    } else {
      toast.success("Removed from playlist");
      setAddedPlaylists(prev => {
        const next = new Set(prev);
        next.delete(playlistId);
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
          <DialogDescription>
            Add this track to one of your playlists or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Playlist */}
          <div className="flex gap-2">
            <Input
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="New playlist name"
              onKeyPress={(e) => e.key === "Enter" && handleCreatePlaylist()}
            />
            <Button
              onClick={handleCreatePlaylist}
              disabled={!newPlaylistName.trim() || creatingPlaylist}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Existing Playlists */}
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {playlists.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No playlists yet. Create one above!
                </p>
              ) : (
                playlists.map((playlist) => {
                  const isAdded = addedPlaylists.has(playlist.id);
                  return (
                    <Button
                      key={playlist.id}
                      variant={isAdded ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() =>
                        isAdded
                          ? removeFromPlaylist(playlist.id)
                          : addToPlaylist(playlist.id)
                      }
                    >
                      {isAdded ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Music className="w-4 h-4 mr-2" />
                      )}
                      {playlist.name}
                    </Button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
