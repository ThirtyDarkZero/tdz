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
    <section className="relative py-16 overflow-hidden bg-[#030303]">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Header - BPM Supreme style */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-10">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="flex items-baseline gap-10">
            {/* Section number */}
            {typeof sectionNumber === "number" && sectionNumber > 0 && (
              <span className="text-white/20 text-5xl md:text-6xl font-black font-display">
                {sectionNumber}
              </span>
            )}
            
            {/* Title block */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                {title}
              </h2>
              <p className="text-white/40 text-sm mt-1">{subtitle || `${albums.length}+ ${title}`}</p>
            </div>

            {/* Current selection info */}
            {currentAlbum && (
              <div className="hidden md:block">
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  {categories.find(c => c.id === activeCategory)?.name || activeCategory}
                </h3>
                <p className="text-white/40 text-sm truncate max-w-[300px]">
                  {currentAlbum.title} — {currentAlbum.artist}
                </p>
              </div>
            )}
          </div>
          
          {/* Navigation arrows */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              disabled={albums.length === 0}
              className="w-10 h-10 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={albums.length === 0}
              className="w-10 h-10 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mt-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange?.(category.id)}
              className={`
                px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
                ${activeCategory === category.id
                  ? 'bg-white text-black shadow-lg shadow-white/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/20'
                }
              `}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Carousel */}
      <div 
        className="relative h-[420px] md:h-[480px] flex items-center justify-center"
        style={{ perspective: '1400px' }}
      >
        <div 
          className="relative w-full flex items-center justify-center" 
          style={{ transformStyle: 'preserve-3d' }}
        >
          {albums.map((album, index) => {
            const style = getAlbumStyle(index);
            const isCurrent = index === currentIndex;
            
            return (
              <div
                key={album.id}
                className="absolute cursor-pointer transition-all duration-600 ease-out"
                style={{
                  ...style,
                  width: isCurrent ? '320px' : '280px',
                  height: isCurrent ? '320px' : '280px',
                  transitionDuration: '600ms',
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
                {/* Album cover */}
                <div className={`
                  relative w-full h-full rounded-xl overflow-hidden shadow-2xl group
                  transition-all duration-500
                  ${isCurrent ? 'shadow-black/80 ring-1 ring-white/10' : 'shadow-black/60'}
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
                      className="w-16 h-16 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-2xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayAlbum?.(album);
                      }}
                    >
                      <Play className="w-7 h-7 ml-1" fill="currentColor" />
                    </Button>
                  </div>
                  
                  {/* Title overlay on hover */}
                  <div className={`
                    absolute bottom-0 left-0 right-0 p-4
                    transition-all duration-300
                    ${isCurrent ? 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0' : 'opacity-0'}
                  `}>
                    <p className="font-bold text-white truncate">{album.title}</p>
                    <p className="text-sm text-white/60 truncate">{album.artist}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mt-8">
        {albums.slice(0, Math.min(albums.length, 12)).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              h-1 rounded-full transition-all duration-300
              ${index === currentIndex % Math.min(albums.length, 12)
                ? 'bg-white w-8'
                : 'bg-white/20 w-1.5 hover:bg-white/40'
              }
            `}
          />
        ))}
      </div>
    </section>
  );
}
