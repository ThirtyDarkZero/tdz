import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Play, Pause, ChevronDown, MoreHorizontal,
  Heart, Music, Loader2, BarChart3
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { EditAlbumDialog } from "@/components/EditAlbumDialog";
import { AlbumAnalytics } from "@/components/AlbumAnalytics";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AlbumDetail() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying, pauseTrack, resumeTrack, setPlayerView, currentTime } = usePlayer();
  const { user } = useAuth();

  const [album, setAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAlbum, setEditingAlbum] = useState(false);

  useEffect(() => {
    if (albumId) {
      loadAlbum();
      loadTracks();
    }
  }, [albumId, user]);

  // Auto-open the OrbPlayerBar when album loads and has tracks
  useEffect(() => {
    if (tracks.length > 0 && currentTrack) {
      setPlayerView("full");
    }
  }, [tracks, currentTrack]);

  const loadAlbum = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .eq("id", albumId)
      .single();

    if (error) {
      console.error("Error loading album:", error);
      toast.error("Failed to load album");
      navigate(-1);
      return;
    }

    if (data.is_published === false && user && data.user_id !== user.id) {
      toast.error("This album is not available");
      navigate("/discover");
      return;
    }

    setAlbum(data);
    setLoading(false);
  };

  const loadTracks = async () => {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("album_id", albumId)
      .order("track_number", { ascending: true });

    if (!error && data) {
      setTracks(data);
    }
  };

  const handlePlayTrack = (track: any) => {
    const normalizedTrack = {
      ...track,
      duration: track.duration || 0,
      file_path: track.file_path || '',
      play_count: track.play_count || 0,
      album_cover_path: album?.motion_cover_path || album?.cover_art_path,
      album_cover_bucket: album?.motion_cover_path ? (album?.motion_cover_bucket || 'motion-covers') : 'album-covers',
      album_title: album?.title,
    };

    const normalizedQueue = tracks.map(t => ({
      ...t,
      duration: t.duration || 0,
      file_path: t.file_path || '',
      play_count: t.play_count || 0,
      album_cover_path: album?.motion_cover_path || album?.cover_art_path,
      album_cover_bucket: album?.motion_cover_path ? (album?.motion_cover_bucket || 'motion-covers') : 'album-covers',
      album_title: album?.title,
    }));

    playTrack(normalizedTrack, normalizedQueue);
    setPlayerView("full");
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) handlePlayTrack(tracks[0]);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const heroMedia = useMemo(() => {
    if (!album) return { type: 'none' as const, url: '' };
    if (album.motion_cover_path) {
      const url = supabase.storage.from(album.motion_cover_bucket || 'motion-covers').getPublicUrl(album.motion_cover_path).data.publicUrl;
      return { type: 'video' as const, url };
    }
    if (album.cover_art_path) {
      const url = supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path).data.publicUrl;
      return { type: 'image' as const, url };
    }
    return { type: 'none' as const, url: '' };
  }, [album]);

  const playingTrack = currentTrack && tracks.find(t => t.id === currentTrack.id);
  const activeSongTitle = playingTrack?.title || tracks[0]?.title || '';
  const activeLyrics = playingTrack?.lyrics || currentTrack?.lyrics || '';
  const isOwner = user && album && user.id === album.user_id;

  const handleEditSuccess = () => {
    loadAlbum();
    loadTracks();
    setEditingAlbum(false);
  };

  if (loading || !album) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "hsl(var(--bg-void))" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "hsl(var(--coral))" }} />
          <p className="font-body" style={{ color: "var(--text-3)" }}>Loading album...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "hsl(var(--bg-void))" }}>
      <Helmet>
        <title>{`${album.title} - ${album.artist_name}`}</title>
        <meta name="description" content={album.description || `Listen to ${album.title} by ${album.artist_name}`} />
      </Helmet>

      {/* Blurred album art background */}
      {heroMedia.type === 'image' && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `url(${heroMedia.url})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(100px) saturate(1.5) brightness(0.15)",
          transform: "scale(1.2)",
        }} />
      )}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to bottom, hsl(var(--bg-void) / 0.6) 0%, hsl(var(--bg-void) / 0.9) 60%, hsl(var(--bg-void) / 0.98) 100%)",
      }} />

      {/* ─── Top Bar ─── */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--glass-border)" }}>
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ChevronDown className="w-5 h-5" style={{ color: "var(--text-2)" }} />
        </button>
        <p className="font-body" style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>
          NOW PLAYING
        </p>
        {isOwner ? (
          <button onClick={() => setEditingAlbum(true)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5" style={{ color: "var(--text-2)" }} />
          </button>
        ) : <div className="w-9" />}
      </div>

      {/* ─── Main 3-Column Layout ─── */}
      <div className="relative z-10 flex-1 overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT COLUMN: Artist / Album Title + Tracklist */}
        <div className="lg:w-[30%] flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden order-2 lg:order-1">
          <div className="mb-4 lg:mb-6 text-center lg:text-left">
            <button
              onClick={() => navigate(`/artist/${album.user_id}`)}
              className="hover:opacity-70 transition-opacity"
            >
              <p className="font-body" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>
                {album.artist_name}
              </p>
            </button>
            <h2 className="font-display" style={{
              fontSize: "clamp(28px, 3vw, 42px)",
              lineHeight: 1.1,
              color: "var(--text-1)",
            }}>
              {album.title}
            </h2>
            {/* Play All button */}
            <button
              onClick={handlePlayAll}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-full font-body transition-all hover:scale-105"
              style={{
                fontSize: 12, fontWeight: 600,
                background: "hsl(var(--coral))",
                color: "#000",
                boxShadow: "0 4px 20px hsl(var(--coral) / 0.4)",
              }}
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" />
              PLAY ALL
            </button>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-0.5 pr-2">
              {tracks.map((track, index) => {
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
                    <span className="font-body" style={{
                      fontSize: 13,
                      color: isActive ? 'hsl(var(--coral))' : 'var(--text-4)',
                      width: 20,
                      textAlign: 'center',
                      flexShrink: 0,
                    }}>
                      {isActive && isPlaying ? '▸' : (track.track_number || index + 1)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-body" style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: isActive ? 'hsl(var(--coral))' : 'var(--text-1)',
                      }}>
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

            {/* Analytics below tracklist if owner */}
            {isOwner && album.is_published && (
              <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--glass-border)" }}>
                <AlbumAnalytics albumId={albumId!} compact />
              </div>
            )}
          </ScrollArea>
        </div>

        {/* CENTER COLUMN: Album Cover Art / Motion Art */}
        <div className="lg:w-[40%] flex items-center justify-center p-4 md:p-8 order-1 lg:order-2 flex-shrink-0">
          <div className="relative" style={{ width: "min(380px, 80vw)", aspectRatio: "1" }}>
            {/* Glow behind art */}
            <div className="absolute -inset-8 rounded-3xl" style={{ background: "hsl(var(--coral) / 0.12)", filter: "blur(60px)" }} />
            <div
              className="relative w-full h-full rounded-2xl overflow-hidden"
              style={{
                boxShadow: "0 20px 60px hsl(0 0% 0% / 0.6), 0 0 80px hsl(var(--coral) / 0.08)",
                border: "1px solid var(--glass-border)",
              }}
            >
              {heroMedia.type === 'video' ? (
                <video
                  src={heroMedia.url}
                  autoPlay loop muted playsInline
                  className="w-full h-full object-cover"
                />
              ) : heroMedia.type === 'image' ? (
                <img src={heroMedia.url} alt={album.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--coral) / 0.3), hsl(var(--secondary) / 0.3))" }}>
                  <Music className="w-20 h-20" style={{ color: "var(--text-4)" }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Song Title + Lyrics */}
        <div className="lg:w-[30%] flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden order-3">
          <div className="mb-4 lg:mb-6 text-center lg:text-left">
            <p className="font-body" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>
              {activeSongTitle ? 'LYRICS' : ''}
            </p>
            <h2 className="font-display" style={{
              fontSize: "clamp(28px, 3vw, 42px)",
              lineHeight: 1.1,
              color: "var(--text-1)",
            }}>
              {activeSongTitle || 'Select a track'}
            </h2>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="pr-2">
              {activeLyrics ? (
                <p className="font-body" style={{
                  fontSize: 13,
                  lineHeight: 2,
                  color: "var(--text-2)",
                  letterSpacing: "0.02em",
                  whiteSpace: "pre-wrap",
                }}>
                  {activeLyrics}
                </p>
              ) : (
                <div className="glass-card rounded-2xl p-6 text-center">
                  <Music className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-4)" }} />
                  <p className="font-body" style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>
                    No lyrics available for this track.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* The OrbPlayerBar from GlobalMusicPlayer handles actual playback controls */}

      {isOwner && (
        <EditAlbumDialog
          album={album}
          open={editingAlbum}
          onOpenChange={setEditingAlbum}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
