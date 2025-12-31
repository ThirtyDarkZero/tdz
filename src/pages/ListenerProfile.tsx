import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Edit, Save, X, Music, Heart, Clock, 
  Camera, Users, ListMusic, Share2, Settings, Play,
  Trophy, Flame, Star, Zap, ChevronLeft, ChevronRight,
  MoreHorizontal, Bell, MessageCircle, UserPlus, UserCheck,
  Sparkles, Grid3X3, Activity
} from "lucide-react";
import { toast } from "sonner";
import { MotionCover } from "@/components/MotionCover";
import { ShareProfileModal } from "@/components/ShareProfileModal";
import { DirectMessagePanel } from "@/components/DirectMessagePanel";
import { ProfileActivityFeed } from "@/components/social/ProfileActivityFeed";
import { ProfileStats } from "@/components/social/ProfileStats";
import { FollowersGrid } from "@/components/social/FollowersGrid";
import { MusicTasteCard } from "@/components/social/MusicTasteCard";
import { FanBadges, FanLevel } from "@/components/social/FanBadges";
import { SocialFeed } from "@/components/social/SocialFeed";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ListenerProfile() {
  const navigate = useNavigate();
  const { fanId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playlistScrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");
  const [user, setUser] = useState<any>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [likedTracks, setLikedTracks] = useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [badges, setBadges] = useState<string[]>([]);
  const [engagement, setEngagement] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    location: "",
    favorite_genres: [] as string[],
  });

  useEffect(() => {
    loadUserData();
  }, [fanId]);

  const loadUserData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Determine which profile to view
      let targetUserId = fanId || currentUser?.id;
      
      if (!targetUserId) {
        navigate("/auth");
        return;
      }

      setViewingUserId(targetUserId);
      setIsOwnProfile(!fanId || fanId === currentUser?.id);

      // Load the target user's profile
      const { data: profileData, error: profileError } = await supabase
        .from("listener_profiles")
        .select("*")
        .eq("user_id", targetUserId)
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
      } else if (isOwnProfile && currentUser) {
        // Create profile if own profile and doesn't exist
        const { data: newProfile } = await supabase
          .from("listener_profiles")
          .insert({
            user_id: currentUser.id,
            display_name: currentUser.email?.split('@')[0] || "Music Explorer"
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

      // Load likes
      const { data: likesData } = await supabase
        .from("track_likes")
        .select(`track_id, created_at, tracks:track_id (id, title, artist_name, duration, album_cover_path, album_cover_bucket, motion_cover_path, motion_cover_bucket)`)
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (likesData) {
        setLikedTracks(likesData.filter(item => item.tracks).map(item => item.tracks));
      }

      // Load listening history
      const { data: historyData } = await supabase
        .from("listening_history")
        .select(`played_at, track_id, tracks:track_id (id, title, artist_name, duration, album_cover_path, album_cover_bucket)`)
        .eq("user_id", targetUserId)
        .order("played_at", { ascending: false })
        .limit(20);

      if (historyData) {
        const seen = new Set();
        const unique = historyData.filter(item => {
          if (!item.tracks || seen.has(item.track_id)) return false;
          seen.add(item.track_id);
          return true;
        });
        setRecentlyPlayed(unique.map(item => ({ ...item.tracks, played_at: item.played_at })));
      }

      // Load playlists (only public ones if not own profile)
      const playlistQuery = supabase
        .from("playlists")
        .select("*")
        .eq("user_id", targetUserId)
        .order("updated_at", { ascending: false });
      
      if (!isOwnProfile) {
        playlistQuery.eq("is_public", true);
      }
      
      const { data: playlistsData } = await playlistQuery;
      setPlaylists(playlistsData || []);

      // Load following count (artists)
      const { count: followingCountData } = await supabase
        .from("artist_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetUserId);
      
      setFollowingCount(followingCountData || 0);

      // Load followers count (fans)
      const { count: fanFollowersCount } = await supabase
        .from("fan_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId);
      
      setFollowersCount(fanFollowersCount || 0);

      // Check if current user follows this profile
      if (currentUser && !isOwnProfile) {
        const { data: followCheck } = await supabase
          .from("fan_follows")
          .select("id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", targetUserId)
          .maybeSingle();
        
        setIsFollowing(!!followCheck);
      }

      // Load badges
      const { data: badgesData } = await supabase
        .from("fan_badges")
        .select("badge_type")
        .eq("user_id", targetUserId);
      
      setBadges(badgesData?.map(b => b.badge_type) || []);

      // Load engagement data
      const { data: engagementData } = await supabase
        .from("fan_engagement")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();
      
      setEngagement(engagementData);

    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !isOwnProfile) return;

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
      if (!user || !profile || !isOwnProfile) return;

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

      toast.success("Profile updated");
      setEditing(false);
      loadUserData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const toggleFollow = async () => {
    if (!user || !viewingUserId || isOwnProfile) return;

    try {
      if (isFollowing) {
        await supabase
          .from("fan_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", viewingUserId);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        toast.success("Unfollowed");
      } else {
        await supabase
          .from("fan_follows")
          .insert({ follower_id: user.id, following_id: viewingUserId });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success("Now following!");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow");
    }
  };

  const getProfileImageUrl = () => {
    if (!profile?.profile_image_path) return null;
    return supabase.storage.from("listener-images").getPublicUrl(profile.profile_image_path).data.publicUrl;
  };

  const scrollPlaylists = (direction: 'left' | 'right') => {
    if (playlistScrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      playlistScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const favoriteGenres = formData.favorite_genres.length > 0 
    ? formData.favorite_genres 
    : ["Music Lover"];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="font-bold text-lg truncate">{formData.display_name || "Fan"}</span>
          </div>
          
          {isOwnProfile && !editing && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setEditing(true)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {isOwnProfile && editing && (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setEditing(false)} className="h-9 w-9 rounded-full bg-white/5">
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-400 text-black rounded-full">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section with Gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/30 via-purple-900/20 to-[#0a0a0a] h-80" />
        
        {/* Profile Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Circular Avatar with Ring */}
            <div className="relative flex-shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden bg-gradient-to-br from-cyan-600 to-purple-700 p-1">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#0a0a0a] flex items-center justify-center">
                  {profile?.profile_image_path ? (
                    <img
                      src={getProfileImageUrl() || undefined}
                      alt={formData.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl sm:text-6xl font-bold text-white/80">
                      {formData.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </div>
              {isOwnProfile && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    size="icon"
                    className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                </>
              )}
              {/* Level Badge */}
              {engagement && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <FanLevel level={engagement.level || 1} xp={engagement.xp_total || 0} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left pt-4 sm:pt-0">
              {/* Badges */}
              {badges.length > 0 && (
                <div className="mb-3">
                  <FanBadges badges={badges} size="md" />
                </div>
              )}

              {/* Type + Genre Tags */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <Badge variant="outline" className="bg-cyan-500/20 border-cyan-500/30 text-cyan-400 text-xs px-3 py-1 rounded-full">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Fan
                </Badge>
                {formData.location && (
                  <span className="text-white/50 text-sm">📍 {formData.location}</span>
                )}
              </div>

              {/* Name */}
              {editing ? (
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Your name"
                  className="text-3xl sm:text-4xl font-black bg-transparent border-white/20 mb-3 max-w-md"
                />
              ) : (
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-2 tracking-tight bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
                  {formData.display_name || "Music Explorer"}
                </h1>
              )}

              {/* Bio */}
              {formData.bio && !editing && (
                <p className="text-white/60 text-sm mb-4 max-w-lg">{formData.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 text-sm mb-6">
                <button className="text-center hover:text-cyan-400 transition-colors">
                  <span className="block text-2xl font-black text-white">{followersCount}</span>
                  <span className="text-white/50">Followers</span>
                </button>
                <button className="text-center hover:text-cyan-400 transition-colors">
                  <span className="block text-2xl font-black text-white">{followingCount}</span>
                  <span className="text-white/50">Following</span>
                </button>
                <button className="text-center hover:text-cyan-400 transition-colors">
                  <span className="block text-2xl font-black text-white">{playlists.length}</span>
                  <span className="text-white/50">Playlists</span>
                </button>
                <button className="text-center hover:text-cyan-400 transition-colors">
                  <span className="block text-2xl font-black text-white">{likedTracks.length}</span>
                  <span className="text-white/50">Likes</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-3">
                {isOwnProfile ? (
                  <>
                    <Button 
                      onClick={() => navigate("/discover")}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-black font-bold px-6 h-11 rounded-full gap-2"
                    >
                      <Play className="w-5 h-5" fill="currentColor" />
                      DISCOVER
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShareModalOpen(true)}
                      className="border-white/30 text-white hover:bg-white/10 font-semibold px-6 h-11 rounded-full gap-2"
                    >
                      <Share2 className="w-5 h-5" />
                      Share
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={toggleFollow}
                      className={isFollowing 
                        ? "bg-white/10 hover:bg-white/20 text-white font-bold px-6 h-11 rounded-full gap-2"
                        : "bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-black font-bold px-6 h-11 rounded-full gap-2"
                      }
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-5 h-5" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedConversation({ user_id: viewingUserId })}
                      className="border-white/30 text-white hover:bg-white/10 font-semibold px-6 h-11 rounded-full gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Message
                    </Button>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-11 w-11 rounded-full border border-white/20 hover:bg-white/10"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                    {isOwnProfile && (
                      <DropdownMenuItem className="text-white hover:bg-white/10">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-white hover:bg-white/10">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Profile
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Bio Edit */}
          {editing && (
            <div className="mt-6 max-w-2xl mx-auto sm:mx-0 space-y-4">
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about your music taste..."
                className="bg-white/5 border-white/20 text-white"
              />
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Location"
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
          )}
        </section>
      </div>

      {/* Stats Cards */}
      {viewingUserId && (
        <section className="px-4 sm:px-6 lg:px-8 py-4">
          <ProfileStats userId={viewingUserId} />
        </section>
      )}

      {/* Tabs Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/5 border border-white/10 rounded-full p-1 mb-6">
            <TabsTrigger 
              value="activity" 
              className="rounded-full data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger 
              value="music" 
              className="rounded-full data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              <Music className="w-4 h-4 mr-2" />
              Music
            </TabsTrigger>
            <TabsTrigger 
              value="social" 
              className="rounded-full data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              <Users className="w-4 h-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger 
              value="playlists" 
              className="rounded-full data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              <ListMusic className="w-4 h-4 mr-2" />
              Playlists
            </TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Recent Activity
                  </h3>
                  {viewingUserId && (
                    <ProfileActivityFeed userId={viewingUserId} isOwnProfile={isOwnProfile} />
                  )}
                </div>
                
                {isOwnProfile && (
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-purple-400" />
                      Share Your Story
                    </h3>
                    <SocialFeed variant="compact" />
                  </div>
                )}
              </div>
              
              <div>
                {viewingUserId && <MusicTasteCard userId={viewingUserId} />}
              </div>
            </div>
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Liked Tracks */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Liked Tracks
                </h3>
                {likedTracks.length > 0 ? (
                  <div className="space-y-2">
                    {likedTracks.slice(0, 10).map((track: any, idx: number) => (
                      <div 
                        key={track.id}
                        onClick={() => navigate(`/track/${track.id}`)}
                        className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <span className="w-6 text-center text-white/40 text-sm">{idx + 1}</span>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                          <MotionCover
                            motionCoverPath={track.motion_cover_path}
                            motionCoverBucket={track.motion_cover_bucket}
                            staticCoverPath={track.album_cover_path}
                            staticCoverBucket={track.album_cover_bucket || "album-covers"}
                            alt={track.title}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-white">{track.title}</p>
                          <p className="text-sm text-white/50 truncate">{track.artist_name}</p>
                        </div>
                        <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/50">
                    <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No liked tracks yet</p>
                  </div>
                )}
              </div>

              {/* Recently Played */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Recently Played
                </h3>
                {recentlyPlayed.length > 0 ? (
                  <div className="space-y-2">
                    {recentlyPlayed.slice(0, 10).map((track: any, idx: number) => (
                      <div 
                        key={`${track.id}-${idx}`}
                        onClick={() => navigate(`/track/${track.id}`)}
                        className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <Play className="w-4 h-4 text-cyan-400" />
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                          {track.album_cover_path ? (
                            <img
                              src={supabase.storage.from(track.album_cover_bucket || "album-covers").getPublicUrl(track.album_cover_path).data.publicUrl}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center">
                              <Music className="w-6 h-6 text-white/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-white">{track.title}</p>
                          <p className="text-sm text-white/50 truncate">{track.artist_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/50">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No listening history</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Followers
                </h3>
                {viewingUserId && (
                  <FollowersGrid userId={viewingUserId} type="followers" isOwnProfile={isOwnProfile} />
                )}
              </div>
              
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Following
                </h3>
                {viewingUserId && (
                  <FollowersGrid userId={viewingUserId} type="following" isOwnProfile={isOwnProfile} />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="mt-0">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-purple-400" />
                Playlists
              </h3>
              {playlists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {playlists.map((playlist: any) => (
                    <div
                      key={playlist.id}
                      onClick={() => navigate(`/playlist/${playlist.id}`)}
                      className="group cursor-pointer"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-600 to-cyan-600 mb-3 relative">
                        {playlist.cover_image_path ? (
                          <img
                            src={supabase.storage.from("playlist-covers").getPublicUrl(playlist.cover_image_path).data.publicUrl}
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ListMusic className="w-12 h-12 text-white/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                        </div>
                      </div>
                      <p className="font-medium text-sm truncate">{playlist.name}</p>
                      <p className="text-xs text-white/50">
                        {playlist.is_public ? 'Public' : 'Private'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-white/50">
                  <ListMusic className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No playlists yet</p>
                  {isOwnProfile && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4 border-white/20"
                      onClick={() => navigate('/discover')}
                    >
                      Create Playlist
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Modals */}
      <ShareProfileModal 
        open={shareModalOpen} 
        onOpenChange={setShareModalOpen}
        profileData={{
          displayName: formData.display_name,
          totalPlays: 0,
          hoursListened: 0,
          artistsFollowed: followingCount,
          likedSongs: likedTracks.length,
          playlists: playlists.length,
          tasteScore: 85,
          achievements: badges,
          topGenres: favoriteGenres
        }}
      />

      {selectedConversation && (
        <DirectMessagePanel
          open={true}
          recipientId={selectedConversation.user_id}
          recipientName={selectedConversation.display_name || 'User'}
          recipientAvatar={selectedConversation.profile_image_path}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </div>
  );
}
