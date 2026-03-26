import { useEffect, useState, useCallback, useRef } from "react";
import { usePlayer, Track as PlayerTrack } from "@/contexts/PlayerContext";
import { MusicPlayer } from "@/components/MusicPlayer";
import { YouTubePlayerEnhanced } from "@/components/youtube/YouTubePlayerEnhanced";
import { SpotifyPreviewPlayer } from "@/components/SpotifyPreviewPlayer";
import { CosmicPlayerBar } from "@/components/discovery/CosmicPlayerBar";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PREVIEW_DURATION_SECONDS = 30;

export function GlobalMusicPlayer() {
  const { user } = useAuth();
  const { role } = useUserRole(user);
  const { hasFeature } = useSubscription(user);
  const { currentTrack, queue, nextTrack, previousTrack, setIsPlaying, isPlaying, playTrack, playerView } = usePlayer();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [youtubeErrorCount, setYoutubeErrorCount] = useState(0);
  const [useSpotifyFallback, setUseSpotifyFallback] = useState(false);
  const lastTrackIdRef = useRef<string>('');
  
  const isArtist = role === 'artist' || role === 'verified_artist' || role === 'manager';
  const hasUnlimitedStreaming = hasFeature('unlimitedStreaming') || isArtist;
  
  // Reset fallback state when track changes
  useEffect(() => {
    if (currentTrack?.id && currentTrack.id !== lastTrackIdRef.current) {
      lastTrackIdRef.current = currentTrack.id;
      setUseSpotifyFallback(false);
      setYoutubeErrorCount(0);
    }
  }, [currentTrack?.id]);
  
  const handleYouTubeError = useCallback(() => {
    setYoutubeErrorCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 2 && currentTrack?.spotifyPreviewUrl) {
        setUseSpotifyFallback(true);
        toast.info("Using Spotify preview for this track");
      } else if (newCount >= 2) {
        nextTrack();
      }
      return newCount;
    });
  }, [currentTrack?.spotifyPreviewUrl, nextTrack]);

  const loadMoreFromArtist = useCallback(async (artistName: string) => {
    if (!artistName) return;
    try {
      const { data } = await supabase.functions.invoke('youtube-search', {
        body: { query: `${artistName} official audio`, maxResults: 10, officialOnly: true }
      });
      if (data?.results?.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const nextVideo = data.results[randomIndex];
        const track = {
          id: `yt-${nextVideo.id}`,
          title: nextVideo.title,
          artist_name: artistName,
          duration: 0,
          file_path: '',
          play_count: 0,
          source: 'youtube' as const,
          youtubeId: nextVideo.id,
          thumbnail: nextVideo.thumbnail,
        };
        const queueTracks = data.results.map((video: any) => ({
          id: `yt-${video.id}`,
          title: video.title,
          artist_name: artistName,
          duration: 0,
          file_path: '',
          play_count: 0,
          source: 'youtube' as const,
          youtubeId: video.id,
          thumbnail: video.thumbnail,
        }));
        playTrack(track, queueTracks);
        toast.success(`Playing more by ${artistName}`);
      }
    } catch (error) {
      console.error('Error loading more from artist:', error);
    }
  }, [playTrack]);

  const handleTrackEnd = useCallback(() => {
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    const hasMoreInQueue = currentIndex >= 0 && currentIndex < queue.length - 1;
    if (hasMoreInQueue) {
      nextTrack();
    } else if (currentTrack?.artist_name) {
      loadMoreFromArtist(currentTrack.artist_name);
    }
  }, [currentTrack, queue, nextTrack, loadMoreFromArtist]);

  const handlePreviewEnd = () => {
    setShowSubscriptionModal(true);
    setIsPlaying(false);
    toast.info("Preview ended - Subscribe for unlimited streaming!");
  };

  if (!currentTrack) return null;

  // When in mini or hidden mode, use CosmicPlayerBar (handles its own visibility)
  if (playerView === 'mini' || playerView === 'hidden') {
    return (
      <>
        <CosmicPlayerBar />
        <SubscriptionModal open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal} />
      </>
    );
  }

  // Full player mode
  const isYouTubeTrack = currentTrack.source === 'youtube' || currentTrack.youtubeId;

  if (useSpotifyFallback && currentTrack.spotifyPreviewUrl) {
    return (
      <>
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="glass-ultra border-t border-white/5 shadow-3d-lg">
            <SpotifyPreviewPlayer
              track={currentTrack}
              queue={queue}
              onNext={nextTrack}
              onPrevious={previousTrack}
              onTrackEnd={handleTrackEnd}
              isPlaying={isPlaying}
              onPlayingChange={setIsPlaying}
            />
          </div>
        </div>
        <SubscriptionModal open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal} />
      </>
    );
  }

  if (isYouTubeTrack) {
    return (
      <>
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="glass-ultra border-t border-white/5 shadow-3d-lg">
            <YouTubePlayerEnhanced
              track={currentTrack}
              queue={queue}
              onNext={nextTrack}
              onPrevious={previousTrack}
              onTrackEnd={handleTrackEnd}
              isPlaying={isPlaying}
              onPlayingChange={setIsPlaying}
              onError={handleYouTubeError}
            />
          </div>
        </div>
        <SubscriptionModal open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal} />
      </>
    );
  }

  const playerTrack = currentTrack as unknown as {
    id: string; title: string; artist_name: string; duration: number;
    file_path: string; play_count: number; album_cover_path?: string;
    album_cover_bucket?: string; motion_cover_path?: string;
    motion_cover_bucket?: string;
    album?: { title: string; cover_art_path?: string };
    ai_tags?: { metadata?: { isMotionCover?: boolean; artworkUrl?: string } };
  };
  const playerQueue = queue as unknown as typeof playerTrack[];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="glass-ultra border-t border-white/5 shadow-3d-lg">
          <MusicPlayer
            currentTrack={playerTrack}
            queue={playerQueue}
            onNext={nextTrack}
            onPrevious={previousTrack}
            onTrackEnd={handleTrackEnd}
            maxDuration={!hasUnlimitedStreaming ? PREVIEW_DURATION_SECONDS : undefined}
            onPreviewEnd={!hasUnlimitedStreaming ? handlePreviewEnd : undefined}
          />
        </div>
      </div>
      <SubscriptionModal open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal} />
    </>
  );
}