import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Heart, Shuffle, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const audioUrl = supabase.storage.from('track-files').getPublicUrl(currentTrack.file_path).data.publicUrl;
      audioRef.current.src = audioUrl;
      if (isPlaying) {
        audioRef.current.play();
      }
      checkIfLiked();
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

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
      audioRef.current.play();
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
      played_at: new Date().toISOString()
    });

    await supabase
      .from('tracks')
      .update({ play_count: currentTrack.play_count + 1 })
      .eq('id', currentTrack.id);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
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
      toast({ title: "Added to Liked Songs" });
    }
    setIsLiked(!isLiked);
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
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-50">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={coverUrl}
              alt={currentTrack.title}
              className="w-14 h-14 rounded object-cover"
            />
            <div className="min-w-0">
              <p className="font-medium truncate">{currentTrack.title}</p>
              <p className="text-sm text-muted-foreground truncate">{currentTrack.artist_name}</p>
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

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
            <div className="flex items-center gap-2">
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
                className="h-10 w-10 rounded-full"
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
                {repeat === 'one' && <span className="absolute text-xs">1</span>}
              </Button>
            </div>
            
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={currentTrack.duration}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(currentTrack.duration)}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
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
          </div>
        </div>
      </div>
    </div>
  );
};