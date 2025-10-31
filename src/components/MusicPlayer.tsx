import { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Heart, 
  Shuffle, Repeat, List, Mic, MoreHorizontal, Share2, Download,
  Cast, Radio, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QueuePanel } from "./QueuePanel";
import { LyricsPanel } from "./LyricsPanel";
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
  album?: {
    title: string;
    cover_art_path?: string;
  };
}

interface MusicPlayerProps {
  currentTrack: Track | null;
  queue: Track[];
  onNext: () => void;
  onPrevious: () => void;
  onTrackEnd: () => void;
}

export const MusicPlayer = ({ currentTrack, queue, onNext, onPrevious, onTrackEnd }: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
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
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const audioUrl = supabase.storage.from('track-files').getPublicUrl(currentTrack.file_path).data.publicUrl;
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = playbackRate;
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Playback failed:', err);
          toast({
            title: "Playback Error",
            description: "Failed to play track. File may be corrupted or unavailable.",
            variant: "destructive"
          });
        });
      }
      checkIfLiked();
    }
  }, [currentTrack]);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('listening_history').insert({
      user_id: user.id,
      track_id: currentTrack.id,
      played_at: new Date().toISOString(),
      play_duration: 0,
      device_type: 'web'
    });

    await supabase
      .from('tracks')
      .update({ play_count: currentTrack.play_count + 1 })
      .eq('id', currentTrack.id);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      
      // Check for crossfade near end
      if (crossfadeDuration > 0) {
        const timeRemaining = currentTrack!.duration - audioRef.current.currentTime;
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
    if (repeat === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      onTrackEnd();
    }
  };

  const coverUrl = currentTrack?.album?.cover_art_path
    ? supabase.storage.from('album-covers').getPublicUrl(currentTrack.album.cover_art_path).data.publicUrl
    : '/placeholder.svg';

  if (!currentTrack) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/98 to-background/95 backdrop-blur-xl border-t border-border/50 z-50 shadow-2xl">
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          crossOrigin="anonymous"
        />
        
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Track Info - Left Side */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img
                src={coverUrl}
                alt={currentTrack.title}
                className="w-16 h-16 rounded-lg object-cover shadow-lg"
              />
              <div className="min-w-0">
                <p className="font-semibold truncate text-base">{currentTrack.title}</p>
                <p className="text-sm text-muted-foreground truncate">{currentTrack.artist_name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLike}
                className={`transition-colors ${isLiked ? "text-primary hover:text-primary/80" : ""}`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* Player Controls - Center */}
            <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShuffle(!shuffle)}
                  className={shuffle ? "text-primary" : ""}
                  title="Shuffle (S)"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onPrevious}
                  title="Previous"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  onClick={togglePlay}
                  className="h-11 w-11 rounded-full shadow-lg hover:scale-105 transition-transform"
                  title="Play/Pause (Space)"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onNext}
                  title="Next"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
                  className={repeat !== 'off' ? "text-primary" : ""}
                  title="Repeat"
                >
                  <Repeat className="h-4 w-4" />
                  {repeat === 'one' && <span className="absolute text-[10px] font-bold">1</span>}
                </Button>
              </div>
              
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-muted-foreground w-12 text-right font-mono">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={currentTrack.duration}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="flex-1 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground w-12 font-mono">
                  {formatTime(currentTrack.duration)}
                </span>
              </div>
            </div>

            {/* Controls - Right Side */}
            <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLyrics(true)}
                title="Lyrics"
              >
                <Mic className="h-5 w-5" />
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
                className="w-24"
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
          // Implementation would need to be passed from parent
          console.log('Play track:', track);
        }}
        onRemoveFromQueue={(index) => {
          console.log('Remove from queue:', index);
        }}
        onReorderQueue={(from, to) => {
          console.log('Reorder:', from, to);
        }}
      />

      <LyricsPanel
        open={showLyrics}
        onClose={() => setShowLyrics(false)}
        trackId={currentTrack.id}
        currentTime={currentTime}
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