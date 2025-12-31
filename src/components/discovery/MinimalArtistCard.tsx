import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface MinimalArtistCardProps {
  artist: {
    user_id: string;
    artist_name: string;
    profile_image_path?: string;
    monthly_listeners?: number;
    verified?: boolean;
    genre?: string;
  };
  isFollowing?: boolean;
  onToggleFollow?: () => void;
  index?: number;
}

// Storage buckets to try in order for artist images
const IMAGE_BUCKETS = ['artist-profiles', 'artist-images', 'artist-banners'] as const;

export function MinimalArtistCard({
  artist,
  isFollowing,
  onToggleFollow,
  index = 0
}: MinimalArtistCardProps) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [currentBucketIndex, setCurrentBucketIndex] = useState(0);
  
  // Try multiple buckets for artist images
  const getImageUrl = () => {
    if (!artist.profile_image_path || imageError) return null;
    const bucket = IMAGE_BUCKETS[currentBucketIndex];
    return supabase.storage.from(bucket).getPublicUrl(artist.profile_image_path).data.publicUrl;
  };
  
  const handleImageError = () => {
    if (currentBucketIndex < IMAGE_BUCKETS.length - 1) {
      setCurrentBucketIndex(prev => prev + 1);
    } else {
      setImageError(true);
    }
  };
  
  const imageUrl = getImageUrl();

  return (
    <div 
      className="group p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => navigate(`/artist/${artist.user_id}`)}
    >
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-white/5 mb-3">
          {imageUrl && !imageError ? (
            <img 
              src={imageUrl} 
              alt={artist.artist_name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-white/60">
                {artist.artist_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Verified badge */}
          {artist.verified && (
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-sm text-white truncate max-w-full">
          {artist.artist_name}
        </h3>

        {/* Listeners */}
        {artist.monthly_listeners !== undefined && (
          <p className="text-xs text-white/40 mt-1">
            {artist.monthly_listeners.toLocaleString()} listeners
          </p>
        )}

        {/* Follow Button */}
        {onToggleFollow && (
          <Button
            variant="outline"
            size="sm"
            className={`
              mt-3 text-xs h-8 px-4
              ${isFollowing 
                ? 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10' 
                : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white hover:bg-white/5'
              }
            `}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollow();
            }}
          >
            {isFollowing ? (
              <>
                <UserCheck className="w-3 h-3 mr-1.5" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3 mr-1.5" />
                Follow
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
