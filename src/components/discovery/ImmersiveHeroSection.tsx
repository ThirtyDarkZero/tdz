import { memo, useMemo } from "react";
import { Play, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";

interface ImmersiveHeroSectionProps {
  forYouItems: Array<{
    id: string;
    title: string;
    artist: string;
    image: string;
    type: "album" | "track";
    trackData?: any;
  }>;
  carouselCenterIndex: number;
  onCenterChange: (index: number) => void;
  onNavigate: (path: string) => void;
  onPlayTrack: (track: any) => void;
}

export const ImmersiveHeroSection = memo(function ImmersiveHeroSection({
  forYouItems,
  carouselCenterIndex,
  onCenterChange,
  onNavigate,
  onPlayTrack,
}: ImmersiveHeroSectionProps) {
  const activeItem = forYouItems[carouselCenterIndex] || forYouItems[0];

  const visibleItems = useMemo(() => {
    if (forYouItems.length === 0) return [];
    return Array.from({ length: 7 }, (_, slot) => {
      const offset = slot - 3;
      const index = (carouselCenterIndex + offset + forYouItems.length) % forYouItems.length;
      return { offset, index, item: forYouItems[index] };
    });
  }, [forYouItems, carouselCenterIndex]);

  if (!activeItem || forYouItems.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: "100vh" }}>
      {/* Full-viewport background from active item */}
      <div className="absolute inset-0">
        <img
          src={activeItem.image}
          alt=""
          className="w-full h-full object-cover transition-all duration-1000"
          style={{ filter: "blur(60px) saturate(180%) brightness(0.3)", transform: "scale(1.3)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(3,3,15,0.4) 0%, rgba(3,3,15,0.7) 50%, rgba(3,3,15,0.95) 100%)" }} />
      </div>

      {/* Content grid */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6">
        {/* Hero artwork with circular glow */}
        <div className="relative mb-8 mt-20">
          {/* Circular glow layers */}
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              width: 320,
              height: 320,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle, rgba(0,207,255,0.25) 0%, rgba(139,92,246,0.15) 40%, transparent 70%)`,
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 380,
              height: 380,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle, rgba(0,207,255,0.1) 0%, transparent 60%)`,
              filter: "blur(60px)",
              animation: "breathe 4s ease-in-out infinite",
            }}
          />
          <img
            src={activeItem.image}
            alt={activeItem.title}
            className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 object-cover rounded-2xl shadow-2xl transition-all duration-700"
            style={{ boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8), 0 0 60px rgba(0,207,255,0.15)" }}
          />
        </div>

        {/* Track info */}
        <div className="text-center mb-8 max-w-lg">
          <h1
            className="font-display transition-all duration-500"
            style={{ fontSize: "clamp(36px, 8vw, 64px)", color: "var(--text-1)", lineHeight: 0.95 }}
          >
            {activeItem.title}
          </h1>
          <p className="font-body mt-3" style={{ fontSize: "clamp(14px, 3vw, 18px)", color: "var(--text-2)" }}>
            {activeItem.artist}
          </p>
          {/* Play button */}
          <button
            onClick={() => {
              if (activeItem.trackData) {
                onPlayTrack(activeItem.trackData);
              } else {
                const targetId = activeItem.id.replace(/^(album|track)-/, "");
                onNavigate(activeItem.type === "album" ? `/album/${targetId}` : `/track/${targetId}`);
              }
            }}
            className="mt-6 w-14 h-14 rounded-full flex items-center justify-center mx-auto transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              background: "var(--text-1)",
              color: "#000",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 40px rgba(0,207,255,0.2)",
            }}
          >
            <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
          </button>
        </div>

        {/* Carousel strip */}
        <div className="w-full max-w-3xl">
          {/* Desktop: 7 covers */}
          <div className="hidden sm:grid grid-cols-7 items-center" style={{ gap: 0 }}>
            {visibleItems.map(({ item, offset, index }, slotIndex) => {
              const distance = Math.abs(offset);
              const isCenter = offset === 0;
              const scale = [1, 0.9, 0.8, 0.7][distance] ?? 0.7;
              const opacity = [1, 0.85, 0.7, 0.55][distance] ?? 0.55;

              return (
                <button
                  key={`${item.id}-${slotIndex}`}
                  className="relative w-full aspect-square cursor-pointer transition-all duration-500"
                  style={{
                    transform: `scale(${scale})`,
                    opacity,
                    filter: isCenter ? "none" : "saturate(0.7)",
                  }}
                  onClick={() => {
                    if (!isCenter) {
                      onCenterChange(index);
                    }
                  }}
                >
                  {/* Circular glow behind artwork */}
                  {isCenter && (
                    <div
                      className="absolute inset-[-20%] rounded-full pointer-events-none"
                      style={{
                        background: "radial-gradient(circle, rgba(0,207,255,0.2) 0%, transparent 70%)",
                        filter: "blur(20px)",
                      }}
                    />
                  )}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="relative z-10 w-full h-full object-cover"
                    style={{ borderRadius: 12 }}
                  />
                </button>
              );
            })}
          </div>

          {/* Mobile: 3 covers */}
          <div className="grid grid-cols-3 gap-2 items-center sm:hidden">
            {visibleItems.slice(2, 5).map(({ item, offset, index }, slotIndex) => {
              const distance = Math.abs(offset);
              const isCenter = offset === 0;
              const scale = [1, 0.85, 0.72][distance] ?? 0.72;
              const opacity = [1, 0.8, 0.6][distance] ?? 0.6;

              return (
                <button
                  key={`m-${item.id}-${slotIndex}`}
                  className="relative w-full aspect-square cursor-pointer transition-all duration-500"
                  style={{ transform: `scale(${scale})`, opacity }}
                  onClick={() => !isCenter && onCenterChange(index)}
                >
                  {isCenter && (
                    <div
                      className="absolute inset-[-15%] rounded-full pointer-events-none"
                      style={{
                        background: "radial-gradient(circle, rgba(0,207,255,0.25) 0%, transparent 70%)",
                        filter: "blur(16px)",
                      }}
                    />
                  )}
                  <img src={item.image} alt={item.title} className="relative z-10 w-full h-full object-cover" style={{ borderRadius: 10 }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-12 mb-8 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-8" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,207,255,0.4))" }} />
          <span className="font-body" style={{ fontSize: 10, color: "var(--text-4)", letterSpacing: "0.15em" }}>SCROLL</span>
        </div>
      </div>
    </section>
  );
});
