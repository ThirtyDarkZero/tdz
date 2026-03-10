import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Youtube, Heart, Shuffle, Repeat, List, Mic, MoreHorizontal,
  Share2, Radio, Clock, Sliders, Award, Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlayer, Track } from '@/contexts/PlayerContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { QueuePanel } from '@/components/QueuePanel';
import { LyricsPanel } from '@/components/LyricsPanel';
import { YouTubeVisualizerPanel } from './YouTubeVisualizerPanel';
import { YouTubeEQPanel } from './YouTubeEQPanel';
import { useCrossfade } from '@/hooks/useCrossfade';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';

// Crossfade duration in seconds
const CROSSFADE_DURATION = 3;

interface YouTubePlayerEnhancedProps {
  track: Track;
  queue: Track[];
  onNext: () => void;
  onPrevious: () => void;
  onTrackEnd: () => void;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
  onError?: () => void;
}

export function YouTubePlayerEnhanced({ 
  track, 
  queue,
  onNext, 
  onPrevious, 
  onTrackEnd,
  isPlaying,
  onPlayingChange,
  onError
}: YouTubePlayerEnhancedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);
  const initializingRef = useRef(false);
  const lastVideoIdRef = useRef<string | null>(null);
  const crossfadeTriggeredRef = useRef(false);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  
  // Panel states - matching TDZ player
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(30);
  
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();
  const { setYoutubePlayer, setCurrentTime: setContextTime } = usePlayer();
  
  // Crossfade hook for DJ-like transitions
  const { isCrossfading, shouldStartCrossfade, startCrossfade, cleanup: cleanupCrossfade } = useCrossfade({
    duration: CROSSFADE_DURATION,
  });

  const videoId = track.youtubeId || track.id.replace('yt-', '');
  
  // Check if track is liked (from liked_youtube_tracks table)
  useEffect(() => {
    const checkLiked = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !track.id) return;
      
      // Check the liked_youtube_tracks table for YouTube tracks
      const { data } = await supabase
        .from('liked_youtube_tracks')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_id', track.id)
        .maybeSingle();
      
      setIsLiked(!!data);
    };
    checkLiked();
  }, [track.id]);
  
  // Force immediate playback state sync on mount - CRITICAL for single-click playback
  useEffect(() => {
    // Immediately set playing state with no delay
    if (!isPlaying) {
      onPlayingChange(true);
    }
    // Also try to play the video immediately if player is ready
    if (playerRef.current && isReady) {
      try {
        playerRef.current.playVideo?.();
      } catch (e) {
        // Ignore
      }
    }
  }, [onPlayingChange, isReady]);

  // Initialize YouTube player
  useEffect(() => {
    if (lastVideoIdRef.current === videoId && playerRef.current && isReady) {
      try {
        playerRef.current.playVideo?.();
        onPlayingChange(true);
      } catch (e) {
        // Ignore
      }
      return;
    }
    
    if (initializingRef.current && lastVideoIdRef.current === videoId) return;
    
    initializingRef.current = true;
    lastVideoIdRef.current = videoId;
    
    const initPlayer = () => {
      // Reset readiness any time we (re)create the underlying IFrame player
      setIsReady(false);

      if (playerRef.current) {
        try {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (e) {}
      }

      const container = document.getElementById('yt-enhanced-player');
      if (!container) {
        initializingRef.current = false;
        return;
      }

      try {
        playerRef.current = new window.YT.Player('yt-enhanced-player', {
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
              
              // Immediate playback - no delay
              event.target.playVideo();
              onPlayingChange(true);
              
              // Clear any existing interval
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              
              // Reset crossfade trigger for new track
              crossfadeTriggeredRef.current = false;
              
              // High-frequency time tracking (250ms for smooth progress bar)
              intervalRef.current = window.setInterval(() => {
                if (playerRef.current?.getCurrentTime) {
                  const time = playerRef.current.getCurrentTime();
                  const trackDuration = playerRef.current.getDuration() || 0;
                  setCurrentTime(time);
                  setContextTime(time);
                  
                  // Check if we should start crossfade (3 seconds before end)
                  if (
                    !crossfadeTriggeredRef.current && 
                    trackDuration > 0 && 
                    shouldStartCrossfade(time, trackDuration) &&
                    repeat !== 'one'
                  ) {
                    crossfadeTriggeredRef.current = true;
                    // Start fading out current track and trigger next
                    startCrossfade(playerRef.current, () => {
                      // Crossfade complete - advance to next track
                      onTrackEnd();
                    });
                  }
                }
              }, 250);
            },
            onStateChange: (event: any) => {
              const playing = event.data === window.YT.PlayerState.PLAYING;
              onPlayingChange(playing);
              
              if (event.data === window.YT.PlayerState.ENDED) {
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                }
                if (repeat === 'one') {
                  playerRef.current?.seekTo(0, true);
                  playerRef.current?.playVideo();
                } else {
                  onTrackEnd();
                }
              }
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data);
              initializingRef.current = false;
              // Notify parent of error for fallback handling
              onError?.();
            },
          },
        });
      } catch (e) {
        console.error('Failed to create YouTube player:', e);
        initializingRef.current = false;
        onError?.();
      }
    };
    
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      let attempts = 0;
      const maxAttempts = 50;
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
      // React StrictMode runs effects twice in dev; ensure we don't get stuck "initializing"
      // which would prevent the second init and result in no playback.
      initializingRef.current = false;
      cleanupCrossfade();
    };
  }, [videoId, onPlayingChange, onTrackEnd, setYoutubePlayer, setContextTime, repeat, shouldStartCrossfade, startCrossfade, cleanupCrossfade]);

  // Handle play/pause changes
  useEffect(() => {
    if (!playerRef.current || !isReady) return;
    
    if (isPlaying) {
      playerRef.current.playVideo?.();
    } else {
      playerRef.current.pauseVideo?.();
    }
  }, [isPlaying, isReady]);

  const togglePlay = useCallback(() => {
    // Direct control for instant response
    if (isPlaying) {
      playerRef.current?.pauseVideo?.();
    } else {
      playerRef.current?.playVideo?.();
    }
    onPlayingChange(!isPlaying);
  }, [isPlaying, onPlayingChange]);

  const handleSeek = useCallback((value: number[]) => {
    const newTime = value[0];
    playerRef.current?.seekTo?.(newTime, true);
    setCurrentTime(newTime);
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const vol = value[0];
    setVolumeState(vol);
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

  const toggleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in to save favorites" });
      return;
    }

    // For YouTube tracks, use the dedicated liked_youtube_tracks table
    if (isLiked) {
      await supabase
        .from('liked_youtube_tracks')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', track.id);
      toast({ title: "Removed from Liked Songs" });
    } else {
      await supabase.from('liked_youtube_tracks').upsert({
        user_id: user.id,
        track_id: track.id,
        title: track.title,
        artist_name: track.artist_name,
        youtube_id: videoId,
        thumbnail: track.thumbnail,
        source: 'youtube'
      }, { onConflict: 'user_id,track_id' });
      toast({ title: "Added to Liked Songs", description: track.title });
    }
    setIsLiked(!isLiked);
  };

  const shareTrack = async () => {
    const shareData = {
      title: track.title,
      text: `Listen to ${track.title} by ${track.artist_name}`,
      url: `https://www.youtube.com/watch?v=${videoId}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast({ title: "Link Copied", description: "YouTube link copied to clipboard" });
    }
  };

  const startSleepTimer = () => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    
    sleepTimerRef.current = setTimeout(() => {
      playerRef.current?.pauseVideo?.();
      onPlayingChange(false);
      toast({ title: "Sleep Timer", description: "Playback stopped" });
    }, sleepTimerMinutes * 60 * 1000);
    
    toast({ 
      title: "Sleep Timer Set", 
      description: `Music will stop in ${sleepTimerMinutes} minutes` 
    });
    setShowSleepTimer(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const thumbnailUrl = track.thumbnail || track.album_cover_path || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  return (
    <>
      <div ref={containerRef} className="bg-gradient-to-t from-background via-background/98 to-background/95 backdrop-blur-xl border-t border-border/50">
        {/* Hidden YouTube player */}
        <div id="yt-enhanced-player" className="hidden absolute" />
        
        {/* Visualizer Section */}
        {showVisualizer && (
          <div className="border-b border-border/50">
            <YouTubeVisualizerPanel isPlaying={isPlaying} currentTime={currentTime} duration={duration} />
          </div>
        )}
        
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          {/* Mobile Layout (< md) */}
          <div className="md:hidden space-y-2">
            {/* Track Info Row */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-12 h-12 rounded overflow-hidden shadow-lg flex-shrink-0">
                <img
                  src={thumbnailUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0.5 right-0.5">
                  <Youtube className="w-4 h-4 text-red-500" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate text-sm">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLike}
                className={`flex-shrink-0 h-8 w-8 ${isLiked ? "text-primary" : ""}`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-9 text-right font-mono">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-9 font-mono">
                {formatTime(duration)}
              </span>
            </div>
            
            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShuffle(!shuffle)}
                className={`h-8 w-8 ${shuffle ? "text-primary" : ""}`}
              >
                <Shuffle className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onPrevious} className="h-8 w-8">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={togglePlay}
                className="h-10 w-10 rounded-full bg-red-600 hover:bg-red-700"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onNext} className="h-8 w-8">
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
                className={`h-8 w-8 ${repeat !== 'off' ? "text-primary" : ""}`}
              >
                <Repeat className="h-3.5 w-3.5" />
                {repeat === 'one' && <span className="absolute text-[8px] font-bold">1</span>}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowQueue(true)} className="h-8 w-8">
                <List className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowVisualizer(!showVisualizer)}>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Visualizer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowEqualizer(true)}>
                    <Sliders className="h-4 w-4 mr-2" />
                    Equalizer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowLyrics(true)}>
                    <Mic className="h-4 w-4 mr-2" />
                    Lyrics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={shareTrack}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Track
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowSleepTimer(true)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Sleep Timer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Desktop Layout (>= md) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Left: Track Info */}
            <div className="flex items-center gap-4 w-72 flex-shrink-0">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden shadow-xl ring-1 ring-white/10">
                <img
                  src={thumbnailUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 right-1">
                  <Youtube className="w-4 h-4 text-red-500 drop-shadow-lg" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate text-sm">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLike}
                className={cn("h-9 w-9", isLiked && "text-primary")}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              </Button>
            </div>
            
            {/* Center: Controls */}
            <div className="flex-1 flex flex-col items-center gap-1 max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShuffle(!shuffle)}
                  className={cn("h-8 w-8", shuffle && "text-primary")}
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onPrevious} className="h-9 w-9">
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  onClick={togglePlay}
                  className="h-11 w-11 rounded-full bg-red-600 hover:bg-red-700 shadow-lg"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={onNext} className="h-9 w-9">
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
                  className={cn("h-8 w-8 relative", repeat !== 'off' && "text-primary")}
                >
                  <Repeat className="h-3.5 w-3.5" />
                  {repeat === 'one' && <span className="absolute text-[8px] font-bold">1</span>}
                </Button>
              </div>
              
              <div className="w-full flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10 text-right font-mono">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 font-mono">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
            
            {/* Right: Volume & Extra Controls */}
            <div className="flex items-center gap-2 w-72 justify-end flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setShowQueue(!showQueue)} className={cn("h-8 w-8", showQueue && "text-primary")}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowLyrics(!showLyrics)} className={cn("h-8 w-8", showLyrics && "text-primary")}>
                <Mic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowVisualizer(!showVisualizer)} className={cn("h-8 w-8", showVisualizer && "text-primary")}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowEqualizer(true)} className="h-8 w-8">
                <Sliders className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 ml-2">
                <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8">
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={shareTrack}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Track
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowSleepTimer(true)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Sleep Timer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      <QueuePanel 
        open={showQueue} 
        onClose={() => setShowQueue(false)} 
        queue={queue as any}
        currentTrack={track as any}
        onPlayTrack={() => {}}
        onRemoveFromQueue={() => {}}
        onReorderQueue={() => {}}
      />

      {/* Lyrics Panel */}
      <LyricsPanel
        open={showLyrics}
        onClose={() => setShowLyrics(false)}
        trackId={track.id}
        currentTime={currentTime}
      />

      {/* Equalizer Panel */}
      <YouTubeEQPanel
        open={showEqualizer}
        onClose={() => setShowEqualizer(false)}
      />

      {/* Sleep Timer Dialog */}
      <Dialog open={showSleepTimer} onOpenChange={setShowSleepTimer}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sleep Timer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minutes" className="text-right">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                value={sleepTimerMinutes}
                onChange={(e) => setSleepTimerMinutes(parseInt(e.target.value) || 30)}
                className="col-span-3"
              />
            </div>
            <div className="flex gap-2 justify-center">
              {[15, 30, 45, 60, 90].map((mins) => (
                <Button
                  key={mins}
                  variant="outline"
                  size="sm"
                  onClick={() => setSleepTimerMinutes(mins)}
                  className={sleepTimerMinutes === mins ? "ring-2 ring-primary" : ""}
                >
                  {mins}m
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={startSleepTimer} className="w-full">
            <Clock className="h-4 w-4 mr-2" />
            Start Timer
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
