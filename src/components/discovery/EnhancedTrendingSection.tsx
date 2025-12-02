import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, Share2, TrendingUp, Crown, Flame } from "lucide-react";
import { MotionCover } from "@/components/MotionCover";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  user_id?: string;
  play_count?: number;
  duration?: number;
  album_cover_path?: string;
  album_cover_bucket?: string;
  motion_cover_path?: string;
  motion_cover_bucket?: string;
}

interface EnhancedTrendingSectionProps {
  tracks: Track[];
  likedTracks: Set<string>;
  onPlayTrack: (track: Track) => void;
  onToggleLike: (trackId: string) => void;
  formatDuration: (seconds: number) => string;
}

export function EnhancedTrendingSection({ 
  tracks, 
  likedTracks, 
  onPlayTrack, 
  onToggleLike,
  formatDuration 
}: EnhancedTrendingSectionProps) {
  const navigate = useNavigate();
  
  // Sort by play count for trending
  const trendingTracks = [...tracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0));

  return (
    <div className="space-y-8">
      {/* Epic header */}
      <div className="relative">
        <div className="space-y-3">
          <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-2">
            <Flame className="w-4 h-4 mr-2" />
            Updated Daily
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter">
            <span className="text-gradient-aurora glow-text-ultra">THE CHARTS</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
            Top trending tracks ranked by plays and engagement
          </p>
        </div>
      </div>

      {trendingTracks.length > 0 ? (
        <Card className="glass-ultra overflow-hidden border border-white/10">
          <div className="divide-y divide-white/5">
            {trendingTracks.slice(0, 50).map((track, index) => (
              <TrendingTrackRow
                key={track.id}
                track={track}
                index={index}
                isLiked={likedTracks.has(track.id)}
                onPlay={() => onPlayTrack(track)}
                onToggleLike={() => onToggleLike(track.id)}
                onShare={() => navigate(`/track/${track.id}`)}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        </Card>
      ) : (
        <Card className="glass-ultra p-16 text-center border border-white/10">
          <TrendingUp className="w-20 h-20 mx-auto mb-6 text-muted-foreground/50" />
          <h3 className="text-3xl font-bold mb-3">No Trending Tracks Yet</h3>
          <p className="text-muted-foreground text-lg">
            Charts are updated based on recent plays and engagement
          </p>
        </Card>
      )}
    </div>
  );
}

function TrendingTrackRow({
  track,
  index,
  isLiked,
  onPlay,
  onToggleLike,
  onShare,
  formatDuration
}: {
  track: Track;
  index: number;
  isLiked: boolean;
  onPlay: () => void;
  onToggleLike: () => void;
  onShare: () => void;
  formatDuration: (seconds: number) => string;
}) {
  const rank = index + 1;
  
  return (
    <div
      className="flex items-center gap-4 p-4 md:p-5 hover:bg-white/5 transition-all duration-300 group cursor-pointer animate-fade-in"
      style={{ animationDelay: `${index * 0.03}s` }}
      onClick={onPlay}
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-12 text-center">
        {rank <= 3 ? (
          <div className={`
            inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-black
            ${rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900 shadow-lg shadow-yellow-500/30' :
              rank === 2 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700' :
              'bg-gradient-to-br from-amber-500 to-amber-700 text-amber-100'}
          `}>
            {rank === 1 ? <Crown className="w-5 h-5" /> : rank}
          </div>
        ) : (
          <span className={`
            text-xl font-bold
            ${rank <= 10 ? 'text-primary glow-text' : 'text-muted-foreground'}
          `}>
            {rank}
          </span>
        )}
      </div>

      {/* Album art */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-primary/30 transition-all">
          <MotionCover
            motionCoverPath={track.motion_cover_path}
            motionCoverBucket={track.motion_cover_bucket}
            staticCoverPath={track.album_cover_path}
            staticCoverBucket={track.album_cover_bucket || "album-covers"}
            alt={track.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
          <Play className="w-6 h-6 text-white" fill="currentColor" />
        </div>
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm md:text-base group-hover:text-primary transition-colors">
          {track.title}
        </p>
        <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
      </div>

      {/* Duration */}
      <div className="hidden md:block text-sm text-muted-foreground flex-shrink-0 tabular-nums">
        {formatDuration(track.duration || 0)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike();
          }}
          className={`
            h-9 w-9 rounded-full transition-all
            ${isLiked ? 'text-primary bg-primary/10' : 'hover:bg-white/10'}
          `}
        >
          <Heart
            className="w-5 h-5"
            fill={isLiked ? "currentColor" : "none"}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className="h-9 w-9 rounded-full hover:bg-white/10"
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}