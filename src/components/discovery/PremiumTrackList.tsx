import { Play, Pause, Heart, MoreHorizontal, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  album_title?: string;
  duration?: number;
  play_count?: number;
  created_at?: string;
}

interface PremiumTrackListProps {
  sectionNumber?: number;
  title?: string;
  subtitle?: string;
  tracks: Track[];
  currentTrackId?: string;
  likedTracks?: string[];
  onPlayTrack: (track: Track) => void;
  onToggleLike?: (trackId: string) => void;
  onAddToQueue?: (track: Track) => void;
  maxTracks?: number;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PremiumTrackList({
  sectionNumber = 4,
  title = "All Tracks",
  subtitle,
  tracks,
  currentTrackId,
  likedTracks = [],
  onPlayTrack,
  onToggleLike,
  onAddToQueue,
  maxTracks = 10,
}: PremiumTrackListProps) {
  const displayTracks = tracks.slice(0, maxTracks);

  if (displayTracks.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16 bg-[#030303]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-8">
        <div className="flex items-baseline gap-10">
          {typeof sectionNumber === "number" && sectionNumber > 0 && (
            <span className="text-white/20 text-5xl md:text-6xl font-black font-display">
              {sectionNumber}
            </span>
          )}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
              {title}
            </h2>
            <p className="text-white/40 text-sm mt-1">{subtitle || `${tracks.length} tracks available`}</p>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Column headers */}
        <div className="grid grid-cols-[40px_1fr_1fr_100px_60px] gap-4 px-4 py-3 text-white/40 text-xs uppercase tracking-wider border-b border-white/5 mb-2">
          <div>#</div>
          <div>Title</div>
          <div className="hidden md:block">Album</div>
          <div className="text-right hidden sm:block">
            <Clock className="w-4 h-4 inline" />
          </div>
          <div></div>
        </div>

        {/* Tracks */}
        <div className="space-y-1">
          {displayTracks.map((track, index) => {
            const isPlaying = currentTrackId === track.id;
            const isLiked = likedTracks.includes(track.id);

            return (
              <div
                key={track.id}
                className={`
                  group grid grid-cols-[40px_1fr_1fr_100px_60px] gap-4 items-center px-4 py-3 rounded-lg
                  transition-all duration-200 cursor-pointer
                  ${isPlaying 
                    ? 'bg-white/10 text-white' 
                    : 'hover:bg-white/5 text-white/70 hover:text-white'
                  }
                `}
                onClick={() => onPlayTrack(track)}
              >
                {/* Number / Play icon */}
                <div className="relative">
                  <span className={`
                    text-sm font-medium transition-opacity
                    ${isPlaying ? 'text-cyan-400' : ''}
                    group-hover:opacity-0
                  `}>
                    {isPlaying ? (
                      <div className="flex items-center gap-0.5">
                        <span className="w-0.5 h-3 bg-cyan-400 rounded-full animate-pulse" />
                        <span className="w-0.5 h-4 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(track);
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-cyan-400" fill="currentColor" />
                    ) : (
                      <Play className="w-4 h-4" fill="currentColor" />
                    )}
                  </Button>
                </div>

                {/* Title & Artist */}
                <div className="min-w-0">
                  <p className={`
                    font-medium truncate transition-colors
                    ${isPlaying ? 'text-cyan-400' : ''}
                  `}>
                    {track.title}
                  </p>
                  <p className="text-sm text-white/40 truncate">{track.artist_name}</p>
                </div>

                {/* Album */}
                <div className="hidden md:block">
                  <p className="text-sm text-white/40 truncate">
                    {track.album_title || 'Single'}
                  </p>
                </div>

                {/* Duration */}
                <div className="text-right text-sm hidden sm:block">
                  {formatDuration(track.duration)}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onToggleLike && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(track.id);
                      }}
                    >
                      <Heart 
                        className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white/60'}`} 
                      />
                    </Button>
                  )}
                  {onAddToQueue && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue(track);
                      }}
                    >
                      <Plus className="w-4 h-4 text-white/60" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more */}
        {tracks.length > maxTracks && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20"
            >
              Show all {tracks.length} tracks
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
