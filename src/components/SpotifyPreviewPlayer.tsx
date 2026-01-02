import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Heart, Shuffle, Repeat, List, Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlayer, Track } from '@/contexts/PlayerContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SpotifyPreviewPlayerProps {
  track: Track;
  queue: Track[];
  onNext: () => void;
  onPrevious: () => void;
  onTrackEnd: () => void;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
}

export function SpotifyPreviewPlayer({ 
  track, 
  queue,
  onNext, 
  onPrevious, 
  onTrackEnd,
  isPlaying,
  onPlayingChange
}: SpotifyPreviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30); // Spotify previews are ~30 seconds
  const [volume, setVolumeState] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [showQueue, setShowQueue] = useState(false);
  
  const { toast } = useToast();
  const { setCurrentTime: setContextTime } = usePlayer();

  const previewUrl = track.spotifyPreviewUrl;
  
  // Check if track is liked
  useEffect(() => {
    const checkLiked = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !track.id) return;
      
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

  // Handle audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !previewUrl) return;
    
    audio.src = previewUrl;
    audio.load();
    
    if (isPlaying) {
      audio.play().catch(console.error);
    }
    
    return () => {
      audio.pause();
    };
  }, [previewUrl]);

  // Play/pause synchronization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setContextTime(audio.currentTime);
    };
    
    const handleDurationChange = () => {
      setDuration(audio.duration || 30);
    };
    
    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        onTrackEnd();
      }
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeat, onTrackEnd, setContextTime]);

  const togglePlay = useCallback(() => {
    onPlayingChange(!isPlaying);
  }, [isPlaying, onPlayingChange]);

  const handleSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = value[0] / 100;
      setVolumeState(value[0]);
      if (value[0] > 0 && isMuted) {
        setIsMuted(false);
        audio.muted = false;
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in to save favorites" });
      return;
    }

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
        youtube_id: track.youtubeId || null,
        thumbnail: track.thumbnail,
        source: 'spotify'
      }, { onConflict: 'user_id,track_id' });
      toast({ title: "Added to Liked Songs", description: track.title });
    }
    setIsLiked(!isLiked);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const thumbnailUrl = track.thumbnail || track.album_cover_path || '/placeholder.svg';

  if (!previewUrl) {
    return null;
  }

  return (
    <>
      <audio ref={audioRef} className="hidden" />
      
      <div className="bg-gradient-to-t from-background via-background/98 to-background/95 backdrop-blur-xl border-t border-border/50">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          {/* Mobile Layout */}
          <div className="md:hidden space-y-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-12 h-12 rounded overflow-hidden shadow-lg flex-shrink-0">
                <img
                  src={thumbnailUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0.5 right-0.5 bg-green-500 rounded-full p-0.5">
                  <Music className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate text-sm">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artist_name} • Preview
                </p>
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
                max={duration || 30}
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
                className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700"
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
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 items-center">
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
                <img
                  src={thumbnailUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                  <Music className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{track.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {track.artist_name} • Spotify Preview
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLike}
                className={isLiked ? "text-primary" : ""}
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* Center Controls */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShuffle(!shuffle)}
                  className={shuffle ? "text-primary" : ""}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onPrevious}>
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  onClick={togglePlay}
                  className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={onNext}>
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
                  className={repeat !== 'off' ? "text-primary" : ""}
                >
                  <Repeat className="h-4 w-4" />
                  {repeat === 'one' && <span className="absolute text-[8px] font-bold">1</span>}
                </Button>
              </div>
              <div className="flex items-center gap-2 w-full max-w-md">
                <span className="text-xs text-muted-foreground w-10 text-right font-mono">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 30}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 font-mono">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowQueue(!showQueue)}>
                <List className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleMute}>
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Sheet */}
      <Sheet open={showQueue} onOpenChange={setShowQueue}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>Queue ({queue.length} tracks)</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-4">
            <div className="space-y-2 pr-4">
              {queue.map((qTrack, index) => (
                <div 
                  key={qTrack.id} 
                  className={`flex items-center gap-3 p-2 rounded-lg ${qTrack.id === track.id ? 'bg-primary/10' : 'hover:bg-accent/50'}`}
                >
                  <span className="text-xs text-muted-foreground w-6">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{qTrack.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{qTrack.artist_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}