import { Badge } from "@/components/ui/badge";
import { Flame, Sparkles, Zap, Music2, Headphones } from "lucide-react";

export function ImmersiveHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl perspective-2000">
      {/* Multi-layer animated background */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient mesh */}
        <div className="absolute inset-0 mesh-bg opacity-60" />
        
        {/* Aurora layer */}
        <div className="absolute inset-0 aurora-bg opacity-40" />
        
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-breathe" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/25 rounded-full blur-[100px] animate-breathe" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[140px] animate-breathe" style={{ animationDelay: '-4s' }} />
        
        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/60"
            style={{
              left: `${10 + (i * 7)}%`,
              top: `${20 + Math.sin(i) * 30}%`,
              animation: `float ${5 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${-i * 0.3}s`,
              filter: 'blur(1px)'
            }}
          />
        ))}
        
        {/* Glowing lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary to-transparent" />
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-secondary to-transparent" />
        </div>
      </div>
      
      {/* Glass card container */}
      <div className="relative z-10 glass-ultra p-8 md:p-12 lg:p-16 border border-white/10">
        {/* Shimmer effect */}
        <div className="absolute inset-0 animate-shimmer rounded-3xl pointer-events-none" />
        
        <div className="relative z-20 space-y-6 md:space-y-8">
          {/* Animated badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-primary/20 text-primary border-primary/40 shadow-glow px-4 py-2 text-sm font-medium animate-pulse">
              <Flame className="w-4 h-4 mr-2" />
              Hot This Week
            </Badge>
            <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/40 px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              AI + Human Artists
            </Badge>
          </div>
          
          {/* Main headline with staggered animation */}
          <div className="space-y-2">
            <h1 
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <span className="text-gradient-aurora glow-text-ultra">
                DISCOVER
              </span>
            </h1>
            <h2 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground/90 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              NEW MUSIC
            </h2>
          </div>
          
          {/* Subtitle with fade */}
          <p 
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-3xl font-light leading-relaxed animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            Stream unlimited music from independent & AI artists around the world
          </p>
          
          {/* Live status indicators */}
          <div 
            className="flex items-center gap-4 md:gap-6 text-sm text-muted-foreground animate-fade-in flex-wrap"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary animate-ping" />
              </div>
              <span className="font-medium">Live Now</span>
            </div>
            <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full">
              <Music2 className="w-4 h-4 text-primary" />
              <span>Millions of Tracks</span>
            </div>
            <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full">
              <Zap className="w-4 h-4 text-secondary" />
              <span>$1/Stream to Artists</span>
            </div>
          </div>
          
          {/* Floating icons decoration */}
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 hidden lg:block">
            <div className="relative w-40 h-40">
              <Headphones className="absolute w-12 h-12 text-primary/40 float" style={{ top: '0', left: '50%' }} />
              <Music2 className="absolute w-10 h-10 text-secondary/40 float-delayed" style={{ bottom: '0', left: '20%' }} />
              <Sparkles className="absolute w-8 h-8 text-accent/40 float-slow" style={{ top: '50%', right: '0' }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-30" />
    </div>
  );
}