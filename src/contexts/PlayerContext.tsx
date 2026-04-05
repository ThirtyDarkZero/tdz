import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

// Track interface for the global player - matches MusicPlayer expectations
export interface Track {
  id: string;
  title: string;
  artist_name: string;
  duration: number;
  file_path: string;
  play_count: number;
  file_bucket?: string;
  album_cover_path?: string;
  album_cover_bucket?: string;
  motion_cover_path?: string;
  motion_cover_bucket?: string;
  user_id?: string;
  artist_user_id?: string;
  album_id?: string;
  album_title?: string;
  lyrics?: string;
  is_published?: boolean;
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
  // YouTube support
  source?: 'tdz' | 'youtube' | 'spotify';
  youtubeId?: string;
  thumbnail?: string;
  // Spotify preview URL fallback for audio playback
  spotifyPreviewUrl?: string;
  spotifyId?: string;
}

interface YouTubePlayerState {
  isReady: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

export type PlayerViewState = 'full' | 'mini' | 'hidden';
export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  
  // Player view state
  playerView: PlayerViewState;
  setPlayerView: (view: PlayerViewState) => void;
  
  // Playback controls
  playTrack: (track: Track, newQueue?: Track[]) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  
  // Queue management
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  
  // State setters
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  currentTime: number;
  
  // Repeat mode
  repeatMode: RepeatMode;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeatMode: () => void;
  
  // YouTube player state
  youtubeState: YouTubePlayerState;
  youtubePlayer: any;
  setYoutubePlayer: (player: any) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    youtubeApiLoaded?: boolean;
    youtubeApiCallbacks?: (() => void)[];
  }
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [playerView, setPlayerView] = useState<PlayerViewState>('full');
  const [currentTime, setCurrentTime] = useState(0);
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
  const [youtubeState, setYoutubeState] = useState<YouTubePlayerState>({
    isReady: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
    isMuted: false,
  });
  
  const intervalRef = useRef<number | null>(null);

  // Load YouTube IFrame API on mount
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setYoutubeState(s => ({ ...s, isReady: true }));
      return;
    }

    // Set up callback for API ready
    if (!window.youtubeApiCallbacks) {
      window.youtubeApiCallbacks = [];
    }
    
    window.youtubeApiCallbacks.push(() => {
      setYoutubeState(s => ({ ...s, isReady: true }));
    });

    if (!window.youtubeApiLoaded) {
      window.youtubeApiLoaded = true;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        window.youtubeApiCallbacks?.forEach(cb => cb());
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update time tracking for YouTube
  useEffect(() => {
    if (currentTrack?.source === 'youtube' && youtubePlayer && isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = window.setInterval(() => {
        if (youtubePlayer?.getCurrentTime) {
          const time = youtubePlayer.getCurrentTime();
          setCurrentTime(time);
          setYoutubeState(s => ({ ...s, currentTime: time }));
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentTrack, youtubePlayer, isPlaying]);

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    // Immediate playback - no delay for snappy response
    setCurrentTrack(track);
    setCurrentTime(0);
    setIsPlaying(true);
    
    if (newQueue) {
      setQueue(newQueue);
      const index = newQueue.findIndex(t => t.id === track.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
  }, []);

  const pauseTrack = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resumeTrack = useCallback(() => {
    if (currentTrack) {
      setIsPlaying(true);
    }
  }, [currentTrack]);

  const nextTrack = useCallback(() => {
    if (repeatMode === 'one') {
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }
    if (currentIndex < queue.length - 1) {
      const next = queue[currentIndex + 1];
      setCurrentTrack(next);
      setCurrentIndex(currentIndex + 1);
      setCurrentTime(0);
      setIsPlaying(true);
    } else if (repeatMode === 'all' && queue.length > 0) {
      setCurrentTrack(queue[0]);
      setCurrentIndex(0);
      setCurrentTime(0);
      setIsPlaying(true);
    } else if (queue.length > 0 && currentTrack) {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, [currentIndex, queue, currentTrack, repeatMode]);

  const previousTrack = useCallback(() => {
    if (currentIndex > 0) {
      const prev = queue[currentIndex - 1];
      setCurrentTrack(prev);
      setCurrentIndex(currentIndex - 1);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [currentIndex, queue]);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      return newQueue;
    });
    
    // Adjust current index if needed
    if (fromIndex === currentIndex) {
      setCurrentIndex(toIndex);
    } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
      setCurrentIndex(prev => prev - 1);
    } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        currentIndex,
        isPlaying,
        playerView,
        setPlayerView,
        playTrack,
        pauseTrack,
        resumeTrack,
        nextTrack,
        previousTrack,
        addToQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        setIsPlaying,
        setCurrentTime,
        currentTime,
        youtubeState,
        youtubePlayer,
        setYoutubePlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    // Return safe defaults instead of throwing
    // This allows components to render even if PlayerProvider is temporarily unavailable
    console.warn('usePlayer called outside PlayerProvider, returning defaults');
    return {
      currentTrack: null,
      queue: [],
      currentIndex: 0,
      isPlaying: false,
      playerView: 'full' as PlayerViewState,
      setPlayerView: () => {},
      playTrack: () => {},
      pauseTrack: () => {},
      resumeTrack: () => {},
      nextTrack: () => {},
      previousTrack: () => {},
      addToQueue: () => {},
      removeFromQueue: () => {},
      clearQueue: () => {},
      reorderQueue: () => {},
      setIsPlaying: () => {},
      setCurrentTime: () => {},
      currentTime: 0,
      youtubeState: { isReady: false, currentTime: 0, duration: 0, volume: 100, isMuted: false },
      youtubePlayer: null,
      setYoutubePlayer: () => {},
    } as PlayerContextType;
  }
  return context;
}
