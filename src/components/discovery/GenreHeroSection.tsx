import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";

interface GenreHero {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  gradient: string;
}

const GENRES: GenreHero[] = [
  {
    id: "hip-hop",
    name: "Hip Hop",
    description: "Get your groove on with the coolest hip hop beats!",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    gradient: "from-amber-900/80 via-transparent to-transparent"
  },
  {
    id: "r-n-b",
    name: "R&B",
    description: "Smooth vibes and soulful melodies",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
    gradient: "from-purple-900/80 via-transparent to-transparent"
  },
  {
    id: "rock",
    name: "Rock'n'Roll",
    description: "The real kind of music",
    imageUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&q=80",
    gradient: "from-red-900/80 via-transparent to-transparent"
  },
  {
    id: "pop",
    name: "Pop",
    description: "Chart-topping hits and catchy tunes",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    gradient: "from-pink-900/80 via-transparent to-transparent"
  },
  {
    id: "electronic",
    name: "Electronic",
    description: "Bass drops and synthesized dreams",
    imageUrl: "https://images.unsplash.com/photo-1571266028243-d220c6e3d9ec?w=800&q=80",
    gradient: "from-cyan-900/80 via-transparent to-transparent"
  },
  {
    id: "country",
    name: "Country",
    description: "Some good ol' country tunes",
    imageUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80",
    gradient: "from-yellow-900/80 via-transparent to-transparent"
  }
];

interface GenreHeroSectionProps {
  onGenreSelect: (genreId: string) => void;
}

export function GenreHeroSection({ onGenreSelect }: GenreHeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  const visibleGenres = GENRES.slice(0, 3);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 3) % GENRES.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 3 + GENRES.length) % GENRES.length);
  };

  const currentGenres = [
    GENRES[(activeIndex) % GENRES.length],
    GENRES[(activeIndex + 1) % GENRES.length],
    GENRES[(activeIndex + 2) % GENRES.length],
  ];

  return (
    <div className="relative w-full">
      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 glass-card hover:bg-white/20 w-12 h-12 rounded-full"
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 glass-card hover:bg-white/20 w-12 h-12 rounded-full"
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Genre cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 h-[60vh] min-h-[400px] max-h-[600px] rounded-2xl overflow-hidden">
        {currentGenres.map((genre, index) => (
          <div
            key={genre.id}
            className="relative group cursor-pointer overflow-hidden"
            onClick={() => onGenreSelect(genre.id)}
          >
            {/* Background image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${genre.imageUrl})` }}
            />
            
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-r ${genre.gradient}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Border between cards */}
            {index < 2 && (
              <div className="absolute right-0 top-0 bottom-0 w-px bg-white/10 z-10 hidden md:block" />
            )}
            
            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-center p-8 z-10">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 drop-shadow-lg">
                {genre.name}
              </h2>
              <p className="text-white/80 text-lg max-w-xs mb-6">
                {genre.description}
              </p>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/20 hover:border-white/50 rounded-full px-8 py-6 text-lg font-medium backdrop-blur-sm transition-all duration-300 group-hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2" fill="currentColor" />
                Browse
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
