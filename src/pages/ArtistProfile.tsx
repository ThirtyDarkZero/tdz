import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Play, Heart, UserPlus, UserCheck, Share2, 
  Music, Image as ImageIcon, Bell, BellOff
} from "lucide-react";

export default function ArtistProfile() {
  const { artistId } = useParams();
  const [artist, setArtist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [presavedTracks, setPresavedTracks] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
    loadArtist();
    loadTracks();
    loadGallery();
  }, [artistId]);

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
      .single();

    if (error) {
      console.error("Error loading artist:", error);
      toast.error("Failed to load artist profile");
    } else {
      setArtist(data);
    }
  };

  const loadTracks = async () => {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("user_id", artistId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTracks(data);
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
      .single();

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


  if (!artist) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        {artist.banner_image_path ? (
          <img
            src={artist.banner_image_path}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary-glow/20 to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto flex items-end gap-6">
            <div className="relative">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-background shadow-glow">
                {artist.profile_image_path ? (
                  <img
                    src={artist.profile_image_path}
                    alt={artist.artist_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                    <Music className="w-16 h-16 text-primary-foreground" />
                  </div>
                )}
              </div>
              {artist.verified && (
                <Badge className="absolute bottom-2 right-2 bg-primary shadow-glow">
                  ✓ Verified
                </Badge>
              )}
            </div>

            <div className="flex-1 pb-4">
              <h1 className="text-6xl font-black mb-2 glow-text">{artist.artist_name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <span>{artist.monthly_listeners?.toLocaleString()} monthly listeners</span>
                <span>•</span>
                <span>{artist.total_plays?.toLocaleString()} total plays</span>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={toggleFollow} size="lg" className="shadow-glow">
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-5 h-5 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <Tabs defaultValue="music" className="space-y-8">
          <TabsList className="glass-card-premium p-2">
            <TabsTrigger value="music" className="gap-2">
              <Music className="w-4 h-4" />
              Music
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              About
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music" className="space-y-4">
            <h2 className="text-3xl font-black glow-text mb-6">Releases</h2>
            <div className="grid gap-4">
              {tracks.map(track => (
                <Card key={track.id} className="glass-card-premium p-6 hover-lift">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button size="icon" variant="outline" className="h-12 w-12 rounded-full">
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
                        <Badge variant="outline">{track.play_count?.toLocaleString()} plays</Badge>
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

          <TabsContent value="gallery" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
