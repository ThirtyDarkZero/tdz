import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Play, Music2, Headphones, Mic2, Guitar, Drum, Piano } from "lucide-react";

interface GenrePlaylistsProps {
  tracks: any[];
  onPlayGenre: (genre: string, tracks: any[]) => void;
  onGenreClick: (genre: string) => void;
}

const GENRE_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  image: string;
}> = {
  "Hip Hop": {
    icon: Mic2,
    gradient: "from-amber-600 to-orange-800",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80"
  },
  "R&B": {
    icon: Headphones,
    gradient: "from-purple-600 to-violet-800",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80"
  },
  "Rock": {
    icon: Guitar,
    gradient: "from-red-600 to-rose-800",
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80"
  },
  "Pop": {
    icon: Music2,
    gradient: "from-pink-500 to-fuchsia-700",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80"
  },
  "Electronic": {
    icon: Drum,
    gradient: "from-cyan-500 to-blue-700",
    image: "https://images.unsplash.com/photo-1571266028243-d220c6e3d9ec?w=400&q=80"
  },
  "Jazz": {
    icon: Piano,
    gradient: "from-yellow-600 to-amber-800",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&q=80"
  },
  "Soul": {
    icon: Headphones,
    gradient: "from-orange-500 to-red-700",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80"
  },
  "Classical": {
    icon: Piano,
    gradient: "from-slate-500 to-gray-700",
    image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=80"
  }
};

export function GenrePlaylists({ tracks, onPlayGenre, onGenreClick }: GenrePlaylistsProps) {
  // Group tracks by genre
  const genrePlaylists = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    tracks.forEach(track => {
      const genre = track.genre || "Other";
      if (!grouped[genre]) {
        grouped[genre] = [];
      }
      grouped[genre].push(track);
    });

    // Sort by track count and return top genres
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 8)
      .map(([genre, genreTracks]) => ({
        genre,
        tracks: genreTracks,
        config: GENRE_CONFIG[genre] || {
          icon: Music2,
          gradient: "from-primary to-primary-glow",
          image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80"
        }
      }));
  }, [tracks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
          <span className="text-gradient-aurora">Browse by Genre</span>
        </h2>
        <Badge variant="secondary" className="text-sm">
          {genrePlaylists.length} Genres
        </Badge>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {genrePlaylists.map(({ genre, tracks: genreTracks, config }) => {
            const Icon = config.icon;
            
            return (
              <Card
                key={genre}
                onClick={() => onGenreClick(genre.toLowerCase().replace(/&/g, 'n').replace(/ /g, '-'))}
                className="relative group cursor-pointer overflow-hidden flex-shrink-0 w-[200px] h-[260px] border-0 hover:scale-[1.02] transition-transform duration-300"
              >
                {/* Background image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${config.image})` }}
                />
                
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${config.gradient} opacity-80`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-5 z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-white/80" />
                      <span className="text-white/60 text-sm">{genreTracks.length} tracks</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{genre}</h3>
                  </div>

                  {/* Play button overlay */}
                  <Button
                    size="icon"
                    className="absolute top-4 right-4 rounded-full w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayGenre(genre, genreTracks);
                    }}
                  >
                    <Play className="w-5 h-5 text-white" fill="currentColor" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
