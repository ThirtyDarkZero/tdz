import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Play, ChevronLeft, Disc, Clock, ListPlus, Heart, 
  MoreHorizontal, Youtube, Loader2, Calendar, Music,
  Shuffle
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";

interface GlobalAlbumDetailProps {
  album: {
    id: string;
    title: string;
    artist: string;
    year?: string;
    coverArt?: string;
    type?: string;
    genres?: string[];
    source: 'discogs' | 'musicbrainz';
    releaseId?: string;
  };
  onClose: () => void;
  onAddToPlaylist?: (track: any) => void;
  onOpenArtist?: (artistName: string) => void;
}

interface AlbumTrack {
  id: string;
  title: string;
  position: string | number;
  duration?: string;
  youtubeId?: string;
  thumbnail?: string;
  isOfficialAudio?: boolean;
  viewCount?: string;
  description?: string;
}

export function GlobalAlbumDetail({ 
  album, 
  onClose, 
  onAddToPlaylist,
  onOpenArtist 
}: GlobalAlbumDetailProps) {
  const { playTrack, addToQueue } = usePlayer();
  const [tracks, setTracks] = useState<AlbumTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const [coverArt, setCoverArt] = useState(album.coverArt);

  useEffect(() => {
    loadAlbumTracks();
  }, [album]);

  const loadAlbumTracks = async () => {
    setLoading(true);
    
    try {
      // Search for official YouTube Music content using the officialOnly flag
      const { data: officialData } = await supabase.functions.invoke('youtube-search', {
        body: { 
          query: `${album.artist} ${album.title}`,
          maxResults: 20,
          officialOnly: true
        }
      });

      let allTracks: AlbumTrack[] = [];
      let albumThumbnail: string | undefined;

      if (officialData?.results?.length > 0) {
        const artistNameLower = album.artist.toLowerCase();
        
        // Filter and prioritize official audio from topic channels
        const relevantTracks = officialData.results.filter((video: any) => {
          const channelLower = (video.channel || '').toLowerCase();
          const titleLower = video.title.toLowerCase();
          
          // Prioritize topic channels and official content
          const isFromArtist = channelLower.includes(artistNameLower) || 
                               video.isOfficialAudio ||
                               video.isOfficialMusicVideo ||
                               channelLower.includes('topic');
          
          // Exclude covers, remixes, karaoke
          const isOriginal = !titleLower.includes('cover') && 
                            !titleLower.includes('remix') &&
                            !titleLower.includes('karaoke') &&
                            !titleLower.includes('reaction');
          
          return isFromArtist && isOriginal;
        });

        allTracks = relevantTracks.map((video: any, idx: number) => ({
          id: `yt-${video.id}`,
          title: cleanTrackTitle(video.title, album.artist, album.title),
          position: idx + 1,
          duration: video.duration,
          youtubeId: video.id,
          thumbnail: video.thumbnail,
          isOfficialAudio: video.isOfficialAudio,
          viewCount: video.viewCount,
          description: video.description,
        }));
        
        // Get best thumbnail from official content
        const officialTrack = relevantTracks.find((t: any) => t.isOfficialAudio);
        albumThumbnail = officialTrack?.thumbnail || relevantTracks[0]?.thumbnail;
      }

      // Fallback: try artist topic channel search
      if (allTracks.length < 3) {
        const { data: topicData } = await supabase.functions.invoke('youtube-search', {
          body: { 
            query: `${album.artist} - Topic ${album.title}`,
            maxResults: 15,
            officialOnly: true
          }
        });
        
        if (topicData?.results?.length > allTracks.length) {
          allTracks = topicData.results.map((video: any, idx: number) => ({
            id: `yt-${video.id}`,
            title: cleanTrackTitle(video.title, album.artist, album.title),
            position: idx + 1,
            duration: video.duration,
            youtubeId: video.id,
            thumbnail: video.thumbnail,
            isOfficialAudio: video.isOfficialAudio,
            viewCount: video.viewCount,
            description: video.description,
          }));
          
          if (!albumThumbnail && topicData.results[0]?.thumbnail) {
            albumThumbnail = topicData.results[0].thumbnail;
          }
        }
      }

      // Last resort: broader search without officialOnly
      if (allTracks.length < 3) {
        const { data: broadData } = await supabase.functions.invoke('youtube-search', {
          body: { 
            query: `${album.artist} ${album.title} official`,
            maxResults: 15
          }
        });
        
        if (broadData?.results) {
          allTracks = broadData.results.map((video: any, idx: number) => ({
            id: `yt-${video.id}`,
            title: cleanTrackTitle(video.title, album.artist, album.title),
            position: idx + 1,
            duration: video.duration,
            youtubeId: video.id,
            thumbnail: video.thumbnail,
            isOfficialAudio: video.isOfficialAudio,
            viewCount: video.viewCount,
          }));
          
          if (!albumThumbnail && broadData.results[0]?.thumbnail) {
            albumThumbnail = broadData.results[0].thumbnail;
          }
        }
      }

      setTracks(allTracks);
      
      // Use best available cover art
      if (!coverArt && albumThumbnail) {
        setCoverArt(albumThumbnail);
      }
    } catch (error) {
      console.error('Error loading album tracks:', error);
      toast.error('Failed to load album tracks');
    } finally {
      setLoading(false);
    }
  };

  const cleanTrackTitle = (title: string, artist: string, albumName: string) => {
    // Remove common patterns from YouTube titles
    let cleaned = title
      .replace(new RegExp(artist, 'gi'), '')
      .replace(new RegExp(albumName, 'gi'), '')
      .replace(/\(official\s*(audio|video|music\s*video)?\)/gi, '')
      .replace(/\[official\s*(audio|video|music\s*video)?\]/gi, '')
      .replace(/official\s*(audio|video)/gi, '')
      .replace(/\(lyrics?\)/gi, '')
      .replace(/\[lyrics?\]/gi, '')
      .replace(/\(audio\)/gi, '')
      .replace(/[-|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned || title;
  };

  const handlePlayTrack = async (track: AlbumTrack, index: number) => {
    if (track.youtubeId) {
      const youtubeTrack = {
        id: track.id,
        title: track.title,
        artist_name: album.artist,
        duration: 0,
        file_path: '',
        play_count: 0,
        source: 'youtube' as const,
        youtubeId: track.youtubeId,
        thumbnail: track.thumbnail || coverArt,
        album_title: album.title,
      };
      playTrack(youtubeTrack);
      
      // Add remaining tracks to queue
      const remainingTracks = tracks.slice(index + 1);
      remainingTracks.forEach(t => {
        if (t.youtubeId) {
          addToQueue({
            id: t.id,
            title: t.title,
            artist_name: album.artist,
            duration: 0,
            file_path: '',
            play_count: 0,
            source: 'youtube' as const,
            youtubeId: t.youtubeId,
            thumbnail: t.thumbnail || coverArt,
            album_title: album.title,
          });
        }
      });
    }
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

  const handleAddToPlaylist = (track: AlbumTrack) => {
    if (onAddToPlaylist) {
      onAddToPlaylist({
        id: track.id,
        title: track.title,
        artist_name: album.artist,
        youtubeId: track.youtubeId,
        thumbnail: track.thumbnail || coverArt,
        album_title: album.title,
      });
    }
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return null;
    return duration;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 px-4 md:px-6 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full bg-white/5 hover:bg-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayAll}
            className="rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
          >
            <Play className="w-5 h-5" fill="currentColor" />
          </Button>
          
          <h1 className="text-lg font-semibold text-white truncate">{album.title}</h1>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="pb-32">
          {/* Album Hero - RKHM Style */}
          <div className="relative px-4 md:px-8 pt-8 pb-6">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Album Cover */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="w-52 h-52 md:w-64 md:h-64 rounded-lg overflow-hidden shadow-2xl bg-white/5">
                  {coverArt ? (
                    <img
                      src={coverArt}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc className="w-20 h-20 text-white/20" />
                    </div>
                  )}
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
                  {album.genres?.slice(0, 3).map((genre) => (
                    <Badge 
                      key={genre} 
                      variant="outline" 
                      className="text-xs bg-white/5 border-white/10 text-cyan-400"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  {album.title}
                </h1>

                {/* Artist - Clickable */}
                <button
                  onClick={() => onOpenArtist?.(album.artist)}
                  className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    <Music className="w-3.5 h-3.5 text-white/60" />
                  </div>
                  <span className="text-white/80 font-medium hover:text-cyan-400 transition-colors">
                    {album.artist}
                  </span>
                </button>

                {/* Stats */}
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-white/60">
                  {album.year && (
                    <>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Release date: <strong className="text-white">{album.year}</strong>
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Music className="w-4 h-4" />
                    Tracks: <strong className="text-white">{loading ? '...' : tracks.length}</strong>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                  <Button 
                    size="lg"
                    onClick={handlePlayAll}
                    disabled={loading || tracks.length === 0}
                    className="bg-white text-black hover:bg-white/90 font-semibold px-8"
                  >
                    <Play className="w-5 h-5 mr-2" fill="currentColor" />
                    PLAY
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleShuffle}
                    disabled={loading || tracks.length === 0}
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

          {/* Tracklist */}
          <div className="px-4 md:px-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-16 text-white/50">
                <Disc className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tracks found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => handlePlayTrack(track, index)}
                  >
                    {/* Track Number */}
                    <span className="w-6 text-center text-sm text-white/40 group-hover:hidden">
                      {track.position}
                    </span>
                    <div className="w-6 hidden group-hover:flex items-center justify-center">
                      {loadingTrack === track.id ? (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 text-white" fill="white" />
                      )}
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium truncate">{track.title}</p>
                        {track.isOfficialAudio && (
                          <Badge className="bg-green-600/20 text-green-400 text-[10px] px-1 py-0 hidden sm:flex">
                            Official
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <span className="truncate">{album.artist}</span>
                        {track.viewCount && (
                          <span className="text-white/30">• {track.viewCount}</span>
                        )}
                      </div>
                    </div>

                    {/* Duration */}
                    {track.duration && (
                      <span className="text-sm text-white/40 hidden sm:block">
                        {formatDuration(track.duration)}
                      </span>
                    )}

                    {/* YouTube Badge */}
                    <Badge className="bg-red-600/20 text-red-400 text-xs px-1.5 py-0.5 hidden sm:flex items-center gap-1">
                      <Youtube className="w-3 h-3" />
                      {track.isOfficialAudio ? 'Music' : ''}
                    </Badge>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlaylist(track);
                      }}
                    >
                      <ListPlus className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
