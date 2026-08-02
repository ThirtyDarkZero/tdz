import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Edit, Save, X, Music, Heart, Clock, 
  Camera, Users, ListMusic, Share2, Play,
  MessageCircle, UserPlus, UserCheck,
  Sparkles, Activity, Compass, Globe, Headphones
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

const CORAL = "#FF6347";

export default function ListenerProfile() {
  const navigate = useNavigate();
  const { fanId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
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
      let targetUserId = fanId || currentUser?.id;
      if (!targetUserId) { navigate("/auth"); return; }

      setViewingUserId(targetUserId);
      setIsOwnProfile(!fanId || fanId === currentUser?.id);

      const { data: profileData } = await supabase.from("listener_profiles").select("*").eq("user_id", targetUserId).maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
        setFormData({
          display_name: profileData.display_name || "",
          bio: profileData.bio || "",
          location: profileData.location || "",
          favorite_genres: Array.isArray(profileData.favorite_genres) ? (profileData.favorite_genres as string[]) : [],
        });
      } else if (isOwnProfile && currentUser) {
        const { data: newProfile } = await supabase.from("listener_profiles").insert({ user_id: currentUser.id, display_name: currentUser.email?.split('@')[0] || "Music Explorer" }).select().single();
        if (newProfile) {
          setProfile(newProfile);
          setFormData({ display_name: newProfile.display_name || "", bio: "", location: "", favorite_genres: [] });
        }
      }

      const { data: likesData } = await supabase.from("track_likes").select(`track_id, created_at, tracks:track_id (id, title, artist_name, duration, album_cover_path, album_cover_bucket, motion_cover_path, motion_cover_bucket)`).eq("user_id", targetUserId).order("created_at", { ascending: false }).limit(20);
      if (likesData) setLikedTracks(likesData.filter(item => item.tracks).map(item => item.tracks));

      const { data: historyData } = await supabase.from("listening_history").select(`played_at, track_id, tracks:track_id (id, title, artist_name, duration, album_cover_path, album_cover_bucket)`).eq("user_id", targetUserId).order("played_at", { ascending: false }).limit(20);
      if (historyData) {
        const seen = new Set();
        const unique = historyData.filter(item => { if (!item.tracks || seen.has(item.track_id)) return false; seen.add(item.track_id); return true; });
        setRecentlyPlayed(unique.map(item => ({ ...item.tracks, played_at: item.played_at })));
      }

      const playlistQuery = supabase.from("playlists").select("*").eq("user_id", targetUserId).order("updated_at", { ascending: false });
      if (!isOwnProfile) playlistQuery.eq("is_public", true);
      const { data: playlistsData } = await playlistQuery;
      setPlaylists(playlistsData || []);

      const { count: followingCountData } = await supabase.from("artist_follows").select("*", { count: "exact", head: true }).eq("follower_id", targetUserId);
      setFollowingCount(followingCountData || 0);
      const { count: fanFollowersCount } = await supabase.from("fan_follows").select("*", { count: "exact", head: true }).eq("following_id", targetUserId);
      setFollowersCount(fanFollowersCount || 0);

      if (currentUser && !isOwnProfile) {
        const { data: followCheck } = await supabase.from("fan_follows").select("id").eq("follower_id", currentUser.id).eq("following_id", targetUserId).maybeSingle();
        setIsFollowing(!!followCheck);
      }

      const { data: badgesData } = await supabase.from("fan_badges").select("badge_type").eq("user_id", targetUserId);
      setBadges(badgesData?.map(b => b.badge_type) || []);
      const { data: engagementData } = await supabase.from("fan_engagement").select("*").eq("user_id", targetUserId).maybeSingle();
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
    if (!file.type.startsWith('image/')) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/profile.${ext}`;
      await supabase.storage.from("listener-images").upload(filePath, file, { upsert: true });
      await supabase.from("listener_profiles").update({ profile_image_path: filePath }).eq("user_id", user.id);
      toast.success("Profile photo updated!");
      loadUserData();
    } catch (error: any) {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile || !isOwnProfile) return;
    try {
      await supabase.from("listener_profiles").update({ display_name: formData.display_name, bio: formData.bio, location: formData.location, favorite_genres: formData.favorite_genres, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      toast.success("Profile updated");
      setEditing(false);
      loadUserData();
    } catch { toast.error("Failed to update profile"); }
  };

  const toggleFollow = async () => {
    if (!user || !viewingUserId || isOwnProfile) return;
    try {
      if (isFollowing) {
        await supabase.from("fan_follows").delete().eq("follower_id", user.id).eq("following_id", viewingUserId);
        setIsFollowing(false); setFollowersCount(prev => prev - 1);
      } else {
        await supabase.from("fan_follows").insert({ follower_id: user.id, following_id: viewingUserId });
        setIsFollowing(true); setFollowersCount(prev => prev + 1);
      }
    } catch { toast.error("Failed to update follow"); }
  };

  const getProfileImageUrl = () => {
    if (!profile?.profile_image_path) return null;
    return supabase.storage.from("listener-images").getPublicUrl(profile.profile_image_path).data.publicUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#03030F" }}>
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${CORAL} transparent transparent transparent` }} />
      </div>
    );
  }

  const favoriteGenres = formData.favorite_genres.length > 0 ? formData.favorite_genres : ["Music Lover"];

  const tabs = [
    { id: "activity", label: "Activity", icon: Activity },
    { id: "music", label: "Music", icon: Music },
    { id: "social", label: "Social", icon: Users },
    { id: "playlists", label: "Playlists", icon: ListMusic },
  ];

  const fanXp = engagement?.xp_total || 0;
  const fanLevel = engagement?.level || 1;
  const xpProgress = Math.min(100, ((fanXp % 1000) / 1000) * 100);

  return (
    <div className="min-h-screen text-white pb-32 relative overflow-hidden" style={{ background: "#050505" }}>
      {/* Cinematic backdrop — matches Onboarding */}
      {getProfileImageUrl() && (
        <div className="fixed inset-0 z-0" style={{
          backgroundImage: `url(${getProfileImageUrl()})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(90px) saturate(1.4) brightness(0.18)", transform: "scale(1.2)",
        }} />
      )}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full blur-[180px] z-0 pointer-events-none" style={{ background: "rgba(255,99,71,0.22)" }} />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[150px] z-0 pointer-events-none" style={{ background: "rgba(167,139,250,0.22)" }} />
      {/* Vignette */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.85) 90%), linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.9) 100%)",
      }} />
      {/* Scanlines */}
      <div className="fixed inset-0 z-0 opacity-[0.06] pointer-events-none" style={{
        backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 3px)",
      }} />

      {/* HUD Header */}
      <header className="sticky top-0 z-50" style={{
        background: "rgba(5,5,5,0.7)", backdropFilter: "blur(32px) saturate(180%)",
        borderBottom: `1px solid rgba(255,99,71,0.12)`,
      }}>
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="text-[10px] tracking-[0.3em] text-white/50" style={{ fontFamily: "'Raleway',sans-serif" }}>
                TASTEMAKER PROFILE
              </div>
              <div className="text-xs tracking-widest text-white/80 font-bold truncate max-w-[180px] sm:max-w-none">
                {(formData.display_name || "FAN").toUpperCase()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* XP counter — game HUD */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-xl"
              style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.5)" }}>
              <Sparkles className="w-4 h-4" style={{ color: "#FFD700" }} />
              <span className="tabular-nums font-bold text-white text-sm tracking-wider">{fanXp.toLocaleString()} XP</span>
            </div>
            {isOwnProfile && !editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} style={{ color: CORAL }}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
            {isOwnProfile && editing && (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setEditing(false)} className="rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSave} className="rounded-full" style={{ background: CORAL, color: "#fff" }}>
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Level progress bar — shimmer like Onboarding */}
        <div className="px-4 sm:px-6 pb-3">
          <div className="relative h-1.5 rounded-full overflow-hidden border border-white/10 max-w-2xl mx-auto" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full transition-all duration-700 ease-out" style={{
              width: `${xpProgress}%`,
              background: `linear-gradient(90deg, ${CORAL}, #a78bfa, ${CORAL})`,
              backgroundSize: "200% 100%",
              animation: "fanShimmer 2s linear infinite",
              boxShadow: `0 0 20px ${CORAL}`,
            }} />
          </div>
          <style>{`@keyframes fanShimmer { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }`}</style>
        </div>
      </header>


      <ScrollArea className="relative z-10">
        {/* ── 3-Column Artist-Style Layout ── */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 md:px-8 pt-8 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">


            {/* ── LEFT COLUMN: Liked Tracks & Recently Played ── */}
            <div className="space-y-4 order-2 lg:order-1">
              {/* Liked Tracks */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(40px) saturate(200%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: CORAL }}>
                  <Heart className="w-4 h-4" /> Liked Tracks
                </h3>
                {likedTracks.length > 0 ? (
                  <div className="space-y-1">
                    {likedTracks.slice(0, 10).map((track: any, idx: number) => (
                      <div key={track.id} onClick={() => navigate(`/track/${track.id}`)} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.04]">
                        <span className="w-5 text-center text-xs font-bold" style={{ color: idx < 3 ? CORAL : "rgba(255,255,255,0.3)" }}>{idx + 1}</span>
                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                          <MotionCover motionCoverPath={track.motion_cover_path} motionCoverBucket={track.motion_cover_bucket} staticCoverPath={track.album_cover_path} staticCoverBucket={track.album_cover_bucket || "album-covers"} alt={track.title} className="w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-white">{track.title}</p>
                          <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{track.artist_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>No liked tracks yet</p>
                )}
              </div>

              {/* Recently Played */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(40px) saturate(200%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "rgba(0,207,255,0.8)" }} /> Recently Played
                </h3>
                {recentlyPlayed.length > 0 ? (
                  <div className="space-y-1">
                    {recentlyPlayed.slice(0, 8).map((track: any, idx: number) => (
                      <div key={`${track.id}-${idx}`} onClick={() => navigate(`/track/${track.id}`)} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/[0.04]">
                        <Play className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(0,207,255,0.6)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-white">{track.title}</p>
                          <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{track.artist_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>No listening history</p>
                )}
              </div>
            </div>

            {/* ── CENTER COLUMN: Profile Hero ── */}
            <div className="flex flex-col items-center text-center order-1 lg:order-2 pt-4">
              {/* Avatar in HUD frame */}
              <div className="relative mb-6 p-5">
                <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${CORAL}40 0%, transparent 70%)`, transform: "scale(1.4)", filter: "blur(30px)" }} />
                {/* Corner brackets — HUD style */}
                <div className="absolute inset-0 pointer-events-none">
                  {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map((pos, k) => (
                    <div key={k} className={`absolute w-6 h-6 ${pos}`} style={{ borderColor: `${CORAL}` }} />
                  ))}
                </div>
                <div className="relative w-44 h-44 md:w-52 md:h-52 rounded-full overflow-hidden" style={{ border: `3px solid ${CORAL}60`, boxShadow: `0 0 40px ${CORAL}30, inset 0 0 20px rgba(0,0,0,0.3)` }}>
                  {getProfileImageUrl() ? (
                    <img src={getProfileImageUrl()!} alt={formData.display_name} className="w-full h-full object-cover" style={{ filter: "saturate(1.15) contrast(1.1)" }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: `${CORAL}10` }}>
                      <span className="text-7xl" style={{ color: CORAL, fontFamily: "'Six Caps', sans-serif" }}>{formData.display_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    </div>
                  )}
                </div>
                {isOwnProfile && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handlePhotoUpload} />
                    <Button size="icon" className="absolute bottom-4 right-4 h-10 w-10 rounded-full" style={{ background: CORAL, color: "#fff" }} onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                      <Camera className="w-5 h-5" />
                    </Button>
                  </>
                )}
                {engagement && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                    <FanLevel level={fanLevel} xp={fanXp} />
                  </div>
                )}
              </div>

              {/* Badges */}
              {badges.length > 0 && <div className="mb-2"><FanBadges badges={badges} size="md" /></div>}

              {/* Class chip */}
              <div className="flex items-center gap-2 mb-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-xl" style={{ background: "rgba(255,99,71,0.1)" }}>
                  <Sparkles className="w-3.5 h-3.5" style={{ color: CORAL }} />
                  <span className="text-[10px] tracking-[0.3em] text-white/80 font-bold">THE TASTEMAKER</span>
                </div>
                {formData.location && <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>📍 {formData.location}</span>}
              </div>

              {/* Name */}
              {editing ? (
                <Input value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} className="text-3xl bg-transparent border-white/20 text-center max-w-sm mb-3" />
              ) : (
                <h1 className="text-5xl md:text-7xl text-white leading-[1.05] mb-3 pb-1 break-words max-w-full" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.02em" }}>
                  {(formData.display_name || "Music Explorer").toUpperCase()}
                </h1>
              )}


              {/* Stats — HUD readout (interactive) */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                {[
                  { label: "Followers", value: followersCount, tab: "social" },
                  { label: "Following", value: followingCount, tab: "social" },
                  { label: "Playlists", value: playlists.length, tab: "playlists" },
                  { label: "Likes", value: likedTracks.length, tab: "music" },
                ].map(s => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      setActiveTab(s.tab);
                      document.getElementById("profile-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    aria-label={`${s.value} ${s.label} — view ${s.tab}`}
                    className="px-4 py-1.5 rounded-full border backdrop-blur-xl text-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6347]/60"
                    style={{ borderColor: activeTab === s.tab ? `${CORAL}55` : "rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.45)" }}>
                    <span className="text-sm font-bold text-white tabular-nums mr-2">{s.value}</span>
                    <span className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</span>
                  </button>
                ))}
              </div>



              {/* Actions */}
              <div className="flex items-center gap-3 mb-6">
                {isOwnProfile ? (
                  <>
                    <Button onClick={() => navigate("/discover")} className="rounded-full px-8 h-11 font-bold" style={{ background: CORAL, color: "#fff" }}>
                      <Compass className="w-5 h-5 mr-2" /> DISCOVER
                    </Button>
                    <Button variant="outline" onClick={() => setShareModalOpen(true)} className="rounded-full px-6 h-11 border-white/20 text-white hover:bg-white/10">
                      <Share2 className="w-5 h-5 mr-2" /> Share
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={toggleFollow} className="rounded-full px-8 h-11 font-bold" style={{ background: isFollowing ? "rgba(255,255,255,0.1)" : CORAL, color: isFollowing ? "#fff" : "#fff" }}>
                      {isFollowing ? <><UserCheck className="w-5 h-5 mr-2" /> Following</> : <><UserPlus className="w-5 h-5 mr-2" /> Follow</>}
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedConversation({ user_id: viewingUserId })} className="rounded-full px-6 h-11 border-white/20 text-white hover:bg-white/10">
                      <MessageCircle className="w-5 h-5 mr-2" /> Message
                    </Button>
                  </>
                )}
              </div>

              {/* Bio Edit */}
              {editing && (
                <div className="w-full max-w-md space-y-3 mb-6">
                  <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell us about your music taste..." className="bg-white/5 border-white/20 text-white text-sm" rows={3} />
                  <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Location" className="bg-white/5 border-white/20 text-white text-sm" />
                </div>
              )}

              {/* Perk tiles — class card style (interactive) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg mb-6">
                {[
                  { icon: Headphones, label: "LISTENING", desc: `${recentlyPlayed.length} recent`, color: "#00CFFF", action: () => navigate("/discover") },
                  { icon: Heart, label: "LIKED", desc: `${likedTracks.length} tracks`, color: "#FF6B9D", action: () => setActiveTab("music") },
                  { icon: Users, label: "FRIENDS", desc: `${followersCount + followingCount}`, color: "#8B5CF6", action: () => setActiveTab("social") },
                  { icon: Globe, label: "PUBLIC", desc: `${playlists.length} playlists`, color: "#10B981", action: () => setActiveTab("playlists") },
                ].map(feat => (
                  <button
                    key={feat.label}
                    type="button"
                    onClick={() => {
                      feat.action();
                      document.getElementById("profile-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    aria-label={`${feat.label}: ${feat.desc}`}
                    className="group relative rounded-xl p-3 text-center cursor-pointer transition-all duration-500 hover:-translate-y-1.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2"
                    style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(24px)", border: `1px solid ${feat.color}25`, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                    <div className="absolute inset-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((pos, k) => (
                        <div key={k} className={`absolute w-3 h-3 ${pos}`} style={{ borderColor: feat.color }} />
                      ))}
                    </div>
                    <feat.icon className="w-5 h-5 mx-auto mb-1 transition-transform group-hover:scale-110" style={{ color: feat.color }} />
                    <p className="text-[10px] font-bold tracking-[0.2em] text-white">{feat.label}</p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{feat.desc}</p>
                  </button>
                ))}
              </div>

              {/* Tabs — HUD selector */}
              <div id="profile-tabs" className="flex flex-wrap justify-center gap-2 mb-4 scroll-mt-24" role="tablist">
                {tabs.map(tab => (
                  <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all backdrop-blur-xl hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6347]/60" style={{
                    background: activeTab === tab.id ? `${CORAL}18` : "rgba(0,0,0,0.45)",
                    color: activeTab === tab.id ? CORAL : "rgba(255,255,255,0.5)",
                    border: `1px solid ${activeTab === tab.id ? `${CORAL}60` : "rgba(255,255,255,0.12)"}`,
                    boxShadow: activeTab === tab.id ? `0 0 24px ${CORAL}40` : "none",
                  }}>
                    <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                ))}
              </div>



              {/* Tab Content */}
              <div className="w-full text-left">
                {activeTab === "activity" && viewingUserId && (
                  <div className="space-y-4">
                    <div className="rounded-2xl p-5" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" style={{ color: CORAL }} /> Recent Activity
                      </h3>
                      <ProfileActivityFeed userId={viewingUserId} isOwnProfile={isOwnProfile} />
                    </div>
                    {isOwnProfile && (
                      <div className="rounded-2xl p-5" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" style={{ color: "#8B5CF6" }} /> Share Your Story
                        </h3>
                        <SocialFeed variant="compact" />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "music" && (
                  <div className="rounded-2xl p-5" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                    {viewingUserId && <MusicTasteCard userId={viewingUserId} />}
                  </div>
                )}

                {activeTab === "social" && viewingUserId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl p-5" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                      <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: CORAL }} /> Followers
                      </h3>
                      <FollowersGrid userId={viewingUserId} type="followers" isOwnProfile={isOwnProfile} />
                    </div>
                    <div className="rounded-2xl p-5" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                      <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                        <Heart className="w-4 h-4" style={{ color: "#FF6B9D" }} /> Following
                      </h3>
                      <FollowersGrid userId={viewingUserId} type="following" isOwnProfile={isOwnProfile} />
                    </div>
                  </div>
                )}

                {activeTab === "playlists" && (
                  <div className="rounded-2xl p-5" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                      <ListMusic className="w-4 h-4" style={{ color: "#8B5CF6" }} /> Playlists
                    </h3>
                    {playlists.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {playlists.map((playlist: any) => (
                          <div key={playlist.id} onClick={() => navigate(`/playlist/${playlist.id}`)} className="group cursor-pointer">
                            <div className="aspect-square rounded-xl overflow-hidden mb-2 relative" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(255,99,71,0.3))" }}>
                              {playlist.cover_image_path ? (
                                <img src={supabase.storage.from("playlist-covers").getPublicUrl(playlist.cover_image_path).data.publicUrl} alt={playlist.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><ListMusic className="w-10 h-10 text-white/30" /></div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                              </div>
                            </div>
                            <p className="text-xs font-medium truncate">{playlist.name}</p>
                            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{playlist.is_public ? 'Public' : 'Private'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ListMusic className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No playlists yet</p>
                        {isOwnProfile && (
                          <Button variant="outline" size="sm" onClick={() => navigate('/discover')} className="mt-3 rounded-full border-white/20 text-xs">
                            Create Playlist
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: Bio, Stats, Music Taste ── */}
            <div className="space-y-4 order-3">
              {/* Bio Card */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(40px) saturate(200%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                <h3 className="text-sm font-bold mb-2">About</h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {formData.bio || "This fan hasn't written a bio yet."}
                </p>
                {favoriteGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {favoriteGenres.map(g => (
                      <Badge key={g} variant="outline" className="text-[10px] rounded-full" style={{ borderColor: `${CORAL}30`, color: CORAL }}>
                        {g}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Profile Stats */}
              {viewingUserId && (
                <div className="rounded-2xl p-4" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(40px) saturate(200%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                  <ProfileStats userId={viewingUserId} />
                </div>
              )}

              {/* Fan Portal Link */}
              <div className="rounded-2xl p-4" style={{ background: `${CORAL}08`, backdropFilter: "blur(40px)", border: `1px solid ${CORAL}15` }}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: CORAL }}>
                  <Sparkles className="w-4 h-4" /> Fan Portal
                </h3>
                <p className="text-[10px] mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Follow other fans, share playlists, and discover music together.
                </p>
                <Button size="sm" onClick={() => navigate("/discover")} className="w-full rounded-full text-xs" style={{ background: CORAL, color: "#fff" }}>
                  Explore Discovery
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Modals */}
      <ShareProfileModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        profileData={{
          displayName: formData.display_name,
          totalPlays: 0, hoursListened: 0,
          artistsFollowed: followingCount,
          likedSongs: likedTracks.length,
          playlists: playlists.length,
          tasteScore: 85,
          achievements: badges,
          topGenres: favoriteGenres
        }}
      />

      {selectedConversation && (
        <DirectMessagePanel open={true} onClose={() => setSelectedConversation(null)} recipientId={selectedConversation.user_id} recipientName={formData.display_name} />
      )}
    </div>
  );
}
