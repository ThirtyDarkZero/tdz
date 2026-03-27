import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Play, Pause, Clock, MoreHorizontal, 
  Globe, Lock, Shuffle, Heart, Share2, Pencil, Trash2, Plus
} from "lucide-react";
import { toast } from "sonner";
import { MotionCover } from "@/components/MotionCover";
import tdzLogo from "@/assets/tdz-logo.png";
import { usePlayer } from "@/contexts/PlayerContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface PlaylistTrack {
  id: string;
  position: number;
  track_id: string | null;
  virtual_track_id: string | null;
  // Resolved data
  resolvedId: string;
  resolvedTitle: string;
  resolvedArtist: string;
  resolvedDuration: number;
  resolvedThumbnail: string | null;
  resolvedYoutubeId?: string;
  resolvedSource: 'tdz' | 'youtube';
}

export default function PlaylistDetail() {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying, addToQueue } = usePlayer();
  const [playlist, setPlaylist] = useState<any>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadPlaylistData();
  }, [playlistId]);

  const loadPlaylistData = async () => {
    if (!playlistId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Load playlist
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .single();

      if (playlistError) throw playlistError;
      setPlaylist(playlistData);
      setIsOwner(user?.id === playlistData.user_id);

      // Load playlist_tracks rows (includes track_id OR virtual_track_id)
      const { data: ptData, error: ptError } = await supabase
        .from("playlist_tracks")
        .select("id, position, track_id, virtual_track_id")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });

      if (ptError) throw ptError;

      const rows = ptData || [];

      // Gather IDs for batch fetches
      const nativeIds = rows.filter(r => r.track_id).map(r => r.track_id!);
      const virtualIds = rows.filter(r => r.virtual_track_id).map(r => r.virtual_track_id!);

      // Fetch native tracks
      let nativeMap: Record<string, any> = {};
      if (nativeIds.length > 0) {
        const { data: nativeTracks } = await supabase
          .from("tracks")
          .select("id, title, artist_name, duration, album_cover_path, album_cover_bucket, motion_cover_path, motion_cover_bucket, file_path")
          .in("id", nativeIds);
        for (const t of nativeTracks || []) {
          nativeMap[t.id] = t;
        }
      }

      // Fetch virtual tracks
      let virtualMap: Record<string, any> = {};
      if (virtualIds.length > 0) {
        const { data: virtualTracks } = await supabase
          .from("virtual_tracks")
          .select("*")
          .in("id", virtualIds);
        for (const vt of virtualTracks || []) {
          virtualMap[vt.id] = vt;
        }
      }

      // Resolve each row
      const resolved: PlaylistTrack[] = [];
      for (const row of rows) {
        if (row.track_id && nativeMap[row.track_id]) {
          const t = nativeMap[row.track_id];
          resolved.push({
            id: row.id,
            position: row.position,
            track_id: row.track_id,
            virtual_track_id: null,
            resolvedId: t.id,
            resolvedTitle: t.title,
            resolvedArtist: t.artist_name,
            resolvedDuration: t.duration || 0,
            resolvedThumbnail: t.album_cover_path,
            resolvedSource: 'tdz',
          });
        } else if (row.virtual_track_id && virtualMap[row.virtual_track_id]) {
          const vt = virtualMap[row.virtual_track_id];
          resolved.push({
            id: row.id,
            position: row.position,
            track_id: null,
            virtual_track_id: row.virtual_track_id,
            resolvedId: vt.id,
            resolvedTitle: vt.title,
            resolvedArtist: vt.artist_name,
            resolvedDuration: vt.duration || 0,
            resolvedThumbnail: vt.thumbnail,
            resolvedYoutubeId: vt.youtube_id,
            resolvedSource: 'youtube',
          });
        }
      }
      setTracks(resolved);

    } catch (error: any) {
      console.error("Error loading playlist:", error);
      toast.error("Failed to load playlist");
    } finally {
      setLoading(false);
    }
  };

  const removeTrack = async (playlistTrackId: string) => {
    if (!playlistId || !isOwner) return;

    const { error } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("id", playlistTrackId);

    if (error) {
      toast.error("Failed to remove track");
    } else {
      toast.success("Track removed from playlist");
      loadPlaylistData();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = tracks.reduce((acc, t) => acc + t.resolvedDuration, 0);
  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} hr ${mins} min`;
    }
    return `${mins} min`;
  };

  const handlePlayTrack = (item: PlaylistTrack, startIndex: number) => {
    const normalizedTrack = {
      id: item.resolvedId,
      title: item.resolvedTitle,
      artist_name: item.resolvedArtist,
      duration: item.resolvedDuration,
      file_path: '',
      play_count: 0,
      source: item.resolvedSource,
      youtubeId: item.resolvedYoutubeId,
      thumbnail: item.resolvedThumbnail,
      album_cover_path: item.resolvedThumbnail,
    };
    
    const remainingTracks = tracks.slice(startIndex + 1).map(t => ({
      id: t.resolvedId,
      title: t.resolvedTitle,
      artist_name: t.resolvedArtist,
      duration: t.resolvedDuration,
      file_path: '',
      play_count: 0,
      source: t.resolvedSource,
      youtubeId: t.resolvedYoutubeId,
      thumbnail: t.resolvedThumbnail,
      album_cover_path: t.resolvedThumbnail,
    }));

    playTrack(normalizedTrack as any, [normalizedTrack, ...remainingTracks] as any);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      handlePlayTrack(tracks[0], 0);
      toast.success(`Playing "${playlist.name}"`);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      const normalizedTracks = shuffled.map(t => ({
        id: t.resolvedId,
        title: t.resolvedTitle,
        artist_name: t.resolvedArtist,
        duration: t.resolvedDuration,
        file_path: '',
        play_count: 0,
        source: t.resolvedSource,
        youtubeId: t.resolvedYoutubeId,
        thumbnail: t.resolvedThumbnail,
        album_cover_path: t.resolvedThumbnail,
      }));
      playTrack(normalizedTracks[0] as any, normalizedTracks as any);
      toast.success('Shuffling playlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading playlist...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Playlist Not Found</h1>
        <Button onClick={() => navigate("/discover")}>Back to Discover</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card-premium border-b neon-border-strong shadow-glow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <img src={tdzLogo} alt="TDZ" className="h-6 sm:h-8 w-auto" />
          </div>
        </div>
      </header>

      {/* Playlist Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Playlist Cover */}
          <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-secondary/30 shadow-glow flex-shrink-0 mx-auto sm:mx-0">
            {playlist.cover_image_path ? (
              <img
                src={supabase.storage.from("playlist-covers").getPublicUrl(playlist.cover_image_path).data.publicUrl}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : tracks[0]?.resolvedThumbnail ? (
              <img
                src={tracks[0].resolvedThumbnail}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl">🎵</div>
              </div>
            )}
          </div>

          {/* Playlist Info */}
          <div className="flex-1 text-center sm:text-left">
            <Badge variant="outline" className="mb-2">
              {playlist.is_public ? (
                <><Globe className="w-3 h-3 mr-1" /> Public Playlist</>
              ) : (
                <><Lock className="w-3 h-3 mr-1" /> Private Playlist</>
              )}
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-muted-foreground mb-4">{playlist.description}</p>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
              <span>{tracks.length} tracks</span>
              <span>•</span>
              <span>{formatTotalDuration(totalDuration)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-6">
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-primary to-secondary shadow-glow"
                onClick={handlePlayAll}
                disabled={tracks.length === 0}
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Play All
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={handleShuffle}
                disabled={tracks.length === 0}
              >
                <Shuffle className="w-5 h-5" />
                Shuffle
              </Button>
              <Button variant="outline" size="icon" className="h-11 w-11">
                <Share2 className="w-5 h-5" />
              </Button>
              {isOwner && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-11 w-11 text-destructive hover:bg-destructive/10 border-destructive/30"
                  onClick={handleDeletePlaylist}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-32">
        <div className="space-y-1">
          {tracks.length === 0 ? (
            <Card className="glass-card-premium p-12 text-center">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-bold mb-2">No Tracks Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add some tracks to get started
              </p>
              <Button onClick={() => navigate("/discover")}>
                <Plus className="w-4 h-4 mr-2" />
                Browse Music
              </Button>
            </Card>
          ) : (
            tracks.map((item, index) => {
              const isCurrentTrack = currentTrack?.id === item.resolvedId;
              return (
              <Card 
                key={item.id}
                className={`glass-card p-3 hover:border-primary/50 transition-all cursor-pointer group ${isCurrentTrack ? 'border-primary/50 bg-primary/5' : ''}`}
                onClick={() => handlePlayTrack(item, index)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 text-center">
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="w-4 h-4 text-primary mx-auto" />
                    ) : (
                      <span className="text-sm text-muted-foreground group-hover:hidden">{index + 1}</span>
                    )}
                    <Play className="w-4 h-4 text-primary mx-auto hidden group-hover:block" fill="currentColor" />
                  </div>
                  <div className="w-12 h-12 rounded overflow-hidden bg-gradient-to-br from-primary/30 to-secondary/30 flex-shrink-0 relative">
                    {item.resolvedThumbnail ? (
                      <img src={item.resolvedThumbnail} alt={item.resolvedTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">🎵</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-5 h-5 text-white" fill="currentColor" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${isCurrentTrack ? 'text-primary' : ''}`}>{item.resolvedTitle}</h3>
                    <p className="text-sm text-muted-foreground truncate">{item.resolvedArtist}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(item.resolvedDuration)}
                  </span>
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrack(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove from Playlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </Card>
            );})
          )}
        </div>
      </div>
    </div>
  );
}
