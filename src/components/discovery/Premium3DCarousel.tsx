import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselAlbum {
  id: string;
  title: string;
  artist: string;
  image: string;
  genre?: string;
}

interface Premium3DCarouselProps {
  sectionNumber?: number;
  title: string;
  subtitle?: string;
  activeCategory?: string;
  categories?: { id: string; name: string }[];
  albums: CarouselAlbum[];
  onCategoryChange?: (id: string) => void;
  onAlbumClick?: (album: CarouselAlbum) => void;
  onPlayAlbum?: (album: CarouselAlbum) => void;
}

export function Premium3DCarousel({
  sectionNumber = 2,
  title,
  subtitle,
  activeCategory = 'pop',
  categories = [
    { id: 'pop', name: 'Pop' },
    { id: 'hip-hop', name: 'Hip-Hop' },
    { id: 'r-b', name: 'R&B' },
    { id: 'electronic', name: 'Electronic' },
    { id: 'rock', name: 'Rock' },
    { id: 'latin', name: 'Latin' },
  ],
  albums,
  onCategoryChange,
  onAlbumClick,
  onPlayAlbum,
}: Premium3DCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(Math.floor(albums.length / 2));
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (albums.length > 0) {
      setCurrentIndex(Math.floor(albums.length / 2));
    }
  }, [albums.length, activeCategory]);

  const handlePrev = useCallback(() => {
    if (isAnimating || albums.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + albums.length) % albums.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, albums.length]);

  const handleNext = useCallback(() => {
    if (isAnimating || albums.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % albums.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, albums.length]);

  // BPM Supreme-style dramatic 3D perspective
  const getAlbumStyle = (index: number) => {
    const diff = index - currentIndex;
    let normalizedDiff = diff;
    
    if (albums.length > 0) {
      if (diff > albums.length / 2) normalizedDiff = diff - albums.length;
      if (diff < -albums.length / 2) normalizedDiff = diff + albums.length;
    }
    
    const absDistance = Math.abs(normalizedDiff);
    
    // More dramatic transforms for BPM Supreme style
    const rotateY = normalizedDiff * 55; // Steeper rotation
    const translateX = normalizedDiff * 160; // Wider spread
    const translateZ = -absDistance * 200; // Deeper depth
    const scale = 1 - absDistance * 0.12;
    const opacity = absDistance > 5 ? 0 : 1 - absDistance * 0.15;
    const zIndex = 20 - absDistance;
    
    // Add subtle tilt for depth
    const rotateX = absDistance * 2;

    return {
      transform: `
        translateX(${translateX}px) 
        translateZ(${translateZ}px) 
        rotateY(${rotateY}deg)
        rotateX(${rotateX}deg)
        scale(${Math.max(scale, 0.4)})
      `,
      opacity: Math.max(opacity, 0),
      zIndex: Math.max(zIndex, 0),
      filter: absDistance > 0 ? `brightness(${1 - absDistance * 0.1})` : 'none',
    };
  };

  const currentAlbum = albums[currentIndex];

  if (albums.length === 0) {
    return null;
  }

  return (
    <section className="relative py-8 sm:py-12 md:py-16 overflow-hidden" style={{ background: "transparent" }}>
      {/* Cosmic background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] md:w-[800px] h-[200px] sm:h-[300px] md:h-[400px] rounded-full blur-[100px] sm:blur-[150px]" 
          style={{ background: "rgba(139,92,246,0.08)" }} />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full blur-[120px]"
          style={{ background: "rgba(0,207,255,0.05)", animation: "cosmicCarouselPulse 10s ease-in-out infinite" }} />
      </div>

      {/* Header - BPM Supreme style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mb-6 sm:mb-8 md:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="flex items-baseline gap-4 sm:gap-6 md:gap-10">
            {/* Section number */}
            {typeof sectionNumber === "number" && sectionNumber > 0 && (
              <span className="hidden md:block text-foreground/20 text-4xl md:text-5xl lg:text-6xl font-black font-display">
                {sectionNumber}
              </span>
            )}
            
            {/* Title block */}
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight">
                {title}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">{subtitle || `${albums.length}+ ${title}`}</p>
            </div>

            {/* Current selection info */}
            {currentAlbum && (
              <div className="hidden lg:block">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold">
                  {categories.find(c => c.id === activeCategory)?.name || activeCategory}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm truncate max-w-[200px] md:max-w-[300px]">
                  {currentAlbum.title} — {currentAlbum.artist}
                </p>
              </div>
            )}
          </div>
          
          {/* Navigation arrows */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              disabled={albums.length === 0}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border transition-all"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={albums.length === 0}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border transition-all"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Category pills - horizontal scroll on mobile */}
        <div className="flex gap-2 mt-4 sm:mt-6 md:mt-8 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange?.(category.id)}
              className={`
                px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 flex-shrink-0
                ${activeCategory === category.id
                  ? 'bg-foreground text-background shadow-lg'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50 hover:border-border'
                }
              `}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Carousel - Responsive sizing */}
      <div 
        className="relative h-[280px] sm:h-[350px] md:h-[420px] lg:h-[480px] flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        <div 
          className="relative w-full flex items-center justify-center" 
          style={{ transformStyle: 'preserve-3d' }}
        >
          {albums.map((album, index) => {
            const style = getAlbumStyle(index);
            const isCurrent = index === currentIndex;
            
            // Responsive album sizes
            const albumSize = isCurrent 
              ? 'w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] md:w-[280px] md:h-[280px] lg:w-[320px] lg:h-[320px]'
              : 'w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] md:w-[240px] md:h-[240px] lg:w-[280px] lg:h-[280px]';
            
            return (
              <div
                key={album.id}
                className={`absolute cursor-pointer transition-all duration-500 ease-out ${albumSize}`}
                style={{
                  ...style,
                  transitionDuration: '500ms',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onClick={() => {
                  if (isCurrent) {
                    onAlbumClick?.(album);
                  } else {
                    setCurrentIndex(index);
                  }
                }}
              >
                {/* Album cover - removed green outline */}
                <div className={`
                  relative w-full h-full rounded-lg sm:rounded-xl overflow-hidden shadow-xl sm:shadow-2xl group
                  transition-all duration-500
                `}>
                  <img
                    src={album.image}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80';
                    }}
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Play button - center on hover */}
                  <div className={`
                    absolute inset-0 flex items-center justify-center
                    transition-all duration-300
                    ${isCurrent ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}
                  `}>
                    <Button
                      size="icon"
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-foreground text-background hover:scale-110 transition-transform shadow-2xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayAlbum?.(album);
                      }}
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 ml-0.5" fill="currentColor" />
                    </Button>
                  </div>
                  
                  {/* Title overlay on hover */}
                  <div className={`
                    absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4
                    transition-all duration-300
                    ${isCurrent ? 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0' : 'opacity-0'}
                  `}>
                    <p className="font-bold text-white text-sm sm:text-base truncate">{album.title}</p>
                    <p className="text-xs sm:text-sm text-white/60 truncate">{album.artist}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress dots - scrollable on mobile */}
      <div className="flex justify-center gap-1 sm:gap-1.5 mt-4 sm:mt-6 md:mt-8 px-4 overflow-x-auto scrollbar-hide">
        {albums.slice(0, Math.min(albums.length, 10)).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              h-1 rounded-full transition-all duration-300 flex-shrink-0
              ${index === currentIndex % Math.min(albums.length, 10)
                ? 'bg-foreground w-6 sm:w-8'
                : 'bg-muted-foreground/30 w-1.5 sm:w-2 hover:bg-muted-foreground/50'
              }
            `}
          />
        ))}
      </div>

      <style>{`
        @keyframes cosmicCarouselPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
      `}</style>
    </section>
  );
}
