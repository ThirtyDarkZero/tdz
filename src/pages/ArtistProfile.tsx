import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Play, Heart, UserPlus, UserCheck, Share2, 
  Music, Image as ImageIcon, Bell, BellOff, ArrowLeft, Home
} from "lucide-react";
import { MusicPlayer } from "@/components/MusicPlayer";
import tdzLogo from "@/assets/tdz-logo.png";

export default function ArtistProfile() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [presavedTracks, setPresavedTracks] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Validate artistId is a valid UUID
  useEffect(() => {
    if (!artistId || artistId === ":artistId" || !isValidUUID(artistId)) {
      toast.error("Invalid artist profile");
      navigate("/discover");
    }
  }, [artistId, navigate]);

  useEffect(() => {
    if (artistId && isValidUUID(artistId)) {
      loadUser();
      loadArtist();
      loadTracks();
      loadGallery();
    }
  }, [artistId]);

  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      checkIfFollowing(user.id);
      loadPresaves(user.id);
    }
  };

  const loadArtist = async () => {
    const { data, error } = await supabase
      .from("artist_profiles")
      .select("*")
      .eq("user_id", artistId)
      .maybeSingle();

    if (error) {
      console.error("Error loading artist:", error);
      toast.error("Failed to load artist profile");
      navigate("/discover");
      return;
    }
    
    if (!data) {
      // No profile found for this artist
      toast.error("Artist profile not found");
      navigate("/discover");
      return;
    }
    
    setArtist(data);
  };

  const loadTracks = async () => {
    const { data, error } = await supabase
      .from("tracks")
      .select("*, albums(*)")
      .eq("user_id", artistId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Filter out tracks from unpublished albums
      const publishedTracks = data.filter(track => 
        !track.albums || track.albums.is_published !== false
      );
      setTracks(publishedTracks);
    }
  };

  const loadGallery = async () => {
    const { data, error } = await supabase
      .from("artist_gallery")
      .select("*")
      .eq("artist_id", artistId)
      .order("display_order", { ascending: true });

    if (!error && data) {
      const galleryWithUrls = data.map(item => ({
        ...item,
        imageUrl: supabase.storage.from("artist-gallery").getPublicUrl(item.image_path).data.publicUrl
      }));
      setGallery(galleryWithUrls);
    }
  };

  const checkIfFollowing = async (userId: string) => {
    const { data } = await supabase
      .from("artist_follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("artist_id", artistId)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const loadPresaves = async (userId: string) => {
    const { data } = await supabase
      .from("track_presaves")
      .select("track_id")
      .eq("user_id", userId);

    if (data) {
      setPresavedTracks(new Set(data.map(p => p.track_id)));
    }
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

  const togglePresave = async (trackId: string) => {
    if (!user) {
      toast.error("Please sign in to presave tracks");
      return;
    }

    const isPresaved = presavedTracks.has(trackId);

    if (isPresaved) {
      await supabase
        .from("track_presaves")
        .delete()
        .eq("user_id", user.id)
        .eq("track_id", trackId);

      setPresavedTracks(prev => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
      toast.success("Presave removed");
    } else {
      await supabase
        .from("track_presaves")
        .insert({
          user_id: user.id,
          track_id: trackId,
          artist_id: artistId
        });

      setPresavedTracks(prev => new Set(prev).add(trackId));
      toast.success("Track presaved! You'll be notified on release");
    }
  };

  const handlePlayTrack = (track: any) => {
    setCurrentTrack(track);
    setQueue(tracks);
    const index = tracks.findIndex(t => t.id === track.id);
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


  if (!artist) {
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
              onClick={() => navigate("/discover")}
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

      {/* Hero Section */}
      <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
        {artist.banner_image_path ? (
          <img
            src={supabase.storage.from("artist-images").getPublicUrl(artist.banner_image_path).data.publicUrl}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary-glow/20 to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 sm:border-4 border-background shadow-glow">
                {artist.profile_image_path ? (
                  <img
                    src={supabase.storage.from("artist-images").getPublicUrl(artist.profile_image_path).data.publicUrl}
                    alt={artist.artist_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                    <Music className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-primary-foreground" />
                  </div>
                )}
              </div>
              {artist.verified && (
                <Badge className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-primary shadow-glow text-xs">
                  ✓ Verified
                </Badge>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2 glow-text truncate">{artist.artist_name}</h1>
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 flex-wrap">
                <span>{tracks.length} releases</span>
                {artist.verified && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-primary">Verified Artist</span>
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button onClick={toggleFollow} size="sm" className="shadow-glow sm:size-lg">
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                      <span className="text-xs sm:text-base">Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                      <span className="text-xs sm:text-base">Follow</span>
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="sm:size-lg">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  <span className="text-xs sm:text-base">Share</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-6 sm:py-8 md:py-12">
        <Tabs defaultValue="music" className="space-y-6 md:space-y-8">
          <TabsList className="glass-card-premium p-1.5 md:p-2 w-full sm:w-auto">
            <TabsTrigger value="music" className="gap-1.5 md:gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
              <Music className="w-3 h-3 sm:w-4 sm:h-4" />
              Music
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-1.5 md:gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
              About
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-1.5 md:gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
              <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black glow-text mb-4 sm:mb-6">Releases</h2>
            <div className="grid gap-4">
              {tracks.map(track => (
                <Card key={track.id} className="glass-card-premium p-6 hover-lift">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Album Cover */}
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {track.album_cover_path ? (
                          <img 
                            src={supabase.storage.from(track.album_cover_bucket || 'album-covers').getPublicUrl(track.album_cover_path).data.publicUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                            <Music className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-12 w-12 rounded-full"
                        onClick={() => handlePlayTrack(track)}
                      >
                        <Play className="w-5 h-5" fill="currentColor" />
                      </Button>
                      <div>
                        <h3 className="font-bold text-lg">{track.title}</h3>
                        <p className="text-sm text-muted-foreground">{track.artist_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {track.release_date && new Date(track.release_date) > new Date() ? (
                        <Button
                          variant={presavedTracks.has(track.id) ? "default" : "outline"}
                          onClick={() => togglePresave(track.id)}
                          className="gap-2"
                        >
                          {presavedTracks.has(track.id) ? (
                            <>
                              <BellOff className="w-4 h-4" />
                              Presaved
                            </>
                          ) : (
                            <>
                              <Bell className="w-4 h-4" />
                              Presave
                            </>
                          )}
                        </Button>
                      ) : (
                        <Badge variant="outline">
                          {track.genre || "Single"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about">
            <Card className="glass-card-premium p-8">
              <h2 className="text-3xl font-black glow-text mb-4">About</h2>
              <p className="text-lg leading-relaxed">{artist.bio || "No bio available yet."}</p>
              
              {artist.social_links && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4">Connect</h3>
                  <div className="flex gap-3">
                    {/* Social links would go here */}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {gallery.map(photo => (
                <Card key={photo.id} className="glass-card-premium overflow-hidden group relative hover-lift">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || "Gallery photo"}
                    className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {photo.caption && (
                    <div className="p-3 bg-gradient-to-t from-background/90 to-transparent">
                      <p className="text-sm">{photo.caption}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {gallery.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No photos in gallery yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

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
