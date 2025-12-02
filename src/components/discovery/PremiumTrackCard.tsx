import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { MotionCover } from "@/components/MotionCover";
import { TrackOptionsMenu } from "./TrackOptionsMenu";
import { useState } from "react";

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

interface PremiumTrackCardProps {
  track: Track;
  index: number;
  playlists: Array<{ id: string; name: string }>;
  isLiked: boolean;
  isPlaying?: boolean;
  onPlay: () => void;
  onToggleLike: () => void;
  onAddToQueue?: () => void;
  onPlaylistUpdate?: () => void;
}

export function PremiumTrackCard({
  track,
  index,
  playlists,
  isLiked,
  isPlaying = false,
  onPlay,
  onToggleLike,
  onAddToQueue,
  onPlaylistUpdate
}: PremiumTrackCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div 
        className={`
          relative cursor-pointer transform-3d transition-all duration-500 ease-out
          ${isHovered ? 'scale-[1.03] -translate-y-3' : 'scale-100'}
        `}
        onClick={() => navigate(`/track/${track.id}`)}
      >
        {/* Glow effect behind card */}
        <div 
          className={`
            absolute -inset-2 rounded-2xl opacity-0 transition-opacity duration-500 blur-xl
            ${isHovered ? 'opacity-100' : ''}
          `}
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--secondary) / 0.3))'
          }}
        />
        
        {/* Main card */}
        <div className="relative glass-ultra rounded-xl overflow-hidden border border-white/10">
          {/* Album art container */}
          <div className="relative aspect-square overflow-hidden">
            {/* Animated gradient overlay */}
            <div 
              className={`
                absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent
                transition-opacity duration-300
                ${isHovered ? 'opacity-100' : 'opacity-60'}
              `}
            />
            
            {/* Motion/Static cover */}
            <MotionCover
              motionCoverPath={track.motion_cover_path}
              motionCoverBucket={track.motion_cover_bucket}
              staticCoverPath={track.album_cover_path}
              staticCoverBucket={track.album_cover_bucket || "album-covers"}
              alt={track.title}
              className={`
                w-full h-full object-cover transition-transform duration-700 ease-out
                ${isHovered ? 'scale-110' : 'scale-100'}
              `}
            />
            
            {/* Play button overlay */}
            <div 
              className={`
                absolute inset-0 z-20 flex items-center justify-center
                transition-all duration-300
                ${isHovered ? 'opacity-100' : 'opacity-0'}
              `}
            >
              <Button 
                size="icon" 
                className={`
                  h-16 w-16 rounded-full shadow-glow-lg
                  bg-primary hover:bg-primary/90 text-primary-foreground
                  transform transition-all duration-300
                  ${isHovered ? 'scale-100' : 'scale-75'}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay();
                }}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7" fill="currentColor" />
                ) : (
                  <Play className="w-7 h-7 ml-1" fill="currentColor" />
                )}
              </Button>
            </div>
            
            {/* Options menu */}
            <div 
              className={`
                absolute top-3 right-3 z-30 transition-all duration-300
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
              `}
            >
              <TrackOptionsMenu
                track={track}
                playlists={playlists}
                isLiked={isLiked}
                onToggleLike={onToggleLike}
                onAddToQueue={onAddToQueue}
                onPlaylistUpdate={onPlaylistUpdate}
              />
            </div>
            
            {/* Playing indicator */}
            {isPlaying && (
              <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1">
                <div className="flex items-end gap-0.5 h-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full animate-pulse"
                      style={{
                        height: `${40 + Math.random() * 60}%`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Track info */}
          <div className="p-4 space-y-1 bg-gradient-to-t from-card to-transparent">
            <p className="font-semibold text-sm truncate text-foreground/95">{track.title}</p>
            <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}