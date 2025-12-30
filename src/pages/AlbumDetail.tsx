import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Play, ArrowLeft, Music, Clock, Calendar, Check, Bell,
  Shuffle, Heart, MoreHorizontal, Edit2, Loader2
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { EditAlbumDialog } from "@/components/EditAlbumDialog";
import { AlbumAnalytics } from "@/components/AlbumAnalytics";
import tdzLogo from "@/assets/tdz-logo.png";
import { Helmet } from "react-helmet";

export default function AlbumDetail() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { playTrack, currentTrack } = usePlayer();
  
  const [album, setAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingAlbum, setEditingAlbum] = useState(false);
  const [isPresaved, setIsPresaved] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (albumId) {
      loadAlbum();
      loadTracks();
    }
  }, [albumId, user]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

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
    checkPresaveStatus();
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

  const checkPresaveStatus = async () => {
    if (!user || !albumId || tracks.length === 0) return;

    const { data } = await supabase
      .from("track_presaves")
      .select("id")
      .eq("user_id", user.id)
      .in("track_id", tracks.map(t => t.id))
      .limit(1)
      .maybeSingle();

    setIsPresaved(!!data);
  };

  const isPreRelease = () => {
    if (!album) return false;
    const now = new Date();
    const releaseDate = album.release_date ? new Date(album.release_date) : null;
    const scheduledDate = album.scheduled_release_date ? new Date(album.scheduled_release_date) : null;
    const targetDate = scheduledDate || releaseDate;
    return targetDate && targetDate > now;
  };

  const handlePresaveAlbum = async () => {
    if (!user) {
      toast.error("Please sign in to pre-save this album");
      return;
    }

    try {
      if (isPresaved) {
        await supabase
          .from("track_presaves")
          .delete()
          .eq("user_id", user.id)
          .in("track_id", tracks.map(t => t.id));

        setIsPresaved(false);
        toast.success("Album pre-save removed");
      } else {
        const presaves = tracks.map(track => ({
          user_id: user.id,
          track_id: track.id,
          artist_id: album.user_id
        }));

        await supabase.from("track_presaves").insert(presaves);
        setIsPresaved(true);
        toast.success("Album pre-saved! You'll be notified on release");
      }
    } catch (error) {
      toast.error("Failed to update pre-save status");
    }
  };

  const handlePlayTrack = (track: any, index: number) => {
    const normalizedTrack = {
      ...track,
      duration: track.duration || 0,
      file_path: track.file_path || '',
      play_count: track.play_count || 0,
      album_cover_path: album?.cover_art_path,
      album_cover_bucket: 'album-covers',
      album_title: album?.title,
    };
    
    const normalizedQueue = tracks.map(t => ({
      ...t,
      duration: t.duration || 0,
      file_path: t.file_path || '',
      play_count: t.play_count || 0,
      album_cover_path: album?.cover_art_path,
      album_cover_bucket: 'album-covers',
      album_title: album?.title,
    }));
    
    playTrack(normalizedTrack, normalizedQueue);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      handlePlayTrack(tracks[0], 0);
      toast.success(`Playing ${album.title}`);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      handlePlayTrack(shuffled[0], 0);
      toast.success(`Shuffling ${album.title}`);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    const total = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    return formatDuration(total);
  };

  const getCoverUrl = (path?: string) => {
    if (!path) return '/placeholder.svg';
    return supabase.storage.from('album-covers').getPublicUrl(path).data.publicUrl;
  };

  const handleEditSuccess = () => {
    loadAlbum();
    loadTracks();
    setEditingAlbum(false);
  };

  const isOwner = user && album && user.id === album.user_id;

  if (loading || !album) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
          <p className="text-white/60">Loading album...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-hidden flex flex-col">
      <Helmet>
        <title>{album ? `${album.title} - ${album.artist_name}` : 'Album'}</title>
        <meta name="description" content={album?.description || `Listen to ${album?.title} by ${album?.artist_name}`} />
        <meta property="og:type" content="music.album" />
        <meta property="og:title" content={`${album?.title} - ${album?.artist_name}`} />
        <meta property="og:image" content={getCoverUrl(album?.cover_art_path)} />
      </Helmet>

      {/* Header - RKHM Style */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 px-4 md:px-6 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full bg-white/5 hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayAll}
            disabled={tracks.length === 0}
            className="rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
          >
            <Play className="w-5 h-5" fill="currentColor" />
          </Button>
          
          <h1 className="text-lg font-semibold text-white truncate">{album.title}</h1>
          
          {isOwner && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setEditingAlbum(true)}
              className="ml-auto gap-2 text-white/60 hover:text-white"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="pb-32">
          {/* Album Hero - RKHM Style (matches GlobalAlbumDetail) */}
          <div className="relative px-4 md:px-8 pt-8 pb-6">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Album Cover */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="w-52 h-52 md:w-64 md:h-64 rounded-lg overflow-hidden shadow-2xl bg-white/5">
                  <img
                    src={getCoverUrl(album.cover_art_path)}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Album Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                {/* Type + Genres */}
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-white/5 border-white/10 text-white/80 uppercase"
                  >
                    Album
                  </Badge>
                  {album.genre && (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-white/5 border-white/10 text-cyan-400"
                    >
                      {album.genre}
                    </Badge>
                  )}
                  {album.is_published ? (
                    <Badge className="text-xs bg-green-600/20 text-green-400">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Unpublished
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  {album.title}
                </h1>

                {/* Artist */}
                <button
                  onClick={() => navigate(`/artist/${album.user_id}`)}
                  className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    <Music className="w-3.5 h-3.5 text-white/60" />
                  </div>
                  <span className="text-white/80 font-medium hover:text-cyan-400 transition-colors">
                    {album.artist_name}
                  </span>
                </button>

                {/* Stats */}
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-white/60 flex-wrap">
                  {album.release_date && (
                    <>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Release: <strong className="text-white">{new Date(album.release_date).getFullYear()}</strong>
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Music className="w-4 h-4" />
                    Tracks: <strong className="text-white">{tracks.length}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Duration: <strong className="text-white">{getTotalDuration()}</strong>
                  </span>
                </div>

                {/* Description */}
                {album.description && (
                  <p className="text-sm text-white/60 max-w-lg">
                    {album.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                  {isPreRelease() && !isOwner ? (
                    <>
                      <Button 
                        size="lg"
                        onClick={handlePresaveAlbum}
                        className={`font-semibold px-8 ${isPresaved ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-white text-black hover:bg-white/90'}`}
                      >
                        {isPresaved ? (
                          <>
                            <Check className="w-5 h-5 mr-2" />
                            Pre-saved
                          </>
                        ) : (
                          <>
                            <Bell className="w-5 h-5 mr-2" />
                            Pre-save
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={handlePlayAll}
                        disabled={tracks.length === 0}
                        className="border-white/20 hover:border-white/40"
                      >
                        <Play className="w-5 h-5 mr-2" fill="currentColor" />
                        Preview
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="lg"
                      onClick={handlePlayAll}
                      disabled={tracks.length === 0}
                      className="bg-white text-black hover:bg-white/90 font-semibold px-8"
                    >
                      <Play className="w-5 h-5 mr-2" fill="currentColor" />
                      PLAY
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleShuffle}
                    disabled={tracks.length === 0}
                    className="border-white/20 hover:border-white/40"
                  >
                    <Shuffle className="w-5 h-5" />
                  </Button>

                  <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                    <Heart className="w-5 h-5" />
                  </Button>

                  <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tracklist - RKHM Style */}
          <div className="px-4 md:px-8">
            {tracks.length === 0 ? (
              <div className="text-center py-16 text-white/50">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tracks in this album</p>
              </div>
            ) : (
              <div className="space-y-1">
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className={`flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer ${
                      currentTrack?.id === track.id ? 'bg-cyan-500/10' : ''
                    }`}
                    onClick={() => handlePlayTrack(track, index)}
                  >
                    {/* Track Number */}
                    <span className="w-6 text-center text-sm text-white/40 group-hover:hidden">
                      {track.track_number || index + 1}
                    </span>
                    <div className="w-6 hidden group-hover:flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" fill="white" />
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-cyan-400' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-sm text-white/50 truncate">{track.artist_name}</p>
                    </div>

                    {/* Duration */}
                    <span className="text-sm text-white/40">
                      {formatDuration(track.duration || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analytics Section - Only visible to album owner */}
          {isOwner && album.is_published && (
            <div className="px-4 md:px-8 mt-12">
              <AlbumAnalytics albumId={albumId!} />
            </div>
          )}
        </div>
      </ScrollArea>

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