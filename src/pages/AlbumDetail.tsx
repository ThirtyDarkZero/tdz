import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Play, Pause, ChevronDown, MoreHorizontal,
  Heart, Music, Loader2, Share2, ListPlus, Pin,
  Clock, Disc, Calendar, Building2
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { EditAlbumDialog } from "@/components/EditAlbumDialog";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AlbumDetail() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying, pauseTrack, resumeTrack, addToQueue } = usePlayer();
  const { user } = useAuth();

  const [album, setAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAlbum, setEditingAlbum] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

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

  const handleQueueAll = () => {
    tracks.forEach(t => {
      addToQueue({
        ...t,
        duration: t.duration || 0,
        file_path: t.file_path || '',
        play_count: t.play_count || 0,
        album_cover_path: album?.motion_cover_path || album?.cover_art_path,
        album_cover_bucket: album?.motion_cover_path ? (album?.motion_cover_bucket || 'motion-covers') : 'album-covers',
        album_title: album?.title,
      });
    });
    toast.success(`Added ${tracks.length} tracks to queue`);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/album/${albumId}`;
    navigator.clipboard.writeText(url);
    toast.success("Album link copied to clipboard");
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = useMemo(() => {
    const total = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const mins = Math.floor(total / 60);
    return mins;
  }, [tracks]);

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

  const releaseYear = album?.release_date ? new Date(album.release_date).getFullYear() : album?.copyright_year;
  const releaseDate = album?.release_date ? new Date(album.release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

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
          {album.release_type?.toUpperCase() || 'ALBUM'}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5" style={{ color: "var(--text-2)" }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="backdrop-blur-xl bg-black/80 border-white/10 min-w-[200px]">
            <DropdownMenuItem onClick={handleShare} className="text-white/80 hover:text-white hover:bg-white/10 gap-2">
              <Share2 className="w-4 h-4" /> Share Album
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleFavorite} className="text-white/80 hover:text-white hover:bg-white/10 gap-2">
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} /> {isFavorited ? 'Unfavorite' : 'Favorite'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleQueueAll} className="text-white/80 hover:text-white hover:bg-white/10 gap-2">
              <ListPlus className="w-4 h-4" /> Add to Queue
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            {isOwner && (
              <DropdownMenuItem onClick={() => setEditingAlbum(true)} className="text-white/80 hover:text-white hover:bg-white/10 gap-2">
                <Pin className="w-4 h-4" /> Edit Album
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ─── Main Layout ─── */}
      <div className="relative z-10 flex-1 overflow-auto">
        <div className="flex flex-col lg:flex-row min-h-full">

          {/* LEFT COLUMN: Tracklist */}
          <div className="lg:w-[30%] flex flex-col p-4 md:p-6 lg:p-8 order-2 lg:order-1">
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
                fontSize: "clamp(24px, 3vw, 42px)",
                lineHeight: 1.1,
                color: "var(--text-1)",
              }}>
                {album.title}
              </h2>

              {/* Release metadata */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1 mt-2" style={{ fontSize: 11, color: "var(--text-4)" }}>
                {releaseDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {releaseDate}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Music className="w-3 h-3" /> {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
                </span>
                {totalDuration > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {totalDuration} min
                  </span>
                )}
              </div>

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

            {/* Tracklist */}
            <div className="space-y-0.5">
              {tracks.map((track, index) => {
                const isActive = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 group"
                  >
                    <button
                      onClick={() => handlePlayTrack(track)}
                      className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
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

                    {/* Track action menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all">
                          <MoreHorizontal className="w-4 h-4" style={{ color: "var(--text-3)" }} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="backdrop-blur-xl bg-black/80 border-white/10 min-w-[180px]">
                        <DropdownMenuItem onClick={() => {
                          addToQueue({
                            ...track,
                            duration: track.duration || 0,
                            file_path: track.file_path || '',
                            play_count: track.play_count || 0,
                            album_title: album?.title,
                          });
                          toast.success(`Added "${track.title}" to queue`);
                        }} className="text-white/80 hover:text-white hover:bg-white/10 gap-2">
                          <ListPlus className="w-4 h-4" /> Add to Queue
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const url = `${window.location.origin}/album/${albumId}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Link copied");
                        }} className="text-white/80 hover:text-white hover:bg-white/10 gap-2">
                          <Share2 className="w-4 h-4" /> Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleFavorite} className="text-white/80 hover:text-white hover:bg-white/10 gap-2">
                          <Heart className="w-4 h-4" /> Favorite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>

            {/* Copyright / Label info */}
            <div className="mt-6 pt-4 space-y-1" style={{ borderTop: "1px solid var(--glass-border)" }}>
              {(album.copyright_owner || album.copyright_year || releaseYear) && (
                <p className="font-body" style={{ fontSize: 10, color: "var(--text-4)", letterSpacing: "0.02em" }}>
                  © {album.copyright_year || releaseYear} {album.copyright_owner || album.artist_name}
                </p>
              )}
              {album.p_line && (
                <p className="font-body" style={{ fontSize: 10, color: "var(--text-4)", letterSpacing: "0.02em" }}>
                  ℗ {album.p_line}
                </p>
              )}
              {album.label && (
                <p className="font-body flex items-center gap-1" style={{ fontSize: 10, color: "var(--text-4)" }}>
                  <Building2 className="w-3 h-3" /> {album.label}
                </p>
              )}
              {album.upc && (
                <p className="font-body" style={{ fontSize: 10, color: "var(--text-4)" }}>
                  UPC: {album.upc}
                </p>
              )}
            </div>
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
          <div className="lg:w-[30%] flex flex-col p-4 md:p-6 lg:p-8 order-3">
            <div className="mb-4 lg:mb-6 text-center lg:text-left">
              <p className="font-body" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>
                {activeSongTitle ? 'LYRICS' : ''}
              </p>
              <h2 className="font-display" style={{
                fontSize: "clamp(24px, 3vw, 42px)",
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
