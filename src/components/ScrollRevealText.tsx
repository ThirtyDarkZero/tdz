import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";

interface ScrollRevealTextProps {
  text: string;
  previewType?: "discover" | "studio";
  gradientColors?: string;
  children?: React.ReactNode;
  sectionId?: string;
}

export function ScrollRevealText({ 
  text, 
  previewType = "discover",
  gradientColors = "from-primary via-secondary to-accent",
  children,
  sectionId
}: ScrollRevealTextProps) {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAccumulator = useRef(0);
  const animationFrame = useRef<number>();
  
  // Split into words for cleaner animation
  const words = text.split(' ');

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Smooth scroll accumulation
    const delta = e.deltaY * 0.004;
    scrollAccumulator.current = Math.max(0, Math.min(1, scrollAccumulator.current + delta));
    
    // Animate to target
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    animationFrame.current = requestAnimationFrame(() => {
      setProgress(scrollAccumulator.current);
      
      if (scrollAccumulator.current >= 0.7 && !showPreview) {
        setShowPreview(true);
      } else if (scrollAccumulator.current < 0.5 && showPreview) {
        setShowPreview(false);
      }
    });
  }, [isActive, showPreview]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener('wheel', handleWheel, { passive: false });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = '';
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isActive, handleWheel]);

  const handleMouseEnter = () => {
    setIsActive(true);
  };

  const handleMouseLeave = () => {
    setIsActive(false);
    // Smooth reset
    const resetAnimation = () => {
      scrollAccumulator.current *= 0.9;
      setProgress(scrollAccumulator.current);
      
      if (scrollAccumulator.current > 0.01) {
        requestAnimationFrame(resetAnimation);
      } else {
        scrollAccumulator.current = 0;
        setProgress(0);
        setShowPreview(false);
      }
    };
    requestAnimationFrame(resetAnimation);
  };

  // Calculate visual properties based on progress
  const wordSpacing = 0.5 + progress * 2; // rem
  const textOpacity = 1 - progress * 0.3;
  const textScale = 1 + progress * 0.15;
  const textY = progress * -20;

  return (
    <div 
      ref={containerRef}
      className="relative cursor-pointer select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Scroll instruction */}
      <div className={`
        absolute -top-12 left-1/2 -translate-x-1/2 z-20
        flex items-center gap-2 px-4 py-2 rounded-full
        bg-card/90 backdrop-blur-md border border-primary/30
        transition-all duration-500 ease-out
        ${isActive && progress < 0.2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}>
        <ChevronDown className="w-4 h-4 text-primary animate-bounce" />
        <span className="text-sm font-medium text-foreground">Scroll to explore</span>
        <ChevronDown className="w-4 h-4 text-primary animate-bounce" />
      </div>

      {/* Main text container */}
      <div 
        className="relative z-10 transition-all duration-300 ease-out"
        style={{
          transform: `scale(${textScale}) translateY(${textY}px)`,
          opacity: showPreview ? 0.4 : textOpacity,
        }}
      >
        <h2 className={`
          text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 
          font-display font-black leading-tight text-center
          transition-all duration-300
        `}>
          <span className={`
            bg-gradient-to-r ${gradientColors} bg-clip-text text-transparent
            inline-flex flex-wrap justify-center gap-x-3 md:gap-x-4
          `}
          style={{
            gap: `0 ${wordSpacing}rem`,
            textShadow: isActive 
              ? `0 0 ${20 + progress * 40}px hsl(var(--primary) / ${0.2 + progress * 0.3})` 
              : 'none',
          }}
          >
            {words.map((word, idx) => (
              <span 
                key={idx}
                className="inline-block transition-transform duration-300 ease-out whitespace-nowrap"
                style={{
                  transform: `translateY(${Math.sin(idx * 0.8 + progress * 3) * progress * 6}px)`,
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                {word}
              </span>
            ))}
          </span>
        </h2>
      </div>

      {/* Live Preview - emerges prominently in foreground */}
      <div 
        className={`
          fixed inset-0 z-50 flex items-center justify-center
          transition-all duration-700 ease-out
          ${showPreview ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        style={{
          backgroundColor: `hsl(var(--background) / ${0.5 + progress * 0.4})`,
        }}
      >
        <div 
          className="relative w-full max-w-5xl mx-4"
          style={{
            transform: showPreview ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(50px)',
            transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Glowing frame */}
          <div className={`
            absolute -inset-4 md:-inset-6 rounded-3xl
            bg-gradient-to-r ${gradientColors}
            opacity-60 blur-2xl animate-pulse
          `} />
          
          {/* Preview container */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-primary/50 shadow-2xl bg-card">
            {/* Header bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-card/90 border-b border-border/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-6 rounded-md bg-muted/50 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    {previewType === "discover" ? "discover.tdz.app" : "studio.tdz.app"}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Live preview iframe */}
            <div className="aspect-video relative overflow-hidden">
              <iframe 
                src={previewType === "discover" ? "/discover" : "/studio"} 
                className="w-full h-full border-0"
                style={{ 
                  transform: 'scale(0.6)', 
                  transformOrigin: 'top left', 
                  width: '166.67%', 
                  height: '166.67%',
                  pointerEvents: 'none'
                }}
                title={`${previewType} preview`}
              />
              
              {/* Gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />
            </div>
            
            {/* CTA footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
              <p className="text-lg font-semibold text-foreground mb-2">
                {previewType === "discover" ? "Discover amazing music" : "Your professional studio"}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  Scroll down to continue
                </span>
              </div>
            </div>
          </div>

          {/* Floating accent particles */}
          <div className="absolute -inset-12 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className={`absolute w-3 h-3 rounded-full bg-gradient-to-r ${gradientColors}`}
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${10 + (i % 3) * 30}%`,
                  animation: `float ${2 + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.6 + Math.random() * 0.4
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`
        absolute -bottom-8 left-1/2 -translate-x-1/2 
        w-32 h-1.5 rounded-full bg-muted/30 overflow-hidden
        transition-opacity duration-300
        ${isActive ? 'opacity-100' : 'opacity-0'}
      `}>
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${gradientColors} transition-all duration-150`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Children (subtitle) - fades when preview shows */}
      {children && (
        <div className={`
          transition-all duration-500
          ${showPreview ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
        `}>
          {children}
        </div>
      )}
    </div>
  );
}

// Simpler inline word reveal for smaller usage
export function ScrollRevealWord({ 
  word, 
  color = "primary" 
}: { 
  word: string; 
  color?: "primary" | "secondary" | "accent" 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [scale, setScale] = useState(1);
  const scrollRef = useRef(0);

  useEffect(() => {
    if (!isHovered) {
      setScale(1);
      scrollRef.current = 0;
      return;
    }

    const handleWheel = (e: WheelEvent) => {
      if (!isHovered) return;
      e.preventDefault();
      
      scrollRef.current = Math.max(0, Math.min(1, scrollRef.current + e.deltaY * 0.003));
      const newScale = 1 + scrollRef.current * 0.5;
      setScale(newScale);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isHovered]);

  const colorMap = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent"
  };

  return (
    <span 
      className={`
        ${colorMap[color]} font-bold inline-block cursor-pointer
        transition-all duration-300 hover:drop-shadow-[0_0_12px_hsl(var(--${color})/0.5)]
      `}
      style={{ 
        transform: `scale(${scale})`,
        letterSpacing: `${(scale - 1) * 0.1}em`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setScale(1);
        scrollRef.current = 0;
      }}
    >
      {word}
    </span>
  );
}
