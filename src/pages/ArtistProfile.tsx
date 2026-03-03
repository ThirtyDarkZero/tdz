import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Play, Bell, BellOff, ArrowLeft, MoreHorizontal, 
  Music, ChevronLeft, ChevronRight, MessageCircle, Share2, UserPlus, UserCheck,
  Globe, Instagram, Twitter, Youtube, Facebook, ExternalLink
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
  const [presavedTracks, setPresavedTracks] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [showMessages, setShowMessages] = useState(false);
  const albumScrollRef = useRef<HTMLDivElement>(null);
  
  const { playTrack, currentTrack } = usePlayer();

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

  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      checkIfFollowing(user.id);
      loadPresaves(user.id);
    }
  };

  const loadArtist = async () => {
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
  };

  const loadTracks = async () => {
    const { data, error } = await supabase
      .from("tracks")
      .select("*, albums(*)")
      .eq("user_id", artistId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const publishedTracks = data.filter(track => 
        !track.albums || track.albums.is_published !== false
      );
      setTracks(publishedTracks);
    }
  };

  const loadAlbums = async () => {
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .eq("user_id", artistId)
      .eq("is_published", true)
      .order("release_date", { ascending: false });

    if (!error && data) {
      setAlbums(data);
    }
  };

  const loadGallery = async () => {
    const { data, error } = await supabase
      .from("artist_gallery")
      .select("*")
      .eq("artist_id", artistId)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setGallery(data);
    }
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

  const loadPresaves = async (userId: string) => {
    const { data } = await supabase
      .from("track_presaves")
      .select("track_id")
      .eq("user_id", userId);
    if (data) {
      setPresavedTracks(new Set(data.map(p => p.track_id)));
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      toast.error("Please sign in to follow artists");
      return;
    }
    if (isFollowing) {
      await supabase.from("artist_follows").delete()
        .eq("follower_id", user.id).eq("artist_id", artistId);
      toast.success("Unfollowed artist");
    } else {
      await supabase.from("artist_follows").insert({ follower_id: user.id, artist_id: artistId });
      toast.success("Following artist");
    }
    setIsFollowing(!isFollowing);
  };

  const togglePresave = async (trackId: string) => {
    if (!user) {
      toast.error("Please sign in to presave tracks");
      return;
    }
    const isPresaved = presavedTracks.has(trackId);
    if (isPresaved) {
      await supabase.from("track_presaves").delete()
        .eq("user_id", user.id).eq("track_id", trackId);
      setPresavedTracks(prev => { const next = new Set(prev); next.delete(trackId); return next; });
      toast.success("Presave removed");
    } else {
      await supabase.from("track_presaves").insert({ user_id: user.id, track_id: trackId, artist_id: artistId });
      setPresavedTracks(prev => new Set(prev).add(trackId));
      toast.success("Track presaved!");
    }
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    const normalizedTracks = tracks.map(t => ({
      ...t, duration: t.duration || 0, file_path: t.file_path || '', play_count: t.play_count || 0,
    }));
    playTrack(normalizedTracks[0], normalizedTracks);
  };

  const handlePlayTrack = (track: any) => {
    const normalizedTrack = { ...track, duration: track.duration || 0, file_path: track.file_path || '', play_count: track.play_count || 0 };
    const normalizedQueue = tracks.map(t => ({ ...t, duration: t.duration || 0, file_path: t.file_path || '', play_count: t.play_count || 0 }));
    playTrack(normalizedTrack, normalizedQueue);
  };

  const getImageUrl = (path: string): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return supabase.storage.from('artist-images').getPublicUrl(path).data.publicUrl;
  };

  const getAlbumCover = (album: any): string => {
    if (!album.cover_art_path) return '';
    return supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path).data.publicUrl;
  };

  const scrollAlbums = (direction: 'left' | 'right') => {
    if (albumScrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      albumScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Extract genres from tracks
  const genres = [...new Set(tracks.map(t => t.genre).filter(Boolean))].slice(0, 3);
  const lastRelease = tracks[0]?.created_at ? new Date(tracks[0].created_at) : null;
  const isRecent = lastRelease && (Date.now() - lastRelease.getTime()) < 30 * 24 * 60 * 60 * 1000;

  if (!artist) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-4 px-4 sm:px-6 py-3">
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
            onClick={handlePlayAll}
            disabled={tracks.length === 0}
            className="h-10 w-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black"
          >
            <Play className="w-5 h-5" fill="currentColor" />
          </Button>
          <span className="font-bold text-lg truncate">{artist.artist_name}</span>
        </div>
      </header>

      {/* Profile Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          {/* Circular Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center ring-4 ring-white/10">
              {artist.profile_image_path ? (
                <img
                  src={getImageUrl(artist.profile_image_path)}
                  alt={artist.artist_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl sm:text-7xl font-bold text-white/80">
                  {artist.artist_name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            {/* Type + Genre Tags */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
              <span className="text-white/60 text-sm">Artist</span>
              {genres.map((genre: string) => (
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3 tracking-tight">
              {artist.artist_name}
            </h1>

            {/* Stats */}
            <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-white/60 mb-6">
              <span>Last release:</span>
              <span className={isRecent ? "text-cyan-400" : "text-white/80"}>
                {isRecent ? "Recently" : lastRelease ? new Date(lastRelease).getFullYear() : "—"}
              </span>
              <span className="mx-2">•</span>
              <span>Albums: <strong className="text-white">{albums.length}</strong></span>
              <span className="mx-2">•</span>
              <span>Tracks: <strong className="text-white">{tracks.length}</strong></span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <Button 
                onClick={handlePlayAll}
                disabled={tracks.length === 0}
                className="bg-white text-black hover:bg-white/90 font-semibold px-6 h-11 rounded-full gap-2"
              >
                <Play className="w-5 h-5" fill="currentColor" />
                PLAY
              </Button>
              <Button
                variant="outline"
                onClick={toggleFollow}
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-6 h-11 rounded-full gap-2"
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-5 h-5" />
                    Following
                  </>
                ) : (
                  <>
                    <Bell className="w-5 h-5" />
                    Subscribe
                  </>
                )}
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
                  <DropdownMenuItem onClick={() => setShowMessages(true)} className="text-white hover:bg-white/10">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Social Links & Website */}
            {(artist.social_links || artist.website) && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                {artist.website && (
                  <a
                    href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm text-white/80 hover:text-white"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                {artist.social_links?.instagram && (
                  <a
                    href={`https://instagram.com/${artist.social_links.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 transition-all text-sm text-white/80 hover:text-white"
                  >
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </a>
                )}
                {artist.social_links?.twitter && (
                  <a
                    href={`https://twitter.com/${artist.social_links.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-sky-500/80 transition-colors text-sm text-white/80 hover:text-white"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </a>
                )}
                {artist.social_links?.youtube && (
                  <a
                    href={artist.social_links.youtube.startsWith('http') ? artist.social_links.youtube : `https://youtube.com/${artist.social_links.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-red-600/80 transition-colors text-sm text-white/80 hover:text-white"
                  >
                    <Youtube className="w-4 h-4" />
                    YouTube
                  </a>
                )}
                {artist.social_links?.facebook && (
                  <a
                    href={artist.social_links.facebook.startsWith('http') ? artist.social_links.facebook : `https://facebook.com/${artist.social_links.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-blue-600/80 transition-colors text-sm text-white/80 hover:text-white"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </a>
                )}
                {artist.social_links?.spotify && (
                  <a
                    href={artist.social_links.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-green-600/80 transition-colors text-sm text-white/80 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Spotify
                  </a>
                )}
                {artist.social_links?.appleMusic && (
                  <a
                    href={artist.social_links.appleMusic}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-pink-500/80 transition-colors text-sm text-white/80 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Apple Music
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tracks Section */}
      {tracks.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">TRACKS</h2>
          <div className="space-y-2">
            {tracks.slice(0, 10).map((track, idx) => (
              <div 
                key={track.id}
                onClick={() => handlePlayTrack(track)}
                className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                  currentTrack?.id === track.id ? 'bg-cyan-500/10' : 'hover:bg-white/5'
                }`}
              >
                <span className="w-6 text-center text-white/40 text-sm">{idx + 1}</span>
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
                  <p className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-cyan-400' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-sm text-white/50 truncate">{track.artist_name}</p>
                </div>
                {track.release_date && new Date(track.release_date) > new Date() && (
                  <Button
                    size="sm"
                    variant={presavedTracks.has(track.id) ? "default" : "outline"}
                    onClick={(e) => { e.stopPropagation(); togglePresave(track.id); }}
                    className="rounded-full"
                  >
                    {presavedTracks.has(track.id) ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Albums Section - Filter by release_type */}
      {albums.filter(a => (a as any).release_type === 'album' || (!(a as any).release_type && !a.title?.toLowerCase().includes('single') && !a.title?.toLowerCase().includes('ep'))).length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {albums.filter(a => (a as any).release_type === 'album' || (!(a as any).release_type && !a.title?.toLowerCase().includes('single') && !a.title?.toLowerCase().includes('ep'))).map((album) => (
              <div 
                key={album.id}
                onClick={() => navigate(`/album/${album.id}`)}
                className="cursor-pointer group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-white/5 mb-3 relative shadow-lg">
                  {album.cover_art_path ? (
                    <img
                      src={getAlbumCover(album)}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  {/* Play overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <p className="font-semibold text-white truncate">{album.title}</p>
                <p className="text-sm text-white/50 flex items-center gap-1">
                  <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">Album</span>
                  {album.release_date ? new Date(album.release_date).getFullYear() : '—'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EPs Section */}
      {albums.filter(a => (a as any).release_type === 'ep').length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">EPs</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {albums.filter(a => (a as any).release_type === 'ep').map((album) => (
              <div 
                key={album.id}
                onClick={() => navigate(`/album/${album.id}`)}
                className="cursor-pointer group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-white/5 mb-3 relative shadow-lg">
                  {album.cover_art_path ? (
                    <img
                      src={getAlbumCover(album)}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <p className="font-semibold text-white truncate">{album.title}</p>
                <p className="text-sm text-white/50 flex items-center gap-1">
                  <span className="text-xs bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded">EP</span>
                  {album.release_date ? new Date(album.release_date).getFullYear() : '—'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Singles Section - Show albums marked as singles or tracks without album_id */}
      {albums.filter(a => (a as any).release_type === 'single').length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Singles</h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollAlbums('left')}
                className="h-8 w-8 rounded-full border border-white/20 hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollAlbums('right')}
                className="h-8 w-8 rounded-full border border-white/20 hover:bg-white/10"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <div 
            ref={albumScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {albums.filter(a => (a as any).release_type === 'single').map((album) => (
              <div 
                key={album.id}
                onClick={() => navigate(`/album/${album.id}`)}
                className="flex-shrink-0 w-40 sm:w-48 cursor-pointer group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-white/5 mb-3 relative shadow-lg">
                  {album.cover_art_path ? (
                    <img
                      src={getAlbumCover(album)}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <p className="font-semibold text-white truncate">{album.title}</p>
                <p className="text-sm text-white/50 flex items-center gap-1">
                  <span className="text-xs bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded">Single</span>
                  {album.release_date ? new Date(album.release_date).getFullYear() : '—'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Photo Gallery Section */}
      {gallery.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">Gallery</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {gallery.map((item) => (
              <div 
                key={item.id}
                className="aspect-square rounded-lg overflow-hidden bg-white/5 cursor-pointer group"
              >
                <img
                  src={supabase.storage.from('artist-gallery').getPublicUrl(item.image_path).data.publicUrl}
                  alt={item.caption || 'Gallery image'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About Section */}
      {artist.bio && (
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight">ABOUT</h2>
          <p className="text-white/70 leading-relaxed max-w-3xl">{artist.bio}</p>
        </section>
      )}

      {/* Direct Message Panel */}
      <DirectMessagePanel
        open={showMessages}
        onClose={() => setShowMessages(false)}
        recipientId={artist.user_id}
        recipientName={artist.artist_name}
        recipientAvatar={artist.profile_image_path ? getImageUrl(artist.profile_image_path) : undefined}
      />
    </div>
  );
}
