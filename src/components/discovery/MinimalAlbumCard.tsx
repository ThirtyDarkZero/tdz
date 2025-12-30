import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MinimalAlbumCardProps {
  album: {
    id: string;
    title: string;
    artist_name: string;
    cover_art_path?: string;
    release_date?: string;
    total_tracks?: number;
    genre?: string;
  };
  index?: number;
}

export function MinimalAlbumCard({ album, index = 0 }: MinimalAlbumCardProps) {
  const navigate = useNavigate();
  
  const coverUrl = album.cover_art_path
    ? supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path).data.publicUrl
    : null;

  const releaseYear = album.release_date 
    ? new Date(album.release_date).getFullYear()
    : null;

  return (
    <div 
      className="group cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => navigate(`/album/${album.id}`)}
    >
      {/* Cover */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5 mb-3">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={album.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div>
        <h3 className="font-semibold text-sm text-white truncate group-hover:text-cyan-400 transition-colors">
          {album.title}
        </h3>
        <p className="text-xs text-white/50 truncate mt-0.5">
          {album.artist_name}
          {releaseYear && <span className="text-white/30"> • {releaseYear}</span>}
        </p>
      </div>
    </div>
  );
}
