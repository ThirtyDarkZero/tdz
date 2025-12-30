import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Youtube, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlayer, Track } from '@/contexts/PlayerContext';
import { cn } from '@/lib/utils';

interface YouTubePlayerInlineProps {
  track: Track;
  onNext: () => void;
  onPrevious: () => void;
  onTrackEnd: () => void;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
}

export function YouTubePlayerInline({ 
  track, 
  onNext, 
  onPrevious, 
  onTrackEnd,
  isPlaying,
  onPlayingChange
}: YouTubePlayerInlineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);
  const initializingRef = useRef(false);
  const lastVideoIdRef = useRef<string | null>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const { setYoutubePlayer, setCurrentTime: setContextTime } = usePlayer();

  const videoId = track.youtubeId || track.id.replace('yt-', '');
  
  // Auto-play on mount - tell parent we're playing
  useEffect(() => {
    // Signal that we should be playing immediately
    if (!isPlaying) {
      onPlayingChange(true);
    }
  }, []);

  // Initialize YouTube player
  useEffect(() => {
    // Skip if already playing this video
    if (lastVideoIdRef.current === videoId && playerRef.current && isReady) {
      // Just ensure it's playing
      try {
        playerRef.current.playVideo?.();
        onPlayingChange(true);
      } catch (e) {
        // Ignore
      }
      return;
    }
    
    // Prevent duplicate initialization for same video
    if (initializingRef.current && lastVideoIdRef.current === videoId) return;
    
    initializingRef.current = true;
    lastVideoIdRef.current = videoId;
    
    const initPlayer = () => {
      // Clean up existing player
      if (playerRef.current) {
        try {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (e) {
          // Ignore destroy errors
        }
      }

      // Ensure the container exists
      const container = document.getElementById('yt-inline-player');
      if (!container) {
        initializingRef.current = false;
        return;
      }

      try {
        playerRef.current = new window.YT.Player('yt-inline-player', {
          height: '0',
          width: '0',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              initializingRef.current = false;
              setIsReady(true);
              const dur = event.target.getDuration();
              setDuration(dur);
              setYoutubePlayer(event.target);
              
              // Auto-play immediately
              event.target.playVideo();
              onPlayingChange(true);
              
              // Start time tracking
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              intervalRef.current = window.setInterval(() => {
                if (playerRef.current?.getCurrentTime) {
                  const time = playerRef.current.getCurrentTime();
                  setCurrentTime(time);
                  setContextTime(time);
                }
              }, 500);
            },
            onStateChange: (event: any) => {
              const playing = event.data === window.YT.PlayerState.PLAYING;
              onPlayingChange(playing);
              
              if (event.data === window.YT.PlayerState.ENDED) {
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                }
                onTrackEnd();
              }
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data);
              initializingRef.current = false;
            },
          },
        });
      } catch (e) {
        console.error('Failed to create YouTube player:', e);
        initializingRef.current = false;
      }
    };
    
    // Check if API is ready
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Wait for API to load with timeout
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      const checkApi = setInterval(() => {
        attempts++;
        if (window.YT && window.YT.Player) {
          clearInterval(checkApi);
          initPlayer();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkApi);
          console.error('YouTube API failed to load');
          initializingRef.current = false;
        }
      }, 100);
      return () => clearInterval(checkApi);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId, onPlayingChange, onTrackEnd, setYoutubePlayer, setContextTime]);

  // Handle play/pause changes
  useEffect(() => {
    if (!playerRef.current || !isReady) return;
    
    if (isPlaying) {
      playerRef.current.playVideo?.();
    } else {
      playerRef.current.pauseVideo?.();
    }
  }, [isPlaying, isReady]);

  // Handle track changes
  useEffect(() => {
    if (playerRef.current && isReady && videoId) {
      playerRef.current.loadVideoById?.(videoId);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [videoId, isReady]);

  const togglePlay = useCallback(() => {
    onPlayingChange(!isPlaying);
  }, [isPlaying, onPlayingChange]);

  const handleSeek = useCallback((value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    playerRef.current?.seekTo?.(newTime, true);
    setCurrentTime(newTime);
  }, [duration]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const vol = value[0];
    setVolume(vol);
    playerRef.current?.setVolume?.(vol);
    if (vol > 0 && isMuted) {
      setIsMuted(false);
      playerRef.current?.unMute?.();
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      playerRef.current?.unMute?.();
      setIsMuted(false);
    } else {
      playerRef.current?.mute?.();
      setIsMuted(true);
    }
  }, [isMuted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={containerRef} className="h-20 md:h-24">
      {/* Hidden YouTube player container */}
      <div id="yt-inline-player" className="hidden absolute" />

      <div className="h-full flex items-center gap-2 md:gap-4 px-3 md:px-6">
        {/* Track info */}
        <div className="flex items-center gap-3 w-48 md:w-64 flex-shrink-0">
          <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img 
              src={track.thumbnail || track.album_cover_path || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt={track.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0.5 right-0.5">
              <Youtube className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{track.title}</p>
            <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
          </div>
        </div>

        {/* Center controls */}
        <div className="flex-1 flex flex-col items-center gap-1 md:gap-2 min-w-0">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <SkipBack className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={togglePlay}
              className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-600 hover:bg-red-700"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Play className="h-4 w-4 md:h-5 md:w-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <SkipForward className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md md:max-w-xl flex items-center gap-2">
            <span className="text-[10px] md:text-xs text-muted-foreground w-8 md:w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-[10px] md:text-xs text-muted-foreground w-8 md:w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div className="hidden sm:flex items-center gap-2 w-32 md:w-48 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            onValueChange={handleVolumeChange}
            className="w-20 md:w-24"
          />
        </div>
      </div>
    </div>
  );
}
