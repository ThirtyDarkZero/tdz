import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Play, ChevronLeft, Shuffle, Heart, MoreHorizontal, 
  Loader2, ListMusic, Clock, Plus 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePlayer } from '@/contexts/PlayerContext';
import { toast } from 'sonner';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';

interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  image?: string;
  tracks: number;
  source: string;
}

interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  thumbnail?: string;
  youtubeId?: string;
  duration?: string;
  position: number;
}

interface SpotifyPlaylistDetailProps {
  playlist: SpotifyPlaylist;
  onClose: () => void;
}

export function SpotifyPlaylistDetail({ playlist, onClose }: SpotifyPlaylistDetailProps) {
  const { playTrack, addToQueue } = usePlayer();
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<any>(null);

  useEffect(() => {
    loadPlaylistTracks();
  }, [playlist]);

  const loadPlaylistTracks = async () => {
    setLoading(true);
    try {
      // Search YouTube for tracks from this playlist
      const searchQueries = [
        `${playlist.name} playlist songs`,
        `${playlist.name} top tracks`,
        `${playlist.name} best songs 2024`,
      ];

      const allTracks: PlaylistTrack[] = [];

      for (const query of searchQueries) {
        if (allTracks.length >= 25) break;

        const { data } = await supabase.functions.invoke('youtube-search', {
          body: {
            query,
            maxResults: 30,
            officialOnly: true,
          },
        });

        const results = data?.results || [];
        
        for (const video of results) {
          // Skip if already added
          if (allTracks.some(t => t.youtubeId === video.id)) continue;
          
          // Filter for quality content
          const titleLower = video.title.toLowerCase();
          if (
            titleLower.includes('cover') ||
            titleLower.includes('karaoke') ||
            titleLower.includes('reaction') ||
            titleLower.includes('tutorial')
          ) continue;

          // Parse artist and title from YouTube title
          const parts = video.title.split(/[-–—]/);
          const artist = parts[0]?.trim() || video.channel;
          const title = parts.slice(1).join(' - ').trim() || video.title;

          allTracks.push({
            id: `yt-${video.id}`,
            title: title
              .replace(/\(official.*?\)/gi, '')
              .replace(/\[official.*?\]/gi, '')
              .replace(/official\s*(audio|video)/gi, '')
              .trim() || video.title,
            artist: artist.replace(/- topic$/i, '').replace(/vevo$/i, '').trim(),
            thumbnail: video.thumbnail,
            youtubeId: video.id,
            duration: video.duration,
            position: allTracks.length + 1,
          });

          if (allTracks.length >= 25) break;
        }
      }

      setTracks(allTracks);
    } catch (error) {
      console.error('Failed to load playlist tracks:', error);
      toast.error('Failed to load playlist tracks');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track: PlaylistTrack, index: number) => {
    if (!track.youtubeId) return;

    const playerTrack = {
      id: track.id,
      title: track.title,
      artist_name: track.artist,
      duration: 0,
      file_path: '',
      play_count: 0,
      source: 'youtube' as const,
      youtubeId: track.youtubeId,
      thumbnail: track.thumbnail,
    };

    playTrack(playerTrack);

    // Add remaining tracks to queue
    tracks.slice(index + 1).forEach(t => {
      if (t.youtubeId) {
        addToQueue({
          id: t.id,
          title: t.title,
          artist_name: t.artist,
          duration: 0,
          file_path: '',
          play_count: 0,
          source: 'youtube' as const,
          youtubeId: t.youtubeId,
          thumbnail: t.thumbnail,
        });
      }
    });
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      handlePlayTrack(tracks[0], 0);
      toast.success(`Now playing: ${playlist.name}`);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      handlePlayTrack(shuffled[0], 0);
      toast.success(`Shuffling: ${playlist.name}`);
    }
  };

  const handleAddTrackToPlaylist = (track: PlaylistTrack) => {
    setAddToPlaylistTrack({
      id: track.id,
      title: track.title,
      artist_name: track.artist,
      youtubeId: track.youtubeId,
      thumbnail: track.thumbnail,
    });
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
            disabled={loading || tracks.length === 0}
            className="rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30"
          >
            <Play className="w-5 h-5" fill="currentColor" />
          </Button>
          
          <h1 className="text-lg font-semibold text-white truncate">{playlist.name}</h1>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="pb-32">
          {/* Playlist Hero */}
          <div className="relative px-4 md:px-8 pt-8 pb-6">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Cover */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="w-52 h-52 md:w-64 md:h-64 rounded-lg overflow-hidden shadow-2xl bg-white/5">
                  {playlist.image ? (
                    <img
                      src={playlist.image}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500/30 to-green-600/30">
                      <ListMusic className="w-20 h-20 text-white/30" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-400">
                  PLAYLIST
                </Badge>

                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  {playlist.name}
                </h1>

                {playlist.description && (
                  <p className="text-white/60 text-sm max-w-xl">
                    {playlist.description}
                  </p>
                )}

                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1.5">
                    <ListMusic className="w-4 h-4" />
                    Tracks: <strong className="text-white">{loading ? '...' : tracks.length}</strong>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                  <Button
                    size="lg"
                    onClick={handlePlayAll}
                    disabled={loading || tracks.length === 0}
                    className="bg-green-500 text-white hover:bg-green-600 font-semibold px-8"
                  >
                    <Play className="w-5 h-5 mr-2" fill="currentColor" />
                    PLAY ALL
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
                </div>
              </div>
            </div>
          </div>

          {/* Tracklist */}
          <div className="px-4 md:px-8">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
                ))}
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-16 text-white/50">
                <ListMusic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tracks found for this playlist</p>
              </div>
            ) : (
              <div className="space-y-1">
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => handlePlayTrack(track, index)}
                  >
                    {/* Position */}
                    <span className="w-6 text-center text-sm text-white/40 group-hover:hidden">
                      {track.position}
                    </span>
                    <div className="w-6 hidden group-hover:flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" fill="white" />
                    </div>

                    {/* Thumbnail */}
                    {track.thumbnail && (
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{track.title}</p>
                      <p className="text-white/50 text-sm truncate">{track.artist}</p>
                    </div>

                    {/* Duration */}
                    {track.duration && (
                      <span className="text-white/40 text-sm hidden sm:block">
                        {track.duration}
                      </span>
                    )}

                    {/* Add to playlist */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddTrackToPlaylist(track);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <AddToPlaylistDialog
        open={!!addToPlaylistTrack}
        onOpenChange={(open) => !open && setAddToPlaylistTrack(null)}
        track={addToPlaylistTrack}
      />
    </div>
  );
}
