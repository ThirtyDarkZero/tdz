import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/contexts/PlayerContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Heart, Shuffle, Music, Youtube, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface LikedTrack {
  id: string;
  title: string;
  artist_name: string;
  thumbnail?: string;
  youtubeId?: string;
  source: 'tdz' | 'youtube';
  duration?: number;
  file_path?: string;
}

export function LikedSongsPlaylist() {
  const { user } = useAuth();
  const { playTrack, currentTrack, isPlaying, addToQueue } = usePlayer();
  const [tracks, setTracks] = useState<LikedTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLikedTracks();
    }
  }, [user]);

  const loadLikedTracks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load TDZ liked tracks from user_library
      const { data: tdzLikes } = await supabase
        .from('user_library')
        .select(`
          track_id,
          tracks (
            id, title, artist_name, duration, file_path, 
            album_cover_path, album_cover_bucket
          )
        `)
        .eq('user_id', user.id)
        .eq('library_type', 'liked_track');

      // Load YouTube liked tracks
      const { data: ytLikes } = await supabase
        .from('liked_youtube_tracks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const allTracks: LikedTrack[] = [];

      // Add TDZ tracks
      tdzLikes?.forEach((like: any) => {
        if (like.tracks) {
          allTracks.push({
            id: like.tracks.id,
            title: like.tracks.title,
            artist_name: like.tracks.artist_name,
            thumbnail: like.tracks.album_cover_path 
              ? supabase.storage.from(like.tracks.album_cover_bucket || 'album-covers').getPublicUrl(like.tracks.album_cover_path).data.publicUrl
              : undefined,
            source: 'tdz',
            duration: like.tracks.duration,
            file_path: like.tracks.file_path,
          });
        }
      });

      // Add YouTube tracks
      ytLikes?.forEach((like: any) => {
        allTracks.push({
          id: like.track_id,
          title: like.title,
          artist_name: like.artist_name,
          thumbnail: like.thumbnail,
          youtubeId: like.youtube_id,
          source: 'youtube',
        });
      });

      setTracks(allTracks);
    } catch (error) {
      console.error('Error loading liked tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: LikedTrack, index: number) => {
    if (track.source === 'youtube' && track.youtubeId) {
      playTrack({
        id: track.id,
        title: track.title,
        artist_name: track.artist_name,
        duration: 0,
        file_path: '',
        play_count: 0,
        source: 'youtube',
        youtubeId: track.youtubeId,
        thumbnail: track.thumbnail,
      });
    } else {
      playTrack({
        id: track.id,
        title: track.title,
        artist_name: track.artist_name,
        duration: track.duration || 0,
        file_path: track.file_path || '',
        play_count: 0,
        source: 'tdz',
      });
    }

    // Add remaining tracks to queue
    tracks.slice(index + 1).forEach(t => {
      addToQueue({
        id: t.id,
        title: t.title,
        artist_name: t.artist_name,
        duration: t.duration || 0,
        file_path: t.file_path || '',
        play_count: 0,
        source: t.source,
        youtubeId: t.youtubeId,
        thumbnail: t.thumbnail,
      });
    });
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      handlePlay(tracks[0], 0);
      toast.success('Playing liked songs');
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      handlePlay(shuffled[0], 0);
      toast.success('Shuffling liked songs');
    }
  };

  const handleUnlike = async (track: LikedTrack) => {
    if (!user) return;

    try {
      if (track.source === 'youtube') {
        await supabase
          .from('liked_youtube_tracks')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', track.id);
      } else {
        await supabase
          .from('user_library')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', track.id)
          .eq('library_type', 'liked_track');
      }
      
      setTracks(prev => prev.filter(t => t.id !== track.id));
      toast.success('Removed from liked songs');
    } catch (error) {
      console.error('Error unliking:', error);
      toast.error('Failed to remove from liked songs');
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-6">
        <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-600/30 flex items-center justify-center shadow-2xl">
          <Heart className="w-20 h-20 text-pink-400" fill="currentColor" />
        </div>
        <div className="space-y-4">
          <p className="text-sm text-white/60 uppercase tracking-wider">Playlist</p>
          <h1 className="text-4xl md:text-5xl font-black text-white">Liked Songs</h1>
          <p className="text-white/60">{tracks.length} songs</p>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="bg-white text-black hover:bg-white/90 font-semibold px-8"
            >
              <Play className="w-5 h-5 mr-2" fill="currentColor" />
              PLAY
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleShuffle}
              disabled={tracks.length === 0}
              className="border-white/20 hover:border-white/40"
            >
              <Shuffle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Track List */}
      {tracks.length === 0 ? (
        <div className="text-center py-16 text-white/50">
          <Heart className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No liked songs yet</p>
          <p className="text-sm">Songs you like will appear here</p>
        </div>
      ) : (
        <ScrollArea className="h-[60vh]">
          <div className="space-y-1">
            {tracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              
              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer ${
                    isCurrentTrack ? 'bg-cyan-500/10' : ''
                  }`}
                  onClick={() => handlePlay(track, index)}
                >
                  {/* Track Number / Play */}
                  <span className="w-6 text-center text-sm text-white/40 group-hover:hidden">
                    {index + 1}
                  </span>
                  <div className="w-6 hidden group-hover:flex items-center justify-center">
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Play className="w-4 h-4 text-white" fill="white" />
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded bg-white/5 overflow-hidden flex-shrink-0">
                    {track.thumbnail ? (
                      <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isCurrentTrack ? 'text-cyan-400' : 'text-white'}`}>
                      {track.title}
                    </p>
                    <p className="text-sm text-white/50 truncate">{track.artist_name}</p>
                  </div>

                  {/* Source Badge */}
                  <Badge 
                    className={`text-xs ${
                      track.source === 'youtube' 
                        ? 'bg-red-600/20 text-red-400' 
                        : 'bg-cyan-600/20 text-cyan-400'
                    }`}
                  >
                    {track.source === 'youtube' && <Youtube className="w-3 h-3 mr-1" />}
                    {track.source === 'youtube' ? 'YouTube' : 'TDZ'}
                  </Badge>

                  {/* Duration */}
                  {track.duration && (
                    <span className="text-sm text-white/40 hidden sm:block">
                      {formatDuration(track.duration)}
                    </span>
                  )}

                  {/* Unlike button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnlike(track);
                    }}
                    className="h-8 w-8 text-pink-400 hover:text-pink-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}