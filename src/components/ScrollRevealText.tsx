import { useState, useRef, useEffect, useCallback } from "react";
import { TrendingUp, DollarSign, Music, Users, Play, Download } from "lucide-react";

interface ScrollRevealTextProps {
  text: string;
  previewType?: "discover" | "studio" | "earnings";
  gradientColors?: string;
  sectionId?: string;
}

// Mock Studio Earnings Dashboard Component
function StudioEarningsDashboard() {
  return (
    <div className="bg-background p-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Earnings</h1>
          <p className="text-muted-foreground">December 2024</p>
        </div>
        <div className="px-4 py-2 bg-primary/20 rounded-full border border-primary/30">
          <span className="text-primary font-semibold">$1.00 per stream</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Streams</span>
          </div>
          <p className="text-2xl font-bold text-foreground">24,847</p>
          <p className="text-xs text-green-500">+12.4% this month</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Stream Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-500">$24,847</p>
          <p className="text-xs text-muted-foreground">$1.00 × streams</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-4 h-4 text-secondary" />
            <span className="text-xs text-muted-foreground">Downloads</span>
          </div>
          <p className="text-2xl font-bold text-foreground">1,234</p>
          <p className="text-xs text-green-500">+8.2% this month</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">Monthly Listeners</span>
          </div>
          <p className="text-2xl font-bold text-foreground">8,432</p>
          <p className="text-xs text-green-500">+23.1% this month</p>
        </div>
      </div>

      {/* Earnings Chart Mock */}
      <div className="bg-card rounded-xl p-6 border border-border mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Earnings Over Time</h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {[35, 45, 38, 52, 48, 65, 72, 68, 85, 78, 92, 100].map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t"
                style={{ height: `${height}%` }}
              />
              <span className="text-[10px] text-muted-foreground">
                {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payout Info */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl p-6 border border-primary/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Next Payout</p>
            <p className="text-3xl font-bold text-foreground">$24,847.00</p>
            <p className="text-sm text-muted-foreground mt-1">Scheduled for Jan 1, 2025</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-semibold">+156% YoY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock Discover Dashboard
function DiscoverDashboard() {
  return (
    <div className="bg-background p-6 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Discover</h1>
        <p className="text-muted-foreground">Find your next favorite track</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { title: "Midnight Dreams", artist: "Luna Wave", plays: "2.4M" },
          { title: "Electric Soul", artist: "The Pulse", plays: "1.8M" },
          { title: "Golden Hour", artist: "Sunset Crew", plays: "3.1M" },
          { title: "City Lights", artist: "Neon Hearts", plays: "956K" },
        ].map((track, i) => (
          <div key={i} className="bg-card rounded-xl overflow-hidden border border-border group cursor-pointer hover:border-primary/50 transition-all">
            <div className="aspect-square bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
              <Music className="w-12 h-12 text-primary/50" />
            </div>
            <div className="p-3">
              <p className="font-semibold text-foreground text-sm truncate">{track.title}</p>
              <p className="text-xs text-muted-foreground">{track.artist}</p>
              <p className="text-xs text-primary mt-1">{track.plays} plays</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-semibold text-foreground mb-3">Trending Now</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="text-primary font-bold">#{i}</span>
              <div className="w-10 h-10 rounded bg-gradient-to-br from-accent/30 to-primary/30" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Track Name {i}</p>
                <p className="text-xs text-muted-foreground">Artist Name</p>
              </div>
              <Play className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Ferrari-style scroll reveal:
 * 1. Preview starts visible as fullscreen background
 * 2. As you scroll, text EMERGES from inside the preview (clipped initially)
 * 3. Text expands, preview visible THROUGH the text letterforms
 * 4. Text continues expanding, preview recedes
 * 5. Text is fully visible, preview gone
 * 6. Continue scrolling = exit and resume normal page scroll
 */
export function ScrollRevealText({ 
  text, 
  previewType = "earnings",
  gradientColors = "from-primary via-secondary to-accent",
  sectionId
}: ScrollRevealTextProps) {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAccumulator = useRef(0);
  const animationFrame = useRef<number>();

  // Smooth spring-based animation
  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const velocity = useRef(0);

  const animateSpring = useCallback(() => {
    const tension = 0.15;
    const friction = 0.75;
    
    const diff = targetProgress.current - currentProgress.current;
    velocity.current = velocity.current * friction + diff * tension;
    currentProgress.current += velocity.current;
    
    if (Math.abs(diff) > 0.001 || Math.abs(velocity.current) > 0.001) {
      setProgress(currentProgress.current);
      animationFrame.current = requestAnimationFrame(animateSpring);
    } else {
      currentProgress.current = targetProgress.current;
      setProgress(currentProgress.current);
    }
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Smoother delta with easing
    const delta = e.deltaY * 0.0025;
    const newValue = scrollAccumulator.current + delta;
    
    // Exit animation when scrolling past end
    if (newValue > 1.15) {
      setIsActive(false);
      targetProgress.current = 0;
      currentProgress.current = progress;
      scrollAccumulator.current = 0;
      document.body.style.overflow = '';
      return;
    }
    
    // Exit if scrolling back up before animation starts
    if (newValue < -0.15) {
      setIsActive(false);
      targetProgress.current = 0;
      currentProgress.current = progress;
      scrollAccumulator.current = 0;
      document.body.style.overflow = '';
      return;
    }
    
    scrollAccumulator.current = Math.max(0, Math.min(1, newValue));
    targetProgress.current = scrollAccumulator.current;
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    animationFrame.current = requestAnimationFrame(animateSpring);
  }, [isActive, progress, animateSpring]);

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

  // Progress phases:
  // 0.0-0.3: Preview visible, text starts emerging (small, visible through clip)
  // 0.3-0.7: Text expands, preview visible through text letterforms, then fades
  // 0.7-1.0: Text fully visible, preview gone, ready to exit

  // Preview opacity: starts at 1, fades as text expands
  const previewOpacity = Math.max(0, 1 - progress * 1.5);
  
  // Text scale: starts small inside preview, grows to full size
  const textScale = 0.3 + progress * 0.7;
  
  // Text letter spacing: increases as text expands
  const letterSpacing = progress * 0.15;
  
  // Text opacity: starts visible, stays visible
  const textOpacity = Math.min(1, progress * 3);
  
  // Clip path: text starts clipped to small center area, expands to full
  const clipInset = Math.max(0, 40 - progress * 50);

  return (
    <div 
      ref={containerRef}
      id={sectionId}
      className="relative h-screen w-full overflow-hidden cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Preview (Dashboard) - starts visible */}
      <div 
        className="absolute inset-0 z-10 transition-opacity duration-300"
        style={{ 
          opacity: isActive ? previewOpacity : 1,
        }}
      >
        {/* Glow effect behind preview */}
        <div className={`absolute inset-0 bg-gradient-to-b ${gradientColors} opacity-20`} />
        
        {/* Preview container - centered */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full max-w-5xl">
            {/* Outer glow */}
            <div className={`absolute -inset-8 rounded-3xl bg-gradient-to-r ${gradientColors} opacity-30 blur-3xl`} />
            
            {/* Browser window */}
            <div className="relative rounded-2xl overflow-hidden border border-primary/30 shadow-2xl bg-card">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-7 rounded-lg bg-muted flex items-center justify-center px-4">
                    <span className="text-sm text-muted-foreground">
                      {previewType === "discover" ? "discover.tdz.app" : "studio.tdz.app/earnings"}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Dashboard content */}
              <div className="h-[500px] overflow-hidden">
                {previewType === "discover" ? <DiscoverDashboard /> : <StudioEarningsDashboard />}
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll hint - only when not active */}
        {!isActive && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse">
            <span className="text-sm font-medium text-foreground/80">Scroll to reveal</span>
            <div className="w-6 h-10 rounded-full border-2 border-foreground/40 flex justify-center pt-2">
              <div className="w-1.5 h-3 rounded-full bg-foreground/60 animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Text Layer - emerges from preview, expands across screen */}
      <div 
        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        style={{
          opacity: isActive ? textOpacity : 0,
        }}
      >
        <h2 
          className="text-center font-display font-black leading-none select-none px-4"
          style={{
            fontSize: 'clamp(3rem, 15vw, 12rem)',
            transform: `scale(${textScale})`,
            letterSpacing: `${letterSpacing}em`,
            clipPath: `inset(${clipInset}% ${clipInset}% ${clipInset}% ${clipInset}%)`,
            transition: 'clip-path 0.1s ease-out, transform 0.1s ease-out',
            // Text has preview as background texture during mid-animation
            background: progress < 0.7 
              ? `linear-gradient(to right, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)))`
              : `linear-gradient(to right, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {text}
        </h2>
      </div>

      {/* Progress indicator at bottom */}
      {isActive && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-48 h-1 rounded-full bg-foreground/20 overflow-hidden">
          <div 
            className={`h-full rounded-full bg-gradient-to-r ${gradientColors}`}
            style={{ width: `${progress * 100}%`, transition: 'width 0.1s ease-out' }}
          />
        </div>
      )}

      {/* Continue hint when fully expanded */}
      {isActive && progress > 0.8 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 text-center animate-pulse">
          <span className="text-sm text-foreground/60">Keep scrolling to continue</span>
        </div>
      )}
    </div>
  );
}

// Simpler inline word reveal for inline text
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
      setScale(1 + scrollRef.current * 0.5);
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
      className={`${colorMap[color]} font-bold inline-block cursor-pointer transition-all duration-200`}
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
