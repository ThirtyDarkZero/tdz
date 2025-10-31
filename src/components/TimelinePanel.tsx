import { Card } from "@/components/ui/card";
import { Play, Pause, SkipBack, SkipForward, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";

const beatMarkers = Array.from({ length: 32 }, (_, i) => i);

export const TimelinePanel = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const projectContext = useProject();
  const { currentProject, generateScenes, loading } = projectContext || {
    currentProject: null,
    generateScenes: async () => {},
    loading: false
  };

  const canGenerateScenes = currentProject?.lyrics && currentProject?.audio_file_path;

  // Load audio URL when project changes
  useEffect(() => {
    if (currentProject?.audio_file_path) {
      const { data } = supabase.storage
        .from('audio-files')
        .getPublicUrl(currentProject.audio_file_path);
      setAudioUrl(data.publicUrl);
    } else {
      setAudioUrl(null);
    }
  }, [currentProject?.audio_file_path]);

  // Update current time from audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Play/pause control
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Skip back 5 seconds
  const skipBack = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - 5);
    }
  };

  // Skip forward 5 seconds
  const skipForward = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-32 glass-card border-t border-border/50 p-4">
      {/* Hidden audio element */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      )}
      
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={skipBack}
            disabled={!audioUrl}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="default"
            className="h-10 w-10 bg-gradient-to-r from-primary to-secondary hover:shadow-glow transition-all"
            onClick={togglePlayPause}
            disabled={!audioUrl}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={skipForward}
            disabled={!audioUrl}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-xs font-mono text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div className="flex-1" />

        <Button
          variant="default"
          size="sm"
          onClick={generateScenes}
          disabled={!canGenerateScenes || loading}
          className="bg-gradient-to-r from-primary to-accent hover:shadow-glow transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Scenes
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          {currentProject?.bpm || 120} BPM • 4/4 • {currentProject?.mood || 'Cinematic'}
        </div>
      </div>

      <div className="relative h-12 bg-background/30 rounded-lg overflow-hidden border border-border/50">
        {/* Waveform visualization */}
        <div className="absolute inset-0 flex items-center justify-around px-2">
          {beatMarkers.map((_, idx) => (
            <div
              key={idx}
              className="w-0.5 bg-gradient-to-t from-primary/50 to-secondary/30 rounded-full"
              style={{
                height: `${Math.random() * 60 + 40}%`,
              }}
            />
          ))}
        </div>

        {/* Beat markers */}
        <div className="absolute top-0 left-0 right-0 h-2 flex">
          {Array.from({ length: 16 }).map((_, idx) => (
            <div
              key={idx}
              className="flex-1 border-l border-primary/30"
              style={{ borderLeftWidth: idx % 4 === 0 ? '2px' : '1px' }}
            />
          ))}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-glow"
          style={{ left: '20%' }}
        />
      </div>
    </div>
  );
};
