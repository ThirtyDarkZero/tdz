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
      {/* Hexagonal Cover */}
      <div className="relative aspect-square mb-3">
        <div className="w-full h-full overflow-hidden transition-all duration-300 group-hover:scale-105"
          style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            filter: "drop-shadow(0 0 8px rgba(139,92,246,0.2))",
          }}>
          {coverUrl ? (
            <img 
              src={coverUrl} 
              alt={album.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full" style={{ 
              background: "linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(0,207,255,0.3) 100%)" 
            }} />
          )}
        </div>
        
        {/* Cosmic glow border */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            boxShadow: "inset 0 0 20px rgba(0,207,255,0.3)",
          }} />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
            style={{ background: "rgba(0,207,255,0.9)", boxShadow: "0 0 20px rgba(0,207,255,0.5)" }}>
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="text-center">
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
