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

const IMAGE_BUCKETS = ['artist-profiles', 'artist-images', 'artist-banners', 'listener-images'] as const;

export function MinimalArtistCard({
  artist,
  isFollowing,
  onToggleFollow,
  index = 0
}: MinimalArtistCardProps) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [currentBucketIndex, setCurrentBucketIndex] = useState(0);
  
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
      className="group p-4 rounded-xl transition-all duration-300 cursor-pointer"
      style={{ 
        animationDelay: `${index * 50}ms`,
        background: "rgba(139,92,246,0.03)",
        border: "1px solid rgba(139,92,246,0.08)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.08)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,207,255,0.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.03)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.08)";
      }}
      onClick={() => navigate(`/artist/${artist.user_id}`)}
    >
      <div className="flex flex-col items-center text-center">
        {/* Avatar with orbital ring */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-3">
          {/* Orbital ring */}
          <div className="absolute inset-[-4px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              border: "1px solid rgba(0,207,255,0.3)",
              animation: "cosmicOrbit 8s linear infinite",
            }} />
          <div className="absolute inset-[-8px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{
              border: "1px dashed rgba(139,92,246,0.2)",
              animation: "cosmicOrbit 12s linear infinite reverse",
            }} />
          
          <div className="w-full h-full rounded-full overflow-hidden" style={{
            boxShadow: "0 0 15px rgba(139,92,246,0.2)",
          }}>
            {imageUrl && !imageError ? (
              <img 
                src={imageUrl} 
                alt={artist.artist_name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.3) 0%, rgba(139,92,246,0.3) 100%)" }}>
                <span className="text-2xl font-bold text-white/60">
                  {artist.artist_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Verified badge */}
          {artist.verified && (
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "#00CFFF", border: "2px solid #030308", boxShadow: "0 0 10px rgba(0,207,255,0.5)" }}>
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
          <p className="text-xs mt-1" style={{ color: "#888" }}>
            {artist.monthly_listeners.toLocaleString()} listeners
          </p>
        )}

        {/* Follow Button */}
        {onToggleFollow && (
          <Button
            variant="outline"
            size="sm"
            className={`mt-3 text-xs h-8 px-4 ${isFollowing 
              ? 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10' 
              : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white hover:bg-white/5'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollow();
            }}
          >
            {isFollowing ? (
              <><UserCheck className="w-3 h-3 mr-1.5" />Following</>
            ) : (
              <><UserPlus className="w-3 h-3 mr-1.5" />Follow</>
            )}
          </Button>
        )}
      </div>

      <style>{`
        @keyframes cosmicOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
