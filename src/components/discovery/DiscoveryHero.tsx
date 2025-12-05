import { Badge } from "@/components/ui/badge";
import { Flame, Sparkles } from "lucide-react";

export function DiscoveryHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl glass-card-premium p-6 sm:p-8 md:p-12 border-primary/40 shadow-glow-lg hover-lift">
      <div className="absolute inset-0 animated-gradient opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary-glow/20 to-secondary/30" />
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary-glow/30 to-secondary/20 blur-3xl -z-10 animate-pulse" />
      
      <div className="relative z-10 space-y-4 md:space-y-6">
        <Badge className="bg-primary/30 text-primary-foreground border-primary/50 shadow-glow px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm animate-fade-in">
          <Flame className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 animate-pulse" />
          What's Moving People
        </Badge>
        
        <div className="space-y-2 md:space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="glow-text-lg bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
              EXPLORE
            </span>
          </h1>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground/90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            ARTIST STORIES
          </h2>
        </div>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl font-light animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Music shared, discussed, and explored — not just streamed
        </p>
        
        <div className="flex items-center gap-2 md:gap-3 text-xs sm:text-sm text-muted-foreground animate-fade-in flex-wrap" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-1.5 md:gap-2">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
            <span>Human Expression First</span>
          </div>
          <span className="text-border">•</span>
          <span>Independent Voices</span>
          <span className="text-border hidden sm:inline">•</span>
          <span className="hidden sm:inline">Join the Movement</span>
        </div>
      </div>
    </div>
  );
}
