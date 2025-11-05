import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Play, Heart, Share2, ArrowLeft, Music, Calendar, Clock, Home
} from "lucide-react";
import { MusicPlayer } from "@/components/MusicPlayer";
import tdzLogo from "@/assets/tdz-logo.png";
import { MotionCover } from "@/components/MotionCover";

export default function TrackDetail() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const [track, setTrack] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentTrack, setCurrentTrack] = useState<any>(null);

  useEffect(() => {
    loadUser();
    loadTrack();
  }, [trackId]);

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
          is_published
        )
      `)
      .eq("id", trackId)
      .single();

    if (error) {
      console.error("Error loading track:", error);
      toast.error("Failed to load track");
      return;
    }

    // Check if track belongs to an unpublished album
    if (data.albums && data.albums.is_published === false) {
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
      .single();

    setIsLiked(!!data);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="h-8 sm:h-9"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Back</span>
            </Button>
            <button 
              onClick={() => navigate("/discover")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src={tdzLogo} alt="TDZ" className="h-6 sm:h-8 w-auto" style={{ mixBlendMode: 'screen' }} />
            </button>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/discover")}
            className="h-8 sm:h-9 text-xs sm:text-sm"
          >
            <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Discover</span>
          </Button>
        </div>
      </div>

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
              <Badge className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5">SINGLE</Badge>
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
              <div className="flex items-center gap-1.5">
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{track.play_count?.toLocaleString()}</span>
              </div>
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
              <Button 
                size="default"
                variant="outline" 
                className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {track.albums && (
          <Card className="glass-card-premium p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">From the Album</h2>
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
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
