import { Play, Pause, Heart, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MinimalTrackCardProps {
  track: {
    id: string;
    title: string;
    artist_name: string;
    album_cover_path?: string;
    album_cover_bucket?: string;
    duration?: number;
    play_count?: number;
    genre?: string;
    source?: string;
    thumbnail?: string;
  };
  isPlaying?: boolean;
  isLiked?: boolean;
  onPlay: () => void;
  onToggleLike?: () => void;
  onAddToQueue?: () => void;
  index?: number;
}

export function MinimalTrackCard({
  track,
  isPlaying,
  isLiked,
  onPlay,
  onToggleLike,
  onAddToQueue,
  index = 0
}: MinimalTrackCardProps) {
  const coverUrl = track.thumbnail || (track.album_cover_path 
    ? supabase.storage.from(track.album_cover_bucket || 'album-covers').getPublicUrl(track.album_cover_path).data.publicUrl
    : null);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="group relative bg-white/[0.02] hover:bg-white/[0.06] rounded-lg p-3 transition-all duration-200 cursor-pointer"
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={onPlay}
    >
      <div className="flex items-center gap-3">
        {/* Cover Art */}
        <div className="relative w-12 h-12 rounded overflow-hidden bg-white/5 flex-shrink-0">
          {coverUrl ? (
            <img 
              src={coverUrl} 
              alt={track.title} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
          )}
          
          {/* Play overlay */}
          <div className={`
            absolute inset-0 bg-black/40 flex items-center justify-center
            transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}>
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" fill="white" />
            ) : (
              <Play className="w-5 h-5 text-white" fill="white" />
            )}
          </div>
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm truncate ${isPlaying ? 'text-cyan-400' : 'text-white'}`}>
            {track.title}
          </p>
          <p className="text-xs text-white/50 truncate">
            {track.artist_name}
            {track.source === 'youtube' && (
              <span className="ml-2 text-red-400/70">• YouTube</span>
            )}
          </p>
        </div>

        {/* Duration */}
        {track.duration && (
          <span className="text-xs text-white/30 hidden sm:block">
            {formatDuration(track.duration)}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {onToggleLike && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
              onClick={onToggleLike}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-cyan-400 text-cyan-400' : ''}`} />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
              {onAddToQueue && (
                <DropdownMenuItem onClick={onAddToQueue} className="text-white/80">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Queue
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
