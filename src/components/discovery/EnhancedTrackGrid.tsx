import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { PremiumTrackCard } from "./PremiumTrackCard";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  user_id?: string;
  artist_user_id?: string;
  album_cover_path?: string;
  album_cover_bucket?: string;
  motion_cover_path?: string;
  motion_cover_bucket?: string;
}

interface EnhancedTrackGridProps {
  tracks: Track[];
  title: string;
  playlists: Array<{ id: string; name: string }>;
  likedTracks: Set<string>;
  currentTrackId?: string;
  onPlayTrack: (track: Track) => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue?: (track: Track) => void;
  onPlaylistUpdate?: () => void;
}

export function EnhancedTrackGrid({ 
  tracks, 
  title, 
  playlists,
  likedTracks,
  currentTrackId,
  onPlayTrack,
  onToggleLike,
  onAddToQueue,
  onPlaylistUpdate
}: EnhancedTrackGridProps) {
  if (tracks.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-gradient-aurora glow-text">{title}</span>
          </h2>
          <div className="hidden md:flex h-px flex-1 max-w-32 bg-gradient-to-r from-primary/50 to-transparent" />
        </div>
        <Badge 
          variant="outline" 
          className="text-sm px-4 py-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <Sparkles className="w-3 h-3 mr-2 text-primary" />
          {tracks.length} Tracks
        </Badge>
      </div>
      
      {/* Mobile Carousel */}
      <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-4 pb-4">
          {tracks.slice(0, 12).map((track, index) => (
            <div key={track.id} className="flex-shrink-0 w-44">
              <PremiumTrackCard
                track={track}
                index={index}
                playlists={playlists}
                isLiked={likedTracks.has(track.id)}
                isPlaying={currentTrackId === track.id}
                onPlay={() => onPlayTrack(track)}
                onToggleLike={() => onToggleLike(track.id)}
                onAddToQueue={onAddToQueue ? () => onAddToQueue(track) : undefined}
                onPlaylistUpdate={onPlaylistUpdate}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Grid with staggered animation */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {tracks.slice(0, 20).map((track, index) => (
          <PremiumTrackCard
            key={track.id}
            track={track}
            index={index}
            playlists={playlists}
            isLiked={likedTracks.has(track.id)}
            isPlaying={currentTrackId === track.id}
            onPlay={() => onPlayTrack(track)}
            onToggleLike={() => onToggleLike(track.id)}
            onAddToQueue={onAddToQueue ? () => onAddToQueue(track) : undefined}
            onPlaylistUpdate={onPlaylistUpdate}
          />
        ))}
      </div>
    </div>
  );
}