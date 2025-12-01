import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play,
  User,
  Music,
  Disc3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MotionCover } from "@/components/MotionCover";

interface NowPlayingSidebarProps {
  currentTrack: any;
  artistInfo?: {
    id: string;
    artist_name: string;
    bio?: string;
    profile_image_path?: string;
    monthly_listeners?: number;
  } | null;
  relatedTracks?: any[];
  onPlayTrack?: (track: any) => void;
}

export function NowPlayingSidebar({ 
  currentTrack, 
  artistInfo,
  relatedTracks = [],
  onPlayTrack
}: NowPlayingSidebarProps) {
  const navigate = useNavigate();

  if (!currentTrack) {
    return (
      <div className="space-y-4">
        <Card className="glass-card p-6 text-center">
          <Disc3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground animate-spin-slow" />
          <h3 className="font-bold mb-1">Nothing Playing</h3>
          <p className="text-sm text-muted-foreground">
            Select a track to start listening
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Now Playing Cover */}
      <Card className="glass-card-premium overflow-hidden">
        <div className="aspect-square">
          <MotionCover
            motionCoverPath={currentTrack.motion_cover_path}
            motionCoverBucket={currentTrack.motion_cover_bucket}
            staticCoverPath={currentTrack.album_cover_path}
            staticCoverBucket={currentTrack.album_cover_bucket || "album-covers"}
            alt={currentTrack.title}
            className="w-full h-full"
          />
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-bold text-lg truncate">{currentTrack.title}</h3>
          <button 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            onClick={() => navigate(`/artist/${currentTrack.artist_user_id || currentTrack.user_id}`)}
          >
            {currentTrack.artist_name}
          </button>
          <div className="flex gap-2 flex-wrap">
            {currentTrack.genre && (
              <Badge variant="outline" className="text-xs">{currentTrack.genre}</Badge>
            )}
            {currentTrack.mood && (
              <Badge variant="outline" className="text-xs">{currentTrack.mood}</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Artist Info */}
      {artistInfo && (
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">About the Artist</h4>
          </div>
          
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/artist/${artistInfo.id}`)}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 overflow-hidden flex-shrink-0">
              {artistInfo.profile_image_path ? (
                <img
                  src={supabase.storage.from("artist-images").getPublicUrl(artistInfo.profile_image_path).data.publicUrl}
                  alt={artistInfo.artist_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{artistInfo.artist_name}</p>
              {artistInfo.monthly_listeners && (
                <p className="text-xs text-muted-foreground">
                  {artistInfo.monthly_listeners.toLocaleString()} monthly listeners
                </p>
              )}
            </div>
          </div>
          
          {artistInfo.bio && (
            <p className="text-xs text-muted-foreground line-clamp-3">
              {artistInfo.bio}
            </p>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => navigate(`/artist/${artistInfo.id}`)}
          >
            View Profile
          </Button>
        </Card>
      )}

      {/* More from Artist */}
      {relatedTracks.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm px-1">More from {currentTrack.artist_name}</h4>
          <div className="space-y-1">
            {relatedTracks.slice(0, 5).map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-accent/10 cursor-pointer group"
                onClick={() => onPlayTrack?.(track)}
              >
                <div className="w-10 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                  {track.album_cover_path ? (
                    <img
                      src={supabase.storage.from(track.album_cover_bucket || "album-covers").getPublicUrl(track.album_cover_path).data.publicUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-3 h-3" fill="currentColor" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
