import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Play, ArrowLeft, MoreHorizontal,
  Music, MessageCircle, Share2, UserPlus, UserCheck,
  Globe, Instagram, Twitter, Youtube, Facebook, ExternalLink,
  Bell, BellOff, ChevronDown, Heart, Loader2, Camera
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { DirectMessagePanel } from "@/components/DirectMessagePanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ArtistProfile() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showMessages, setShowMessages] = useState(false);
  const [loading, setLoading] = useState(true);

  const { playTrack, currentTrack, isPlaying } = usePlayer();

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
      loadAlbums();
      loadGallery();
    }
  }, [artistId]);

  const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) checkIfFollowing(user.id);
  };

  const loadArtist = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("artist_profiles")
      .select("*")
      .eq("user_id", artistId)
      .maybeSingle();

    if (error || !data) {
      toast.error("Artist profile not found");
      navigate("/discover");
      return;
    }
    setArtist(data);
    setLoading(false);
  };

  const loadTracks = async () => {
    const { data } = await supabase
      .from("tracks")
      .select("*, albums(*)")
      .eq("user_id", artistId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (data) {
      setTracks(data.filter(t => !t.albums || t.albums.is_published !== false));
    }
  };

  const loadAlbums = async () => {
    const { data } = await supabase
      .from("albums")
      .select("*")
      .eq("user_id", artistId)
      .eq("is_published", true)
      .order("release_date", { ascending: false });

    if (data) setAlbums(data);
  };

  const loadGallery = async () => {
    const { data } = await supabase
      .from("artist_gallery")
      .select("*")
      .eq("artist_id", artistId)
      .order("display_order", { ascending: true });

    if (data) setGallery(data);
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

  const toggleFollow = async () => {
    if (!user) { toast.error("Please sign in to follow artists"); return; }
    if (isFollowing) {
      await supabase.from("artist_follows").delete().eq("follower_id", user.id).eq("artist_id", artistId);
      toast.success("Unfollowed artist");
    } else {
      await supabase.from("artist_follows").insert({ follower_id: user.id, artist_id: artistId });
      toast.success("Following artist");
    }
    setIsFollowing(!isFollowing);
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    const q = tracks.map(t => ({ ...t, duration: t.duration || 0, file_path: t.file_path || '', play_count: t.play_count || 0 }));
    playTrack(q[0], q);
  };

  const handlePlayTrack = (track: any) => {
    const n = { ...track, duration: track.duration || 0, file_path: track.file_path || '', play_count: track.play_count || 0 };
    const q = tracks.map(t => ({ ...t, duration: t.duration || 0, file_path: t.file_path || '', play_count: t.play_count || 0 }));
    playTrack(n, q);
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return supabase.storage.from('artist-images').getPublicUrl(path).data.publicUrl;
  };

  const getAlbumCover = (album: any) => {
    if (!album.cover_art_path) return '';
    return supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path).data.publicUrl;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const genres = [...new Set(tracks.map(t => t.genre).filter(Boolean))].slice(0, 3);

  const profileImage = useMemo(() => {
    if (!artist?.profile_image_path) return null;
    return getImageUrl(artist.profile_image_path);
  }, [artist]);

  if (loading || !artist) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "hsl(var(--bg-void))" }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "hsl(var(--coral))" }} />
      </div>
    );
  }

  // Social links helper
  const socialLinks = artist.social_links || {};
  const hasSocials = artist.website || Object.values(socialLinks).some(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "hsl(var(--bg-void))" }}>
      {/* Blurred background */}
      {profileImage && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `url(${profileImage})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(100px) saturate(1.5) brightness(0.15)",
          transform: "scale(1.2)",
        }} />
      )}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to bottom, hsl(var(--bg-void) / 0.6) 0%, hsl(var(--bg-void) / 0.9) 60%, hsl(var(--bg-void) / 0.98) 100%)",
      }} />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--glass-border)" }}>
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ChevronDown className="w-5 h-5" style={{ color: "var(--text-2)" }} />
        </button>
        <p className="font-body" style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>
          ARTIST
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5" style={{ color: "var(--text-2)" }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="backdrop-blur-xl bg-black/80 border-white/10 min-w-[200px]">
            <DropdownMenuItem onClick={() => setShowMessages(true)} className="text-white/80 hover:text-white hover:bg-white/10 gap-2">
              <MessageCircle className="w-4 h-4" /> Message
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/artist/${artistId}`);
              toast.success("Profile link copied");
            }} className="text-white/80 hover:text-white hover:bg-white/10 gap-2">
              <Share2 className="w-4 h-4" /> Share Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 3-Column Layout */}
      <div className="relative z-10 flex-1 overflow-auto">
        <div className="flex flex-col lg:flex-row min-h-full">

          {/* LEFT: Discography / Tracklist */}
          <div className="lg:w-[30%] flex flex-col p-4 md:p-6 lg:p-8 order-2 lg:order-1">
            <div className="mb-4 lg:mb-6 text-center lg:text-left">
              <p className="font-body" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>
                {tracks.length} tracks · {albums.length} releases
              </p>
              <h2 className="font-display" style={{ fontSize: "clamp(24px, 3vw, 36px)", lineHeight: 1.1, color: "var(--text-1)" }}>
                Discography
              </h2>

              <div className="flex items-center justify-center lg:justify-start gap-2 mt-3">
                <button
                  onClick={handlePlayAll}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-body transition-all hover:scale-105"
                  style={{ fontSize: 12, fontWeight: 600, background: "hsl(var(--coral))", color: "#000", boxShadow: "0 4px 20px hsl(var(--coral) / 0.4)" }}
                >
                  <Play className="w-3.5 h-3.5" fill="currentColor" />
                  PLAY ALL
                </button>
                <button
                  onClick={toggleFollow}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-body transition-all hover:scale-105"
                  style={{ fontSize: 12, fontWeight: 600, background: "var(--glass-2)", color: "var(--text-1)", border: "1px solid var(--glass-border)" }}
                >
                  {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>

            {/* Albums list */}
            {albums.length > 0 && (
              <div className="mb-4">
                <p className="font-body mb-2" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>RELEASES</p>
                <div className="space-y-2">
                  {albums.map(album => (
                    <button
                      key={album.id}
                      onClick={() => navigate(`/album/${album.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all hover:bg-white/5"
                      style={{ border: "1px solid transparent" }}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--glass-2)" }}>
                        {album.cover_art_path ? (
                          <img src={getAlbumCover(album)} alt={album.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4" style={{ color: "var(--text-4)" }} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-body" style={{ fontWeight: 600, fontSize: 13, color: "var(--text-1)" }}>{album.title}</p>
                        <p className="font-body" style={{ fontSize: 11, color: "var(--text-4)" }}>
                          {album.release_type || 'Album'} · {album.release_date ? new Date(album.release_date).getFullYear() : '—'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tracks list */}
            <p className="font-body mb-2" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>TRACKS</p>
            <div className="space-y-0.5">
              {tracks.slice(0, 20).map((track, index) => {
                const isActive = currentTrack?.id === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => handlePlayTrack(track)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: isActive ? "var(--glass-2)" : "transparent",
                      border: isActive ? "1px solid var(--glass-border-lit)" : "1px solid transparent",
                      backdropFilter: isActive ? "blur(20px)" : "none",
                    }}
                  >
                    <span className="font-body" style={{ fontSize: 13, color: isActive ? 'hsl(var(--coral))' : 'var(--text-4)', width: 20, textAlign: 'center', flexShrink: 0 }}>
                      {isActive && isPlaying ? '▸' : index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-body" style={{ fontWeight: 600, fontSize: 14, color: isActive ? 'hsl(var(--coral))' : 'var(--text-1)' }}>
                        {track.title}
                      </p>
                    </div>
                    <span className="font-body" style={{ fontSize: 12, color: "var(--text-4)" }}>
                      {formatDuration(track.duration || 0)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CENTER: Artist Photo */}
          <div className="lg:w-[40%] flex items-center justify-center p-4 md:p-8 order-1 lg:order-2 flex-shrink-0">
            <div className="relative" style={{ width: "min(380px, 80vw)", aspectRatio: "1" }}>
              <div className="absolute -inset-8 rounded-full" style={{ background: "hsl(var(--coral) / 0.12)", filter: "blur(60px)" }} />
              <div
                className="relative w-full h-full rounded-full overflow-hidden"
                style={{
                  boxShadow: "0 20px 60px hsl(0 0% 0% / 0.6), 0 0 80px hsl(var(--coral) / 0.08)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                {profileImage ? (
                  <img src={profileImage} alt={artist.artist_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--coral) / 0.3), hsl(var(--secondary) / 0.3))" }}>
                    <span className="font-display" style={{ fontSize: 80, color: "var(--text-2)" }}>
                      {artist.artist_name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Bio, Gallery, Socials */}
          <div className="lg:w-[30%] flex flex-col p-4 md:p-6 lg:p-8 order-3">
            <div className="mb-4 lg:mb-6 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-2">
                {genres.map((g: string) => (
                  <span key={g} className="font-body px-2 py-0.5 rounded-full" style={{ fontSize: 10, background: "var(--glass-2)", color: "var(--text-3)", border: "1px solid var(--glass-border)" }}>{g}</span>
                ))}
                {artist.verified && (
                  <span className="font-body px-2 py-0.5 rounded-full" style={{ fontSize: 10, background: "hsl(var(--coral) / 0.2)", color: "hsl(var(--coral))" }}>✓ Verified</span>
                )}
              </div>
              <h2 className="font-display" style={{ fontSize: "clamp(28px, 3vw, 48px)", lineHeight: 1.1, color: "var(--text-1)" }}>
                {artist.artist_name}
              </h2>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="pr-2 space-y-6">
                {/* Bio */}
                {artist.bio && (
                  <div>
                    <p className="font-body mb-1" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>ABOUT</p>
                    <p className="font-body" style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text-2)", whiteSpace: "pre-wrap" }}>
                      {artist.bio}
                    </p>
                  </div>
                )}

                {/* Social Links */}
                {hasSocials && (
                  <div>
                    <p className="font-body mb-2" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>LINKS</p>
                    <div className="flex flex-wrap gap-2">
                      {artist.website && (
                        <a href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs transition-all hover:scale-105"
                          style={{ background: "var(--glass-2)", color: "var(--text-2)", border: "1px solid var(--glass-border)" }}>
                          <Globe className="w-3 h-3" /> Website
                        </a>
                      )}
                      {socialLinks.instagram && (
                        <a href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs transition-all hover:scale-105"
                          style={{ background: "var(--glass-2)", color: "var(--text-2)", border: "1px solid var(--glass-border)" }}>
                          <Instagram className="w-3 h-3" /> Instagram
                        </a>
                      )}
                      {socialLinks.twitter && (
                        <a href={`https://twitter.com/${socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs transition-all hover:scale-105"
                          style={{ background: "var(--glass-2)", color: "var(--text-2)", border: "1px solid var(--glass-border)" }}>
                          <Twitter className="w-3 h-3" /> Twitter
                        </a>
                      )}
                      {socialLinks.youtube && (
                        <a href={socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://youtube.com/${socialLinks.youtube}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs transition-all hover:scale-105"
                          style={{ background: "var(--glass-2)", color: "var(--text-2)", border: "1px solid var(--glass-border)" }}>
                          <Youtube className="w-3 h-3" /> YouTube
                        </a>
                      )}
                      {socialLinks.facebook && (
                        <a href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs transition-all hover:scale-105"
                          style={{ background: "var(--glass-2)", color: "var(--text-2)", border: "1px solid var(--glass-border)" }}>
                          <Facebook className="w-3 h-3" /> Facebook
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Gallery */}
                {gallery.length > 0 && (
                  <div>
                    <p className="font-body mb-2" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>GALLERY</p>
                    <div className="grid grid-cols-2 gap-2">
                      {gallery.map(item => (
                        <div key={item.id} className="aspect-square rounded-xl overflow-hidden group cursor-pointer" style={{ border: "1px solid var(--glass-border)" }}>
                          <img
                            src={supabase.storage.from('artist-gallery').getPublicUrl(item.image_path).data.publicUrl}
                            alt={item.caption || 'Gallery'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      <DirectMessagePanel
        open={showMessages}
        onClose={() => setShowMessages(false)}
        recipientId={artist.user_id}
        recipientName={artist.artist_name}
        recipientAvatar={profileImage || undefined}
      />
    </div>
  );
}
