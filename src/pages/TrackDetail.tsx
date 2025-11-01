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
          cover_art_path
        )
      `)
      .eq("id", trackId)
      .single();

    if (error) {
      console.error("Error loading track:", error);
      toast.error("Failed to load track");
    } else {
      setTrack(data);
    }
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <button 
              onClick={() => navigate("/discover")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src={tdzLogo} alt="TDZ" className="h-8 w-auto" style={{ mixBlendMode: 'screen' }} />
            </button>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/discover")}
          >
            <Home className="w-4 h-4 mr-2" />
            Discover
          </Button>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[1200px] h-[1200px] bg-primary/15 rounded-full blur-[200px] animate-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">

        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Album Art / Canvas */}
          <div className="space-y-6">
            <div className="aspect-square rounded-3xl overflow-hidden shadow-glow-lg">
              {track.ai_tags?.metadata?.isMotionCover && track.ai_tags?.metadata?.artworkUrl ? (
                <video 
                  src={track.ai_tags.metadata.artworkUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : track.album_cover_path ? (
                <img 
                  src={supabase.storage.from('album-covers').getPublicUrl(track.album_cover_path).data.publicUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                  <Music className="w-32 h-32 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Track Info */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <Badge className="text-sm px-4 py-2">SINGLE</Badge>
              <h1 className="text-7xl font-black glow-text leading-tight">{track.title}</h1>
              <button 
                onClick={() => navigate(`/artist/${track.user_id}`)}
                className="text-3xl font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                {track.artist_name}
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              {track.genre && (
                <Badge variant="outline" className="text-base px-4 py-2">
                  {track.genre}
                </Badge>
              )}
              {track.mood && (
                <Badge variant="outline" className="text-base px-4 py-2">
                  {track.mood}
                </Badge>
              )}
              {track.bpm && (
                <Badge variant="outline" className="text-base px-4 py-2">
                  {track.bpm} BPM
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{new Date(track.created_at).getFullYear()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{formatDuration(track.duration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                <span>{track.play_count?.toLocaleString()} plays</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                size="lg" 
                className="h-16 px-12 text-xl shadow-glow"
                onClick={handlePlayTrack}
              >
                <Play className="w-6 h-6 mr-3" fill="currentColor" />
                Play
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-16 w-16"
                onClick={toggleLike}
              >
                <Heart 
                  className="w-6 h-6" 
                  fill={isLiked ? "currentColor" : "none"}
                />
              </Button>
              <Button size="lg" variant="outline" className="h-16 w-16">
                <Share2 className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {track.albums && (
          <Card className="glass-card-premium p-8">
            <h2 className="text-2xl font-black mb-4 glow-text">From the Album</h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-lg overflow-hidden">
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
              <div>
                <h3 className="text-2xl font-bold">{track.albums.title}</h3>
                <p className="text-muted-foreground">{track.artist_name}</p>
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
