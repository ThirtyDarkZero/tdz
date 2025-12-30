import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Music, ListMusic, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AddToPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    id: string;
    title: string;
    artist_name: string;
    youtubeId?: string;
    thumbnail?: string;
  } | null;
}

interface Playlist {
  id: string;
  name: string;
  cover_image_path?: string;
  track_count?: number;
}

export function AddToPlaylistDialog({ open, onOpenChange, track }: AddToPlaylistDialogProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      loadPlaylists();
    }
  }, [open, user]);

  const loadPlaylists = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          id,
          name,
          cover_image_path,
          playlist_tracks(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPlaylists(data?.map(p => ({
        id: p.id,
        name: p.name,
        cover_image_path: p.cover_image_path,
        track_count: (p.playlist_tracks as any)?.[0]?.count || 0,
      })) || []);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name: newPlaylistName.trim(),
          is_public: true,
        })
        .select()
        .single();

      if (error) throw error;

      setPlaylists([{ id: data.id, name: data.name, track_count: 0 }, ...playlists]);
      setNewPlaylistName("");
      setShowCreate(false);
      toast.success(`Created "${data.name}"`);

      // Immediately add track to new playlist
      if (track) {
        await addTrackToPlaylist(data.id);
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const addTrackToPlaylist = async (playlistId: string) => {
    if (!track || !user) return;

    setAddingToPlaylist(playlistId);
    try {
      // Get current max position
      const { data: posData } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (posData?.[0]?.position || 0) + 1;

      // For YouTube/external tracks, store in virtual_tracks first
      if (track.youtubeId) {
        const virtualId = `youtube:${track.youtubeId}`;
        
        // Insert into virtual_tracks (upsert)
        await supabase
          .from('virtual_tracks')
          .upsert({
            id: virtualId,
            title: track.title,
            artist_name: track.artist_name,
            youtube_id: track.youtubeId,
            thumbnail: track.thumbnail,
            source: 'youtube'
          }, { onConflict: 'id' });

        // Check if already in playlist
        const { data: existing } = await supabase
          .from('playlist_tracks')
          .select('id')
          .eq('playlist_id', playlistId)
          .eq('track_id', virtualId)
          .maybeSingle();

        if (existing) {
          toast.info('Track already in playlist');
          setAddingToPlaylist(null);
          return;
        }

        // Store in localStorage as backup for loading
        const ytPlaylists = JSON.parse(localStorage.getItem('yt_playlist_tracks') || '{}');
        if (!ytPlaylists[playlistId]) {
          ytPlaylists[playlistId] = [];
        }
        // Remove if already exists
        ytPlaylists[playlistId] = ytPlaylists[playlistId].filter((t: any) => t.id !== virtualId);
        ytPlaylists[playlistId].push({
          id: virtualId,
          title: track.title,
          artist_name: track.artist_name,
          youtubeId: track.youtubeId,
          thumbnail: track.thumbnail,
          position: nextPosition,
        });
        localStorage.setItem('yt_playlist_tracks', JSON.stringify(ytPlaylists));

        toast.success(`Added "${track.title}" to playlist`);
        onOpenChange(false);
        setAddingToPlaylist(null);
        return;
      }

      // Native TDZ track - check if already exists
      const { data: existing } = await supabase
        .from('playlist_tracks')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('track_id', track.id)
        .maybeSingle();

      if (existing) {
        toast.info('Track already in playlist');
        setAddingToPlaylist(null);
        return;
      }

      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: track.id,
          position: nextPosition,
          added_by: user.id,
        });

      if (error) throw error;

      toast.success(`Added "${track.title}" to playlist`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding to playlist:', error);
      toast.error('Failed to add to playlist');
    } finally {
      setAddingToPlaylist(null);
    }
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#141414] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Sign in Required</DialogTitle>
          </DialogHeader>
          <p className="text-white/60">Please sign in to add tracks to playlists.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add to Playlist</DialogTitle>
        </DialogHeader>

        {track && (
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg mb-4">
            <div className="w-12 h-12 rounded bg-white/10 overflow-hidden flex-shrink-0">
              {track.thumbnail ? (
                <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-white/30" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{track.title}</p>
              <p className="text-sm text-white/50 truncate">{track.artist_name}</p>
            </div>
          </div>
        )}

        {/* Create new playlist */}
        {showCreate ? (
          <div className="flex gap-2 mb-4">
            <Input
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name..."
              className="bg-white/5 border-white/10 text-white"
              autoFocus
            />
            <Button
              onClick={handleCreatePlaylist}
              disabled={creating || !newPlaylistName.trim()}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreate(false);
                setNewPlaylistName("");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowCreate(true)}
            className="w-full mb-4 border-dashed border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create new playlist
          </Button>
        )}

        {/* Playlist list */}
        <ScrollArea className="max-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <ListMusic className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No playlists yet</p>
              <p className="text-sm">Create one to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => addTrackToPlaylist(playlist.id)}
                  disabled={addingToPlaylist === playlist.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
                    <ListMusic className="w-5 h-5 text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{playlist.name}</p>
                    <p className="text-xs text-white/40">{playlist.track_count || 0} tracks</p>
                  </div>
                  {addingToPlaylist === playlist.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                  ) : (
                    <Plus className="w-5 h-5 text-white/40" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}