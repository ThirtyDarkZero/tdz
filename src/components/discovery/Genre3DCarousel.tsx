import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GenreAlbum {
  id: string;
  title: string;
  artist: string;
  image: string;
  genre: string;
}

interface Genre3DCarouselProps {
  title?: string;
  subtitle?: string;
  albums: GenreAlbum[];
  activeGenre?: string;
  onGenreChange?: (genre: string) => void;
  onAlbumClick?: (album: GenreAlbum) => void;
  onPlayAlbum?: (album: GenreAlbum) => void;
}

// Popular genre definitions with curated images
const GENRE_DEFINITIONS = [
  { id: 'pop', name: 'Pop', color: 'from-pink-500 to-rose-600' },
  { id: 'hip-hop', name: 'Hip-Hop', color: 'from-amber-500 to-orange-600' },
  { id: 'r-b', name: 'R&B', color: 'from-purple-500 to-violet-600' },
  { id: 'electronic', name: 'Electronic', color: 'from-cyan-500 to-blue-600' },
  { id: 'rock', name: 'Rock', color: 'from-red-500 to-rose-700' },
  { id: 'latin', name: 'Latin', color: 'from-orange-500 to-red-600' },
  { id: 'country', name: 'Country', color: 'from-amber-600 to-yellow-700' },
  { id: 'jazz', name: 'Jazz', color: 'from-yellow-500 to-amber-600' },
];

export function Genre3DCarousel({
  title = "Genres",
  subtitle = "20+ Genres",
  albums,
  activeGenre = 'pop',
  onGenreChange,
  onAlbumClick,
  onPlayAlbum,
}: Genre3DCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(Math.floor(albums.length / 2));
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeGenreData = GENRE_DEFINITIONS.find(g => g.id === activeGenre) || GENRE_DEFINITIONS[0];

  const handlePrev = () => {
    if (isAnimating || albums.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + albums.length) % albums.length);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handleNext = () => {
    if (isAnimating || albums.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % albums.length);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handleGenreClick = (genreId: string) => {
    onGenreChange?.(genreId);
    setCurrentIndex(Math.floor(albums.length / 2));
  };

  // Calculate 3D transform for each album
  const getAlbumStyle = (index: number) => {
    const diff = index - currentIndex;
    const absDistance = Math.abs(diff);
    
    // Normalize diff for looping
    let normalizedDiff = diff;
    if (albums.length > 0) {
      if (diff > albums.length / 2) normalizedDiff = diff - albums.length;
      if (diff < -albums.length / 2) normalizedDiff = diff + albums.length;
    }

    const absNormalizedDistance = Math.abs(normalizedDiff);
    
    // 3D perspective transforms
    const rotateY = normalizedDiff * 45; // Rotate based on position
    const translateX = normalizedDiff * 120; // Horizontal spacing
    const translateZ = -absNormalizedDistance * 150; // Depth
    const scale = 1 - absNormalizedDistance * 0.15; // Scale down distant items
    const opacity = absNormalizedDistance > 4 ? 0 : 1 - absNormalizedDistance * 0.15;
    const zIndex = 10 - absNormalizedDistance;

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${Math.max(scale, 0.5)})`,
      opacity: Math.max(opacity, 0),
      zIndex: Math.max(zIndex, 0),
      pointerEvents: absNormalizedDistance > 2 ? 'none' as const : 'auto' as const,
    };
  };

  if (albums.length === 0) {
    return (
      <div className="py-16 text-center">
        <Music2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/40">No albums available</p>
      </div>
    );
  }

  return (
    <section className="relative py-12 overflow-hidden bg-[#0a0a0a]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-8">
            <div className="text-white/40 text-4xl font-bold">2</div>
            <div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <p className="text-white/50 text-sm">{subtitle}</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{activeGenreData.name}</h3>
              <p className="text-white/50 text-sm">
                {albums[currentIndex]?.title} — {albums[currentIndex]?.artist}
              </p>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Genre Pills */}
        <div className="flex flex-wrap gap-2 mt-6">
          {GENRE_DEFINITIONS.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreClick(genre.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${activeGenre === genre.id
                  ? `bg-gradient-to-r ${genre.color} text-white shadow-lg`
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Carousel Container */}
      <div 
        ref={containerRef}
        className="relative h-[400px] flex items-center justify-center"
        style={{ perspective: '1200px' }}
      >
        <div className="relative w-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          {albums.map((album, index) => {
            const style = getAlbumStyle(index);
            const isCurrent = index === currentIndex;
            
            return (
              <div
                key={album.id}
                className={`
                  absolute cursor-pointer transition-all duration-500 ease-out
                  ${isCurrent ? 'ring-4 ring-white/20' : ''}
                `}
                style={{
                  ...style,
                  width: '280px',
                  height: '280px',
                }}
                onClick={() => {
                  if (isCurrent) {
                    onAlbumClick?.(album);
                  } else {
                    setCurrentIndex(index);
                  }
                }}
              >
                {/* Album Cover */}
                <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl group">
                  <img
                    src={album.image}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80';
                    }}
                  />
                  
                  {/* Hover overlay */}
                  <div className={`
                    absolute inset-0 bg-black/60 flex items-center justify-center
                    transition-opacity duration-300
                    ${isCurrent ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}
                  `}>
                    <Button
                      size="icon"
                      className="w-16 h-16 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayAlbum?.(album);
                      }}
                    >
                      <Play className="w-7 h-7 ml-1" fill="currentColor" />
                    </Button>
                  </div>
                  
                  {/* Genre badge */}
                  <Badge 
                    className={`absolute top-3 left-3 bg-gradient-to-r ${activeGenreData.color} text-white border-0 shadow-lg`}
                  >
                    {album.genre || activeGenreData.name}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-6">
        {albums.slice(0, Math.min(albums.length, 10)).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${index === currentIndex % Math.min(albums.length, 10)
                ? 'bg-white w-6'
                : 'bg-white/30 hover:bg-white/50'
              }
            `}
          />
        ))}
      </div>
    </section>
  );
}
