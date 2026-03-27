import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Play, Heart, UserPlus, UserCheck, Share2, X,
  Music, ArrowLeft, Home, Youtube, Crown, Clock, Disc, MoreHorizontal,
  Loader2, Camera, MessageCircle, MapPin, Video, Mail, Calendar, Globe
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { YouTubeVideo } from "@/hooks/useYouTubePlayer";
import { ArtistTipJar } from "@/components/ArtistTipJar";
import tdzLogo from "@/assets/tdz-logo.png";

type ArtistSource = 'tdz' | 'youtube';

interface UnifiedTrack {
  id: string;
  title: string;
  artist_name: string;
  duration?: number;
  album_name?: string;
  thumbnail?: string;
  source: ArtistSource;
  youtubeData?: YouTubeVideo;
}

interface GalleryPhoto {
  id: string;
  image_path: string;
  caption: string | null;
  imageUrl: string;
}

export default function UnifiedArtistProfile() {
  const { artistId, source } = useParams<{ artistId: string; source?: string }>();
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  
  const [artist, setArtist] = useState<any>(null);
  const [tracks, setTracks] = useState<UnifiedTrack[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [artistSource, setArtistSource] = useState<ArtistSource>('tdz');
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!artistId) return;
    const isYouTube = source === 'youtube' || artistId.startsWith('UC') || artistId.startsWith('yt-');
    setArtistSource(isYouTube ? 'youtube' : 'tdz');
  }, [artistId, source]);

  useEffect(() => {
    if (!artistId) {
      toast.error("Invalid artist profile");
      navigate("/discover");
      return;
    }
    loadUser();
    if (artistSource === 'youtube') loadYouTubeArtist();
    else loadTDZArtist();
  }, [artistId, artistSource]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user && artistSource === 'tdz') checkIfFollowing(user.id);
  };

  const loadTDZArtist = async () => {
    setLoading(true);
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artistId!);
      if (!isUUID) { toast.error("Invalid artist ID"); navigate("/discover"); return; }

      const { data: artistData, error: artistError } = await supabase
        .from("artist_profiles").select("*").eq("user_id", artistId).maybeSingle();

      if (artistError || !artistData) { toast.error("Artist not found"); navigate("/discover"); return; }

      setArtist({
        id: artistData.user_id,
        name: artistData.artist_name,
        image: artistData.profile_image_path ? supabase.storage.from('artist-images').getPublicUrl(artistData.profile_image_path).data.publicUrl : null,
        banner: artistData.banner_image_path ? supabase.storage.from('artist-images').getPublicUrl(artistData.banner_image_path).data.publicUrl : null,
        bio: artistData.bio,
        verified: artistData.verified,
        monthlyListeners: artistData.monthly_listeners || 0,
        totalPlays: artistData.total_plays || 0,
        social_links: artistData.social_links,
        website: artistData.website,
        source: 'tdz',
        genres: [],
      });

      const { data: trackData } = await supabase.from("tracks").select("*, albums(title)")
        .eq("user_id", artistId).eq("is_published", true).order("created_at", { ascending: false });

      if (trackData) {
        setTracks(trackData.map(track => ({
          id: track.id, title: track.title, artist_name: track.artist_name, duration: track.duration,
          album_name: track.albums?.title,
          thumbnail: track.album_cover_path ? supabase.storage.from(track.album_cover_bucket || 'album-covers').getPublicUrl(track.album_cover_path).data.publicUrl : undefined,
          source: 'tdz',
        })));
      }

      const { data: albumsData } = await supabase.from("albums").select("*").eq("user_id", artistId)
        .eq("is_published", true).order("release_date", { ascending: false });
      if (albumsData) setAlbums(albumsData);

      const { data: galleryData } = await supabase.from("artist_gallery").select("*")
        .eq("artist_id", artistId).order("display_order", { ascending: true });
      if (galleryData) {
        setGallery(galleryData.map(item => ({
          id: item.id, image_path: item.image_path, caption: item.caption,
          imageUrl: supabase.storage.from("artist-gallery").getPublicUrl(item.image_path).data.publicUrl
        })));
      }
    } catch (error) {
      console.error('Error loading TDZ artist:', error);
      toast.error("Failed to load artist");
    } finally {
      setLoading(false);
    }
  };

  const loadYouTubeArtist = async () => {
    setLoading(true);
    try {
      const channelQuery = artistId?.replace('yt-', '').replace('UC', '');
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: decodeURIComponent(channelQuery || ''), type: 'search', maxResults: 30 }
      });
      if (error || !data?.results?.length) { toast.error("Could not load YouTube artist"); navigate("/discover"); return; }
      const firstVideo = data.results[0] as YouTubeVideo;
      setArtist({
        id: artistId, name: firstVideo.channel,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstVideo.channel)}&size=300&background=dc2626&color=fff`,
        banner: firstVideo.thumbnail, bio: `YouTube artist with ${data.results.length}+ videos available.`,
        verified: false, monthlyListeners: 0, source: 'youtube', genres: ['YouTube Music'],
      });
      setTracks(data.results.map((video: YouTubeVideo) => ({
        id: `yt-${video.id}`, title: video.title, artist_name: video.channel,
        duration: parseDurationToSeconds(video.duration), thumbnail: video.thumbnail,
        source: 'youtube' as const, youtubeData: video,
      })));
    } catch (error) { console.error('Error loading YouTube artist:', error); toast.error("Failed to load artist"); }
    finally { setLoading(false); }
  };

  function parseDurationToSeconds(duration?: string): number {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  }

  const checkIfFollowing = async (userId: string) => {
    const { data } = await supabase.from("artist_follows").select("id").eq("follower_id", userId).eq("artist_id", artistId).maybeSingle();
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

  const handlePlayTrack = (track: UnifiedTrack) => {
    if (track.source === 'youtube' && track.youtubeData) {
      const yt = { id: track.id, title: track.title, artist_name: track.artist_name, duration: track.duration || 0, file_path: '', play_count: 0, source: 'youtube' as const, youtubeId: track.youtubeData.id, thumbnail: track.thumbnail };
      playTrack(yt, tracks.filter(t => t.source === 'youtube').map(t => ({ id: t.id, title: t.title, artist_name: t.artist_name, duration: t.duration || 0, file_path: '', play_count: 0, source: 'youtube' as const, youtubeId: t.youtubeData?.id, thumbnail: t.thumbnail })));
    } else {
      const tdzTrack = { id: track.id, title: track.title, artist_name: track.artist_name, duration: track.duration || 0, file_path: '', play_count: 0 };
      playTrack(tdzTrack, tracks.filter(t => t.source === 'tdz').map(t => ({ id: t.id, title: t.title, artist_name: t.artist_name, duration: t.duration || 0, file_path: '', play_count: 0 })));
    }
  };

  const handlePlayAll = () => { if (tracks.length > 0) handlePlayTrack(tracks[0]); };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAlbumCover = (album: any) => {
    if (!album.cover_art_path) return '';
    return supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path).data.publicUrl;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "hsl(var(--bg-void))" }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "hsl(var(--coral))" }} />
      </div>
    );
  }

  if (!artist) return null;

  const socialLinks = artist.social_links || {};
  const hasSocials = artist.website || Object.values(socialLinks).some(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "hsl(var(--bg-void))" }}>
      {/* Blurred background */}
      {artist.image && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `url(${artist.image})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(100px) saturate(1.5) brightness(0.15)",
          transform: "scale(1.2)",
        }} />
      )}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to bottom, hsl(var(--bg-void) / 0.5) 0%, hsl(var(--bg-void) / 0.85) 50%, hsl(var(--bg-void) / 0.95) 100%)",
      }} />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--glass-border)", background: "var(--glass-1)", backdropFilter: "blur(30px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-2)" }} />
          </button>
          <img src={tdzLogo} alt="TDZ" className="h-7 w-auto cursor-pointer" onClick={() => navigate("/discover")} />
        </div>
        <p className="font-body" style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>
          {artistSource === 'youtube' ? 'YOUTUBE ARTIST' : 'ARTIST'}
        </p>
        <Button variant="ghost" size="sm" onClick={() => navigate("/discover")} className="glass-ultra rounded-full px-3" style={{ fontSize: 11 }}>
          <Home className="w-4 h-4 mr-1" /> Discover
        </Button>
      </div>

      {/* Main scrollable content */}
      <div className="relative z-10 flex-1 overflow-auto">
        {/* Centered Profile Photo */}
        <div className="flex flex-col items-center pt-8 pb-4 px-4">
          <div className="relative" style={{ width: "min(260px, 55vw)", aspectRatio: "1" }}>
            <div className="absolute -inset-6 rounded-full" style={{ background: artistSource === 'youtube' ? "hsl(0 84% 40% / 0.2)" : "hsl(var(--coral) / 0.15)", filter: "blur(50px)" }} />
            <div className="relative w-full h-full rounded-full overflow-hidden" style={{
              boxShadow: `0 20px 60px hsl(0 0% 0% / 0.6), 0 0 80px ${artistSource === 'youtube' ? 'hsl(0 84% 40% / 0.15)' : 'hsl(var(--coral) / 0.12)'}`,
              border: "2px solid var(--glass-border-lit)",
            }}>
              {artist.image ? (
                <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: artistSource === 'youtube' ? 'hsl(0 84% 40% / 0.3)' : 'linear-gradient(135deg, hsl(var(--coral) / 0.3), hsl(var(--secondary) / 0.3))' }}>
                  {artistSource === 'youtube' ? <Youtube className="w-16 h-16 text-white" /> : (
                    <span className="font-display" style={{ fontSize: 64, color: "var(--text-2)" }}>{artist.name?.charAt(0)?.toUpperCase() || 'A'}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Name & badges */}
          <h1 className="font-display mt-5 text-center" style={{ fontSize: "clamp(36px, 6vw, 56px)", lineHeight: 1, color: "var(--text-1)" }}>
            {artist.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {artistSource === 'youtube' && (
              <span className="font-body px-3 py-1 rounded-full" style={{ fontSize: 10, background: "hsl(0 84% 40% / 0.3)", color: "#f87171" }}>
                <Youtube className="w-3 h-3 inline mr-1" />YouTube
              </span>
            )}
            {artistSource === 'tdz' && (
              <span className="font-body px-3 py-1 rounded-full" style={{ fontSize: 10, background: "hsl(var(--coral) / 0.2)", color: "hsl(var(--coral))" }}>
                <Crown className="w-3 h-3 inline mr-1" />TDZ
              </span>
            )}
            {artist.verified && (
              <span className="font-body px-3 py-1 rounded-full" style={{ fontSize: 10, background: "hsl(var(--coral) / 0.2)", color: "hsl(var(--coral))" }}>✓ Verified</span>
            )}
          </div>
          <p className="font-body mt-2" style={{ fontSize: 12, color: "var(--text-4)" }}>
            {tracks.length} tracks{artistSource === 'tdz' ? ` · ${albums.length} releases · ${artist.monthlyListeners?.toLocaleString() || 0} monthly listeners` : ''}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <button onClick={handlePlayAll} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-body transition-all hover:scale-105"
              style={{ fontSize: 12, fontWeight: 600, background: artistSource === 'youtube' ? 'hsl(0 84% 50%)' : 'hsl(var(--coral))', color: "#fff", boxShadow: `0 4px 20px ${artistSource === 'youtube' ? 'hsl(0 84% 50% / 0.4)' : 'hsl(var(--coral) / 0.4)'}` }}>
              <Play className="w-4 h-4" fill="currentColor" /> PLAY ALL
            </button>
            {artistSource === 'tdz' && (
              <>
                <button onClick={toggleFollow} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-body transition-all hover:scale-105 glass-ultra" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                  {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <ArtistTipJar artistId={artist.id} artistName={artist.name} />
              </>
            )}
          </div>
        </div>

        {/* Fan Features Row */}
        <div className="px-4 md:px-8 py-4 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: MapPin, label: "Tour Dates", desc: "No upcoming dates" },
              { icon: Video, label: "Videos", desc: `${gallery.length > 0 ? gallery.length : 0} media` },
              { icon: Mail, label: "Newsletter", desc: "Stay updated" },
              { icon: Calendar, label: "Events", desc: "See all events" },
            ].map((item) => (
              <div key={item.label} className="glass-ultra rounded-2xl p-4 text-center cursor-pointer hover:scale-[1.02] transition-transform">
                <item.icon className="w-5 h-5 mx-auto mb-2" style={{ color: artistSource === 'youtube' ? '#f87171' : "hsl(var(--coral))" }} />
                <p className="font-body" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{item.label}</p>
                <p className="font-body" style={{ fontSize: 10, color: "var(--text-4)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        {artist.bio && (
          <div className="px-4 md:px-8 py-3 max-w-5xl mx-auto">
            <div className="glass-ultra rounded-2xl p-5">
              <p className="font-body mb-2" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>ABOUT</p>
              <p className="font-body" style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text-2)", whiteSpace: "pre-wrap" }}>{artist.bio}</p>
            </div>
          </div>
        )}

        {/* Social Links */}
        {hasSocials && (
          <div className="px-4 md:px-8 py-2 max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {artist.website && (
                <a href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-xs transition-all hover:scale-105 glass-ultra" style={{ color: "var(--text-2)" }}>
                  <Globe className="w-3 h-3" /> Website
                </a>
              )}
            </div>
          </div>
        )}

        {/* Albums */}
        {albums.length > 0 && (
          <div className="px-4 md:px-8 py-4 max-w-5xl mx-auto">
            <p className="font-body mb-3" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>RELEASES</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {albums.map(album => (
                <button key={album.id} onClick={() => navigate(`/album/${album.id}`)} className="glass-ultra rounded-2xl p-3 text-left transition-all hover:scale-[1.03] group">
                  <div className="aspect-square rounded-xl overflow-hidden mb-2" style={{ border: "1px solid var(--glass-border)" }}>
                    {album.cover_art_path ? (
                      <img src={getAlbumCover(album)} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--glass-2)" }}><Music className="w-6 h-6" style={{ color: "var(--text-4)" }} /></div>
                    )}
                  </div>
                  <p className="truncate font-body" style={{ fontWeight: 600, fontSize: 13, color: "var(--text-1)" }}>{album.title}</p>
                  <p className="font-body" style={{ fontSize: 11, color: "var(--text-4)" }}>{album.release_type || 'Album'} · {album.release_date ? new Date(album.release_date).getFullYear() : '—'}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tracks - newest to oldest */}
        <div className="px-4 md:px-8 py-4 max-w-5xl mx-auto">
          <p className="font-body mb-3" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>TRACKS</p>
          <div className="glass-ultra rounded-2xl overflow-hidden">
            <div className="space-y-0.5 p-2">
              {tracks.map((track, index) => {
                const isActive = currentTrack?.id === track.id;
                const accentColor = artistSource === 'youtube' ? '#f87171' : 'hsl(var(--coral))';
                return (
                  <button key={track.id} onClick={() => handlePlayTrack(track)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: isActive ? (artistSource === 'youtube' ? 'hsl(0 84% 40% / 0.12)' : 'hsl(var(--coral) / 0.12)') : 'transparent',
                      border: isActive ? `1px solid ${artistSource === 'youtube' ? 'hsl(0 84% 40% / 0.25)' : 'hsl(var(--coral) / 0.25)'}` : '1px solid transparent',
                    }}>
                    {track.thumbnail && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid var(--glass-border)" }}>
                        <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="font-body" style={{ fontSize: 13, color: isActive ? accentColor : 'var(--text-4)', width: 20, textAlign: 'center', flexShrink: 0 }}>
                      {isActive && isPlaying ? '▸' : index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-body" style={{ fontWeight: 600, fontSize: 14, color: isActive ? accentColor : 'var(--text-1)' }}>{track.title}</p>
                      {track.album_name && <p className="font-body" style={{ fontSize: 11, color: "var(--text-4)" }}>{track.album_name}</p>}
                    </div>
                    <span className="font-body" style={{ fontSize: 12, color: "var(--text-4)" }}>{formatDuration(track.duration)}</span>
                  </button>
                );
              })}
              {tracks.length === 0 && (
                <div className="text-center py-12">
                  <Music className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-4)" }} />
                  <p className="font-body" style={{ fontSize: 13, color: "var(--text-4)" }}>No tracks available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery with lightbox */}
        {artistSource === 'tdz' && gallery.length > 0 && (
          <div className="px-4 md:px-8 py-4 max-w-5xl mx-auto pb-32">
            <p className="font-body mb-3 flex items-center gap-2" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>
              <Camera className="w-3.5 h-3.5" /> GALLERY
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map(photo => (
                <button key={photo.id} onClick={() => setLightboxPhoto(photo.imageUrl)}
                  className="aspect-square rounded-2xl overflow-hidden group cursor-pointer glass-ultra">
                  <img src={photo.imageUrl} alt={photo.caption || "Gallery photo"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "hsl(0 0% 0% / 0.9)", backdropFilter: "blur(30px)" }}
          onClick={() => setLightboxPhoto(null)}>
          <button className="absolute top-6 right-6 p-2 rounded-full glass-ultra hover:scale-110 transition-transform" onClick={() => setLightboxPhoto(null)}>
            <X className="w-6 h-6" style={{ color: "var(--text-1)" }} />
          </button>
          <img src={lightboxPhoto} alt="Gallery" className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
            style={{ boxShadow: "0 40px 100px hsl(0 0% 0% / 0.8)" }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
