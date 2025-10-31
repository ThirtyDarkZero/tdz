import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Heart, Share2, Music, TrendingUp, Flame, 
  Search, User, ListMusic, Plus, UserPlus 
} from "lucide-react";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";

export default function Discover() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [followedArtists, setFollowedArtists] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
    const { data, error } = await supabase
      .from("published_tracks_view")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error loading tracks:", error);
      toast.error("Failed to load tracks");
    } else {
      setTracks(data || []);
    }
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

  const filteredTracks = tracks.filter(track =>
    track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={tdzLogo} alt="TDZ" className="h-10 w-auto" />
              <span className="font-display font-bold text-xl hidden md:block">
                TDZ DISTRIBUTION
              </span>
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracks, artists..."
                  className="pl-10 bg-background/80 backdrop-blur-sm"
                />
              </div>
            </div>

            <Button variant="outline" size="icon">
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="discover" className="space-y-8">
          <TabsList className="glass-card">
            <TabsTrigger value="discover" className="gap-2">
              <Flame className="w-4 h-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="artists" className="gap-2">
              <Music className="w-4 h-4" />
              Artists
            </TabsTrigger>
            <TabsTrigger value="playlists" className="gap-2">
              <ListMusic className="w-4 h-4" />
              My Playlists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl glass-card p-12 border-primary/30">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
              <div className="relative z-10">
                <Badge className="bg-accent/20 text-accent border-accent/30 mb-4">
                  <Flame className="w-3 h-3 mr-1" />
                  Hot This Week
                </Badge>
                <h1 className="text-5xl font-display font-black mb-4">
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    DISCOVER
                  </span>
                  <br />
                  NEW MUSIC
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Stream unlimited music from independent artists around the world
                </p>
              </div>
            </div>

            {/* Tracks Grid */}
            <div>
              <h2 className="text-2xl font-display font-bold mb-6">Latest Releases</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTracks.map((track) => (
                  <Card key={track.id} className="glass-card group hover:border-primary/60 transition-all duration-300">
                    <div className="p-4 space-y-3">
                      {/* Album Art */}
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                        {track.album_cover && (
                          <img 
                            src={track.album_cover} 
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="icon" className="h-12 w-12 rounded-full bg-primary">
                            <Play className="w-5 h-5" fill="currentColor" />
                          </Button>
                        </div>
                      </div>

                      {/* Track Info */}
                      <div>
                        <h3 className="font-semibold truncate">{track.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.artist_name}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleLike(track.id)}
                            className={likedTracks.has(track.id) ? "text-red-500" : ""}
                          >
                            <Heart 
                              className="w-4 h-4" 
                              fill={likedTracks.has(track.id) ? "currentColor" : "none"}
                            />
                          </Button>
                          <Button size="icon" variant="ghost">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="artists" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {artists.map((artist) => (
                <Card key={artist.id} className="glass-card p-4 text-center hover:border-primary/60 transition-all">
                  <div className="aspect-square rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 mb-3">
                    {artist.profile_image_path && (
                      <img 
                        src={artist.profile_image_path}
                        alt={artist.artist_name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <h3 className="font-semibold truncate mb-1">{artist.artist_name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {artist.monthly_listeners?.toLocaleString()} listeners
                  </p>
                  <Button
                    size="sm"
                    variant={followedArtists.has(artist.user_id) ? "outline" : "default"}
                    onClick={() => toggleFollow(artist.user_id)}
                    className="w-full"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    {followedArtists.has(artist.user_id) ? "Following" : "Follow"}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="playlists" className="space-y-6">
            <Button className="bg-gradient-to-r from-primary to-secondary">
              <Plus className="w-4 h-4 mr-2" />
              Create Playlist
            </Button>
            
            {playlists.length === 0 ? (
              <Card className="glass-card p-12 text-center">
                <ListMusic className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first playlist to organize your favorite tracks
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {playlists.map((playlist) => (
                  <Card key={playlist.id} className="glass-card p-4 hover:border-primary/60 transition-all">
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 mb-3" />
                    <h3 className="font-semibold truncate">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">{playlist.description}</p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}