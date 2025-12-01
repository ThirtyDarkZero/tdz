import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, UserPlus, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  profile_image_path?: string;
  monthly_listeners?: number;
}

interface ArtistGridProps {
  artists: Artist[];
  followedArtists: Set<string>;
  onToggleFollow: (artistUserId: string) => void;
}

export function ArtistGrid({ artists, followedArtists, onToggleFollow }: ArtistGridProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight glow-text">Featured Artists</h2>
        <Badge variant="outline" className="text-sm px-4 py-2">
          {artists.length} Artists
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {artists.map((artist, index) => (
          <Card 
            key={artist.id} 
            className="glass-card-premium p-4 md:p-5 text-center hover:border-primary/70 transition-all hover-lift shadow-card-hover animate-fade-in cursor-pointer"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => navigate(`/artist/${artist.user_id}`)}
          >
            <div className="relative">
              <div className="aspect-square rounded-full overflow-hidden bg-gradient-to-br from-primary/30 to-secondary/30 mb-4 shadow-glow ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                {artist.profile_image_path ? (
                  <img 
                    src={supabase.storage.from("artist-images").getPublicUrl(artist.profile_image_path).data.publicUrl}
                    alt={artist.artist_name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-primary shadow-glow text-xs">
                  <TrendingUp className="w-3 h-3" />
                </Badge>
              </div>
            </div>
            
            <h3 className="font-bold truncate mb-2 text-sm md:text-base">{artist.artist_name}</h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-4 font-medium">
              {artist.monthly_listeners?.toLocaleString() || 0} listeners
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
              {followedArtists.has(artist.user_id) ? "Following" : "Follow"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
