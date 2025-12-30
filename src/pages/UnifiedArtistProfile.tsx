import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Play, Heart, UserPlus, UserCheck, Share2, 
  Music, Image as ImageIcon, ArrowLeft, Home, 
  Youtube, Crown, Clock, Disc, MoreHorizontal,
  Loader2
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { YouTubeVideo } from "@/hooks/useYouTubePlayer";
import tdzLogo from "@/assets/tdz-logo.png";

type ArtistSource = 'tdz' | 'youtube';

interface UnifiedTrack {
  id: string;
  title: string;
  artist_name: string;
  duration?: number;
  album_name?: string;
  thumbnail?: string;
  source: ArtistSource;
  youtubeData?: YouTubeVideo;
}

export default function UnifiedArtistProfile() {
  const { artistId, source } = useParams<{ artistId: string; source?: string }>();
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  
  const [artist, setArtist] = useState<any>(null);
  const [tracks, setTracks] = useState<UnifiedTrack[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [artistSource, setArtistSource] = useState<ArtistSource>('tdz');

  // Determine if this is a YouTube artist based on URL or ID format
  useEffect(() => {
    if (!artistId) return;
    
    const isYouTube = source === 'youtube' || artistId.startsWith('UC') || artistId.startsWith('yt-');
    setArtistSource(isYouTube ? 'youtube' : 'tdz');
  }, [artistId, source]);

  useEffect(() => {
    if (!artistId) {
      toast.error("Invalid artist profile");
      navigate("/discover");
      return;
    }
    
    loadUser();
    
    if (artistSource === 'youtube') {
      loadYouTubeArtist();
    } else {
      loadTDZArtist();
    }
  }, [artistId, artistSource]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user && artistSource === 'tdz') {
      checkIfFollowing(user.id);
    }
  };

  const loadTDZArtist = async () => {
    setLoading(true);
    try {
      // Check if artistId is a valid UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artistId!);
      
      if (!isUUID) {
        toast.error("Invalid artist ID");
        navigate("/discover");
        return;
      }

      const { data: artistData, error: artistError } = await supabase
        .from("artist_profiles")
        .select("*")
        .eq("user_id", artistId)
        .maybeSingle();

      if (artistError || !artistData) {
        toast.error("Artist not found");
        navigate("/discover");
        return;
      }

      setArtist({
        id: artistData.user_id,
        name: artistData.artist_name,
        image: artistData.profile_image_path 
          ? supabase.storage.from('artist-images').getPublicUrl(artistData.profile_image_path).data.publicUrl
          : null,
        banner: artistData.banner_image_path
          ? supabase.storage.from('artist-images').getPublicUrl(artistData.banner_image_path).data.publicUrl
          : null,
        bio: artistData.bio,
        verified: artistData.verified,
        monthlyListeners: artistData.monthly_listeners || 0,
        totalPlays: artistData.total_plays || 0,
        source: 'tdz',
        genres: [],
      });

      // Load tracks
      const { data: trackData } = await supabase
        .from("tracks")
        .select("*, albums(title)")
        .eq("user_id", artistId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (trackData) {
        const mappedTracks: UnifiedTrack[] = trackData.map(track => ({
          id: track.id,
          title: track.title,
          artist_name: track.artist_name,
          duration: track.duration,
          album_name: track.albums?.title,
          thumbnail: track.album_cover_path
            ? supabase.storage.from(track.album_cover_bucket || 'album-covers').getPublicUrl(track.album_cover_path).data.publicUrl
            : undefined,
          source: 'tdz',
        }));
        setTracks(mappedTracks);
      }
    } catch (error) {
      console.error('Error loading TDZ artist:', error);
      toast.error("Failed to load artist");
    } finally {
      setLoading(false);
    }
  };

  const loadYouTubeArtist = async () => {
    setLoading(true);
    try {
      // Clean up the artist ID (remove yt- prefix if present)
      const channelQuery = artistId?.replace('yt-', '').replace('UC', '');
      
      // Search YouTube for this artist's content
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { 
          query: decodeURIComponent(channelQuery || ''),
          type: 'search',
          maxResults: 30 
        }
      });

      if (error || !data?.results?.length) {
        toast.error("Could not load YouTube artist");
        navigate("/discover");
        return;
      }

      const firstVideo = data.results[0] as YouTubeVideo;
      
      setArtist({
        id: artistId,
        name: firstVideo.channel,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstVideo.channel)}&size=300&background=dc2626&color=fff`,
        banner: firstVideo.thumbnail,
        bio: `YouTube artist with ${data.results.length}+ videos available.`,
        verified: false,
        monthlyListeners: 0,
        source: 'youtube',
        genres: ['YouTube Music'],
      });

      const mappedTracks: UnifiedTrack[] = data.results.map((video: YouTubeVideo) => ({
        id: `yt-${video.id}`,
        title: video.title,
        artist_name: video.channel,
        duration: parseDurationToSeconds(video.duration),
        thumbnail: video.thumbnail,
        source: 'youtube' as const,
        youtubeData: video,
      }));

      setTracks(mappedTracks);
    } catch (error) {
      console.error('Error loading YouTube artist:', error);
      toast.error("Failed to load artist");
    } finally {
      setLoading(false);
    }
  };

  function parseDurationToSeconds(duration?: string): number {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  }

  const checkIfFollowing = async (userId: string) => {
    const { data } = await supabase
      .from("artist_follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("artist_id", artistId)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (!user) {
      toast.error("Please sign in to follow artists");
      return;
    }

    if (isFollowing) {
      await supabase
        .from("artist_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("artist_id", artistId);
      toast.success("Unfollowed artist");
    } else {
      await supabase
        .from("artist_follows")
        .insert({ follower_id: user.id, artist_id: artistId });
      toast.success("Following artist");
    }
    setIsFollowing(!isFollowing);
  };

  const handlePlayTrack = (track: UnifiedTrack) => {
    if (track.source === 'youtube' && track.youtubeData) {
      const youtubeTrack = {
        id: track.id,
        title: track.title,
        artist_name: track.artist_name,
        duration: track.duration || 0,
        file_path: '',
        play_count: 0,
        source: 'youtube' as const,
        youtubeId: track.youtubeData.id,
        thumbnail: track.thumbnail,
      };
      playTrack(youtubeTrack, tracks.filter(t => t.source === 'youtube').map(t => ({
        id: t.id,
        title: t.title,
        artist_name: t.artist_name,
        duration: t.duration || 0,
        file_path: '',
        play_count: 0,
        source: 'youtube' as const,
        youtubeId: t.youtubeData?.id,
        thumbnail: t.thumbnail,
      })));
    } else {
      const tdzTrack = {
        id: track.id,
        title: track.title,
        artist_name: track.artist_name,
        duration: track.duration || 0,
        file_path: '',
        play_count: 0,
      };
      const tdzQueue = tracks.filter(t => t.source === 'tdz').map(t => ({
        id: t.id,
        title: t.title,
        artist_name: t.artist_name,
        duration: t.duration || 0,
        file_path: '',
        play_count: 0,
      }));
      playTrack(tdzTrack, tdzQueue);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      handlePlayTrack(tracks[0]);
      toast.success(`Playing ${artist?.name}`);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading artist...</p>
        </div>
      </div>
    );
  }

  if (!artist) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img 
              src={tdzLogo} 
              alt="TDZ" 
              className="h-8 w-auto cursor-pointer" 
              onClick={() => navigate("/discover")}
            />
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

      {/* Hero Section - RKHM Style */}
      <div className="relative">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0 h-80 md:h-96"
          style={{
            background: artistSource === 'youtube' 
              ? 'linear-gradient(180deg, hsl(0 84% 40% / 0.3) 0%, hsl(var(--background)) 100%)'
              : 'linear-gradient(180deg, hsl(var(--primary) / 0.3) 0%, hsl(var(--background)) 100%)'
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-8">
            {/* Artist Image - Circular like RKHM */}
            <div className="relative flex-shrink-0">
              <div 
                className={`w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 ${
                  artistSource === 'youtube' ? 'border-red-500/50' : 'border-primary/50'
                } shadow-2xl`}
              >
                {artist.image ? (
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${
                    artistSource === 'youtube' ? 'bg-red-600' : 'bg-gradient-to-br from-primary to-primary-glow'
                  }`}>
                    {artistSource === 'youtube' ? (
                      <Youtube className="w-16 h-16 text-white" />
                    ) : (
                      <Music className="w-16 h-16 text-primary-foreground" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Artist Info */}
            <div className="flex-1 space-y-4">
              {/* Type + Genres */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs uppercase tracking-wider">
                  Artist
                </Badge>
                {artistSource === 'youtube' && (
                  <Badge className="bg-red-600 text-white">
                    <Youtube className="w-3 h-3 mr-1" />
                    YouTube
                  </Badge>
                )}
                {artistSource === 'tdz' && (
                  <Badge className="bg-gradient-to-r from-primary to-primary-glow">
                    <Crown className="w-3 h-3 mr-1" />
                    TDZ
                  </Badge>
                )}
                {artist.verified && (
                  <Badge className="bg-primary">✓ Verified</Badge>
                )}
              </div>

              {/* Name */}
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                {artist.name}
              </h1>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {artistSource === 'tdz' && (
                  <>
                    <span>Last release: <strong className="text-foreground">Recently</strong></span>
                    <span>•</span>
                  </>
                )}
                <span>Tracks: <strong className="text-foreground">{tracks.length}</strong></span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button 
                  size="lg"
                  onClick={handlePlayAll}
                  className={artistSource === 'youtube' 
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gradient-to-r from-primary to-primary-glow shadow-glow'
                  }
                >
                  <Play className="w-5 h-5 mr-2" fill="currentColor" />
                  PLAY
                </Button>
                
                {artistSource === 'tdz' && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={toggleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-5 h-5 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Subscribe
                      </>
                    )}
                  </Button>
                )}

                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <h2 className="text-2xl md:text-3xl font-black mb-6">Tracks</h2>
        
        <div className="space-y-1">
          {tracks.map((track, index) => {
            const isCurrentTrack = currentTrack?.id === track.id;
            
            return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track)}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all cursor-pointer group ${
                  isCurrentTrack 
                    ? 'bg-primary/10 border-l-2 border-primary' 
                    : 'hover:bg-muted/50'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {track.thumbnail ? (
                    <img 
                      src={track.thumbnail} 
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" fill="white" />
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isCurrentTrack ? 'text-primary' : ''}`}>
                    {track.title}
                  </p>
                  {track.album_name && (
                    <p className="text-sm text-muted-foreground truncate">
                      {track.album_name}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div className="text-sm text-muted-foreground tabular-nums">
                  {formatDuration(track.duration)}
                </div>
              </div>
            );
          })}
        </div>

        {tracks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tracks available</p>
          </div>
        )}
      </div>
    </div>
  );
}
