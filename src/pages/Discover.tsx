import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Heart, Share2, Music, TrendingUp, Flame, 
  Search, User, ListMusic, Plus, UserPlus, Mic2
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";
import { MusicPlayer } from "@/components/MusicPlayer";
import { MotionCover } from "@/components/MotionCover";

export default function Discover() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [followedArtists, setFollowedArtists] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { role } = useUserRole(user);

  useEffect(() => {
    loadUser();
    loadTracks();
    loadArtists();
    loadPlaylists();
    loadLikedTracks();
    loadFollowedArtists();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadTracks = async () => {
    // Load tracks with motion cover support
    const { data: tracksData, error: tracksError } = await supabase
      .from("tracks")
      .select("*, albums(*)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (tracksError) {
      console.error("Error loading tracks:", tracksError);
      toast.error("Failed to load tracks");
      setLoading(false);
      return;
    }

    // Load all artist profiles to map artist names to user IDs
    const { data: artistsData, error: artistsError } = await supabase
      .from("artist_profiles")
      .select("artist_name, user_id");

    if (artistsError) {
      console.error("Error loading artists:", artistsError);
    }

    // Create a map of artist names to user IDs
    const artistMap = new Map(
      (artistsData || []).map(artist => [artist.artist_name, artist.user_id])
    );

    // Enhance tracks with artist user IDs and flatten album data
    const enhancedTracks = (tracksData || []).map(track => ({
      ...track,
      artist_user_id: artistMap.get(track.artist_name),
      album_cover_path: track.album_cover_path || track.albums?.cover_art_path,
      motion_cover_path: track.motion_cover_path || track.albums?.motion_cover_path,
      motion_cover_bucket: track.motion_cover_bucket || track.albums?.motion_cover_bucket,
    }));

    setTracks(enhancedTracks);
    setLoading(false);
  };

  const loadArtists = async () => {
    const { data, error } = await supabase
      .from("artist_profiles")
      .select("*")
      .order("monthly_listeners", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Error loading artists:", error);
    } else {
      setArtists(data || []);
    }
  };

  const loadPlaylists = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setPlaylists(data);
    }
  };

  const loadLikedTracks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("track_likes")
      .select("track_id")
      .eq("user_id", user.id);

    if (!error && data) {
      setLikedTracks(new Set(data.map(item => item.track_id)));
    }
  };

  const loadFollowedArtists = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("artist_follows")
      .select("artist_id")
      .eq("follower_id", user.id);

    if (!error && data) {
      setFollowedArtists(new Set(data.map(item => item.artist_id)));
    }
  };

  const toggleLike = async (trackId: string) => {
    if (!user) {
      toast.error("Please sign in to like tracks");
      return;
    }

    const isLiked = likedTracks.has(trackId);

    if (isLiked) {
      await supabase
        .from("track_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("track_id", trackId);

      setLikedTracks(prev => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
      toast.success("Removed from liked songs");
    } else {
      await supabase
        .from("track_likes")
        .insert({ user_id: user.id, track_id: trackId });

      setLikedTracks(prev => new Set(prev).add(trackId));
      toast.success("Added to liked songs");
    }
  };

  const toggleFollow = async (artistUserId: string) => {
    if (!user) {
      toast.error("Please sign in to follow artists");
      return;
    }

    const isFollowing = followedArtists.has(artistUserId);

    if (isFollowing) {
      await supabase
        .from("artist_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("artist_id", artistUserId);

      setFollowedArtists(prev => {
        const next = new Set(prev);
        next.delete(artistUserId);
        return next;
      });
      toast.success("Unfollowed artist");
    } else {
      await supabase
        .from("artist_follows")
        .insert({ follower_id: user.id, artist_id: artistUserId });

      setFollowedArtists(prev => new Set(prev).add(artistUserId));
      toast.success("Following artist");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayTrack = (track: any) => {
    setCurrentTrack(track);
    setQueue(filteredTracks);
    const index = filteredTracks.findIndex(t => t.id === track.id);
    setCurrentIndex(index);
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

  const filteredTracks = tracks.filter(track =>
    track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Epic animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[1200px] h-[1200px] bg-primary/15 rounded-full blur-[200px] animate-pulse animated-gradient" />
        <div className="absolute top-1/4 right-0 w-[900px] h-[900px] bg-secondary/10 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/3 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-glow/5 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card-premium border-b neon-border-strong shadow-glow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img src={tdzLogo} alt="TDZ" className="h-8 sm:h-10 w-auto flex-shrink-0" />
              <span className="font-display font-bold text-sm sm:text-base md:text-xl hidden sm:block truncate">
                TDZ DISTRIBUTION
              </span>
            </div>

            <div className="flex-1 max-w-xs sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 sm:pl-10 bg-background/80 backdrop-blur-sm text-sm h-9 sm:h-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(role === 'artist' || role === 'verified_artist' || role === 'manager') && (
                <Button 
                  variant="outline"
                  onClick={() => navigate("/studio")}
                  className="gap-2 h-9 sm:h-10"
                >
                  <Mic2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Studio</span>
                </Button>
              )}
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate("/profile")}
                className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 relative z-10">
        <Tabs defaultValue="discover" className="space-y-6 md:space-y-8">
          <div className="flex justify-center animate-fade-in overflow-x-auto pb-2 -mx-3 px-3">
            <TabsList className="glass-card-premium p-1.5 md:p-2 gap-1 md:gap-2 h-auto shadow-glow inline-flex min-w-max">
              <TabsTrigger value="discover" className="gap-1.5 md:gap-2 px-3 sm:px-4 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap">
                <Flame className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Discover</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-1.5 md:gap-2 px-3 sm:px-4 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Trending</span>
              </TabsTrigger>
              <TabsTrigger value="artists" className="gap-1.5 md:gap-2 px-3 sm:px-4 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap">
                <Music className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Artists</span>
              </TabsTrigger>
              <TabsTrigger value="playlists" className="gap-1.5 md:gap-2 px-3 sm:px-4 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap">
                <ListMusic className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Playlists</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="discover" className="space-y-6 md:space-y-8 animate-fade-in">
            {/* Epic Hero Section */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl glass-card-premium p-6 sm:p-8 md:p-12 lg:p-16 border-primary/40 shadow-glow-lg hover-lift">
              <div className="absolute inset-0 animated-gradient opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary-glow/20 to-secondary/30" />
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary-glow/30 to-secondary/20 blur-3xl -z-10 animate-pulse" />
              
              <div className="relative z-10 space-y-4 md:space-y-6">
                <Badge className="bg-primary/30 text-primary-foreground border-primary/50 shadow-glow px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm animate-fade-in">
                  <Flame className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 animate-pulse" />
                  Hot This Week
                </Badge>
                
                <div className="space-y-2 md:space-y-4">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <span className="glow-text-lg bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
                      DISCOVER
                    </span>
                  </h1>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-foreground/90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    NEW MUSIC
                  </h2>
                </div>
                
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-muted-foreground max-w-3xl font-light animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  Stream unlimited music from independent artists around the world
                </p>
                
                <div className="flex items-center gap-2 md:gap-3 text-xs sm:text-sm text-muted-foreground animate-fade-in flex-wrap" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary animate-pulse" />
                    <span>Live</span>
                  </div>
                  <span className="text-border">•</span>
                  <span>Millions of Tracks</span>
                  <span className="text-border hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Independent Artists</span>
                </div>
              </div>
            </div>

            {/* Latest Releases Carousel */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Latest Releases</h2>
                <Badge variant="outline" className="text-xs px-2 py-1">
                  {filteredTracks.length}
                </Badge>
              </div>
              
              {/* Mobile Carousel - 2 per view */}
              <div className="md:hidden overflow-x-auto scrollbar-hide -mx-3 px-3">
                <div className="flex gap-3 pb-2">
                  {filteredTracks.slice(0, 12).map((track) => (
                    <div 
                      key={track.id}
                      className="flex-shrink-0 w-[calc(50%-6px)] cursor-pointer"
                      onClick={() => navigate(`/track/${track.id}`)}
                    >
                      <div className="space-y-2">
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                          <MotionCover
                            motionCoverPath={track.motion_cover_path}
                            motionCoverBucket={track.motion_cover_bucket}
                            staticCoverPath={track.album_cover_path}
                            staticCoverBucket={track.album_cover_bucket || "album-covers"}
                            alt={track.title}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium truncate">{track.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{track.artist_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
              {filteredTracks.slice(0, 24).map((track) => (
                  <div 
                    key={track.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/track/${track.id}`)}
                  >
                    <div className="space-y-2">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                        <MotionCover
                          motionCoverPath={track.motion_cover_path}
                          motionCoverBucket={track.motion_cover_bucket}
                          staticCoverPath={track.album_cover_path}
                          staticCoverBucket={track.album_cover_bucket || "album-covers"}
                          alt={track.title}
                          className="w-full h-full group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            size="icon" 
                            className="h-12 w-12 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayTrack(track);
                            }}
                          >
                            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="artists" className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-tight glow-text">Featured Artists</h2>
              <Badge variant="outline" className="text-sm px-4 py-2">
                {artists.length} Artists
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {artists.map((artist, index) => (
                <Card 
                  key={artist.id} 
                  className="glass-card-premium p-5 text-center hover:border-primary/70 transition-all hover-lift shadow-card-hover animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => navigate(`/artist/${artist.user_id}`)}
                >
                  <div className="relative">
                    <div className="aspect-square rounded-full overflow-hidden bg-gradient-to-br from-primary/30 to-secondary/30 mb-4 shadow-glow ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                      {artist.profile_image_path && (
                        <img 
                          src={artist.profile_image_path}
                          alt={artist.artist_name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                      )}
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-primary shadow-glow text-xs">
                        <TrendingUp className="w-3 h-3" />
                      </Badge>
                    </div>
                  </div>
                  
                  <h3 className="font-bold truncate mb-2 text-base">{artist.artist_name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 font-medium">
                    {artist.monthly_listeners?.toLocaleString()} listeners
                  </p>
                  
                  <Button
                    size="sm"
                    variant={followedArtists.has(artist.user_id) ? "outline" : "default"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow(artist.user_id);
                    }}
                    className={`w-full transition-all hover-lift ${
                      followedArtists.has(artist.user_id) 
                        ? "border-primary/50" 
                        : "bg-gradient-to-r from-primary to-secondary shadow-glow"
                    }`}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {followedArtists.has(artist.user_id) ? "Following" : "Follow"}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="playlists" className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-tight glow-text">My Playlists</h2>
              <Button className="bg-gradient-to-r from-primary via-primary-glow to-secondary shadow-glow hover-lift px-6 py-6">
                <Plus className="w-5 h-5 mr-2" />
                Create Playlist
              </Button>
            </div>
            
            {playlists.length === 0 ? (
              <Card className="glass-card-premium p-16 text-center shadow-glow-lg">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="relative inline-block">
                    <ListMusic className="w-20 h-20 mx-auto text-primary" />
                    <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl -z-10" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black">No playlists yet</h3>
                    <p className="text-lg text-muted-foreground">
                      Create your first playlist to organize your favorite tracks
                    </p>
                  </div>
                  
                  <Button className="bg-gradient-to-r from-primary to-secondary shadow-glow hover-lift px-8 py-6 text-base mt-6">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Playlist
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {playlists.map((playlist, index) => (
                  <Card 
                    key={playlist.id} 
                    className="glass-card-premium p-5 hover:border-primary/70 transition-all hover-lift shadow-card-hover animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 mb-4 shadow-glow flex items-center justify-center">
                      <ListMusic className="w-12 h-12 text-primary-foreground" />
                    </div>
                    <h3 className="font-bold text-lg truncate mb-2">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{playlist.description}</p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <MusicPlayer
        currentTrack={currentTrack}
        queue={queue}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onTrackEnd={handleTrackEnd}
      />
    </div>
  );
}