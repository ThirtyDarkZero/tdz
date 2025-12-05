import { Badge } from "@/components/ui/badge";
import { Flame, Sparkles } from "lucide-react";
import { AnimatedHeading, ScrollReveal } from "@/components/AnimatedHeading";

export function DiscoveryHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl glass-card-premium p-6 sm:p-8 md:p-12 border-primary/40 shadow-glow-lg hover-lift">
      <div className="absolute inset-0 animated-gradient opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary-glow/20 to-secondary/30" />
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary-glow/30 to-secondary/20 blur-3xl -z-10 animate-pulse" />
      
      <div className="relative z-10 space-y-4 md:space-y-6">
        <ScrollReveal delay={0}>
          <Badge className="bg-primary/30 text-primary-foreground border-primary/50 shadow-glow px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm">
            <Flame className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 animate-pulse" />
            What's Moving People
          </Badge>
        </ScrollReveal>
        
        <div className="space-y-2 md:space-y-4">
          <AnimatedHeading 
            text="EXPLORE" 
            variant="large"
            gradient="from-primary via-primary-glow to-secondary"
            staggerDelay={0.04}
            className="glow-text-lg"
          />
          <ScrollReveal delay={0.2}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground/90">
              ARTIST STORIES
            </h2>
          </ScrollReveal>
        </div>
        
        <ScrollReveal delay={0.3}>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl font-light">
            Music shared, discussed, and explored — not just streamed
          </p>
        </ScrollReveal>
        
        <ScrollReveal delay={0.4}>
          <div className="flex items-center gap-2 md:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              <span>Human Expression First</span>
            </div>
            <span className="text-border">•</span>
            <span>Independent Voices</span>
            <span className="text-border hidden sm:inline">•</span>
            <span className="hidden sm:inline">Join the Movement</span>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}