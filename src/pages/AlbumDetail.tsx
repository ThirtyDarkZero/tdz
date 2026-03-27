import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Play, Pause, ChevronDown, MoreHorizontal, SkipBack, SkipForward,
  Heart, Music, Loader2, Disc3, Type, SlidersHorizontal, ListMusic,
  BarChart3
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { EditAlbumDialog } from "@/components/EditAlbumDialog";
import { AlbumAnalytics } from "@/components/AlbumAnalytics";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";

type PlayerTab = 'cover' | 'lyrics' | 'visual' | 'eq' | 'queue';

export default function AlbumDetail() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying, pauseTrack, resumeTrack, nextTrack, previousTrack, currentTime } = usePlayer();
  const { user } = useAuth();

  const [album, setAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAlbum, setEditingAlbum] = useState(false);
  const [activeTab, setActiveTab] = useState<PlayerTab>('cover');

  useEffect(() => {
    if (albumId) {
      loadAlbum();
      loadTracks();
    }
  }, [albumId, user]);

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
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) handlePlayTrack(tracks[0]);
  };

  const togglePlayPause = () => (isPlaying ? pauseTrack() : resumeTrack());

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCoverUrl = (path?: string, bucket?: string) => {
    if (!path) return '/placeholder.svg';
    return supabase.storage.from(bucket || 'album-covers').getPublicUrl(path).data.publicUrl;
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

  // Which track is currently playing from this album
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
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#030308" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#FF6347" }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Raleway', sans-serif" }}>Loading album...</p>
        </div>
      </div>
    );
  }

  // Progress percentage
  const duration = playingTrack?.duration || currentTrack?.duration || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0a0a14" }}>
      <Helmet>
        <title>{`${album.title} - ${album.artist_name}`}</title>
        <meta name="description" content={album.description || `Listen to ${album.title} by ${album.artist_name}`} />
      </Helmet>

      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ChevronDown className="w-5 h-5 text-white/60" />
        </button>
        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
          NOW PLAYING
        </p>
        <button onClick={() => setEditingAlbum(true)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* ─── Main 3-Column Layout ─── */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT COLUMN: Artist / Album Title + Tracklist */}
        <div className="lg:w-[30%] flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden order-2 lg:order-1">
          <div className="mb-4 lg:mb-6 text-center lg:text-left">
            <button
              onClick={() => navigate(`/artist/${album.user_id}`)}
              className="hover:opacity-70 transition-opacity"
            >
              <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                {album.artist_name}
              </p>
            </button>
            <h2 style={{
              fontFamily: "'Six Caps', sans-serif",
              fontSize: "clamp(28px, 3vw, 42px)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              lineHeight: 1.1,
              color: "#FFFFFF",
            }}>
              {album.title}
            </h2>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-0.5 pr-2">
              {tracks.map((track, index) => {
                const isActive = currentTrack?.id === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => handlePlayTrack(track)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      isActive ? 'bg-white/8' : 'hover:bg-white/5'
                    }`}
                  >
                    <span style={{
                      fontFamily: "'Raleway', sans-serif",
                      fontSize: 13,
                      color: isActive ? '#FF6347' : 'rgba(255,255,255,0.3)',
                      width: 20,
                      textAlign: 'center',
                      flexShrink: 0,
                    }}>
                      {isActive && isPlaying ? '▸' : (track.track_number || index + 1)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{
                        fontFamily: "'Raleway', sans-serif",
                        fontWeight: 600,
                        fontSize: 14,
                        color: isActive ? '#FF6347' : '#FFFFFF',
                      }}>
                        {track.title}
                      </p>
                    </div>
                    <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                      {formatDuration(track.duration || 0)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Analytics below tracklist if owner */}
            {isOwner && album.is_published && (
              <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4" style={{ color: "#FF6347" }} />
                  <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 22, letterSpacing: "0.04em", textTransform: "uppercase", color: "#FFFFFF" }}>
                    Analytics
                  </h3>
                </div>
                <AlbumAnalytics albumId={albumId!} />
              </div>
            )}
          </ScrollArea>
        </div>

        {/* CENTER COLUMN: Album Cover Art / Motion Art */}
        <div className="lg:w-[40%] flex items-center justify-center p-4 md:p-8 order-1 lg:order-2 flex-shrink-0">
          <div className="relative" style={{ width: "min(380px, 80vw)", aspectRatio: "1" }}>
            <div
              className="w-full h-full rounded-2xl overflow-hidden shadow-2xl"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(255,99,71,0.08)" }}
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
                <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,99,71,0.3), rgba(139,92,246,0.3))" }}>
                  <Music className="w-20 h-20 text-white/20" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Song Title + Lyrics */}
        <div className="lg:w-[30%] flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden order-3">
          <div className="mb-4 lg:mb-6 text-center lg:text-left">
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
              {activeSongTitle ? 'SONG TITLE' : ''}
            </p>
            <h2 style={{
              fontFamily: "'Six Caps', sans-serif",
              fontSize: "clamp(28px, 3vw, 42px)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              lineHeight: 1.1,
              color: "#FFFFFF",
            }}>
              {activeSongTitle || 'Select a track'}
            </h2>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="pr-2">
              {activeLyrics ? (
                <p style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 13,
                  lineHeight: 2,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: "0.02em",
                  whiteSpace: "pre-wrap",
                }}>
                  {activeLyrics}
                </p>
              ) : (
                <p style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.25)",
                  fontStyle: "italic",
                }}>
                  No lyrics available for this track.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* ─── Album Info Row (below art on mobile) ─── */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex-1 min-w-0">
          <p className="truncate" style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 20, letterSpacing: "0.04em", textTransform: "uppercase", color: "#FFFFFF" }}>
            {playingTrack?.title || album.title}
          </p>
          <button onClick={() => navigate(`/artist/${album.user_id}`)} className="hover:underline">
            <p className="truncate" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              {album.artist_name}
            </p>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-white/40 hover:text-white transition-colors">
            <Heart className="w-5 h-5" />
          </button>
          <button className="p-2 text-white/40 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ─── Player Controls ─── */}
      <div className="flex-shrink-0 px-4 md:px-6 pb-2 pt-2">
        <div className="flex flex-col items-center gap-3">
          {/* Transport */}
          <div className="flex items-center gap-6">
            <button onClick={previousTrack} className="text-white/50 hover:text-white transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={playingTrack ? togglePlayPause : handlePlayAll}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105"
              style={{ background: "linear-gradient(135deg, #FF6347, #FF4500)", boxShadow: "0 4px 20px rgba(255,99,71,0.4)" }}
            >
              {isPlaying && playingTrack ? (
                <Pause className="w-6 h-6 text-white" fill="white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
              )}
            </button>
            <button onClick={nextTrack} className="text-white/50 hover:text-white transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="w-full max-w-md flex items-center gap-3">
            <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", minWidth: 36, textAlign: "right" }}>
              {formatDuration(currentTime)}
            </span>
            <div className="flex-1 h-1 rounded-full cursor-pointer" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%`, background: "#FF6347" }} />
            </div>
            <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", minWidth: 36 }}>
              {formatDuration(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Bottom Tab Bar ─── */}
      <div className="flex-shrink-0 flex items-center justify-around px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {[
          { id: 'cover' as PlayerTab, icon: Disc3, label: 'Cover' },
          { id: 'lyrics' as PlayerTab, icon: Type, label: 'Lyrics' },
          { id: 'visual' as PlayerTab, icon: SlidersHorizontal, label: 'Visual' },
          { id: 'eq' as PlayerTab, icon: SlidersHorizontal, label: 'EQ' },
          { id: 'queue' as PlayerTab, icon: ListMusic, label: 'Queue' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center gap-1 px-3 py-1 transition-colors"
          >
            <tab.icon className="w-5 h-5" style={{ color: activeTab === tab.id ? '#FF6347' : 'rgba(255,255,255,0.35)' }} />
            <span style={{
              fontFamily: "'Raleway', sans-serif",
              fontSize: 10,
              color: activeTab === tab.id ? '#FF6347' : 'rgba(255,255,255,0.35)',
            }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

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
