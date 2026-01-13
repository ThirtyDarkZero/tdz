import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Music } from "lucide-react";

interface Album {
  id: string;
  title: string;
  artist_name: string;
  cover_art_path?: string;
  total_tracks?: number;
}

interface AlbumGridProps {
  albums: Album[];
  title: string;
}

export function AlbumGrid({ albums, title }: AlbumGridProps) {
  const navigate = useNavigate();

  if (albums.length === 0) return null;

  const getCoverUrl = (path?: string) => {
    if (!path) return null;
    return supabase.storage.from('album-covers').getPublicUrl(path).data.publicUrl;
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
        <Badge variant="outline" className="text-xs px-2 py-1">
          {albums.length}
        </Badge>
      </div>
      
      {/* Mobile Carousel */}
      <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-3 pb-2">
          {albums.map((album) => {
            const coverUrl = getCoverUrl(album.cover_art_path);
            return (
              <div 
                key={album.id}
                className="flex-shrink-0 w-[calc(50%-6px)] cursor-pointer"
                onClick={() => navigate(`/album/${album.id}`)}
              >
                <div className="space-y-2">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={album.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium truncate">{album.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{album.artist_name}</p>
                    {album.total_tracks && (
                      <p className="text-[10px] text-muted-foreground">{album.total_tracks} tracks</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {albums.map((album) => {
          const coverUrl = getCoverUrl(album.cover_art_path);
          return (
            <div 
              key={album.id}
              className="group cursor-pointer"
              onClick={() => navigate(`/album/${album.id}`)}
            >
              <div className="space-y-2">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Music className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium truncate">{album.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{album.artist_name}</p>
                  {album.total_tracks && (
                    <p className="text-xs text-muted-foreground">{album.total_tracks} tracks</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
