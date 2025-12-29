import { useState, useCallback } from 'react';
import { YouTubeBrowser } from './YouTubeBrowser';
import { YouTubePlayer } from './YouTubePlayer';
import { YouTubeVideo } from '@/hooks/useYouTubePlayer';

export function YouTubeSection() {
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [queue, setQueue] = useState<YouTubeVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleVideoSelect = useCallback((video: YouTubeVideo) => {
    setCurrentVideo(video);
    // Add to queue if not already there
    setQueue(prev => {
      const exists = prev.some(v => v.id === video.id);
      if (!exists) {
        return [...prev, video];
      }
      return prev;
    });
    setCurrentIndex(queue.findIndex(v => v.id === video.id) || queue.length);
  }, [queue]);

  const handleNext = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentVideo(queue[currentIndex + 1]);
    }
  }, [currentIndex, queue]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentVideo(queue[currentIndex - 1]);
    }
  }, [currentIndex, queue]);

  return (
    <div className="h-full flex flex-col">
      <YouTubeBrowser 
        onVideoSelect={handleVideoSelect}
        currentVideoId={currentVideo?.id}
      />
      <YouTubePlayer
        video={currentVideo}
        queue={queue}
        onNext={queue.length > currentIndex + 1 ? handleNext : undefined}
        onPrevious={currentIndex > 0 ? handlePrevious : undefined}
      />
    </div>
  );
}

export { YouTubeBrowser } from './YouTubeBrowser';
export { YouTubePlayer } from './YouTubePlayer';
