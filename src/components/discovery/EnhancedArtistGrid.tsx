import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Award, Medal, UserPlus, User, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  profile_image_path?: string;
  monthly_listeners?: number;
  verified?: boolean;
}

interface EnhancedArtistGridProps {
  artists: Artist[];
  followedArtists: Set<string>;
  onToggleFollow: (artistUserId: string) => void;
}

export function EnhancedArtistGrid({ artists, followedArtists, onToggleFollow }: EnhancedArtistGridProps) {
  const navigate = useNavigate();

  const getRankingBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="absolute -top-3 -left-3 z-20">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-600 flex items-center justify-center shadow-lg ring-4 ring-yellow-400/30 animate-pulse">
            <Crown className="w-5 h-5 text-yellow-900" />
          </div>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="absolute -top-3 -left-3 z-20">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 flex items-center justify-center shadow-lg ring-4 ring-gray-300/30">
            <Award className="w-5 h-5 text-gray-700" />
          </div>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="absolute -top-3 -left-3 z-20">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg ring-4 ring-amber-500/30">
            <Medal className="w-5 h-5 text-amber-100" />
          </div>
        </div>
      );
    }
    return (
      <div className="absolute -top-2 -left-2 z-20">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center shadow-md font-bold text-xs
          ${rank <= 10 
            ? 'bg-gradient-to-br from-primary to-primary-dark text-primary-foreground shadow-glow' 
            : 'bg-muted text-muted-foreground'
          }
        `}>
          {rank}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
            <span className="text-gradient-aurora glow-text-lg">TOP 100</span>
          </h2>
          <p className="text-muted-foreground text-lg">The most streamed artists this week</p>
        </div>
        <Badge 
          variant="outline" 
          className="text-sm px-5 py-2.5 border-primary/40 bg-primary/10 hidden md:flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4 text-primary" />
          {artists.length} Artists
        </Badge>
      </div>
      
      {/* Artist grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {artists.map((artist, index) => {
          const rank = index + 1;
          const isFullUrl = artist.profile_image_path?.startsWith('http');
          const imageUrl = artist.profile_image_path 
            ? (isFullUrl 
                ? artist.profile_image_path 
                : supabase.storage.from("artist-images").getPublicUrl(artist.profile_image_path).data.publicUrl)
            : null;
          
          return (
            <ArtistCard
              key={artist.id}
              artist={artist}
              rank={rank}
              imageUrl={imageUrl}
              isFollowed={followedArtists.has(artist.user_id)}
              onToggleFollow={() => onToggleFollow(artist.user_id)}
              onNavigate={() => navigate(`/artist/${artist.user_id}`)}
              getRankingBadge={getRankingBadge}
            />
          );
        })}
      </div>
    </div>
  );
}

function ArtistCard({ 
  artist, 
  rank, 
  imageUrl, 
  isFollowed,
  onToggleFollow,
  onNavigate,
  getRankingBadge
}: {
  artist: Artist;
  rank: number;
  imageUrl: string | null;
  isFollowed: boolean;
  onToggleFollow: () => void;
  onNavigate: () => void;
  getRankingBadge: (rank: number) => JSX.Element;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="group perspective-1000 animate-fade-in"
      style={{ animationDelay: `${rank * 0.02}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`
          relative cursor-pointer transform-3d transition-all duration-500 ease-out
          ${isHovered ? 'scale-[1.05] -translate-y-2' : 'scale-100'}
        `}
        onClick={onNavigate}
      >
        {/* Glow effect */}
        <div 
          className={`
            absolute -inset-3 rounded-3xl opacity-0 transition-opacity duration-500 blur-2xl
            ${isHovered ? 'opacity-100' : ''}
            ${rank <= 3 ? 'bg-gradient-to-br from-primary/50 to-secondary/40' : 'bg-primary/30'}
          `}
        />
        
        {/* Card */}
        <div className={`
          relative glass-ultra p-4 md:p-5 text-center rounded-2xl border border-white/10
          transition-all duration-300
          ${rank <= 3 ? 'ring-2 ring-primary/20' : ''}
        `}>
          {getRankingBadge(rank)}
          
          {/* Avatar */}
          <div className="relative mb-4">
            <div className={`
              aspect-square rounded-full overflow-hidden shadow-glow ring-2 transition-all duration-300
              ${rank === 1 ? 'ring-yellow-400/60 shadow-yellow-500/40' :
                rank === 2 ? 'ring-gray-300/60 shadow-gray-400/30' :
                rank === 3 ? 'ring-amber-500/60 shadow-amber-500/30' :
                'ring-primary/20'}
              bg-gradient-to-br from-primary/30 to-secondary/30
            `}>
              {imageUrl ? (
                <img 
                  src={imageUrl}
                  alt={artist.artist_name}
                  className={`
                    w-full h-full object-cover transition-transform duration-500
                    ${isHovered ? 'scale-110' : 'scale-100'}
                  `}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {artist.verified && (
              <div className="absolute -bottom-1 -right-1 z-10">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-glow ring-2 ring-background">
                  <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              </div>
            )}
          </div>
          
          {/* Info */}
          <h3 className="font-bold truncate mb-1 text-sm md:text-base">{artist.artist_name}</h3>
          <p className="text-xs md:text-sm text-muted-foreground mb-4 font-medium">
            {artist.monthly_listeners?.toLocaleString() || 0} listeners
          </p>
          
          {/* Follow button */}
          <Button
            size="sm"
            variant={isFollowed ? "outline" : "default"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollow();
            }}
            className={`
              w-full transition-all duration-300
              ${isFollowed 
                ? "border-primary/50 hover:bg-primary/10" 
                : "bg-gradient-to-r from-primary via-primary-glow to-primary shadow-glow hover:shadow-glow-lg"
              }
            `}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isFollowed ? "Following" : "Follow"}
          </Button>
        </div>
      </div>
    </div>
  );
}