import { useState } from "react";
import { Play, ChevronRight, TrendingUp, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Playlist {
  id: string;
  name: string;
  description?: string;
  image: string;
  trackCount?: number;
  category: string;
  trending?: boolean;
}

interface PremiumPlaylistGridProps {
  sectionNumber?: number;
  title: string;
  subtitle?: string;
  playlists: Playlist[];
  onPlayPlaylist?: (playlist: Playlist) => void;
  onViewAll?: () => void;
}

const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'best-2025',
    name: 'Best of 2025',
    description: 'Top hits this year',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
    trackCount: 50,
    category: 'Trending',
    trending: true,
  },
  {
    id: 'new-releases',
    name: 'New Releases',
    description: 'Fresh drops this week',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    trackCount: 30,
    category: 'New',
    trending: true,
  },
  {
    id: 'party-mix',
    name: 'Party Mix',
    description: 'Get the party started',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    trackCount: 45,
    category: 'Party',
  },
  {
    id: 'chill-vibes',
    name: 'Chill Vibes',
    description: 'Relax and unwind',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80',
    trackCount: 40,
    category: 'Mood',
  },
  {
    id: 'workout',
    name: 'Workout Energy',
    description: 'Power through your gym session',
    image: 'https://images.unsplash.com/photo-1571266028243-d220c6e3d9ec?w=400&q=80',
    trackCount: 35,
    category: 'Activity',
  },
  {
    id: 'hip-hop-heat',
    name: 'Hip-Hop Heat',
    description: 'The hottest hip-hop tracks',
    image: 'https://images.unsplash.com/photo-1504509546545-e000b4a62425?w=400&q=80',
    trackCount: 55,
    category: 'Hip-Hop',
    trending: true,
  },
];

export function PremiumPlaylistGrid({
  sectionNumber = 3,
  title = "Featured Playlists",
  subtitle,
  playlists = DEFAULT_PLAYLISTS,
  onPlayPlaylist,
  onViewAll,
}: Partial<PremiumPlaylistGridProps> & { onPlayPlaylist?: (playlist: Playlist) => void; onViewAll?: () => void }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="relative py-16 bg-[#030303]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-10">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-10">
            <span className="text-white/20 text-5xl md:text-6xl font-black font-display">
              {sectionNumber}
            </span>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                {title}
              </h2>
              <p className="text-white/40 text-sm mt-1">{subtitle || `Curated collections`}</p>
            </div>
          </div>
          
          {onViewAll && (
            <Button
              variant="ghost"
              onClick={onViewAll}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 gap-2"
            >
              See More
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {playlists.slice(0, 6).map((playlist, index) => (
            <div
              key={playlist.id}
              className="group cursor-pointer"
              onMouseEnter={() => setHoveredId(playlist.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onPlayPlaylist?.(playlist)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Card */}
              <div className={`
                relative aspect-square rounded-xl overflow-hidden
                transition-all duration-500
                ${hoveredId === playlist.id ? 'scale-105 shadow-2xl shadow-black/60' : 'shadow-lg shadow-black/40'}
              `}>
                <img
                  src={playlist.image}
                  alt={playlist.name}
                  className={`
                    w-full h-full object-cover transition-all duration-700
                    ${hoveredId === playlist.id ? 'scale-110 brightness-75' : 'brightness-90'}
                  `}
                  loading="lazy"
                />
                
                {/* Category badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {playlist.trending && (
                    <Badge className="bg-red-500/90 text-white border-0 text-xs font-semibold px-2 py-0.5 gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </Badge>
                  )}
                  <Badge className="bg-black/60 backdrop-blur-sm text-white/90 border-0 text-xs px-2 py-0.5">
                    {playlist.category}
                  </Badge>
                </div>

                {/* Play overlay */}
                <div className={`
                  absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent
                  flex items-center justify-center
                  transition-opacity duration-300
                  ${hoveredId === playlist.id ? 'opacity-100' : 'opacity-0'}
                `}>
                  <Button
                    size="icon"
                    className="w-14 h-14 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-xl"
                  >
                    <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="mt-3">
                <h3 className={`
                  font-semibold text-sm truncate transition-colors
                  ${hoveredId === playlist.id ? 'text-white' : 'text-white/80'}
                `}>
                  {playlist.name}
                </h3>
                <p className="text-white/40 text-xs truncate mt-0.5">
                  {playlist.description || `${playlist.trackCount || 0} tracks`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
