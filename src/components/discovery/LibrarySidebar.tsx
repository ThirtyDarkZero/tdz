import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Heart, 
  ListMusic, 
  Clock, 
  Plus,
  ChevronRight,
  Music,
  Lock,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";

interface LibrarySidebarProps {
  userId: string | null;
  likedTracksCount: number;
  onPlaylistSelect?: (playlistId: string) => void;
}

export function LibrarySidebar({ 
  userId, 
  likedTracksCount,
  onPlaylistSelect 
}: LibrarySidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole(user);
  const { hasFeature } = useSubscription(user);
  
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);

  // Artists always have playlist access, fans need subscription
  const isArtist = role === 'artist' || role === 'verified_artist' || role === 'manager';
  const canCreatePlaylists = isArtist || hasFeature('playlists');

  useEffect(() => {
    if (userId) {
      loadPlaylists();
      loadRecentlyPlayed();
    }
  }, [userId]);

  const loadPlaylists = async () => {
    if (!userId) return;
    
    const { data } = await supabase
      .from("playlists")
      .select("*, playlist_tracks(count)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (data) {
      setPlaylists(data);
    }
  };

  const loadRecentlyPlayed = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("listening_history")
      .select(`
        track_id,
        played_at,
        tracks:track_id (
          id,
          title,
          artist_name,
          album_cover_path
        )
      `)
      .eq("user_id", userId)
      .order("played_at", { ascending: false })
      .limit(5);

    if (data) {
      const uniqueTracks = data
        .filter(item => item.tracks)
        .reduce((acc: any[], item) => {
          if (!acc.find(t => t.id === item.tracks.id)) {
            acc.push({ ...item.tracks, played_at: item.played_at });
          }
          return acc;
        }, []);
      setRecentlyPlayed(uniqueTracks);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!canCreatePlaylists) {
      toast.error("Subscribe to create playlists", {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/auth?upgrade=true"),
        },
      });
      return;
    }
    
    if (!newPlaylistName.trim() || !userId) return;
    
    setCreating(true);
    try {
      const { error } = await supabase
        .from("playlists")
        .insert({
          user_id: userId,
          name: newPlaylistName.trim(),
          is_public: true
        });

      if (error) throw error;

      toast.success(`Created playlist "${newPlaylistName}"`);
      setShowNewPlaylist(false);
      setNewPlaylistName("");
      loadPlaylists();
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast.error("Failed to create playlist");
    } finally {
      setCreating(false);
    }
  };
  
  const handlePlusClick = () => {
    if (!canCreatePlaylists) {
      toast.error("Subscribe to create playlists ($12/mo)", {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/auth?upgrade=true"),
        },
      });
      return;
    }
    setShowNewPlaylist(true);
  };

  if (!userId) {
    return (
      <Card className="glass-card p-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Sign in to access your library
        </p>
        <Button size="sm" onClick={() => navigate("/auth")}>
          Sign In
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Your Collection</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={handlePlusClick}
        >
          {canCreatePlaylists ? (
            <Plus className="w-4 h-4" />
          ) : (
            <Lock className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      
      {/* Subscription notice for playlist creation */}
      {!canCreatePlaylists && (
        <Card className="p-3 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Join to curate playlists</span>
          </div>
        </Card>
      )}

      {/* Liked Songs */}
      <Card 
        className="glass-card p-3 cursor-pointer hover:border-primary/50 transition-all group"
        onClick={() => navigate("/profile")}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" fill="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">Songs That Move You</p>
            <p className="text-xs text-muted-foreground">{likedTracksCount} resonated</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Card>

      {/* Playlists */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">Playlists</h4>
          <Badge variant="outline" className="text-xs">{playlists.length}</Badge>
        </div>
        
        <ScrollArea className="h-48">
          <div className="space-y-1">
            {playlists.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No playlists yet. Create one!
              </p>
            ) : (
              playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-accent/10 cursor-pointer group"
                  onClick={() => onPlaylistSelect?.(playlist.id)}
                >
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <ListMusic className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{playlist.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {playlist.playlist_tracks?.[0]?.count || 0} tracks
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Recently Explored */}
      {recentlyPlayed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-muted-foreground">Your Journey</h4>
          </div>
          
          <div className="space-y-1">
            {recentlyPlayed.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-accent/10 cursor-pointer"
                onClick={() => navigate(`/track/${track.id}`)}
              >
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <Music className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              {creating ? "Creating..." : "Create Playlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
