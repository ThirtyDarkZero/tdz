import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, UserPlus, User, Crown, Award, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  profile_image_path?: string;
  monthly_listeners?: number;
  verified?: boolean;
}

interface ArtistGridProps {
  artists: Artist[];
  followedArtists: Set<string>;
  onToggleFollow: (artistUserId: string) => void;
}

export function ArtistGrid({ artists, followedArtists, onToggleFollow }: ArtistGridProps) {
  const navigate = useNavigate();

  const getRankingBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="absolute -top-2 -left-2 z-10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg ring-2 ring-yellow-400/50">
            <Crown className="w-4 h-4 text-yellow-900" />
          </div>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="absolute -top-2 -left-2 z-10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg ring-2 ring-gray-300/50">
            <Award className="w-4 h-4 text-gray-700" />
          </div>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="absolute -top-2 -left-2 z-10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg ring-2 ring-amber-600/50">
            <Medal className="w-4 h-4 text-amber-200" />
          </div>
        </div>
      );
    }
    return (
      <div className="absolute -top-2 -left-2 z-10">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md font-bold text-xs ${
          rank <= 10 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {rank}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight glow-text">Featured Artists</h2>
        <Badge variant="outline" className="text-sm px-4 py-2 border-primary/50">
          {artists.length} Voices
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {artists.map((artist, index) => {
          const rank = index + 1;
          const isFullUrl = artist.profile_image_path?.startsWith('http');
          const imageUrl = artist.profile_image_path 
            ? (isFullUrl 
                ? artist.profile_image_path 
                : supabase.storage.from("artist-images").getPublicUrl(artist.profile_image_path).data.publicUrl)
            : null;
          
          return (
            <Card 
              key={artist.id} 
              className={`glass-card-premium p-4 md:p-5 text-center hover:border-primary/70 transition-all hover-lift shadow-card-hover animate-fade-in cursor-pointer relative ${
                rank <= 3 ? 'ring-2 ring-primary/30' : ''
              }`}
              style={{ animationDelay: `${index * 0.02}s` }}
              onClick={() => navigate(`/artist/${artist.user_id}`)}
            >
              {getRankingBadge(rank)}
              
              <div className="relative">
                <div className={`aspect-square rounded-full overflow-hidden mb-4 shadow-glow ring-2 transition-all ${
                  rank === 1 ? 'ring-yellow-500 shadow-yellow-500/30' :
                  rank === 2 ? 'ring-gray-400 shadow-gray-400/30' :
                  rank === 3 ? 'ring-amber-600 shadow-amber-600/30' :
                  'ring-primary/20 group-hover:ring-primary/50'
                } bg-gradient-to-br from-primary/30 to-secondary/30`}>
                  {imageUrl ? (
                    <img 
                      src={imageUrl}
                      alt={artist.artist_name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {artist.verified && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-primary shadow-glow text-xs">
                      <TrendingUp className="w-3 h-3" />
                    </Badge>
                  </div>
                )}
              </div>
              
              <h3 className="font-bold truncate mb-2 text-sm md:text-base">{artist.artist_name}</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-4 font-medium">
                {artist.monthly_listeners?.toLocaleString() || 0} invested
              </p>
              
              <Button
                size="sm"
                variant={followedArtists.has(artist.user_id) ? "outline" : "default"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollow(artist.user_id);
                }}
                className={`w-full transition-all hover-lift ${
                  followedArtists.has(artist.user_id) 
                    ? "border-primary/50" 
                    : "bg-gradient-to-r from-primary to-secondary shadow-glow"
                }`}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {followedArtists.has(artist.user_id) ? "In Your Circle" : "Join Journey"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
