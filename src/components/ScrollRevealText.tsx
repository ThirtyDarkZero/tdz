import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, TrendingUp, DollarSign, Music, Users, Play, Download } from "lucide-react";

interface ScrollRevealTextProps {
  text: string;
  previewType?: "discover" | "studio" | "earnings";
  gradientColors?: string;
  children?: React.ReactNode;
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

export function ScrollRevealText({ 
  text, 
  previewType = "earnings",
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
  
  const words = text.split(' ');

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY * 0.005;
    const newValue = scrollAccumulator.current + delta;
    
    // If scrolling down past 1, close preview and resume normal scroll
    if (newValue > 1.2 && showPreview) {
      setIsActive(false);
      setShowPreview(false);
      setProgress(0);
      scrollAccumulator.current = 0;
      document.body.style.overflow = '';
      return;
    }
    
    // If scrolling up past 0, close and resume
    if (newValue < -0.2) {
      setIsActive(false);
      setShowPreview(false);
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
      
      if (scrollAccumulator.current >= 0.6 && !showPreview) {
        setShowPreview(true);
      } else if (scrollAccumulator.current < 0.4 && showPreview) {
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
    scrollAccumulator.current = progress;
  };

  const handleMouseLeave = () => {
    setIsActive(false);
    const resetAnimation = () => {
      scrollAccumulator.current *= 0.85;
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

  // Visual properties - SOLID text, no blur
  const wordSpacing = 0.5 + progress * 3;
  const textScale = 1 + progress * 0.2;

  return (
    <div 
      ref={containerRef}
      className="relative cursor-pointer select-none py-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Scroll instruction */}
      <div className={`
        absolute -top-10 left-1/2 -translate-x-1/2 z-20
        flex items-center gap-2 px-4 py-2 rounded-full
        bg-card/95 backdrop-blur-sm border border-primary/40
        transition-all duration-300
        ${isActive && progress < 0.3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
      `}>
        <ChevronDown className="w-4 h-4 text-primary animate-bounce" />
        <span className="text-sm font-medium text-foreground">Scroll to explore</span>
        <ChevronDown className="w-4 h-4 text-primary animate-bounce" />
      </div>

      {/* Main text - SOLID, readable, no blur */}
      <div 
        className="relative z-10 transition-all duration-200 ease-out"
        style={{
          transform: `scale(${textScale})`,
        }}
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-black leading-tight text-center">
          <span 
            className={`bg-gradient-to-r ${gradientColors} bg-clip-text text-transparent inline-flex flex-wrap justify-center`}
            style={{
              gap: `0.25rem ${wordSpacing}rem`,
            }}
          >
            {words.map((word, idx) => (
              <span 
                key={idx}
                className="inline-block transition-transform duration-200 whitespace-nowrap"
                style={{
                  transform: `translateY(${Math.sin(idx * 0.5 + progress * 2) * progress * 8}px)`,
                }}
              >
                {word}
              </span>
            ))}
          </span>
        </h2>
      </div>

      {/* Preview - FOREGROUND overlay */}
      <div 
        className={`
          fixed inset-0 z-50 flex items-center justify-center p-4
          transition-all duration-500 ease-out
          ${showPreview ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        style={{
          backgroundColor: `hsl(var(--background) / 0.95)`,
        }}
      >
        <div 
          className="relative w-full max-w-4xl"
          style={{
            transform: showPreview ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(30px)',
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Glow effect */}
          <div className={`
            absolute -inset-6 rounded-3xl
            bg-gradient-to-r ${gradientColors}
            opacity-40 blur-3xl
          `} />
          
          {/* Preview container */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-primary/50 shadow-2xl bg-card">
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
            
            {/* Mock dashboard content - NOT an iframe */}
            <div className="h-[400px] md:h-[450px] overflow-hidden">
              {previewType === "discover" ? <DiscoverDashboard /> : <StudioEarningsDashboard />}
            </div>
          </div>

          {/* Continue scrolling hint */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-sm text-muted-foreground">Keep scrolling to continue</span>
            <ChevronDown className="w-5 h-5 text-primary animate-bounce" />
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className={`
        absolute -bottom-6 left-1/2 -translate-x-1/2 
        w-24 h-1 rounded-full bg-muted/40 overflow-hidden
        transition-opacity duration-200
        ${isActive ? 'opacity-100' : 'opacity-0'}
      `}>
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${gradientColors}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Children fade when preview shows */}
      {children && (
        <div className={`
          transition-all duration-300
          ${showPreview ? 'opacity-0' : 'opacity-100'}
        `}>
          {children}
        </div>
      )}
    </div>
  );
}

// Simpler inline word reveal
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
