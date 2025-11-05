import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Play, Heart, Share2, ArrowLeft, Music, Clock, Home, Edit2, Calendar
} from "lucide-react";
import { MusicPlayer } from "@/components/MusicPlayer";
import { EditAlbumDialog } from "@/components/EditAlbumDialog";
import tdzLogo from "@/assets/tdz-logo.png";

export default function AlbumDetail() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingAlbum, setEditingAlbum] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (albumId) {
      loadAlbum();
      loadTracks();
    }
  }, [albumId]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadAlbum = async () => {
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .eq("id", albumId)
      .single();

    if (error) {
      console.error("Error loading album:", error);
      toast.error("Failed to load album");
      navigate(-1);
      return;
    }

    // Check if album is published (unless viewing own album)
    if (data.is_published === false && user && data.user_id !== user.id) {
      toast.error("This album is not available");
      navigate("/discover");
      return;
    }

    setAlbum(data);
  };

  const loadTracks = async () => {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("album_id", albumId)
      .order("track_number", { ascending: true });

    if (!error && data) {
      setTracks(data);
    }
  };

  const handlePlayTrack = (track: any) => {
    setCurrentTrack(track);
    setQueue(tracks);
    const index = tracks.findIndex(t => t.id === track.id);
    setCurrentIndex(index);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setCurrentTrack(tracks[0]);
      setQueue(tracks);
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1];
      setCurrentTrack(nextTrack);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1];
      setCurrentTrack(prevTrack);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTrackEnd = () => {
    handleNext();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    const total = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    return formatDuration(total);
  };

  const getCoverUrl = (path?: string) => {
    if (!path) return '/placeholder.svg';
    return supabase.storage.from('album-covers').getPublicUrl(path).data.publicUrl;
  };

  const handleEditSuccess = () => {
    loadAlbum();
    loadTracks();
    setEditingAlbum(false);
  };

  const isOwner = user && album && user.id === album.user_id;

  if (!album) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="h-9 px-2 sm:px-4"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <button 
              onClick={() => navigate("/discover")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src={tdzLogo} alt="TDZ" className="h-6 sm:h-8 w-auto" style={{ mixBlendMode: 'screen' }} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingAlbum(true)}
                  className="h-9 gap-2"
                >
                  <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Edit Album</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/studio")}
                  className="h-9"
                >
                  Studio
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/discover")}
              className="h-9 px-2 sm:px-4"
            >
              <Home className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Discover</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[1200px] h-[1200px] bg-primary/15 rounded-full blur-[200px] animate-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 mb-8 md:mb-12">
          {/* Album Cover */}
          <div className="space-y-4 md:space-y-6">
            <div className="aspect-square rounded-2xl md:rounded-3xl overflow-hidden shadow-glow-lg">
              <img
                src={getCoverUrl(album.cover_art_path)}
                alt={album.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Album Info */}
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-2 md:space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs sm:text-sm">Album</Badge>
                {album.is_published ? (
                  <Badge className="text-xs sm:text-sm bg-primary/20 text-primary">Published</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs sm:text-sm">Unpublished</Badge>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black glow-text">{album.title}</h1>
              <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground">{album.artist_name}</p>
            </div>

            {album.genre && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{album.genre}</Badge>
              </div>
            )}

            {album.description && (
              <Card className="p-4 bg-accent/50">
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {album.description}
                </p>
              </Card>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>{tracks.length} tracks</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{getTotalDuration()}</span>
              </div>
              {album.release_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(album.release_date).toLocaleDateString()}</span>
                </div>
              )}
              {album.scheduled_release_date && !album.is_published && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Scheduled: {new Date(album.scheduled_release_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={handlePlayAll} className="gap-2 shadow-glow">
                <Play className="w-5 h-5" fill="currentColor" />
                Play All
              </Button>
              {isOwner && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => setEditingAlbum(true)}
                  className="gap-2"
                >
                  <Edit2 className="w-5 h-5" />
                  Edit Album
                </Button>
              )}
              <Button variant="outline" size="lg" className="gap-2">
                <Share2 className="w-5 h-5" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Track List */}
        <Card className="glass-card-premium p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Tracks</h2>
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handlePlayTrack(track)}
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <span className="text-muted-foreground w-6 text-sm sm:text-base">{index + 1}</span>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    className="h-10 w-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-4 h-4" fill="currentColor" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">{track.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{track.artist_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-sm text-muted-foreground">{formatDuration(track.duration)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <MusicPlayer
        currentTrack={currentTrack}
        queue={queue}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onTrackEnd={handleTrackEnd}
      />

      {isOwner && (
        <EditAlbumDialog
          album={album}
          open={editingAlbum}
          onOpenChange={setEditingAlbum}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
