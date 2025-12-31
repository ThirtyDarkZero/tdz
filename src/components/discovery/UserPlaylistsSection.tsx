import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Play, Plus, ListMusic, Lock, Globe, ChevronRight, 
  Music, Sparkles, Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image_path: string | null;
  track_count: number;
  play_count: number;
}

interface UserPlaylistsSectionProps {
  onPlaylistClick?: (playlistId: string) => void;
  onViewAll?: () => void;
}

export function UserPlaylistsSection({ onPlaylistClick, onViewAll }: UserPlaylistsSectionProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: true
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      loadPlaylists();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadPlaylists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_tracks(count)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const playlistsWithCount = (data || []).map(p => ({
        ...p,
        track_count: p.playlist_tracks?.[0]?.count || 0
      }));
      setPlaylists(playlistsWithCount);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !user) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_public: formData.is_public
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Created "${formData.name}"`);
      setFormData({ name: '', description: '', is_public: true });
      setShowCreateDialog(false);
      loadPlaylists();
      
      // Navigate to the new playlist
      if (data) {
        navigate(`/playlist/${data.id}`);
      }
    } catch (error: any) {
      toast.error('Failed to create playlist');
      console.error('Error creating playlist:', error);
    } finally {
      setCreating(false);
    }
  };

  const getCoverUrl = (path: string | null) => {
    if (!path) return null;
    return supabase.storage.from('playlist-covers').getPublicUrl(path).data.publicUrl;
  };

  if (!user) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <ListMusic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Your Playlists</h2>
              <p className="text-sm text-muted-foreground">Create and manage your collections</p>
            </div>
          </div>
        </div>
        <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border-dashed">
          <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sign in to create playlists</h3>
          <p className="text-muted-foreground mb-4">
            Build your own collections and save your favorite tracks
          </p>
          <Button onClick={() => navigate('/auth')} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Sign In
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <ListMusic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Your Playlists</h2>
            <p className="text-sm text-muted-foreground">{playlists.length} collections</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Playlist
          </Button>
          {playlists.length > 0 && (
            <Button variant="ghost" onClick={onViewAll} className="gap-2">
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="w-48 h-64 rounded-xl flex-shrink-0" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border-dashed">
          <ListMusic className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first playlist to start organizing your favorite tracks
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2 bg-gradient-to-r from-primary to-secondary">
            <Plus className="w-4 h-4" />
            Create Your First Playlist
          </Button>
        </Card>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {/* Create new playlist card */}
            <Card
              className="w-48 flex-shrink-0 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/30 backdrop-blur-sm border-dashed border-2 hover:border-primary/50"
              onClick={() => setShowCreateDialog(true)}
            >
              <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                <div className="text-center">
                  <Plus className="w-12 h-12 mx-auto mb-2 text-primary" />
                  <span className="text-sm font-medium">Create Playlist</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm">New Collection</h3>
                <p className="text-xs text-muted-foreground mt-1">Add your favorite tracks</p>
              </div>
            </Card>

            {/* Liked Songs pseudo-playlist */}
            <Card
              className="w-48 flex-shrink-0 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-sm border-pink-500/30"
              onClick={() => navigate('/liked-songs')}
            >
              <div className="relative aspect-square overflow-hidden flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600">
                <Heart className="w-16 h-16 text-white" fill="white" />
                <Button
                  size="icon"
                  className="absolute bottom-3 right-3 rounded-full h-12 w-12 bg-white text-pink-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                >
                  <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                </Button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm">Liked Songs</h3>
                <p className="text-xs text-muted-foreground mt-1">Your favorites</p>
              </div>
            </Card>

            {/* User playlists */}
            {playlists.map((playlist) => (
              <Card
                key={playlist.id}
                className="w-48 flex-shrink-0 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-border/50"
                onClick={() => {
                  if (onPlaylistClick) {
                    onPlaylistClick(playlist.id);
                  } else {
                    navigate(`/playlist/${playlist.id}`);
                  }
                }}
              >
                <div className="relative aspect-square overflow-hidden">
                  {playlist.cover_image_path ? (
                    <img
                      src={getCoverUrl(playlist.cover_image_path) || ''}
                      alt={playlist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                      <ListMusic className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button
                    size="icon"
                    className="absolute bottom-3 right-3 rounded-full h-12 w-12 bg-primary shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                  >
                    <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                  </Button>
                  <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm">
                    {playlist.is_public ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate text-sm">{playlist.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {playlist.track_count} tracks
                  </p>
                </div>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Create Playlist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Playlist Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Playlist"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What's this playlist about?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Playlist</Label>
                <p className="text-xs text-muted-foreground">
                  {formData.is_public ? 'Anyone can see this playlist' : 'Only you can see this playlist'}
                </p>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!formData.name.trim() || creating}
              className="gap-2"
            >
              {creating ? 'Creating...' : 'Create Playlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
