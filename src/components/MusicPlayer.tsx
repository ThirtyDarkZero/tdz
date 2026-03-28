import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Heart, 
  Shuffle, Repeat, List, Mic, MoreHorizontal, Share2, Download,
  Cast, Radio, Clock, Sliders, Award, Maximize2, AlertCircle
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QueuePanel } from "./QueuePanel";
import { LyricsPanel } from "./LyricsPanel";
import { AudioVisualizer3D } from "./3D/AudioVisualizer3D";
import { EqualizerPanel } from "./EqualizerPanel";
import { CreditsPanel } from "./CreditsPanel";
import { useFocusTracking } from "@/hooks/useFocusTracking";
import { useMultiSourceAudio } from "@/hooks/useMultiSourceAudio";
import { useRadioMode } from "@/hooks/useRadioMode";
import { useAudioQuality } from "@/hooks/useAudioQuality";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  duration: number;
  file_path: string;
  play_count: number;
  album_cover_path?: string;
  album_cover_bucket?: string;
  motion_cover_path?: string;
  motion_cover_bucket?: string;
  download_price?: number | null;
  user_id?: string;
  album?: {
    title: string;
    cover_art_path?: string;
  };
  ai_tags?: {
    metadata?: {
      isMotionCover?: boolean;
      artworkUrl?: string;
    };
  };
}

interface MusicPlayerProps {
  currentTrack: Track | null;
  queue: Track[];
  onNext: () => void;
  onPrevious: () => void;
  onTrackEnd: () => void;
  maxDuration?: number; // Maximum playback duration in seconds (for previews)
  onPreviewEnd?: () => void; // Callback when preview limit is reached
}

export const MusicPlayer = ({ currentTrack, queue, onNext, onPrevious, onTrackEnd, maxDuration, onPreviewEnd }: MusicPlayerProps) => {
  const { isPlaying: contextIsPlaying, setIsPlaying: setContextIsPlaying } = usePlayer();
  const [isPlaying, setIsPlayingLocal] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const { setCurrentTime: setContextTime } = usePlayer();
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(30);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [crossfadeDuration, setCrossfadeDuration] = useState(0);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [motionCoverUrl, setMotionCoverUrl] = useState<string | null>(null);
  const [streamRecorded, setStreamRecorded] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();

  // Focus tracking for fraud-resistant stream counting
  const { 
    isFocused, 
    startTracking, 
    stopTracking, 
    getFocusStats,
    resetTracking 
  } = useFocusTracking();

  // Multi-source audio fallback
  const {
    audioUrl,
    isLoading: isSourceLoading,
    error: sourceError,
    sourceInfo,
    initializeSources,
    handleSourceError,
    refreshCurrentSource,
  } = useMultiSourceAudio({
    filePath: currentTrack?.file_path || '',
    fileBucket: 'track-files',
    trackId: currentTrack?.id || '',
    enableFallback: true,
  });

  // Radio mode for continuous play
  const { 
    isRadioMode, 
    currentStation, 
    startRadioFromTrack, 
    stopRadio,
    isLoadingTracks: isLoadingRadioTracks 
  } = useRadioMode();

  // Audio quality detection
  const { 
    preferences: audioPrefs, 
    getRecommendedQuality,
    qualityLabels 
  } = useAudioQuality();

  // Initialize audio sources when track changes
  useEffect(() => {
    if (currentTrack) {
      initializeSources();
      setStreamRecorded(false);
      resetTracking();
      checkIfLiked();
      loadMotionCover();
    }
  }, [currentTrack?.id]);

  // Wrapper to sync local + context isPlaying state
  const setIsPlaying = useCallback((playing: boolean) => {
    setIsPlayingLocal(playing);
    setContextIsPlaying(playing);
  }, [setContextIsPlaying]);

  // Sync with context isPlaying (e.g. when OrbPlayerBar pauses)
  useEffect(() => {
    if (contextIsPlaying !== isPlaying && audioRef.current) {
      if (contextIsPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
      setIsPlayingLocal(contextIsPlaying);
    }
  }, [contextIsPlaying]);

  // Load audio URL when source is ready
  useEffect(() => {
    if (audioUrl && audioRef.current && currentTrack) {
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = playbackRate;
      
      // Start focus tracking when playback begins
      startTracking();
      
      // Auto-play when new track is loaded
      audioRef.current.play().catch(err => {
        console.error('Playback failed:', err);
        // Try next source on playback failure
        handleSourceError().then(hasNext => {
          if (!hasNext) {
            toast({
              title: "Playback Error",
              description: "Failed to play track. Please try again.",
              variant: "destructive"
            });
          }
        });
      });
      setIsPlaying(true);
      recordPlay();
    }
  }, [audioUrl]);

  // Show source error toast
  useEffect(() => {
    if (sourceError) {
      toast({
        title: "Audio Source Error",
        description: sourceError,
        variant: "destructive"
      });
    }
  }, [sourceError]);

  const loadMotionCover = async () => {
    // Check for motion cover path first
    if (currentTrack?.motion_cover_path) {
      const bucket = currentTrack.motion_cover_bucket || 'motion-covers';
      const { data } = supabase.storage.from(bucket).getPublicUrl(currentTrack.motion_cover_path);
      setMotionCoverUrl(data.publicUrl);
      return;
    }
    
    if (!currentTrack?.ai_tags?.metadata?.isMotionCover) {
      setMotionCoverUrl(null);
      return;
    }

    // Use artworkUrl if available from ai_tags
    const metadata = currentTrack.ai_tags.metadata;
    if (metadata?.artworkUrl) {
      setMotionCoverUrl(metadata.artworkUrl);
    } else {
      setMotionCoverUrl(null);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch(e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          if (audioRef.current) audioRef.current.currentTime -= 5;
          break;
        case 'ArrowRight':
          if (audioRef.current) audioRef.current.currentTime += 5;
          break;
        case 'ArrowUp':
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'l':
          toggleLike();
          break;
        case 'q':
          setShowQueue(!showQueue);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, volume, showQueue]);

  const checkIfLiked = async () => {
    if (!currentTrack) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_library')
      .select('id')
      .eq('user_id', user.id)
      .eq('track_id', currentTrack.id)
      .eq('library_type', 'liked_track')
      .single();

    setIsLiked(!!data);
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Playback failed:', err);
        toast({
          title: "Playback Error",
          description: "Failed to play track.",
          variant: "destructive"
        });
      });
      recordPlay();
    }
    setIsPlaying(!isPlaying);
  };

  const recordPlay = async () => {
    if (!currentTrack) return;
    // Initial play - don't increment count yet, wait for stream recording
  };

  // Record stream via edge function when conditions are met
  // Uses focus tracking to ensure user is actively listening (fraud prevention)
  const recordStream = useCallback(async (duration: number, completionPercentage: number) => {
    if (!currentTrack || streamRecorded) return;
    
    // Get focus stats for fraud detection
    const focusStats = getFocusStats();
    
    // Require at least 50% focused time for stream to count
    // This prevents counting streams from background tabs or bots
    const MIN_FOCUS_PERCENTAGE = 50;
    if (focusStats.focusPercentage < MIN_FOCUS_PERCENTAGE) {
      console.log(`Stream not counted: Focus percentage ${focusStats.focusPercentage.toFixed(1)}% below threshold`);
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/record-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          trackId: currentTrack.id,
          duration,
          completionPercentage,
          // Include focus metrics for enhanced fraud detection
          focusMetrics: {
            focusedDuration: focusStats.focusedDuration,
            totalDuration: focusStats.totalDuration,
            focusPercentage: focusStats.focusPercentage,
          },
        }),
      });

      const result = await response.json();
      if (result.recorded) {
        setStreamRecorded(true);
        console.log(`Stream recorded: Artist earned $${result.artistEarned} (${focusStats.focusPercentage.toFixed(1)}% focused)`);
        
        // Track listener demographics
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-listener-demographics`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
            },
            body: JSON.stringify({
              trackId: currentTrack.id,
              artistId: result.artistId,
              listenerId: session?.user?.id || null,
            }),
          });
        } catch (demoError) {
          console.log('Demographics tracking failed:', demoError);
        }
      }
    } catch (error) {
      console.error('Error recording stream:', error);
    }
  }, [currentTrack, streamRecorded, getFocusStats]);

  const handleTimeUpdate = () => {
    if (audioRef.current && currentTrack) {
      const currentSeconds = audioRef.current.currentTime;
      setCurrentTime(currentSeconds);
      setContextTime(currentSeconds);
      
      // Record stream when user has listened 30+ seconds OR 50%+ completion
      if (!streamRecorded) {
        const completionPercentage = (currentSeconds / currentTrack.duration) * 100;
        if (currentSeconds >= 30 || completionPercentage >= 50) {
          recordStream(currentSeconds, completionPercentage);
        }
      }
      
      // Check if preview max duration is reached
      if (maxDuration && currentSeconds >= maxDuration) {
        audioRef.current.pause();
        setIsPlaying(false);
        onPreviewEnd?.();
        return;
      }
      
      // Check for crossfade near end
      if (crossfadeDuration > 0) {
        const timeRemaining = currentTrack.duration - currentSeconds;
        if (timeRemaining <= crossfadeDuration && timeRemaining > 0) {
          const fadeVolume = timeRemaining / crossfadeDuration;
          audioRef.current.volume = fadeVolume * (isMuted ? 0 : volume);
        }
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const toggleLike = async () => {
    if (!currentTrack) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isLiked) {
      await supabase
        .from('user_library')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', currentTrack.id)
        .eq('library_type', 'liked_track');
      toast({ title: "Removed from Liked Songs" });
    } else {
      await supabase.from('user_library').insert({
        user_id: user.id,
        track_id: currentTrack.id,
        library_type: 'liked_track'
      });
      toast({ title: "Added to Liked Songs", description: currentTrack.title });
    }
    setIsLiked(!isLiked);
  };

  const startSleepTimer = () => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    
    sleepTimerRef.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        toast({ title: "Sleep Timer", description: "Playback stopped" });
      }
    }, sleepTimerMinutes * 60 * 1000);
    
    toast({ 
      title: "Sleep Timer Set", 
      description: `Music will stop in ${sleepTimerMinutes} minutes` 
    });
    setShowSleepTimer(false);
  };

  const shareTrack = async () => {
    if (!currentTrack) return;
    
    const shareData = {
      title: currentTrack.title,
      text: `Listen to ${currentTrack.title} by ${currentTrack.artist_name}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "Share link copied to clipboard" });
    }
  };

  const downloadTrack = async () => {
    if (!currentTrack) return;
    
    // SECURITY: Require authentication for ALL downloads
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ 
        title: "Sign in Required", 
        description: "Please sign in to download tracks.",
        variant: "destructive" 
      });
      return;
    }
    
    // Check if track has a download price - require purchase
    if (currentTrack.download_price && currentTrack.download_price > 0) {
      const { data: existingPurchase } = await supabase
        .from('download_purchases')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('track_id', currentTrack.id)
        .maybeSingle();

      if (existingPurchase) {
        // Already purchased - allow download
        const audioUrl = supabase.storage.from('track-files').getPublicUrl(currentTrack.file_path).data.publicUrl;
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = `${currentTrack.artist_name} - ${currentTrack.title}.mp3`;
        link.click();
        toast({ title: "Download Started", description: currentTrack.title });
        return;
      }

      // Needs purchase - show purchase dialog or redirect
      toast({ 
        title: "Purchase Required", 
        description: `This track costs $${currentTrack.download_price.toFixed(2)} to download. Purchase coming soon.`,
      });
      return;
    }
    
    // Free download (no price set or price is 0/null) - still requires auth
    const audioUrl = supabase.storage.from('track-files').getPublicUrl(currentTrack.file_path).data.publicUrl;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${currentTrack.artist_name} - ${currentTrack.title}.mp3`;
    link.click();
    toast({ title: "Download Started", description: currentTrack.title });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEnded = () => {
    // Stop focus tracking for this track
    const finalStats = stopTracking();
    console.log(`Track ended: ${finalStats.focusPercentage.toFixed(1)}% focused listening`);
    
    if (repeat === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      startTracking(); // Restart tracking for repeat
      audioRef.current.play();
    } else {
      onTrackEnd();
    }
  };

  // Handle audio element errors with multi-source fallback
  const handleAudioError = useCallback(async (e: React.SyntheticEvent<HTMLAudioElement>) => {
    console.warn('Audio element error:', e);
    const hasNext = await handleSourceError();
    if (!hasNext) {
      toast({
        title: "Playback Failed",
        description: "Unable to load audio. Please try a different track.",
        variant: "destructive"
      });
    }
  }, [handleSourceError, toast]);

  // Get cover URL - prioritize direct album_cover_path, then nested album.cover_art_path
  const getCoverUrl = () => {
    if (currentTrack?.album_cover_path) {
      const bucket = currentTrack.album_cover_bucket || 'album-covers';
      return supabase.storage.from(bucket).getPublicUrl(currentTrack.album_cover_path).data.publicUrl;
    }
    if (currentTrack?.album?.cover_art_path) {
      return supabase.storage.from('album-covers').getPublicUrl(currentTrack.album.cover_art_path).data.publicUrl;
    }
    return '/placeholder.svg';
  };
  
  const coverUrl = getCoverUrl();

  if (!currentTrack) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/98 to-background/95 backdrop-blur-xl border-t border-border/50 z-50 shadow-2xl">
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={handleAudioError}
          crossOrigin="anonymous"
        />
        
        {/* Source loading indicator */}
        {isSourceLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="animate-pulse text-sm text-muted-foreground">Loading audio...</div>
          </div>
        )}
        
        {/* Focus indicator for debugging (only in dev) */}
        {import.meta.env.DEV && !isFocused && isPlaying && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-destructive/80 text-destructive-foreground px-2 py-0.5 text-xs rounded-b flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Tab unfocused - stream may not count
          </div>
        )}
        
        {/* 3D Visualizer Section */}
        {showVisualizer && (
          <div className="border-b border-border/50">
            <AudioVisualizer3D audioElement={audioRef.current} isPlaying={isPlaying} genre={currentTrack?.album?.title} mood={(currentTrack?.ai_tags as any)?.mood} />
          </div>
        )}
        
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          {/* Mobile Layout (< md) */}
          <div className="md:hidden space-y-2">
            {/* Track Info Row */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-12 h-12 rounded overflow-hidden shadow-lg flex-shrink-0">
                {motionCoverUrl ? (
                  <video
                    src={motionCoverUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate text-sm">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentTrack.artist_name}</p>
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
                max={currentTrack.duration}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-9 font-mono">
                {formatTime(currentTrack.duration)}
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
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onPrevious}
                className="h-8 w-8"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={togglePlay}
                className="h-10 w-10 rounded-full"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onNext}
                className="h-8 w-8"
              >
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQueue(true)}
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => isRadioMode ? stopRadio() : startRadioFromTrack()}>
                    <Radio className={`h-4 w-4 mr-2 ${isRadioMode ? 'text-primary' : ''}`} />
                    {isRadioMode ? 'Stop Radio' : 'Start Radio'}
                    {isRadioMode && currentStation && (
                      <span className="ml-auto text-xs text-muted-foreground">On</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
                  <DropdownMenuItem onClick={() => setShowCredits(true)}>
                    <Award className="h-4 w-4 mr-2" />
                    Credits
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={shareTrack}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Track
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadTrack}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowSleepTimer(true)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Sleep Timer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <span className="text-sm mr-2">Speed:</span>
                    <select 
                      value={playbackRate}
                      onChange={(e) => setPlaybackRate(Number(e.target.value))}
                      className="bg-transparent text-sm"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">1x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2x</option>
                    </select>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Desktop/Tablet Layout (≥ md) */}
          <div className="hidden md:flex items-center justify-between gap-4">
            {/* Track Info with Motion Cover - Left Side */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative w-14 h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden shadow-lg">
                {motionCoverUrl ? (
                  <video
                    src={motionCoverUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate text-sm lg:text-base">{currentTrack.title}</p>
                <p className="text-xs lg:text-sm text-muted-foreground truncate">{currentTrack.artist_name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLike}
                className={`transition-colors ${isLiked ? "text-primary hover:text-primary/80" : ""}`}
              >
                <Heart className={`h-4 w-4 lg:h-5 lg:w-5 ${isLiked ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* Player Controls - Center */}
            <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
              <div className="flex items-center gap-2 lg:gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShuffle(!shuffle)}
                  className={`h-8 w-8 lg:h-9 lg:w-9 ${shuffle ? "text-primary" : ""}`}
                  title="Shuffle (S)"
                >
                  <Shuffle className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onPrevious}
                  title="Previous"
                  className="h-8 w-8 lg:h-9 lg:w-9"
                >
                  <SkipBack className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  onClick={togglePlay}
                  className="h-10 w-10 lg:h-11 lg:w-11 rounded-full shadow-lg hover:scale-105 transition-transform"
                  title="Play/Pause (Space)"
                >
                  {isPlaying ? <Pause className="h-4 w-4 lg:h-5 lg:w-5" /> : <Play className="h-4 w-4 lg:h-5 lg:w-5 ml-0.5" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onNext}
                  title="Next"
                  className="h-8 w-8 lg:h-9 lg:w-9"
                >
                  <SkipForward className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
                  className={`h-8 w-8 lg:h-9 lg:w-9 ${repeat !== 'off' ? "text-primary" : ""}`}
                  title="Repeat"
                >
                  <Repeat className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  {repeat === 'one' && <span className="absolute text-[10px] font-bold">1</span>}
                </Button>
              </div>
              
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-muted-foreground w-10 lg:w-12 text-right font-mono">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={currentTrack.duration}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="flex-1 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground w-10 lg:w-12 font-mono">
                  {formatTime(currentTrack.duration)}
                </span>
              </div>
            </div>

            {/* Controls - Right Side */}
            <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVisualizer(!showVisualizer)}
                title="Visualizer"
                className={`hidden lg:flex ${showVisualizer ? "text-primary" : ""}`}
              >
                <Radio className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEqualizer(true)}
                title="Equalizer"
                className="hidden lg:flex"
              >
                <Sliders className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLyrics(true)}
                title="Lyrics"
                className="hidden xl:flex"
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCredits(true)}
                title="Credits"
                className="hidden xl:flex"
              >
                <Award className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQueue(true)}
                title="Queue (Q)"
              >
                <List className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                title="Mute"
                className="hidden lg:flex"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={(value) => {
                  setVolume(value[0]);
                  setIsMuted(false);
                }}
                className="w-20 lg:w-24 hidden lg:flex"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="More Options">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={shareTrack}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Track
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadTrack}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowSleepTimer(true)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Sleep Timer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <span className="text-sm mr-2">Speed:</span>
                    <select 
                      value={playbackRate}
                      onChange={(e) => setPlaybackRate(Number(e.target.value))}
                      className="bg-transparent text-sm"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">1x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2x</option>
                    </select>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <QueuePanel
        open={showQueue}
        onClose={() => setShowQueue(false)}
        queue={queue}
        currentTrack={currentTrack}
        onPlayTrack={(track) => {
          // Queue functionality handled by parent component
        }}
        onRemoveFromQueue={(index) => {
          // Queue removal handled by parent component
        }}
        onReorderQueue={(from, to) => {
          // Queue reorder handled by parent component
        }}
      />

      <LyricsPanel
        open={showLyrics}
        onClose={() => setShowLyrics(false)}
        trackId={currentTrack.id}
        currentTime={currentTime}
        audioPath={currentTrack.file_path}
      />

      <EqualizerPanel
        open={showEqualizer}
        onClose={() => setShowEqualizer(false)}
        audioElement={audioRef.current}
      />

      <CreditsPanel
        open={showCredits}
        onClose={() => setShowCredits(false)}
        trackId={currentTrack.id}
      />

      <Dialog open={showSleepTimer} onOpenChange={setShowSleepTimer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sleep Timer</DialogTitle>
            <DialogDescription>
              Automatically stop playback after a set duration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="timer">Minutes</Label>
              <Input
                id="timer"
                type="number"
                min="1"
                max="180"
                value={sleepTimerMinutes}
                onChange={(e) => setSleepTimerMinutes(Number(e.target.value))}
              />
            </div>
            <Button onClick={startSleepTimer} className="w-full">
              Start Timer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};