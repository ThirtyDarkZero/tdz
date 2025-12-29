import { useState, useCallback, useRef, useEffect } from 'react';

export interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
  viewCount?: string;
  publishedAt?: string;
}

interface YouTubePlayerState {
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function useYouTubePlayer(containerId: string) {
  const [state, setState] = useState<YouTubePlayerState>({
    isReady: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
    isMuted: false,
  });
  
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setState(s => ({ ...s, isReady: true }));
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setState(s => ({ ...s, isReady: true }));
    };

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Initialize player for a video
  const loadVideo = useCallback((video: YouTubeVideo) => {
    if (!state.isReady) return;

    setCurrentVideo(video);

    // Destroy existing player
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    // Create new player
    playerRef.current = new window.YT.Player(containerId, {
      height: '0',
      width: '0',
      videoId: video.id,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: (event: any) => {
          const duration = event.target.getDuration();
          setState(s => ({ ...s, duration, isPlaying: true }));
          event.target.playVideo();
          
          // Start time tracking
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          intervalRef.current = window.setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
              const currentTime = playerRef.current.getCurrentTime();
              setState(s => ({ ...s, currentTime }));
            }
          }, 1000);
        },
        onStateChange: (event: any) => {
          const isPlaying = event.data === window.YT.PlayerState.PLAYING;
          setState(s => ({ ...s, isPlaying }));
          
          if (event.data === window.YT.PlayerState.ENDED) {
            // Video ended - could trigger next in queue
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          }
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data);
        },
      },
    });
  }, [state.isReady, containerId]);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  const setVolume = useCallback((volume: number) => {
    playerRef.current?.setVolume(volume);
    setState(s => ({ ...s, volume }));
  }, []);

  const mute = useCallback(() => {
    playerRef.current?.mute();
    setState(s => ({ ...s, isMuted: true }));
  }, []);

  const unmute = useCallback(() => {
    playerRef.current?.unMute();
    setState(s => ({ ...s, isMuted: false }));
  }, []);

  const destroy = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    playerRef.current?.destroy();
    playerRef.current = null;
    setCurrentVideo(null);
  }, []);

  return {
    ...state,
    currentVideo,
    loadVideo,
    play,
    pause,
    seekTo,
    setVolume,
    mute,
    unmute,
    destroy,
  };
}
