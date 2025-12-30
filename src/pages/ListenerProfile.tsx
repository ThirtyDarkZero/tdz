import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Edit, Save, X, Music, Heart, Clock, 
  Camera, Users, ListMusic, Share2, Settings, Play,
  Trophy, Flame, Star, Zap, ChevronLeft, ChevronRight,
  MoreHorizontal, Bell
} from "lucide-react";
import { toast } from "sonner";
import { PlaylistManager } from "@/components/PlaylistManager";
import { MotionCover } from "@/components/MotionCover";
import { ShareProfileModal } from "@/components/ShareProfileModal";
import { DirectMessagePanel } from "@/components/DirectMessagePanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ListenerProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playlistScrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [likedTracks, setLikedTracks] = useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  
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
        const { data: newProfile } = await supabase
          .from("listener_profiles")
          .insert({
            user_id: user.id,
            display_name: user.email?.split('@')[0] || "Music Explorer"
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

      const { data: likesData } = await supabase
        .from("track_likes")
        .select(`track_id, created_at, tracks:track_id (id, title, artist_name, duration, album_cover_path, album_cover_bucket, motion_cover_path, motion_cover_bucket)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (likesData) {
        setLikedTracks(likesData.filter(item => item.tracks).map(item => item.tracks));
      }

      const { data: historyData } = await supabase
        .from("listening_history")
        .select(`played_at, track_id, tracks:track_id (id, title, artist_name, duration, album_cover_path, album_cover_bucket)`)
        .eq("user_id", user.id)
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

      const { data: playlistsData } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      
      setPlaylists(playlistsData || []);

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

      toast.success("Profile updated");
      setEditing(false);
      loadUserData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
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
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black"
              onClick={() => likedTracks.length > 0 && navigate(`/track/${likedTracks[0].id}`)}
            >
              <Play className="w-5 h-5" fill="currentColor" />
            </Button>
            <span className="font-bold text-lg truncate">{formData.display_name || "Fan"}</span>
          </div>
          
          {!editing ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setEditing(true)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
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

      {/* Profile Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          {/* Circular Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center ring-4 ring-white/10">
              {profile?.profile_image_path ? (
                <img
                  src={getProfileImageUrl() || undefined}
                  alt={formData.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl sm:text-7xl font-bold text-white/80">
                  {formData.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <Button
              size="icon"
              className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              <Camera className="w-5 h-5" />
            </Button>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            {/* Type + Genre Tags */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
              <span className="text-white/60 text-sm">Fan</span>
              {favoriteGenres.slice(0, 3).map((genre: string) => (
                <Badge 
                  key={genre} 
                  variant="outline" 
                  className="bg-white/5 border-white/20 text-white/80 text-xs px-3 py-1 rounded-full"
                >
                  {genre}
                </Badge>
              ))}
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3 tracking-tight">
                {formData.display_name || "Music Explorer"}
              </h1>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-white/60 mb-6">
              <span>Following: <strong className="text-white">{followingCount}</strong></span>
              <span className="mx-2">•</span>
              <span>Playlists: <strong className="text-white">{playlists.length}</strong></span>
              <span className="mx-2">•</span>
              <span>Liked: <strong className="text-white">{likedTracks.length}</strong></span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <Button 
                onClick={() => navigate("/discover")}
                className="bg-white text-black hover:bg-white/90 font-semibold px-6 h-11 rounded-full gap-2"
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
                Share Stats
              </Button>
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
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
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

      {/* Liked Tracks Section */}
      {likedTracks.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">LIKED TRACKS</h2>
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
        </section>
      )}

      {/* Playlists Section */}
      {playlists.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">PLAYLISTS</h2>
              <button className="text-white/40 hover:text-white text-sm">MORE</button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollPlaylists('left')}
                className="h-10 w-10 rounded-full border border-white/20 hover:bg-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollPlaylists('right')}
                className="h-10 w-10 rounded-full border border-white/20 hover:bg-white/10"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <div 
            ref={playlistScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {playlists.map((playlist) => (
              <div 
                key={playlist.id}
                onClick={() => navigate(`/playlist/${playlist.id}`)}
                className="flex-shrink-0 w-40 sm:w-48 cursor-pointer group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-cyan-500/20 to-purple-500/20 mb-3 flex items-center justify-center">
                  {playlist.cover_image_path ? (
                    <img
                      src={supabase.storage.from('playlist-covers').getPublicUrl(playlist.cover_image_path).data.publicUrl}
                      alt={playlist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ListMusic className="w-12 h-12 text-white/30" />
                  )}
                </div>
                <p className="font-medium text-white truncate">{playlist.name}</p>
                <p className="text-sm text-white/50">Playlist</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Achievements Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">ACHIEVEMENTS</h2>
        <div className="flex flex-wrap gap-3">
          <Badge className="gap-2 py-2 px-4 bg-yellow-500/10 border-yellow-500/30 text-yellow-400 rounded-full">
            <Star className="w-4 h-4" />
            Early Adopter
          </Badge>
          {likedTracks.length >= 5 && (
            <Badge className="gap-2 py-2 px-4 bg-pink-500/10 border-pink-500/30 text-pink-400 rounded-full">
              <Heart className="w-4 h-4" />
              Music Lover
            </Badge>
          )}
          {playlists.length >= 1 && (
            <Badge className="gap-2 py-2 px-4 bg-purple-500/10 border-purple-500/30 text-purple-400 rounded-full">
              <ListMusic className="w-4 h-4" />
              Curator
            </Badge>
          )}
          {followingCount >= 3 && (
            <Badge className="gap-2 py-2 px-4 bg-blue-500/10 border-blue-500/30 text-blue-400 rounded-full">
              <Users className="w-4 h-4" />
              Fan Club
            </Badge>
          )}
          {recentlyPlayed.length >= 10 && (
            <Badge className="gap-2 py-2 px-4 bg-green-500/10 border-green-500/30 text-green-400 rounded-full">
              <Flame className="w-4 h-4" />
              On Fire
            </Badge>
          )}
          <Badge className="gap-2 py-2 px-4 bg-cyan-500/10 border-cyan-500/30 text-cyan-400 rounded-full">
            <Zap className="w-4 h-4" />
            TDZ Pioneer
          </Badge>
        </div>
      </section>

      {/* Recently Played Section */}
      {recentlyPlayed.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">RECENTLY PLAYED</h2>
          <div className="space-y-2">
            {recentlyPlayed.slice(0, 5).map((track: any, idx: number) => (
              <div 
                key={`${track.id}-${idx}`}
                onClick={() => navigate(`/track/${track.id}`)}
                className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {track.album_cover_path ? (
                    <img
                      src={supabase.storage.from(track.album_cover_bucket || 'album-covers').getPublicUrl(track.album_cover_path).data.publicUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-white">{track.title}</p>
                  <p className="text-sm text-white/50 truncate">{track.artist_name}</p>
                </div>
                <Clock className="w-4 h-4 text-white/30" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Share Modal */}
      <ShareProfileModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        profileData={{
          displayName: formData.display_name || "Music Lover",
          totalPlays: recentlyPlayed.length * 3,
          hoursListened: Math.round(recentlyPlayed.length * 3 * 3.5 / 60),
          artistsFollowed: followingCount,
          likedSongs: likedTracks.length,
          playlists: playlists.length,
          tasteScore: likedTracks.length > 0 ? Math.min(100, likedTracks.length * 5) : 0,
          achievements: [
            "Early Adopter",
            ...(likedTracks.length >= 5 ? ["Music Lover"] : []),
            ...(playlists.length >= 1 ? ["Curator"] : []),
            ...(followingCount >= 3 ? ["Fan Club"] : []),
            ...(recentlyPlayed.length >= 10 ? ["On Fire"] : []),
          ],
          topGenres: formData.favorite_genres.length > 0 
            ? formData.favorite_genres 
            : ["Electronic", "Hip-Hop", "Pop"],
        }}
      />

      {/* Direct Message Panel */}
      {selectedConversation && (
        <DirectMessagePanel
          open={!!selectedConversation}
          onClose={() => setSelectedConversation(null)}
          recipientId={selectedConversation.partnerId}
          recipientName={selectedConversation.partnerName}
          recipientAvatar={selectedConversation.partnerAvatar}
        />
      )}
    </div>
  );
}
