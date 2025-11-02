import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Edit, Save, X, Music, Heart, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ListenerProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [likedTracks, setLikedTracks] = useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    location: "",
    favorite_genres: [] as string[],
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      // Load listener profile
      const { data: profileData, error: profileError } = await supabase
        .from("listener_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (profileData) {
        setProfile(profileData);
        setFormData({
          display_name: profileData.display_name || "",
          bio: profileData.bio || "",
          location: profileData.location || "",
          favorite_genres: Array.isArray(profileData.favorite_genres) 
            ? (profileData.favorite_genres as string[])
            : [],
        });
      }

      // Load liked tracks
      const { data: likesData } = await supabase
        .from("user_library")
        .select(`
          track_id,
          tracks:track_id (
            id,
            title,
            artist_name,
            duration,
            album_cover_path,
            album_cover_bucket
          )
        `)
        .eq("user_id", user.id)
        .eq("library_type", "liked_track")
        .limit(10);

      if (likesData) {
        setLikedTracks(likesData.map(item => item.tracks).filter(Boolean));
      }

      // Load recently played
      const { data: historyData } = await supabase
        .from("listening_history")
        .select(`
          played_at,
          track_id,
          tracks:track_id (
            id,
            title,
            artist_name,
            duration
          )
        `)
        .eq("user_id", user.id)
        .order("played_at", { ascending: false })
        .limit(10);

      if (historyData) {
        setRecentlyPlayed(historyData.map(item => ({
          ...item.tracks,
          played_at: item.played_at
        })).filter(Boolean));
      }

    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from("listener_profiles")
        .upsert({
          user_id: user.id,
          ...formData,
        });

      if (error) throw error;

      toast.success("Profile updated successfully");
      setEditing(false);
      loadUserData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card-premium border-b neon-border-strong shadow-glow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/discover")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Discover
            </Button>
            {!editing ? (
              <Button onClick={() => setEditing(true)} className="gap-2">
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4" />
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid gap-8">
          {/* Profile Header */}
          <Card className="glass-card-premium p-8">
            <div className="flex items-start gap-6">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile?.profile_image_path} />
                <AvatarFallback className="text-4xl">
                  {formData.display_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                {editing ? (
                  <div className="space-y-4">
                    <Input
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="Display Name"
                      className="text-2xl font-bold"
                    />
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px]"
                    />
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Location"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black">{formData.display_name || "Music Lover"}</h1>
                    {formData.bio && <p className="text-muted-foreground text-lg">{formData.bio}</p>}
                    {formData.location && <p className="text-sm text-muted-foreground">📍 {formData.location}</p>}
                  </>
                )}
                
                <Badge variant="outline" className="text-sm">
                  Listener
                </Badge>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card-premium p-6 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">{likedTracks.length}</div>
              <div className="text-sm text-muted-foreground">Liked Tracks</div>
            </Card>
            <Card className="glass-card-premium p-6 text-center">
              <Music className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">{recentlyPlayed.length}</div>
              <div className="text-sm text-muted-foreground">Recently Played</div>
            </Card>
            <Card className="glass-card-premium p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Hours Listened</div>
            </Card>
          </div>

          {/* Liked Tracks */}
          {likedTracks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black">Liked Tracks</h2>
              <div className="grid gap-4">
                {likedTracks.map((track) => (
                  <Card 
                    key={track.id}
                    className="glass-card-premium p-4 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/track/${track.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded bg-gradient-to-br from-primary/30 to-secondary/30">
                        {track.album_cover_path && track.album_cover_bucket && (
                          <img
                            src={supabase.storage.from(track.album_cover_bucket).getPublicUrl(track.album_cover_path).data.publicUrl}
                            alt={track.title}
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{track.title}</h3>
                        <p className="text-sm text-muted-foreground">{track.artist_name}</p>
                      </div>
                      <Badge variant="outline">{formatDuration(track.duration)}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recently Played */}
          {recentlyPlayed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black">Recently Played</h2>
              <div className="grid gap-4">
                {recentlyPlayed.map((track, index) => (
                  <Card 
                    key={`${track.id}-${index}`}
                    className="glass-card-premium p-4 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/track/${track.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{track.title}</h3>
                        <p className="text-sm text-muted-foreground">{track.artist_name}</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(track.played_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
