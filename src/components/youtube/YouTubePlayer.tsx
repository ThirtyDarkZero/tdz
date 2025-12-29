import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize2, Minimize2, Radio, ListMusic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useYouTubePlayer, YouTubeVideo } from '@/hooks/useYouTubePlayer';
import { useYouTubeSearch } from '@/hooks/useYouTubeSearch';
import { cn } from '@/lib/utils';

interface YouTubePlayerProps {
  video: YouTubeVideo | null;
  onNext?: () => void;
  onPrevious?: () => void;
  queue?: YouTubeVideo[];
  onVideoEnd?: () => void;
}

export function YouTubePlayer({ video, onNext, onPrevious, queue = [], onVideoEnd }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRelated, setShowRelated] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  
  const { getRelated } = useYouTubeSearch();
  const player = useYouTubePlayer('yt-player-container');

  // Load video when it changes
  useEffect(() => {
    if (video && player.isReady) {
      player.loadVideo(video);
      
      // Fetch related videos
      getRelated(video.id).then(setRelatedVideos);
    }
  }, [video, player.isReady]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  if (!video) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300",
        isExpanded ? "h-[50vh]" : "h-24"
      )}
    >
      {/* Hidden YouTube player container */}
      <div id="yt-player-container" className="hidden" />

      <div className="h-full bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl">
        {/* Expanded view with video info and related */}
        {isExpanded && (
          <div className="h-[calc(100%-6rem)] flex">
            {/* Current video info */}
            <div className="flex-1 p-6 flex flex-col">
              <div className="flex items-start gap-4">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-48 h-auto rounded-lg shadow-lg"
                />
                <div>
                  <h2 className="text-xl font-bold text-foreground">{video.title}</h2>
                  <p className="text-muted-foreground mt-1">{video.channel}</p>
                  {video.viewCount && (
                    <p className="text-sm text-muted-foreground mt-2">{video.viewCount}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Related videos */}
            {showRelated && relatedVideos.length > 0 && (
              <div className="w-80 border-l border-border/50 p-4 overflow-y-auto">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Up Next</h3>
                <div className="space-y-3">
                  {relatedVideos.slice(0, 5).map((rv) => (
                    <div 
                      key={rv.id}
                      onClick={() => player.loadVideo(rv)}
                      className="flex gap-3 cursor-pointer hover:bg-secondary/50 rounded-lg p-2 transition-colors"
                    >
                      <img 
                        src={rv.thumbnail} 
                        alt={rv.title}
                        className="w-24 h-auto rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{rv.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{rv.channel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Player controls */}
        <div className="h-24 flex items-center gap-4 px-4">
          {/* Track info (compact) */}
          <div className="flex items-center gap-3 w-64 flex-shrink-0">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-14 h-14 rounded-lg object-cover shadow-md"
            />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{video.title}</p>
              <p className="text-xs text-muted-foreground truncate">{video.channel}</p>
            </div>
          </div>

          {/* Center controls */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                disabled={!onPrevious}
                className="h-10 w-10"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button
                variant="default"
                size="icon"
                onClick={() => player.isPlaying ? player.pause() : player.play()}
                className="h-12 w-12 rounded-full"
              >
                {player.isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                disabled={!onNext}
                className="h-10 w-10"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xl flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(player.currentTime)}
              </span>
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                onValueChange={(value) => {
                  const newTime = (value[0] / 100) * player.duration;
                  player.seekTo(newTime);
                }}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(player.duration)}
              </span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 w-64 justify-end">
            {/* Volume */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => player.isMuted ? player.unmute() : player.mute()}
            >
              {player.isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[player.isMuted ? 0 : player.volume]}
              max={100}
              onValueChange={(value) => player.setVolume(value[0])}
              className="w-24"
            />

            {/* Related toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRelated(!showRelated)}
              className={cn(showRelated && "text-primary")}
            >
              <ListMusic className="h-4 w-4" />
            </Button>

            {/* Expand toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
