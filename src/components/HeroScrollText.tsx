import { useState, useRef, useEffect, useCallback } from "react";

interface HeroScrollTextProps {
  text: string;
  gradientColors?: string;
}

/**
 * Pure typographic scroll effect for hero headlines
 * - Letters expand and spread on scroll
 * - Each letter animates with staggered timing
 * - Dramatic 3D depth effect
 * - No preview screen, just beautiful text animation
 */
export function HeroScrollText({ 
  text, 
  gradientColors = "from-green-500 via-emerald-500 to-primary"
}: HeroScrollTextProps) {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAccumulator = useRef(0);
  const animationFrame = useRef<number>();

  const letters = text.split('');

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY * 0.004;
    const newValue = scrollAccumulator.current + delta;
    
    // Exit when scrolling past end
    if (newValue > 1.15) {
      setIsActive(false);
      setProgress(0);
      scrollAccumulator.current = 0;
      document.body.style.overflow = '';
      return;
    }
    
    // Exit if scrolling back before start
    if (newValue < -0.15) {
      setIsActive(false);
      setProgress(0);
      scrollAccumulator.current = 0;
      document.body.style.overflow = '';
      return;
    }
    
    scrollAccumulator.current = Math.max(0, Math.min(1, newValue));
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    animationFrame.current = requestAnimationFrame(() => {
      setProgress(scrollAccumulator.current);
    });
  }, [isActive]);

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
    scrollAccumulator.current = progress;
  };

  const handleMouseLeave = () => {
    if (progress < 0.1) {
      setIsActive(false);
      setProgress(0);
      scrollAccumulator.current = 0;
    }
  };

  // Calculate letter animations based on progress
  const getLetterStyle = (index: number, total: number) => {
    // Stagger timing - letters near center animate first
    const centerIndex = total / 2;
    const distanceFromCenter = Math.abs(index - centerIndex) / centerIndex;
    const staggerDelay = distanceFromCenter * 0.3;
    const adjustedProgress = Math.max(0, Math.min(1, (progress - staggerDelay) / (1 - staggerDelay)));
    
    // Horizontal spread - letters move away from center
    const spreadDirection = index < centerIndex ? -1 : 1;
    const spreadAmount = adjustedProgress * spreadDirection * (20 + distanceFromCenter * 30);
    
    // Vertical wave
    const waveOffset = Math.sin((index / total) * Math.PI * 2 + progress * Math.PI) * adjustedProgress * 15;
    
    // Scale pulse
    const scalePulse = 1 + Math.sin(adjustedProgress * Math.PI) * 0.2;
    
    // Rotation
    const rotation = spreadDirection * adjustedProgress * 10 * distanceFromCenter;
    
    // Z-depth
    const zDepth = adjustedProgress * 50 * (1 - distanceFromCenter);
    
    return {
      transform: `
        translateX(${spreadAmount}px) 
        translateY(${waveOffset}px) 
        translateZ(${zDepth}px)
        scale(${scalePulse})
        rotateY(${rotation}deg)
      `,
      opacity: letters[index] === ' ' ? 0 : 1,
      transition: 'transform 0.15s ease-out',
    };
  };

  // Global text effects
  const textScale = 1 + progress * 0.15;
  const letterSpacing = progress * 0.08;
  const textGlow = progress * 30;

  return (
    <div 
      ref={containerRef}
      className="relative cursor-pointer select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Scroll hint */}
      <div className={`
        absolute -top-8 left-1/2 -translate-x-1/2 z-20
        flex items-center gap-2 px-3 py-1.5 rounded-full
        bg-card/80 backdrop-blur-sm border border-primary/30
        transition-all duration-300
        ${isActive && progress < 0.2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}>
        <div className="w-4 h-6 rounded-full border border-primary/50 flex justify-center pt-1">
          <div className="w-1 h-2 rounded-full bg-primary animate-bounce" />
        </div>
        <span className="text-xs font-medium text-foreground/80">Scroll to animate</span>
      </div>

      {/* Main text container with 3D perspective */}
      <div 
        className="relative"
        style={{
          perspective: '1000px',
          perspectiveOrigin: 'center center',
        }}
      >
        <div 
          className={`
            relative inline-flex flex-wrap justify-center
            text-3xl sm:text-4xl md:text-6xl lg:text-7xl 
            font-display font-black leading-none
          `}
          style={{
            transform: `scale(${textScale})`,
            letterSpacing: `${letterSpacing}em`,
            filter: `drop-shadow(0 0 ${textGlow}px hsl(var(--primary) / 0.5))`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
          }}
        >
          {letters.map((letter, idx) => (
            <span
              key={idx}
              className={`
                inline-block bg-gradient-to-b ${gradientColors} bg-clip-text text-transparent
                ${letter === ' ' ? 'w-[0.3em]' : ''}
              `}
              style={getLetterStyle(idx, letters.length)}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
        </div>

        {/* Animated underline */}
        <div 
          className={`
            absolute -bottom-2 left-1/2 h-1 rounded-full
            bg-gradient-to-r ${gradientColors}
            transition-all duration-300 ease-out
          `}
          style={{
            width: `${30 + progress * 70}%`,
            transform: 'translateX(-50%)',
            opacity: 0.5 + progress * 0.5,
          }}
        />
      </div>

      {/* Progress indicator */}
      {isActive && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-0.5 rounded-full bg-foreground/10 overflow-hidden">
          <div 
            className={`h-full rounded-full bg-gradient-to-r ${gradientColors}`}
            style={{ width: `${progress * 100}%`, transition: 'width 0.1s ease-out' }}
          />
        </div>
      )}
    </div>
  );
}
