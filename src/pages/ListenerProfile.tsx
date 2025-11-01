import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Home, User, Music, Heart, ListMusic } from "lucide-react";
import tdzLogo from "@/assets/tdz-logo.png";

export default function ListenerProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [likedTracks, setLikedTracks] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadPlaylists();
      loadLikedTracks();
    }
  }, [userId]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("listener_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const loadPlaylists = async () => {
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", userId)
      .eq("is_public", true)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setPlaylists(data);
    }
  };

  const loadLikedTracks = async () => {
    const { data, error } = await supabase
      .from("track_likes")
      .select(`
        *,
        tracks (
          id,
          title,
          artist_name,
          album_cover_path
        )
      `)
      .eq("user_id", userId)
      .limit(20);

    if (!error && data) {
      setLikedTracks(data.map(l => l.tracks).filter(Boolean));
    }
  };

  if (!profile) {
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

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="flex items-center gap-8 mb-12">
          <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary-glow shadow-glow">
            {profile.profile_image_path ? (
              <img
                src={profile.profile_image_path}
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-primary-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <Badge className="mb-2">LISTENER</Badge>
            <h1 className="text-5xl font-black glow-text mb-2">{profile.display_name}</h1>
            {profile.location && (
              <p className="text-muted-foreground mb-4">{profile.location}</p>
            )}
            {profile.bio && (
              <p className="text-lg max-w-2xl">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="playlists" className="w-full">
          <TabsList className="glass-card mb-8">
            <TabsTrigger value="playlists" className="gap-2">
              <ListMusic className="w-4 h-4" />
              Public Playlists ({playlists.length})
            </TabsTrigger>
            <TabsTrigger value="liked" className="gap-2">
              <Heart className="w-4 h-4" />
              Liked Tracks ({likedTracks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="playlists">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {playlists.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  No public playlists yet
                </p>
              ) : (
                playlists.map((playlist) => (
                  <Card
                    key={playlist.id}
                    className="glass-card-premium p-4 hover:border-primary/70 transition-all cursor-pointer"
                  >
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 mb-4 flex items-center justify-center">
                      <Music className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="font-bold truncate">{playlist.name}</h3>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {playlist.description}
                      </p>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="liked">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {likedTracks.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  No liked tracks yet
                </p>
              ) : (
                likedTracks.map((track: any) => (
                  <Card
                    key={track.id}
                    className="glass-card-premium p-4 hover:border-primary/70 transition-all cursor-pointer"
                    onClick={() => navigate(`/track/${track.id}`)}
                  >
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 mb-3 overflow-hidden">
                      {track.album_cover_path ? (
                        <img
                          src={supabase.storage.from('album-covers').getPublicUrl(track.album_cover_path).data.publicUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-sm truncate">{track.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
