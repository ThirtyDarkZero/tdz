import { useState, useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Heart, Plus, Crown, 
  Flame, Music, Youtube 
} from "lucide-react";
import { MotionCover } from "@/components/MotionCover";
import { YouTubeVideo } from "@/hooks/useYouTubePlayer";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  duration?: number;
  play_count?: number;
  genre?: string;
  album_cover_path?: string;
  album_cover_bucket?: string;
  motion_cover_path?: string;
  motion_cover_bucket?: string;
  source: 'tdz' | 'youtube';
  youtubeData?: YouTubeVideo;
}

interface UnifiedMusicStreamProps {
  tdzTracks: any[];
  likedTracks: Set<string>;
  currentTrackId?: string;
  playlists: any[];
  selectedGenre?: string;
  onPlayTrack: (track: any) => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: any) => void;
  onPlayYouTube: (video: YouTubeVideo) => void;
}

export function UnifiedMusicStream({
  tdzTracks,
  likedTracks,
  currentTrackId,
  playlists,
  selectedGenre,
  onPlayTrack,
  onToggleLike,
  onAddToQueue,
  onPlayYouTube
}: UnifiedMusicStreamProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'tdz' | 'youtube'>('all');
  const [youtubeResults, setYoutubeResults] = useState<YouTubeVideo[]>([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState(false);
  
  // Use refs to track fetch state and prevent infinite loops
  const hasFetchedRef = useRef(false);
  const lastGenreRef = useRef<string | undefined>(undefined);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch YouTube trending on mount - only once
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    const fetchTrending = async () => {
      setYoutubeLoading(true);
      setYoutubeError(false);
      try {
        const { data, error } = await supabase.functions.invoke('youtube-search', {
          body: { type: 'trending', maxResults: 20 }
        });
        if (!isMountedRef.current) return;
        if (!error && data?.results) {
          setYoutubeResults(data.results);
        } else {
          console.warn('YouTube trending returned no results');
        }
      } catch (err) {
        console.error('YouTube trending error:', err);
        if (isMountedRef.current) {
          setYoutubeError(true);
        }
      } finally {
        if (isMountedRef.current) {
          setYoutubeLoading(false);
        }
      }
    };
    
    fetchTrending();
  }, []);

  // Search YouTube when genre changes
  useEffect(() => {
    if (!selectedGenre || selectedGenre === lastGenreRef.current) return;
    lastGenreRef.current = selectedGenre;
    
    const searchGenre = async () => {
      if (!isMountedRef.current) return;
      setYoutubeLoading(true);
      setYoutubeError(false);
      try {
        const { data, error } = await supabase.functions.invoke('youtube-search', {
          body: { query: `${selectedGenre} music`, type: 'search', maxResults: 20 }
        });
        if (!isMountedRef.current) return;
        if (!error && data?.results) {
          setYoutubeResults(data.results);
        }
      } catch (err) {
        console.error('YouTube search error:', err);
        if (isMountedRef.current) {
          setYoutubeError(true);
        }
      } finally {
        if (isMountedRef.current) {
          setYoutubeLoading(false);
        }
      }
    };
    
    searchGenre();
  }, [selectedGenre]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter TDZ tracks by genre if selected
  const filteredTdzTracks = useMemo(() => {
    if (!selectedGenre) return tdzTracks;
    return tdzTracks.filter(track => 
      track.genre?.toLowerCase().includes(selectedGenre.replace('-', ' ').replace('n', '&'))
    );
  }, [tdzTracks, selectedGenre]);

  // Merge TDZ (first priority) with YouTube results
  const unifiedTracks = useMemo(() => {
    const tdzMapped: Track[] = filteredTdzTracks.map(track => ({
      ...track,
      source: 'tdz' as const
    }));

    const youtubeMapped: Track[] = (youtubeResults || []).map((video: YouTubeVideo) => ({
      id: `yt-${video.id}`,
      title: video.title,
      artist_name: video.channel,
      duration: parseDurationToSeconds(video.duration),
      play_count: parseViewCount(video.viewCount),
      source: 'youtube' as const,
      youtubeData: video
    }));

    // TDZ first, then YouTube
    if (activeFilter === 'tdz') return tdzMapped;
    if (activeFilter === 'youtube') return youtubeMapped;
    return [...tdzMapped, ...youtubeMapped];
  }, [filteredTdzTracks, youtubeResults, activeFilter]);

  function parseDurationToSeconds(duration?: string): number {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  }

  function parseViewCount(viewCount?: string): number {
    if (!viewCount) return 0;
    const num = viewCount.replace(/[^0-9.]/g, '');
    const multiplier = viewCount.includes('B')
      ? 1e9
      : viewCount.includes('M')
        ? 1e6
        : viewCount.includes('K')
          ? 1e3
          : 1;
    return Math.round(parseFloat(num) * multiplier);
  }

  const handlePlayUnified = (track: Track) => {
    if (track.source === 'youtube' && track.youtubeData) {
      onPlayYouTube(track.youtubeData);
    } else {
      onPlayTrack(track);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
          {selectedGenre ? (
            <span className="capitalize">{selectedGenre.replace('-', ' ').replace('n', '&')} Music</span>
          ) : (
            "All Music"
          )}
        </h2>
        
        <div className="flex items-center gap-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className={cn(
              "rounded-full",
              activeFilter === 'all' && "bg-primary text-primary-foreground"
            )}
          >
            <Music className="w-4 h-4 mr-2" />
            All
          </Button>
          <Button
            variant={activeFilter === 'tdz' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('tdz')}
            className={cn(
              "rounded-full",
              activeFilter === 'tdz' && "bg-gradient-to-r from-primary to-primary-glow"
            )}
          >
            <Crown className="w-4 h-4 mr-2" />
            TDZ Artists
          </Button>
          <Button
            variant={activeFilter === 'youtube' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('youtube')}
            className={cn(
              "rounded-full",
              activeFilter === 'youtube' && "bg-red-600"
            )}
          >
            <Youtube className="w-4 h-4 mr-2" />
            YouTube
          </Button>
        </div>
      </div>

      {/* Track list */}
      <Card className="glass-card-premium overflow-hidden border-primary/20">
        <ScrollArea className="h-[500px]">
          <div className="divide-y divide-border/30">
            {unifiedTracks.map((track, index) => (
              <div
                key={track.id}
                onClick={() => handlePlayUnified(track)}
                className={cn(
                  "flex items-center gap-4 p-4 hover:bg-primary/5 transition-all cursor-pointer group",
                  currentTrackId === track.id && "bg-primary/10 border-l-2 border-primary"
                )}
              >
                {/* Index/Play indicator */}
                <div className="w-8 text-center flex-shrink-0">
                  <span className="text-muted-foreground group-hover:hidden">
                    {index + 1}
                  </span>
                  <Play 
                    className="w-4 h-4 hidden group-hover:block mx-auto text-primary" 
                    fill="currentColor" 
                  />
                </div>

                {/* Cover art */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                    {track.source === 'youtube' && track.youtubeData?.thumbnail ? (
                      <img 
                        src={track.youtubeData.thumbnail} 
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MotionCover
                        motionCoverPath={track.motion_cover_path}
                        motionCoverBucket={track.motion_cover_bucket}
                        staticCoverPath={track.album_cover_path}
                        staticCoverBucket={track.album_cover_bucket || "album-covers"}
                        alt={track.title}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  
                  {/* Source badge */}
                  {track.source === 'tdz' && (
                    <div className="absolute -top-1 -right-1">
                      <Badge className="bg-gradient-to-r from-primary to-primary-glow text-[10px] px-1 py-0 h-4">
                        <Crown className="w-2 h-2 mr-0.5" />
                        TDZ
                      </Badge>
                    </div>
                  )}
                  {track.source === 'youtube' && (
                    <div className="absolute -top-1 -right-1">
                      <Badge className="bg-red-600 text-[10px] px-1 py-0 h-4">
                        <Youtube className="w-2 h-2" />
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                </div>

                {/* Play count */}
                <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                  <Flame className="w-3 h-3" />
                  {track.play_count?.toLocaleString() || 0}
                </div>

                {/* Duration */}
                <div className="hidden sm:block text-sm text-muted-foreground flex-shrink-0 w-12 text-right">
                  {formatDuration(track.duration)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {track.source === 'tdz' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLike(track.id);
                        }}
                      >
                        <Heart 
                          className={cn("w-4 h-4", likedTracks.has(track.id) && "text-primary fill-primary")}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToQueue(track);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {youtubeLoading && activeFilter !== 'tdz' && (
              <div className="p-12 text-center text-muted-foreground">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p>Loading music...</p>
              </div>
            )}

            {unifiedTracks.length === 0 && !youtubeLoading && (
              <div className="p-12 text-center text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{youtubeError ? 'Unable to load YouTube content' : 'No tracks found for this genre'}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
