import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Edit, Save, X, Music, Heart, Clock, 
  Camera, Users, ListMusic, Share2, Settings, Play,
  Trophy, Flame, Star, Zap, Headphones, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { PlaylistManager } from "@/components/PlaylistManager";
import { MotionCover } from "@/components/MotionCover";
import tdzLogo from "@/assets/tdz-logo.png";

export default function ListenerProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [likedTracks, setLikedTracks] = useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  
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
      } else {
        // Create default profile
        const { data: newProfile } = await supabase
          .from("listener_profiles")
          .insert({
            user_id: user.id,
            display_name: user.email?.split('@')[0] || "Music Lover"
          })
          .select()
          .single();
        
        if (newProfile) {
          setProfile(newProfile);
          setFormData({
            display_name: newProfile.display_name || "",
            bio: "",
            location: "",
            favorite_genres: []
          });
        }
      }

      // Load liked tracks
      const { data: likesData } = await supabase
        .from("track_likes")
        .select(`
          track_id,
          created_at,
          tracks:track_id (
            id,
            title,
            artist_name,
            duration,
            album_cover_path,
            album_cover_bucket,
            motion_cover_path,
            motion_cover_bucket
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (likesData) {
        setLikedTracks(likesData.filter(item => item.tracks).map(item => item.tracks));
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
            duration,
            album_cover_path,
            album_cover_bucket
          )
        `)
        .eq("user_id", user.id)
        .order("played_at", { ascending: false })
        .limit(20);

      if (historyData) {
        // Deduplicate
        const seen = new Set();
        const unique = historyData.filter(item => {
          if (!item.tracks || seen.has(item.track_id)) return false;
          seen.add(item.track_id);
          return true;
        });
        setRecentlyPlayed(unique.map(item => ({
          ...item.tracks,
          played_at: item.played_at
        })));
      }

      // Load playlists count
      const { data: playlistsData } = await supabase
        .from("playlists")
        .select("id")
        .eq("user_id", user.id);
      
      setPlaylists(playlistsData || []);

      // Load following count
      const { count: followingCountData } = await supabase
        .from("artist_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id);
      
      setFollowingCount(followingCountData || 0);

    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/profile.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listener-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("listener_profiles")
        .update({ profile_image_path: filePath })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success("Profile photo updated!");
      loadUserData();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!user || !profile) return;

      const { error } = await supabase
        .from("listener_profiles")
        .update({
          display_name: formData.display_name,
          bio: formData.bio,
          location: formData.location,
          favorite_genres: formData.favorite_genres,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

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

  const getProfileImageUrl = () => {
    if (!profile?.profile_image_path) return null;
    return supabase.storage.from("listener-images").getPublicUrl(profile.profile_image_path).data.publicUrl;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/discover")}
                className="gap-1 sm:gap-2 h-9 px-2 sm:px-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <img src={tdzLogo} alt="TDZ" className="h-6 sm:h-8 w-auto" />
            </div>
            {!editing ? (
              <Button onClick={() => setEditing(true)} size="sm" className="gap-1 sm:gap-2 h-9">
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Profile</span>
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="h-9 px-2 sm:px-4">
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSave} className="h-9 px-2 sm:px-4">
                  <Save className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Hero */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="h-32 sm:h-48 md:h-56 bg-gradient-to-r from-primary/30 via-primary-glow/20 to-secondary/30" />
        
        {/* Profile Info Overlay */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
            {/* Avatar with Upload */}
            <div className="relative">
              <Avatar className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 border-4 border-background shadow-glow">
                <AvatarImage src={getProfileImageUrl() || undefined} />
                <AvatarFallback className="text-3xl sm:text-4xl md:text-5xl bg-gradient-to-br from-primary to-secondary">
                  {formData.display_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <Button
                size="icon"
                className="absolute bottom-1 right-1 h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            {/* Name & Stats */}
            <div className="flex-1 text-center sm:text-left pb-2">
              {editing ? (
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Display Name"
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-transparent border-primary/50 mb-2"
                />
              ) : (
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-1">
                  {formData.display_name || "Music Lover"}
                </h1>
              )}
              
              {formData.location && !editing && (
                <p className="text-sm text-muted-foreground mb-2">📍 {formData.location}</p>
              )}

              {/* Stats Row */}
              <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 text-sm">
                <div className="text-center sm:text-left">
                  <span className="font-bold">{followingCount}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="font-bold">{playlists.length}</span>
                  <span className="text-muted-foreground ml-1">Playlists</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="font-bold">{likedTracks.length}</span>
                  <span className="text-muted-foreground ml-1">Liked</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {editing ? (
          <div className="space-y-4">
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              className="min-h-[80px]"
            />
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Location (e.g., Los Angeles, CA)"
            />
          </div>
        ) : formData.bio ? (
          <p className="text-muted-foreground">{formData.bio}</p>
        ) : null}
      </div>

      {/* Stats & Achievements Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-6">
        {/* Listening Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="glass-card-premium p-4 text-center hover:border-primary/50 transition-all">
            <Headphones className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{recentlyPlayed.length * 3}</div>
            <div className="text-xs text-muted-foreground">Total Plays</div>
          </Card>
          <Card className="glass-card-premium p-4 text-center hover:border-primary/50 transition-all">
            <Clock className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{Math.round(recentlyPlayed.length * 3 * 3.5 / 60)}h</div>
            <div className="text-xs text-muted-foreground">Hours Listened</div>
          </Card>
          <Card className="glass-card-premium p-4 text-center hover:border-primary/50 transition-all">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{followingCount}</div>
            <div className="text-xs text-muted-foreground">Artists Followed</div>
          </Card>
          <Card className="glass-card-premium p-4 text-center hover:border-primary/50 transition-all">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{likedTracks.length > 0 ? Math.min(100, likedTracks.length * 5) : 0}%</div>
            <div className="text-xs text-muted-foreground">Taste Score</div>
          </Card>
        </div>

        {/* Achievements Section */}
        <Card className="glass-card-premium p-4 sm:p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievements
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Badge className="gap-1 py-2 px-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 hover:border-yellow-500/50">
              <Star className="w-3 h-3 text-yellow-500" />
              Early Adopter
            </Badge>
            {likedTracks.length >= 5 && (
              <Badge className="gap-1 py-2 px-3 bg-gradient-to-r from-pink-500/20 to-red-500/20 border-pink-500/30 hover:border-pink-500/50">
                <Heart className="w-3 h-3 text-pink-500" />
                Music Lover
              </Badge>
            )}
            {playlists.length >= 1 && (
              <Badge className="gap-1 py-2 px-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500/30 hover:border-purple-500/50">
                <ListMusic className="w-3 h-3 text-purple-500" />
                Curator
              </Badge>
            )}
            {followingCount >= 3 && (
              <Badge className="gap-1 py-2 px-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-500/50">
                <Users className="w-3 h-3 text-blue-500" />
                Fan Club
              </Badge>
            )}
            {recentlyPlayed.length >= 10 && (
              <Badge className="gap-1 py-2 px-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/50">
                <Flame className="w-3 h-3 text-green-500" />
                On Fire
              </Badge>
            )}
            <Badge className="gap-1 py-2 px-3 bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 hover:border-primary/50">
              <Zap className="w-3 h-3 text-primary" />
              TDZ Pioneer
            </Badge>
          </div>
        </Card>

        {/* Music Taste Section */}
        <Card className="glass-card-premium p-4 sm:p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Music Taste
          </h3>
          <div className="space-y-3">
            {[
              { genre: "Hip-Hop", percent: 45, color: "bg-purple-500" },
              { genre: "R&B", percent: 30, color: "bg-blue-500" },
              { genre: "Pop", percent: 15, color: "bg-pink-500" },
              { genre: "Electronic", percent: 10, color: "bg-cyan-500" },
            ].map((item) => (
              <div key={item.genre} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.genre}</span>
                  <span className="text-muted-foreground">{item.percent}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {likedTracks.length === 0 && recentlyPlayed.length === 0 && (
            <p className="text-center text-muted-foreground text-sm mt-4">
              Listen to more music to personalize your taste profile!
            </p>
          )}
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
        <Tabs defaultValue="liked" className="space-y-6">
          <TabsList className="w-full sm:w-auto glass-card-premium p-1 h-auto">
            <TabsTrigger value="liked" className="gap-2 flex-1 sm:flex-none py-2 sm:py-3 px-3 sm:px-6">
              <Heart className="w-4 h-4" />
              <span>Liked</span>
            </TabsTrigger>
            <TabsTrigger value="playlists" className="gap-2 flex-1 sm:flex-none py-2 sm:py-3 px-3 sm:px-6">
              <ListMusic className="w-4 h-4" />
              <span>Playlists</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 flex-1 sm:flex-none py-2 sm:py-3 px-3 sm:px-6">
              <Clock className="w-4 h-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          {/* Liked Songs */}
          <TabsContent value="liked" className="space-y-4">
            {likedTracks.length === 0 ? (
              <Card className="glass-card-premium p-8 sm:p-12 text-center">
                <Heart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2">No Liked Songs Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start exploring and like songs to save them here
                </p>
                <Button onClick={() => navigate("/discover")}>Explore Music</Button>
              </Card>
            ) : (
              <div className="grid gap-2">
                {likedTracks.map((track: any) => (
                  <Card 
                    key={track.id}
                    className="glass-card p-3 hover:border-primary/50 transition-all cursor-pointer group"
                    onClick={() => navigate(`/track/${track.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded overflow-hidden bg-gradient-to-br from-primary/30 to-secondary/30 flex-shrink-0 relative">
                        <MotionCover
                          motionCoverPath={track.motion_cover_path}
                          motionCoverBucket={track.motion_cover_bucket}
                          staticCoverPath={track.album_cover_path}
                          staticCoverBucket={track.album_cover_bucket || "album-covers"}
                          alt={track.title}
                          className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-5 h-5 text-white" fill="currentColor" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{track.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{track.artist_name}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Playlists */}
          <TabsContent value="playlists">
            <PlaylistManager 
              userId={user?.id} 
              onPlaylistSelect={(id) => navigate(`/playlist/${id}`)}
            />
          </TabsContent>

          {/* Listening History */}
          <TabsContent value="history" className="space-y-4">
            {recentlyPlayed.length === 0 ? (
              <Card className="glass-card-premium p-8 sm:p-12 text-center">
                <Clock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2">No Listening History</h3>
                <p className="text-muted-foreground mb-4">
                  Start playing music to see your listening history
                </p>
                <Button onClick={() => navigate("/discover")}>Explore Music</Button>
              </Card>
            ) : (
              <div className="grid gap-2">
                {recentlyPlayed.map((track: any, index: number) => (
                  <Card 
                    key={`${track.id}-${index}`}
                    className="glass-card p-3 hover:border-primary/50 transition-all cursor-pointer group"
                    onClick={() => navigate(`/track/${track.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded overflow-hidden bg-gradient-to-br from-primary/30 to-secondary/30 flex-shrink-0 relative">
                        {track.album_cover_path && track.album_cover_bucket ? (
                          <img
                            src={supabase.storage.from(track.album_cover_bucket).getPublicUrl(track.album_cover_path).data.publicUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-5 h-5 text-white" fill="currentColor" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{track.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{track.artist_name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {new Date(track.played_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
