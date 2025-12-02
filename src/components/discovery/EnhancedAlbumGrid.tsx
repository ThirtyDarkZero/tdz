import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Play, Disc3 } from "lucide-react";
import { MotionCover } from "@/components/MotionCover";
import { useState } from "react";

interface Album {
  id: string;
  title: string;
  artist_name: string;
  cover_art_path?: string;
  motion_cover_path?: string;
  motion_cover_bucket?: string;
  total_tracks?: number;
}

interface EnhancedAlbumGridProps {
  albums: Album[];
  title: string;
}

export function EnhancedAlbumGrid({ albums, title }: EnhancedAlbumGridProps) {
  const navigate = useNavigate();

  if (albums.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-gradient-aurora glow-text">{title}</span>
          </h2>
          <div className="hidden md:flex h-px flex-1 max-w-32 bg-gradient-to-r from-secondary/50 to-transparent" />
        </div>
        <Badge 
          variant="outline" 
          className="text-sm px-4 py-2 border-secondary/30 bg-secondary/5"
        >
          <Disc3 className="w-3 h-3 mr-2 text-secondary" />
          {albums.length} Albums
        </Badge>
      </div>
      
      {/* Mobile Carousel */}
      <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-4 pb-4">
          {albums.slice(0, 10).map((album, index) => (
            <div key={album.id} className="flex-shrink-0 w-48">
              <AlbumCard album={album} index={index} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {albums.slice(0, 15).map((album, index) => (
          <AlbumCard key={album.id} album={album} index={index} />
        ))}
      </div>
    </div>
  );
}

function AlbumCard({ album, index }: { album: Album; index: number }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group perspective-1000 animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`
          relative cursor-pointer transform-3d transition-all duration-500 ease-out
          ${isHovered ? 'scale-[1.03] -translate-y-3' : 'scale-100'}
        `}
        onClick={() => navigate(`/album/${album.id}`)}
      >
        {/* Glow effect */}
        <div 
          className={`
            absolute -inset-2 rounded-2xl opacity-0 transition-opacity duration-500 blur-xl
            ${isHovered ? 'opacity-100' : ''}
          `}
          style={{
            background: 'linear-gradient(135deg, hsl(var(--secondary) / 0.4), hsl(var(--accent) / 0.3))'
          }}
        />
        
        {/* Card */}
        <div className="relative glass-ultra rounded-xl overflow-hidden border border-white/10">
          {/* Album art */}
          <div className="relative aspect-square overflow-hidden">
            <div 
              className={`
                absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-transparent
                transition-opacity duration-300
                ${isHovered ? 'opacity-100' : 'opacity-50'}
              `}
            />
            
            <MotionCover
              motionCoverPath={album.motion_cover_path}
              motionCoverBucket={album.motion_cover_bucket}
              staticCoverPath={album.cover_art_path}
              staticCoverBucket="album-covers"
              alt={album.title}
              className={`
                w-full h-full object-cover transition-transform duration-700 ease-out
                ${isHovered ? 'scale-110' : 'scale-100'}
              `}
            />
            
            {/* Play overlay */}
            <div 
              className={`
                absolute inset-0 z-20 flex items-center justify-center
                transition-all duration-300
                ${isHovered ? 'opacity-100' : 'opacity-0'}
              `}
            >
              <div className="h-14 w-14 rounded-full bg-secondary/90 backdrop-blur-sm flex items-center justify-center shadow-glow-lg transform hover:scale-110 transition-transform">
                <Play className="w-6 h-6 ml-0.5 text-secondary-foreground" fill="currentColor" />
              </div>
            </div>
            
            {/* Track count badge */}
            {album.total_tracks && (
              <div className="absolute bottom-3 right-3 z-30">
                <Badge className="bg-black/60 backdrop-blur-sm text-white border-white/20 text-xs">
                  {album.total_tracks} tracks
                </Badge>
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="p-4 space-y-1 bg-gradient-to-t from-card to-transparent">
            <p className="font-semibold text-sm truncate">{album.title}</p>
            <p className="text-xs text-muted-foreground truncate">{album.artist_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}