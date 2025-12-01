import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { MotionCover } from "@/components/MotionCover";
import { TrackOptionsMenu } from "./TrackOptionsMenu";

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

interface TrackGridProps {
  tracks: Track[];
  title: string;
  playlists: Array<{ id: string; name: string }>;
  likedTracks: Set<string>;
  onPlayTrack: (track: Track) => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue?: (track: Track) => void;
  onPlaylistUpdate?: () => void;
}

export function TrackGrid({ 
  tracks, 
  title, 
  playlists,
  likedTracks,
  onPlayTrack,
  onToggleLike,
  onAddToQueue,
  onPlaylistUpdate
}: TrackGridProps) {
  const navigate = useNavigate();

  if (tracks.length === 0) return null;

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
        <Badge variant="outline" className="text-xs px-2 py-1">
          {tracks.length}
        </Badge>
      </div>
      
      {/* Mobile Carousel */}
      <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-3 pb-2">
          {tracks.slice(0, 12).map((track) => (
            <div 
              key={track.id}
              className="flex-shrink-0 w-[calc(50%-6px)] cursor-pointer group"
              onClick={() => navigate(`/track/${track.id}`)}
            >
              <div className="space-y-2">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                  <MotionCover
                    motionCoverPath={track.motion_cover_path}
                    motionCoverBucket={track.motion_cover_bucket}
                    staticCoverPath={track.album_cover_path}
                    staticCoverBucket={track.album_cover_bucket || "album-covers"}
                    alt={track.title}
                    className="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      size="icon" 
                      className="h-10 w-10 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track);
                      }}
                    >
                      <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium truncate">{track.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{track.artist_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tracks.slice(0, 20).map((track) => (
          <div 
            key={track.id}
            className="group cursor-pointer"
            onClick={() => navigate(`/track/${track.id}`)}
          >
            <div className="space-y-2">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                <MotionCover
                  motionCoverPath={track.motion_cover_path}
                  motionCoverBucket={track.motion_cover_bucket}
                  staticCoverPath={track.album_cover_path}
                  staticCoverBucket={track.album_cover_bucket || "album-covers"}
                  alt={track.title}
                  className="w-full h-full group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    size="icon" 
                    className="h-12 w-12 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(track);
                    }}
                  >
                    <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                  </Button>
                </div>
                <div className="absolute top-2 right-2 z-10">
                  <TrackOptionsMenu
                    track={track}
                    playlists={playlists}
                    isLiked={likedTracks.has(track.id)}
                    onToggleLike={() => onToggleLike(track.id)}
                    onAddToQueue={onAddToQueue ? () => onAddToQueue(track) : undefined}
                    onPlaylistUpdate={onPlaylistUpdate}
                  />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium truncate">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
