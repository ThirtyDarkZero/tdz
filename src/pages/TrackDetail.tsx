import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Play, Heart, Share2, ArrowLeft, Music, Calendar, Clock, Home, Info, Radio, Activity, TrendingUp,
  MoreHorizontal, ListPlus, ListMusic, User, Plus
} from "lucide-react";
import { MusicPlayer } from "@/components/MusicPlayer";
import { TrackAnalytics } from "@/components/TrackAnalytics";
import { TrackAnalysisPanel } from "@/components/TrackAnalysisPanel";
import tdzLogo from "@/assets/tdz-logo.png";
import { MotionCover } from "@/components/MotionCover";
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

export default function TrackDetail() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const [track, setTrack] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    loadUser();
    loadTrack();
  }, [trackId]);

  useEffect(() => {
    if (user) {
      loadPlaylists();
    }
  }, [user]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      checkIfLiked(user.id);
    }
  };

  const loadTrack = async () => {
    const { data, error } = await supabase
      .from("tracks")
      .select(`
        *,
        albums (
          id,
          title,
          cover_art_path,
          is_published,
          release_date
        )
      `)
      .eq("id", trackId)
      .maybeSingle();

    if (error) {
      console.error("Error loading track:", error);
      toast.error("Failed to load track");
      return;
    }

    if (!data) {
      toast.error("Track not found");
      navigate("/discover");
      return;
    }

    // Check if track belongs to an unpublished album
    if (data.albums && data.albums.is_published === false && (!user || data.user_id !== user?.id)) {
      toast.error("This track is not available");
      navigate("/discover");
      return;
    }

    setTrack(data);
  };

  const checkIfLiked = async (userId: string) => {
    const { data } = await supabase
      .from("track_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("track_id", trackId)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const loadPlaylists = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("playlists")
      .select("id, name")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) setPlaylists(data);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
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
          track_id: trackId,
          position: nextPosition
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Track already in playlist");
        } else throw error;
      } else {
        toast.success(`Added to playlist`);
      }
    } catch (error) {
      toast.error("Failed to add to playlist");
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !user) return;
    try {
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

      await supabase
        .from("playlist_tracks")
        .insert({
          playlist_id: playlist.id,
          track_id: trackId,
          position: 0
        });

      toast.success(`Created playlist with this track`);
      setShowNewPlaylist(false);
      setNewPlaylistName("");
      loadPlaylists();
    } catch (error) {
      toast.error("Failed to create playlist");
    }
  };

  const handleAddToQueue = () => {
    if (track) {
      setQueue(prev => [...prev, track]);
      toast.success("Added to queue");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/track/${trackId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: track?.title,
          text: `Listen to "${track?.title}" by ${track?.artist_name} on TDZ`,
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

  const toggleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like tracks");
      return;
    }

    if (isLiked) {
      await supabase
        .from("track_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("track_id", trackId);
      toast.success("Removed from liked songs");
    } else {
      await supabase
        .from("track_likes")
        .insert({ user_id: user.id, track_id: trackId });
      toast.success("Added to liked songs");
    }
    setIsLiked(!isLiked);
  };

  const handlePlayTrack = () => {
    setCurrentTrack(track);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!track) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const isOwner = user && track && user.id === track.user_id;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <button 
            onClick={() => navigate("/discover")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src={tdzLogo} alt="TDZ" className="h-8 w-auto" style={{ mixBlendMode: 'screen' }} />
          </button>
          <div className="text-sm text-muted-foreground hidden sm:block">
            Press{" "}
            <kbd className="px-2 py-1 text-xs bg-muted rounded">⌘K</kbd>
            {" "}for quick actions
          </div>
        </div>
      </div>
      <div className="h-14" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[1200px] h-[1200px] bg-primary/15 rounded-full blur-[200px] animate-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">

        <div className="grid md:grid-cols-2 gap-6 md:gap-12 mb-8 md:mb-12">
          {/* Album Art / Canvas */}
          <div className="space-y-4 md:space-y-6">
            <div className="aspect-square rounded-2xl md:rounded-3xl overflow-hidden shadow-glow-lg">
              <MotionCover
                motionCoverPath={track.motion_cover_path}
                motionCoverBucket={track.motion_cover_bucket}
                staticCoverPath={track.album_cover_path}
                staticCoverBucket="album-covers"
                alt={track.title}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Track Info */}
          <div className="flex flex-col justify-center space-y-4 sm:space-y-6 md:space-y-8">
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5">
                  {track.albums ? 'ALBUM TRACK' : 'SINGLE'}
                </Badge>
                {track.is_published ? (
                  <Badge className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/20 text-primary">
                    Published
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5">
                    Unpublished
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight">{track.title}</h1>
              <button 
                onClick={() => navigate(`/artist/${track.user_id}`)}
                className="text-lg sm:text-xl md:text-2xl font-semibold text-muted-foreground hover:text-primary transition-colors text-left"
              >
                {track.artist_name}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {track.genre && (
                <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                  {track.genre}
                </Badge>
              )}
              {track.mood && (
                <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                  {track.mood}
                </Badge>
              )}
              {track.bpm && (
                <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                  {track.bpm} BPM
                </Badge>
              )}
              {track.key && (
                <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                  Key: {track.key}
                </Badge>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{new Date(track.created_at).getFullYear()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{formatDuration(track.duration)}</span>
              </div>
              {/* Only show play count to track owner */}
              {isOwner && (
                <div className="flex items-center gap-1.5">
                  <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{track.play_count?.toLocaleString()} plays</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                size="default"
                className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 md:px-12 text-sm sm:text-base md:text-lg shadow-glow"
                onClick={handlePlayTrack}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2" fill="currentColor" />
                Play
              </Button>
              <Button
                size="default"
                variant="outline"
                className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16"
                onClick={toggleLike}
              >
                <Heart 
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" 
                  fill={isLiked ? "currentColor" : "none"}
                />
              </Button>
              
              {/* 3-dot menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="default"
                    variant="outline" 
                    className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16"
                  >
                    <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ListPlus className="w-4 h-4 mr-2" />
                      Add to Playlist
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setShowNewPlaylist(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Playlist
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {playlists.length === 0 ? (
                        <DropdownMenuItem disabled>No playlists</DropdownMenuItem>
                      ) : (
                        playlists.map((p) => (
                          <DropdownMenuItem key={p.id} onClick={() => handleAddToPlaylist(p.id)}>
                            <ListMusic className="w-4 h-4 mr-2" />
                            {p.name}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem onClick={handleAddToQueue}>
                    <ListMusic className="w-4 h-4 mr-2" />
                    Add to Queue
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/artist/${track.user_id}`)}>
                    <User className="w-4 h-4 mr-2" />
                    Go to Artist
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* New Playlist Dialog */}
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
                  <Button variant="outline" onClick={() => setShowNewPlaylist(false)}>Cancel</Button>
                  <Button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Track Metadata and Publishing Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Track Metadata */}
          <Card className="glass-card-premium p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Track Information</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-start py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Title</span>
                <span className="text-sm font-medium text-right">{track.title}</span>
              </div>
              <div className="flex justify-between items-start py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Artist</span>
                <span className="text-sm font-medium text-right">{track.artist_name}</span>
              </div>
              <div className="flex justify-between items-start py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="text-sm font-medium">{formatDuration(track.duration)}</span>
              </div>
              {track.genre && (
                <div className="flex justify-between items-start py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Genre</span>
                  <span className="text-sm font-medium">{track.genre}</span>
                </div>
              )}
              {track.mood && (
                <div className="flex justify-between items-start py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Mood</span>
                  <span className="text-sm font-medium">{track.mood}</span>
                </div>
              )}
              {track.bpm && (
                <div className="flex justify-between items-start py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">BPM</span>
                  <span className="text-sm font-medium">{track.bpm}</span>
                </div>
              )}
              {track.key && (
                <div className="flex justify-between items-start py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Key</span>
                  <span className="text-sm font-medium">{track.key}</span>
                </div>
              )}
              {track.track_number && (
                <div className="flex justify-between items-start py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Track Number</span>
                  <span className="text-sm font-medium">#{track.track_number}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Credits */}
          <Card className="glass-card-premium p-6">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Credits</h2>
            </div>
            <div className="space-y-3">
              {/* Main Artist */}
              <div className="flex justify-between items-start py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Artist</span>
                <button 
                  onClick={() => navigate(`/artist/${track.user_id}`)}
                  className="text-sm font-medium text-primary hover:underline text-right"
                >
                  {track.artist_name}
                </button>
              </div>
              
              {/* Contributors from ai_tags metadata */}
              {track.ai_tags?.metadata?.contributors && track.ai_tags.metadata.contributors.length > 0 && (
                <>
                  {track.ai_tags.metadata.contributors.map((contributor: any, index: number) => (
                    <div key={index} className="flex justify-between items-start py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground capitalize">{contributor.role || 'Contributor'}</span>
                      <span className="text-sm font-medium text-right">{contributor.name}</span>
                    </div>
                  ))}
                </>
              )}
              
              {/* Copyright Info */}
              {track.ai_tags?.metadata?.copyrightHolder && (
                <div className="flex justify-between items-start py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">℗ {track.ai_tags.metadata.copyrightYear || ''}</span>
                  <span className="text-sm font-medium text-right">{track.ai_tags.metadata.copyrightHolder}</span>
                </div>
              )}
              
              {track.ai_tags?.metadata?.cLine && (
                <div className="flex justify-between items-start py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">© Copyright</span>
                  <span className="text-sm font-medium text-right">{track.ai_tags.metadata.cLine}</span>
                </div>
              )}
              
              {track.ai_tags?.metadata?.publishingRights && (
                <div className="flex justify-between items-start py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Publishing</span>
                  <span className="text-sm font-medium text-right">{track.ai_tags.metadata.publishingRights}</span>
                </div>
              )}
              
              {/* Release Info */}
              {track.release_date && (
                <div className="flex justify-between items-start py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Release Date</span>
                  <span className="text-sm font-medium">{formatDate(track.release_date)}</span>
                </div>
              )}
              
              {/* Album Link */}
              {track.albums && (
                <div className="flex justify-between items-start py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Album</span>
                  <button 
                    onClick={() => navigate(`/album/${track.albums.id}`)}
                    className="text-sm font-medium text-primary hover:underline text-right"
                  >
                    {track.albums.title}
                  </button>
                </div>
              )}
              
              {/* Identifiers */}
              {track.ai_tags?.metadata?.isrc && (
                <div className="flex justify-between items-start py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">ISRC</span>
                  <span className="text-sm font-medium font-mono">{track.ai_tags.metadata.isrc}</span>
                </div>
              )}
              
              {track.ai_tags?.metadata?.upc && (
                <div className="flex justify-between items-start py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">UPC</span>
                  <span className="text-sm font-medium font-mono">{track.ai_tags.metadata.upc}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Streaming Performance - Only visible to track owner */}
        {isOwner && (
          <Card className="glass-card-premium p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Streaming Performance</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Play className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Total Plays</p>
                </div>
                <p className="text-2xl md:text-3xl font-bold glow-text">{track.play_count?.toLocaleString() || 0}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Likes</p>
                </div>
                <p className="text-2xl md:text-3xl font-bold glow-text">{track.like_count?.toLocaleString() || 0}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Est. Revenue</p>
                </div>
                <p className="text-2xl md:text-3xl font-bold glow-text">
                  ${((track.play_count || 0) * 0.003).toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Music className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Listeners</p>
                </div>
                <p className="text-2xl md:text-3xl font-bold glow-text">
                  {Math.floor((track.play_count || 0) * 0.6).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Album Card if part of album */}
        {track.albums && (
          <Card className="glass-card-premium p-4 sm:p-6 md:p-8 mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">From the Album</h2>
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 cursor-pointer hover:opacity-80 transition-opacity"
                 onClick={() => navigate(`/album/${track.albums.id}`)}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
                {track.albums.cover_art_path ? (
                  <img 
                    src={supabase.storage.from('album-covers').getPublicUrl(track.albums.cover_art_path).data.publicUrl}
                    alt={track.albums.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl font-bold truncate">{track.albums.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground truncate">{track.artist_name}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Detailed Analytics - Only visible to track owner */}
        {isOwner && (
          <div className="space-y-8 border-t border-border/50 pt-8">
            <TrackAnalytics trackId={trackId!} isOwner={true} />
            <TrackAnalysisPanel trackId={trackId!} trackTitle={track.title} />
          </div>
        )}
      </div>

      <MusicPlayer
        currentTrack={currentTrack}
        queue={currentTrack ? [currentTrack] : []}
        onNext={() => {}}
        onPrevious={() => {}}
        onTrackEnd={() => {}}
      />
    </div>
  );
}
