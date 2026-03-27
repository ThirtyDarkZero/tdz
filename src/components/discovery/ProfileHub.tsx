import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { DirectMessagePanel } from "@/components/DirectMessagePanel";
import { SocialFeed } from "@/components/social/SocialFeed";
import { FollowersGrid } from "@/components/social/FollowersGrid";
import { FanBadges, FanLevel } from "@/components/social/FanBadges";
import { toast } from "sonner";
import {
  User, Camera, Edit, Save, X, Heart, ListMusic, Play, Settings,
  MessageCircle, Users, Share2, LogOut, ChevronRight, Music, Sparkles,
  Shield, Headphones, CreditCard, Link2, LifeBuoy, Trash2,
  FolderOpen, Image, Plus, MoreHorizontal, Bell, Globe, Lock
} from "lucide-react";

const CORAL = "#FF6347";

/* ── Glass Card ── */
function GlassCard({ title, description, children, accent }: { title: string; description?: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-2xl p-5" style={{
      background: "var(--glass-1)",
      border: `1px solid ${accent ? accent + "30" : "var(--glass-border)"}`,
      backdropFilter: "blur(20px)",
    }}>
      <h3 className="font-display" style={{ fontSize: 18, color: accent || "var(--text-1)", marginBottom: 2 }}>{title}</h3>
      {description && <p className="font-body" style={{ color: "var(--text-3)", fontSize: 12, marginBottom: 16 }}>{description}</p>}
      {children}
    </div>
  );
}

/* ── Setting Toggle ── */
function SettingToggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div>
        <p className="font-body" style={{ color: "var(--text-1)", fontWeight: 600, fontSize: 13 }}>{label}</p>
        <p className="font-body" style={{ color: "var(--text-3)", fontSize: 11 }}>{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ── Playlist Category Pill ── */
const PLAYLIST_CATEGORIES = ["All", "Favorites", "Chill", "Workout", "Party", "Focus", "Mood"];

interface ProfileHubProps {
  userProfile: any;
  likedTracks: Set<string>;
  followedArtists: Set<string>;
  playlists: any[];
  singles: any[];
  onPlayTrack: (track: any) => void;
}

export function ProfileHub({ userProfile, likedTracks, followedArtists, playlists, singles, onPlayTrack }: ProfileHubProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { subscription } = useSubscription(user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  /* ── State ── */
  const [activeSection, setActiveSection] = useState<"profile" | "playlists" | "messages" | "social" | "settings">("profile");
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [engagement, setEngagement] = useState<any>(null);
  const [playlistCategory, setPlaylistCategory] = useState("All");
  const [settingsPanel, setSettingsPanel] = useState("account");
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [newPlaylistPublic, setNewPlaylistPublic] = useState(true);

  // Settings state
  const [audioQuality, setAudioQuality] = useState("high");
  const [crossfade, setCrossfade] = useState([0]);
  const [autoPlay, setAutoPlay] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showListening, setShowListening] = useState(true);
  const [allowDMs, setAllowDMs] = useState(true);

  const [formData, setFormData] = useState({ display_name: "", bio: "", location: "" });

  useEffect(() => {
    if (user) loadProfile();
    else setLoading(false);
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data: p } = await supabase.from("listener_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (p) {
        setProfile(p);
        setFormData({ display_name: p.display_name || "", bio: p.bio || "", location: p.location || "" });
      } else {
        const { data: np } = await supabase.from("listener_profiles").insert({ user_id: user.id, display_name: user.email?.split("@")[0] || "Explorer" }).select().single();
        if (np) { setProfile(np); setFormData({ display_name: np.display_name || "", bio: "", location: "" }); }
      }

      // Counts
      const { count: fc } = await supabase.from("fan_follows").select("*", { count: "exact", head: true }).eq("following_id", user.id);
      setFollowersCount(fc || 0);
      const { count: foc } = await supabase.from("artist_follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id);
      setFollowingCount(foc || 0);

      // Badges
      const { data: bd } = await supabase.from("fan_badges").select("badge_type").eq("user_id", user.id);
      setBadges(bd?.map(b => b.badge_type) || []);

      // Engagement
      const { data: eng } = await supabase.from("fan_engagement").select("*").eq("user_id", user.id).maybeSingle();
      setEngagement(eng);

      // Playlists
      const { data: pl } = await supabase.from("playlists").select("*, playlist_tracks(count)").eq("user_id", user.id).order("updated_at", { ascending: false });
      setUserPlaylists((pl || []).map((p: any) => ({ ...p, track_count: p.playlist_tracks?.[0]?.count || 0 })));
    } catch (e) {
      console.error("Profile load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const getProfileImageUrl = () => {
    if (!profile?.profile_image_path) return null;
    return supabase.storage.from("listener-images").getPublicUrl(profile.profile_image_path).data.publicUrl;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/profile.${ext}`;
      await supabase.storage.from("listener-images").upload(path, file, { upsert: true });
      await supabase.from("listener_profiles").update({ profile_image_path: path }).eq("user_id", user.id);
      toast.success("Photo updated!");
      loadProfile();
    } catch { toast.error("Upload failed"); } finally { setUploadingPhoto(false); }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    try {
      await supabase.from("listener_profiles").update({ display_name: formData.display_name, bio: formData.bio, location: formData.location, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      toast.success("Profile updated");
      setEditing(false);
      loadProfile();
    } catch { toast.error("Failed to save"); }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !user) return;
    try {
      const { data } = await supabase.from("playlists").insert({ user_id: user.id, name: newPlaylistName.trim(), description: newPlaylistDesc.trim() || null, is_public: newPlaylistPublic }).select().single();
      toast.success(`Created "${newPlaylistName}"`);
      setNewPlaylistName(""); setNewPlaylistDesc(""); setShowCreatePlaylist(false);
      loadProfile();
      if (data) navigate(`/playlist/${data.id}`);
    } catch { toast.error("Failed to create playlist"); }
  };

  const handleSignOut = async () => {
    try { await signOut(); navigate("/"); } catch { toast.error("Sign out failed"); }
  };

  const getPlaylistCoverUrl = (path: string | null) => {
    if (!path) return null;
    return supabase.storage.from("playlist-covers").getPublicUrl(path).data.publicUrl;
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${CORAL}15`, border: `2px solid ${CORAL}40` }}>
          <User className="w-9 h-9" style={{ color: CORAL }} />
        </div>
        <h2 className="font-display" style={{ fontSize: 32, color: "var(--text-1)" }}>YOUR SPACE</h2>
        <p className="font-body text-center" style={{ fontSize: 14, color: "var(--text-3)", maxWidth: 280 }}>Sign in to access your profile, playlists, messages, and settings.</p>
        <Button onClick={() => navigate("/auth")} className="rounded-full px-8 h-12 font-bold" style={{ background: CORAL, color: "#fff" }}>
          <Sparkles className="w-4 h-4 mr-2" /> Sign In
        </Button>
      </div>
    );
  }

  /* ── Navigation Tabs ── */
  const tabs = [
    { id: "profile" as const, label: "PROFILE", icon: User },
    { id: "playlists" as const, label: "PLAYLISTS", icon: ListMusic },
    { id: "messages" as const, label: "MESSAGES", icon: MessageCircle },
    { id: "social" as const, label: "SOCIAL", icon: Users },
    { id: "settings" as const, label: "SETTINGS", icon: Settings },
  ];

  return (
    <div className="space-y-0">
      {/* ── Profile Header Card ── */}
      <div className="relative overflow-hidden" style={{
        background: `linear-gradient(135deg, ${CORAL}18, rgba(139,92,246,0.08), rgba(3,3,15,1))`,
        borderBottom: `1px solid ${CORAL}20`,
      }}>
        {/* Banner gradient */}
        <div className="h-32" style={{ background: `linear-gradient(180deg, ${CORAL}20, transparent)` }} />

        <div className="px-5 pb-5 -mt-16 relative">
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden" style={{ border: `3px solid ${CORAL}`, background: "var(--bg-deep)" }}>
                {getProfileImageUrl() ? (
                  <img src={getProfileImageUrl()!} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display" style={{ fontSize: 36, color: CORAL, background: `${CORAL}10` }}>
                    {formData.display_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: CORAL, color: "#fff" }}
              >
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              {engagement && (
                <div className="absolute -top-2 -right-2">
                  <FanLevel level={engagement.level || 1} xp={engagement.xp_total || 0} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pb-1">
              {editing ? (
                <Input value={formData.display_name} onChange={e => setFormData({ ...formData, display_name: e.target.value })} className="font-display text-xl bg-transparent border-b mb-1" style={{ borderColor: `${CORAL}40`, color: "var(--text-1)" }} />
              ) : (
                <h2 className="font-display truncate" style={{ fontSize: 26, color: "var(--text-1)" }}>{formData.display_name || "Explorer"}</h2>
              )}
              {formData.location && <p className="font-body truncate" style={{ fontSize: 11, color: "var(--text-3)" }}>📍 {formData.location}</p>}
              {badges.length > 0 && <div className="mt-1"><FanBadges badges={badges} size="sm" /></div>}
            </div>

            {/* Edit / Save */}
            {editing ? (
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setEditing(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--glass-2)" }}><X className="w-4 h-4" style={{ color: "var(--text-2)" }} /></button>
                <button onClick={handleSave} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: CORAL, color: "#fff" }}><Save className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--glass-2)" }}>
                <Edit className="w-4 h-4" style={{ color: "var(--text-2)" }} />
              </button>
            )}
          </div>

          {/* Bio Edit */}
          {editing && (
            <div className="mt-3 space-y-2">
              <Textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell the world about your music taste..." rows={2} className="text-sm" style={{ background: "var(--glass-1)", borderColor: "var(--glass-border)", color: "var(--text-1)" }} />
              <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Location" className="text-sm" style={{ background: "var(--glass-1)", borderColor: "var(--glass-border)", color: "var(--text-1)" }} />
            </div>
          )}
          {!editing && formData.bio && <p className="font-body mt-2" style={{ fontSize: 12, color: "var(--text-2)" }}>{formData.bio}</p>}

          {/* Stats Row */}
          <div className="flex gap-6 mt-4">
            {[
              { label: "FOLLOWERS", value: followersCount },
              { label: "FOLLOWING", value: followingCount },
              { label: "PLAYLISTS", value: userPlaylists.length },
              { label: "LIKED", value: likedTracks.size },
            ].map(s => (
              <div key={s.label}>
                <span className="font-body block" style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>{s.value}</span>
                <span className="font-body" style={{ fontSize: 9, fontWeight: 700, color: "var(--text-4)", letterSpacing: "0.1em" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 whitespace-nowrap transition-all duration-200 flex-shrink-0"
                style={{
                  borderRadius: "var(--radius-pill)",
                  fontSize: 11,
                  fontWeight: 700,
                  background: isActive ? `${CORAL}20` : "var(--glass-1)",
                  color: isActive ? CORAL : "var(--text-3)",
                  border: isActive ? `1px solid ${CORAL}40` : "1px solid var(--glass-border)",
                }}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-5 pb-36 space-y-5">

        {/* ════════ PROFILE ════════ */}
        {activeSection === "profile" && (
          <>
            {/* Liked Tracks */}
            <GlassCard title="LIKED TRACKS" accent={CORAL}>
              {singles.filter(t => likedTracks.has(t.id)).length > 0 ? (
                <div className="space-y-1">
                  {singles.filter(t => likedTracks.has(t.id)).slice(0, 8).map((track, i) => {
                    const coverUrl = track.album_cover_path
                      ? supabase.storage.from(track.album_cover_bucket || "album-covers").getPublicUrl(track.album_cover_path).data.publicUrl
                      : null;
                    return (
                      <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.04]" onClick={() => onPlayTrack(track)}>
                        <span className="font-body w-5 text-center" style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? CORAL : "var(--text-4)" }}>{i + 1}</span>
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--glass-2)" }}>
                          {coverUrl ? <img src={coverUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4" style={{ color: "var(--text-4)" }} /></div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-body truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{track.title}</p>
                          <p className="font-body truncate" style={{ fontSize: 11, color: "var(--text-3)" }}>{track.artist_name}</p>
                        </div>
                        <Heart className="w-4 h-4 flex-shrink-0" style={{ color: CORAL }} fill={CORAL} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Heart className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-4)" }} />
                  <p className="font-body" style={{ fontSize: 13, color: "var(--text-3)" }}>No liked tracks yet</p>
                </div>
              )}
            </GlassCard>

            {/* Share / Quick Actions */}
            <div className="flex gap-3">
              <button onClick={() => toast.success("Profile link copied!")} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)" }}>
                <Share2 className="w-4 h-4" style={{ color: CORAL }} />
                <span className="font-body" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Share Profile</span>
              </button>
              <button onClick={() => setActiveSection("messages")} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)" }}>
                <MessageCircle className="w-4 h-4" style={{ color: "#00CFFF" }} />
                <span className="font-body" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Messages</span>
              </button>
            </div>
          </>
        )}

        {/* ════════ PLAYLISTS ════════ */}
        {activeSection === "playlists" && (
          <>
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {PLAYLIST_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setPlaylistCategory(cat)}
                  className="px-4 py-2 whitespace-nowrap transition-all duration-200 flex-shrink-0"
                  style={{
                    borderRadius: "var(--radius-pill)",
                    fontSize: 11,
                    fontWeight: 600,
                    background: playlistCategory === cat ? `${CORAL}20` : "var(--glass-1)",
                    color: playlistCategory === cat ? CORAL : "var(--text-3)",
                    border: playlistCategory === cat ? `1px solid ${CORAL}40` : "1px solid var(--glass-border)",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Create playlist button */}
            <button
              onClick={() => setShowCreatePlaylist(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl transition-all"
              style={{ background: `${CORAL}08`, border: `1px dashed ${CORAL}40` }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${CORAL}15` }}>
                <Plus className="w-6 h-6" style={{ color: CORAL }} />
              </div>
              <div className="text-left">
                <p className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Create New Playlist</p>
                <p className="font-body" style={{ fontSize: 11, color: "var(--text-3)" }}>Organize your favorite tracks</p>
              </div>
            </button>

            {/* Liked Songs card */}
            <div
              className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
              style={{ background: `linear-gradient(135deg, ${CORAL}20, rgba(139,92,246,0.15))`, border: `1px solid ${CORAL}30` }}
              onClick={() => navigate("/liked-songs")}
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${CORAL}, #8B5CF6)` }}>
                <Heart className="w-7 h-7 text-white" fill="white" />
              </div>
              <div className="flex-1">
                <p className="font-body" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Liked Songs</p>
                <p className="font-body" style={{ fontSize: 12, color: "var(--text-3)" }}>{likedTracks.size} songs</p>
              </div>
              <Play className="w-5 h-5" style={{ color: CORAL }} fill={CORAL} />
            </div>

            {/* Playlist grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userPlaylists.map(pl => {
                const coverUrl = getPlaylistCoverUrl(pl.cover_image_path);
                return (
                  <div
                    key={pl.id}
                    onClick={() => navigate(`/playlist/${pl.id}`)}
                    className="group cursor-pointer rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
                    style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)" }}
                  >
                    <div className="aspect-square relative overflow-hidden">
                      {coverUrl ? (
                        <img src={coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${CORAL}15, rgba(139,92,246,0.1))` }}>
                          <ListMusic className="w-10 h-10" style={{ color: "var(--text-4)" }} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
                          {pl.is_public ? <Globe className="w-3 h-3 text-white" /> : <Lock className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-body truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{pl.name}</p>
                      <p className="font-body" style={{ fontSize: 11, color: "var(--text-3)" }}>{pl.track_count} tracks</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {userPlaylists.length === 0 && (
              <div className="py-10 text-center">
                <ListMusic className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-4)" }} />
                <p className="font-body" style={{ fontSize: 13, color: "var(--text-3)" }}>No playlists yet. Create your first!</p>
              </div>
            )}

            {/* Create Playlist Sheet */}
            <Sheet open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
              <SheetContent side="bottom" className="rounded-t-3xl" style={{ background: "var(--bg-deep)", borderColor: "var(--glass-border)" }}>
                <SheetHeader>
                  <SheetTitle className="font-display" style={{ color: "var(--text-1)" }}>Create Playlist</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <Input value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} placeholder="Playlist name" style={{ background: "var(--glass-1)", borderColor: "var(--glass-border)", color: "var(--text-1)" }} />
                  <Textarea value={newPlaylistDesc} onChange={e => setNewPlaylistDesc(e.target.value)} placeholder="Description (optional)" rows={2} style={{ background: "var(--glass-1)", borderColor: "var(--glass-border)", color: "var(--text-1)" }} />
                  <div className="flex items-center justify-between">
                    <Label className="font-body" style={{ color: "var(--text-2)" }}>Public playlist</Label>
                    <Switch checked={newPlaylistPublic} onCheckedChange={setNewPlaylistPublic} />
                  </div>
                  <Button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()} className="w-full rounded-full h-12 font-bold" style={{ background: CORAL, color: "#fff" }}>
                    Create Playlist
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}

        {/* ════════ MESSAGES ════════ */}
        {activeSection === "messages" && (
          <GlassCard title="MESSAGES" accent="#00CFFF" description="Chat with artists and fans you follow">
            <div className="space-y-3">
              {/* Quick message buttons for followed artists */}
              <p className="font-body" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", letterSpacing: "0.1em" }}>FOLLOWED ARTISTS</p>
              {followedArtists.size > 0 ? (
                <div className="space-y-2">
                  {Array.from(followedArtists).slice(0, 6).map(artistId => (
                    <button
                      key={artistId}
                      onClick={() => setSelectedConversation({ user_id: artistId })}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.04]"
                      style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)" }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${CORAL}15` }}>
                        <MessageCircle className="w-4 h-4" style={{ color: CORAL }} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Artist</p>
                        <p className="font-body" style={{ fontSize: 11, color: "var(--text-3)" }}>Tap to message</p>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: "var(--text-4)" }} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-4)" }} />
                  <p className="font-body" style={{ fontSize: 12, color: "var(--text-3)" }}>Follow artists to start messaging</p>
                </div>
              )}

              <p className="font-body pt-2" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", letterSpacing: "0.1em" }}>RECENT CONVERSATIONS</p>
              <div className="py-6 text-center">
                <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-4)" }} />
                <p className="font-body" style={{ fontSize: 12, color: "var(--text-3)" }}>Your conversations will appear here</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* ════════ SOCIAL ════════ */}
        {activeSection === "social" && user && (
          <>
            <GlassCard title="FOLLOWERS" accent="#00CFFF">
              <FollowersGrid userId={user.id} type="followers" isOwnProfile={true} />
            </GlassCard>
            <GlassCard title="FOLLOWING" accent={CORAL}>
              <FollowersGrid userId={user.id} type="following" isOwnProfile={true} />
            </GlassCard>
            <GlassCard title="SHARE YOUR STORY" accent="#8B5CF6">
              <SocialFeed variant="compact" />
            </GlassCard>
          </>
        )}

        {/* ════════ SETTINGS ════════ */}
        {activeSection === "settings" && (
          <>
            {/* Settings category pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {[
                { id: "account", label: "Account", icon: User },
                { id: "subscription", label: "Plan", icon: CreditCard },
                { id: "listening", label: "Audio", icon: Headphones },
                { id: "privacy", label: "Privacy", icon: Shield },
                { id: "connected", label: "Apps", icon: Link2 },
                { id: "support", label: "Help", icon: LifeBuoy },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSettingsPanel(cat.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 whitespace-nowrap transition-all flex-shrink-0"
                  style={{
                    borderRadius: "var(--radius-pill)",
                    fontSize: 11,
                    fontWeight: 600,
                    background: settingsPanel === cat.id ? `${CORAL}20` : "var(--glass-1)",
                    color: settingsPanel === cat.id ? CORAL : "var(--text-3)",
                    border: settingsPanel === cat.id ? `1px solid ${CORAL}40` : "1px solid var(--glass-border)",
                  }}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Account */}
            {settingsPanel === "account" && (
              <GlassCard title="ACCOUNT" description="Your profile and security">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden" style={{ border: `2px solid ${CORAL}40`, background: "var(--glass-2)" }}>
                      {getProfileImageUrl() ? (
                        <img src={getProfileImageUrl()!} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-display" style={{ fontSize: 24, color: CORAL }}>{formData.display_name?.charAt(0)?.toUpperCase()}</div>
                      )}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="font-body px-4 py-2 rounded-full" style={{ fontSize: 12, fontWeight: 600, background: "var(--glass-2)", color: "var(--text-2)", border: "1px solid var(--glass-border)" }}>
                      Change Photo
                    </button>
                  </div>
                  <div>
                    <Label className="font-body" style={{ color: "var(--text-3)", fontSize: 12 }}>Email</Label>
                    <Input value={user?.email || ""} disabled className="mt-1" style={{ background: "var(--glass-1)", borderColor: "var(--glass-border)", color: "var(--text-3)" }} />
                  </div>
                  <button className="w-full text-left font-body px-4 py-3 rounded-xl" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)", fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
                    Change Password
                  </button>
                </div>
              </GlassCard>
            )}

            {/* Subscription */}
            {settingsPanel === "subscription" && (
              <GlassCard title="MY PLAN" description="Your current subscription">
                <div className="p-4 rounded-xl" style={{ background: `${CORAL}08`, border: `1px solid ${CORAL}20` }}>
                  <div className="flex items-center justify-between mb-3">
                    <SubscriptionBadge />
                    <span className="font-body" style={{ fontSize: 12, color: "var(--text-3)" }}>Active</span>
                  </div>
                  <p className="font-body" style={{ fontSize: 12, color: "var(--text-3)" }}>Your plan renews automatically.</p>
                  <Button onClick={() => navigate("/pricing")} className="mt-3 rounded-full" style={{ background: `${CORAL}20`, color: CORAL, border: `1px solid ${CORAL}40` }}>
                    Upgrade Plan
                  </Button>
                </div>
              </GlassCard>
            )}

            {/* Listening */}
            {settingsPanel === "listening" && (
              <div className="space-y-4">
                <GlassCard title="AUDIO QUALITY" description="Streaming quality settings">
                  <div className="space-y-2">
                    {[
                      { value: "auto", label: "Auto", desc: "Adjusts based on connection" },
                      { value: "low", label: "Low", desc: "96 kbps — saves data" },
                      { value: "medium", label: "Normal", desc: "160 kbps" },
                      { value: "high", label: "High", desc: "320 kbps — best quality" },
                      { value: "lossless", label: "Lossless", desc: "FLAC — studio quality" },
                    ].map(q => (
                      <label key={q.value} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{ background: audioQuality === q.value ? `${CORAL}08` : "transparent", border: audioQuality === q.value ? `1px solid ${CORAL}20` : "1px solid transparent" }}>
                        <input type="radio" name="quality" value={q.value} checked={audioQuality === q.value} onChange={e => setAudioQuality(e.target.value)} className="sr-only" />
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: audioQuality === q.value ? CORAL : "var(--glass-border)" }}>
                          {audioQuality === q.value && <div className="w-2 h-2 rounded-full" style={{ background: CORAL }} />}
                        </div>
                        <div>
                          <p className="font-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{q.label}</p>
                          <p className="font-body" style={{ fontSize: 11, color: "var(--text-3)" }}>{q.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </GlassCard>
                <GlassCard title="PLAYBACK" description="Customize playback">
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label className="font-body" style={{ color: "var(--text-2)" }}>Crossfade</Label>
                        <span className="font-body" style={{ color: "var(--text-3)", fontSize: 12 }}>{crossfade[0]}s</span>
                      </div>
                      <Slider value={crossfade} onValueChange={setCrossfade} min={0} max={12} step={1} />
                    </div>
                    <SettingToggle label="Auto-Play" desc="Play similar tracks when queue ends" checked={autoPlay} onChange={setAutoPlay} />
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Privacy */}
            {settingsPanel === "privacy" && (
              <GlassCard title="PRIVACY" description="Control who sees your activity">
                <div className="space-y-3">
                  <SettingToggle label="Private Profile" desc="Only followers can see your activity" checked={privateProfile} onChange={setPrivateProfile} />
                  <SettingToggle label="Show Listening Activity" desc="Let friends see what you're playing" checked={showListening} onChange={setShowListening} />
                  <SettingToggle label="Allow Direct Messages" desc="Receive messages from other users" checked={allowDMs} onChange={setAllowDMs} />
                </div>
              </GlassCard>
            )}

            {/* Connected Apps */}
            {settingsPanel === "connected" && (
              <GlassCard title="CONNECTED APPS" description="Third-party services">
                <div className="space-y-3">
                  {[
                    { name: "Square Payments", status: "Not connected" },
                    { name: "Shopify Store", status: "Not connected" },
                  ].map(app => (
                    <div key={app.name} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)" }}>
                      <div>
                        <p className="font-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{app.name}</p>
                        <p className="font-body" style={{ fontSize: 11, color: "var(--text-3)" }}>{app.status}</p>
                      </div>
                      <button className="font-body px-3 py-1.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, background: "var(--glass-2)", color: "var(--text-2)", border: "1px solid var(--glass-border)" }}>Connect</button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Support */}
            {settingsPanel === "support" && (
              <GlassCard title="SUPPORT" description="Get help">
                <div className="space-y-3">
                  <button onClick={() => navigate("/faq")} className="w-full flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)" }}>
                    <LifeBuoy className="w-4 h-4" style={{ color: CORAL }} />
                    <span className="font-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Help Center</span>
                    <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "var(--text-4)" }} />
                  </button>
                  <button onClick={() => navigate("/support")} className="w-full flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)" }}>
                    <MessageCircle className="w-4 h-4" style={{ color: "#00CFFF" }} />
                    <span className="font-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Submit a Ticket</span>
                    <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "var(--text-4)" }} />
                  </button>
                </div>
              </GlassCard>
            )}

            {/* Sign Out + Danger */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all"
                style={{ background: `${CORAL}10`, border: `1px solid ${CORAL}30` }}
              >
                <LogOut className="w-4 h-4" style={{ color: CORAL }} />
                <span className="font-body" style={{ fontSize: 13, fontWeight: 700, color: CORAL }}>Sign Out</span>
              </button>
              <button
                onClick={() => toast.error("Contact support@thirtydarkzero.com to delete your account")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <Trash2 className="w-4 h-4" style={{ color: "#EF4444" }} />
                <span className="font-body" style={{ fontSize: 12, fontWeight: 600, color: "#EF4444" }}>Delete Account</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* DM Panel */}
      {selectedConversation && (
        <DirectMessagePanel
          open={true}
          onClose={() => setSelectedConversation(null)}
          recipientId={selectedConversation.user_id}
          recipientName="Artist"
        />
      )}
    </div>
  );
}
