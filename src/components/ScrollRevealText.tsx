import { useState, useRef, useEffect } from "react";

interface ScrollRevealTextProps {
  text: string;
  previewImage?: string;
  previewType?: "discover" | "studio";
  gradientColors?: string;
  children?: React.ReactNode;
}

export function ScrollRevealText({ 
  text, 
  previewImage,
  previewType = "discover",
  gradientColors = "from-primary via-secondary to-accent",
  children
}: ScrollRevealTextProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAccumulator = useRef(0);
  
  // Handle wheel scroll to expand text
  useEffect(() => {
    if (!isHovering) {
      // Reset when not hovering
      scrollAccumulator.current = 0;
      setScrollProgress(0);
      setIsRevealed(false);
      return;
    }

    const handleWheel = (e: WheelEvent) => {
      if (!isHovering) return;
      
      e.preventDefault();
      
      // Accumulate scroll delta
      scrollAccumulator.current += Math.abs(e.deltaY) * 0.003;
      const newProgress = Math.min(1, scrollAccumulator.current);
      setScrollProgress(newProgress);
      
      if (newProgress >= 0.8 && !isRevealed) {
        setIsRevealed(true);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isHovering, isRevealed]);

  // Split text into individual letters for animation
  const letters = text.split('');
  
  // Calculate letter spacing based on scroll progress
  const baseSpacing = 0.04; // em
  const maxSpacing = 0.8; // em at full expansion
  const currentSpacing = baseSpacing + (maxSpacing - baseSpacing) * scrollProgress;
  
  // Calculate font size scaling
  const baseScale = 1;
  const maxScale = 1.3;
  const currentScale = baseScale + (maxScale - baseScale) * scrollProgress;

  return (
    <div 
      ref={containerRef}
      className="relative cursor-pointer overflow-visible"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setScrollProgress(0);
        setIsRevealed(false);
        scrollAccumulator.current = 0;
      }}
    >
      {/* Instruction indicator */}
      <div className={`
        absolute -top-8 left-1/2 -translate-x-1/2 
        text-xs text-muted-foreground/80 whitespace-nowrap
        flex items-center gap-2 transition-all duration-500
        ${isHovering && scrollProgress < 0.3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}>
        <span className="animate-bounce">↕</span>
        <span>Scroll to reveal</span>
        <span className="animate-bounce">↕</span>
      </div>

      {/* Animated text container */}
      <h2 
        className={`
          text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-black 
          transition-all duration-300 ease-out select-none
          bg-gradient-to-r ${gradientColors} bg-clip-text text-transparent
          ${isHovering ? 'glow-text-ultra' : ''}
        `}
        style={{
          letterSpacing: `${currentSpacing}em`,
          transform: `scale(${currentScale})`,
          textShadow: isHovering 
            ? `0 0 ${40 + scrollProgress * 60}px hsl(var(--primary) / ${0.3 + scrollProgress * 0.5})` 
            : 'none'
        }}
      >
        {letters.map((letter, idx) => (
          <span 
            key={idx} 
            className="inline-block transition-all duration-200"
            style={{
              transform: `translateY(${Math.sin(idx * 0.5 + scrollProgress * 5) * scrollProgress * 8}px)`,
              opacity: letter === ' ' ? 0 : 1,
              animationDelay: `${idx * 0.02}s`
            }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </h2>

      {/* Platform preview that emerges from the text */}
      <div 
        className={`
          absolute left-1/2 -translate-x-1/2
          transition-all duration-700 ease-out
          ${isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
        `}
        style={{
          top: `${60 + scrollProgress * 20}%`,
          width: `${Math.min(100, 40 + scrollProgress * 60)}%`,
          zIndex: isRevealed ? 50 : -1
        }}
      >
        <div className="relative">
          {/* Glowing frame */}
          <div className={`
            absolute -inset-2 rounded-2xl
            bg-gradient-to-r ${gradientColors}
            opacity-60 blur-xl animate-pulse
          `} />
          
          {/* Preview container */}
          <div className="relative rounded-xl overflow-hidden border-2 border-primary/50 shadow-2xl">
            {/* Live preview iframe or image */}
            <div className="aspect-video bg-card relative">
              {previewType === "discover" ? (
                <iframe 
                  src="/discover" 
                  className="w-full h-full pointer-events-none"
                  style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                />
              ) : (
                <iframe 
                  src="/studio" 
                  className="w-full h-full pointer-events-none"
                  style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                />
              )}
              
              {/* Overlay with CTA */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent flex items-end justify-center pb-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {previewType === "discover" ? "Discover amazing music" : "Create your next hit"}
                  </p>
                  <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                    Scroll down to continue
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating particles around preview */}
          <div className="absolute -inset-8 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary animate-pulse"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.5 + Math.random() * 0.5
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Static children content (subtitle, etc.) */}
      {children && (
        <div className={`
          transition-all duration-500
          ${isRevealed ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
        `}>
          {children}
        </div>
      )}

      {/* Progress indicator */}
      {isHovering && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-muted/30 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-150"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Simpler version for smaller sections
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
      
      scrollRef.current += Math.abs(e.deltaY) * 0.002;
      const newScale = Math.min(2, 1 + scrollRef.current);
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
        transition-all duration-300
        ${isHovered ? 'glow-text-lg' : ''}
      `}
      style={{ 
        transform: `scale(${scale})`,
        letterSpacing: `${0.04 + (scale - 1) * 0.15}em`
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
