import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { usePlayer, Track as PlayerTrack } from "@/contexts/PlayerContext";
import { MusicPlayer } from "@/components/MusicPlayer";
import { YouTubePlayerEnhanced } from "@/components/youtube/YouTubePlayerEnhanced";
import { SpotifyPreviewPlayer } from "@/components/SpotifyPreviewPlayer";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OrbPlayerBar } from "@/components/discovery/OrbPlayerBar";
import { useLocation as useRouterLocation } from "react-router-dom";

const PREVIEW_DURATION_SECONDS = 30;

const HIDDEN_ROUTES = ['/', '/auth', '/role-selection', '/pricing', '/checkout', '/terms', '/privacy', '/faq', '/support', '/investors'];

export function GlobalMusicPlayer() {
  const location = useLocation();
  const { user } = useAuth();
  const { role } = useUserRole(user);
  const { hasFeature } = useSubscription(user);
  const { currentTrack, queue, nextTrack, previousTrack, setIsPlaying, isPlaying, playTrack } = usePlayer();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [youtubeErrorCount, setYoutubeErrorCount] = useState(0);
  const [useSpotifyFallback, setUseSpotifyFallback] = useState(false);
  const lastTrackIdRef = useRef<string>('');
  
  const isArtist = role === 'artist' || role === 'verified_artist' || role === 'manager';
  const hasUnlimitedStreaming = hasFeature('unlimitedStreaming') || isArtist;

  const shouldHidePlayer = HIDDEN_ROUTES.includes(location.pathname);
  
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

  if (shouldHidePlayer) return null;

  const isYouTubeTrack = currentTrack?.source === 'youtube' || currentTrack?.youtubeId;

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
      {/* Hidden audio engine - renders the actual audio/video elements but no visible UI */}
      {currentTrack && (
        <div className="fixed -left-[9999px] -top-[9999px] w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {useSpotifyFallback && currentTrack.spotifyPreviewUrl ? (
            <SpotifyPreviewPlayer
              track={currentTrack}
              queue={queue}
              onNext={nextTrack}
              onPrevious={previousTrack}
              onTrackEnd={handleTrackEnd}
              isPlaying={isPlaying}
              onPlayingChange={setIsPlaying}
            />
          ) : isYouTubeTrack ? (
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
          ) : (
            <MusicPlayer
              currentTrack={playerTrack}
              queue={playerQueue}
              onNext={nextTrack}
              onPrevious={previousTrack}
              onTrackEnd={handleTrackEnd}
              maxDuration={!hasUnlimitedStreaming ? PREVIEW_DURATION_SECONDS : undefined}
              onPreviewEnd={!hasUnlimitedStreaming ? handlePreviewEnd : undefined}
            />
          )}
        </div>
      )}

      {/* Visible orb player bar */}
      <OrbPlayerBar />

      <SubscriptionModal open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal} />
    </>
  );
}
