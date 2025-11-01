import { createContext, useContext, useState, ReactNode } from "react";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  duration: number;
  file_path: string;
  play_count: number;
  album_cover_path?: string;
  album_cover_bucket?: string;
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

interface MusicPlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  setCurrentTrack: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  setCurrentIndex: (index: number) => void;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  nextTrack: () => void;
  previousTrack: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const playTrack = (track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track);
    if (newQueue) {
      setQueue(newQueue);
      const index = newQueue.findIndex(t => t.id === track.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
  };

  const nextTrack = () => {
    if (currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1];
      setCurrentTrack(nextTrack);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousTrack = () => {
    if (currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1];
      setCurrentTrack(prevTrack);
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        queue,
        currentIndex,
        setCurrentTrack,
        setQueue,
        setCurrentIndex,
        playTrack,
        nextTrack,
        previousTrack,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }
  return context;
};
