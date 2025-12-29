import { usePlayer, Track as PlayerTrack } from "@/contexts/PlayerContext";
import { MusicPlayer } from "@/components/MusicPlayer";
import { YouTubePlayerInline } from "@/components/youtube/YouTubePlayerInline";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { toast } from "sonner";

const PREVIEW_DURATION_SECONDS = 30;

export function GlobalMusicPlayer() {
  const { user } = useAuth();
  const { role } = useUserRole(user);
  const { hasFeature } = useSubscription(user);
  const { currentTrack, queue, nextTrack, previousTrack, setIsPlaying, isPlaying } = usePlayer();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const isArtist = role === 'artist' || role === 'verified_artist' || role === 'manager';
  const hasUnlimitedStreaming = hasFeature('unlimitedStreaming') || isArtist;

  const handleTrackEnd = () => {
    nextTrack();
  };

  const handlePreviewEnd = () => {
    setShowSubscriptionModal(true);
    setIsPlaying(false);
    toast.info("Preview ended - Subscribe for unlimited streaming!");
  };

  // Only render if there's a track
  if (!currentTrack) {
    return null;
  }

  // Check if this is a YouTube track
  const isYouTubeTrack = currentTrack.source === 'youtube' || currentTrack.youtubeId;

  if (isYouTubeTrack) {
    return (
      <>
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="glass-ultra border-t border-white/5 shadow-3d-lg">
            <YouTubePlayerInline
              track={currentTrack}
              onNext={nextTrack}
              onPrevious={previousTrack}
              onTrackEnd={handleTrackEnd}
              isPlaying={isPlaying}
              onPlayingChange={setIsPlaying}
            />
          </div>
        </div>
        <SubscriptionModal
          open={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
        />
      </>
    );
  }

  // Cast to the expected type since we ensure required fields in PlayerContext
  const playerTrack = currentTrack as unknown as {
    id: string;
    title: string;
    artist_name: string;
    duration: number;
    file_path: string;
    play_count: number;
    album_cover_path?: string;
    album_cover_bucket?: string;
    motion_cover_path?: string;
    motion_cover_bucket?: string;
    album?: { title: string; cover_art_path?: string; };
    ai_tags?: { metadata?: { isMotionCover?: boolean; artworkUrl?: string; }; };
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

      <SubscriptionModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
      />
    </>
  );
}
