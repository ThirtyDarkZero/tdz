import { MinimalTrackCard } from "./MinimalTrackCard";

interface MinimalTrackListProps {
  tracks: any[];
  currentTrackId?: string;
  likedTracks: Set<string>;
  onPlayTrack: (track: any) => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: any) => void;
  title?: string;
  showAll?: boolean;
}

export function MinimalTrackList({
  tracks,
  currentTrackId,
  likedTracks,
  onPlayTrack,
  onToggleLike,
  onAddToQueue,
  title,
  showAll = false
}: MinimalTrackListProps) {
  const displayTracks = showAll ? tracks : tracks.slice(0, 10);

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {!showAll && tracks.length > 10 && (
            <span className="text-sm text-white/40">
              Showing {displayTracks.length} of {tracks.length}
            </span>
          )}
        </div>
      )}
      
      <div className="space-y-1">
        {displayTracks.map((track, index) => (
          <MinimalTrackCard
            key={track.id}
            track={track}
            isPlaying={currentTrackId === track.id}
            isLiked={likedTracks.has(track.id)}
            onPlay={() => onPlayTrack(track)}
            onToggleLike={() => onToggleLike(track.id)}
            onAddToQueue={() => onAddToQueue(track)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
