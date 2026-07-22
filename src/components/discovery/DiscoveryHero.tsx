import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Flame, DollarSign, Sparkles } from "lucide-react";
import { AnimatedHeading, ScrollReveal } from "@/components/AnimatedHeading";
import artistStudio from "@/assets/hero-artist-studio.jpg";
import artistStreet from "@/assets/hero-artist-street.jpg";
import artistHeadphones from "@/assets/hero-artist-headphones.jpg";

const REEL = [
  {
    src: artistStudio,
    kicker: "SMART DISTRIBUTION, ZERO LIMITS",
    headline: "THE FIRST PLATFORM",
    line2: "THAT PAYS $1 PER STREAM",
    sub: "Independent artists earn 333× more than legacy streaming.",
  },
  {
    src: artistStreet,
    kicker: "FAN TIPPING",
    headline: "TIP THE ARTIST",
    line2: "EVERY DOLLAR HITS THE CREATOR",
    sub: "Fans fund the artists they love — directly, instantly, transparently.",
  },
  {
    src: artistHeadphones,
    kicker: "DISCOVERY REIMAGINED",
    headline: "SOUND. STORY.",
    line2: "SIGNAL.",
    sub: "Editorial curation, live pulse, resonance graphs. Not another algorithm feed.",
  },
];

export function DiscoveryHero() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % REEL.length), 6500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl">
      {/* Cinematic backdrop images — cross-fading */}
      <div className="absolute inset-0">
        {REEL.map((slide, idx) => (
          <div
            key={idx}
            aria-hidden={i !== idx}
            className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
            style={{ opacity: i === idx ? 1 : 0 }}
          >
            <img
              src={slide.src}
              alt=""
              className="w-full h-full object-cover"
              style={{ transform: "scale(1.06)", filter: "saturate(1.1) contrast(1.05)" }}
            />
          </div>
        ))}
        {/* Vignette + gradient wash to keep text legible */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        {/* Brand grain */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(1200px 400px at 20% 20%, rgba(139,92,246,0.35), transparent 60%), radial-gradient(900px 400px at 90% 80%, rgba(236,72,153,0.35), transparent 60%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-10 md:p-14 lg:p-16 min-h-[280px] sm:min-h-[360px] md:min-h-[440px] flex flex-col justify-end">
        <ScrollReveal delay={0}>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge className="bg-white/10 backdrop-blur border-white/20 text-white px-3 py-1.5 text-[10px] sm:text-xs tracking-widest">
              <Flame className="w-3 h-3 mr-1.5 text-primary" />
              {REEL[i].kicker}
            </Badge>
            <Badge className="bg-primary/20 border-primary/40 text-primary-foreground px-3 py-1.5 text-[10px] sm:text-xs tracking-widest">
              <DollarSign className="w-3 h-3 mr-1" />
              $1 / STREAM
            </Badge>
          </div>
        </ScrollReveal>

        <div key={i} className="space-y-1 md:space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AnimatedHeading
            text={REEL[i].headline}
            variant="large"
            gradient="from-white via-white to-white/70"
            staggerDelay={0.03}
            className="!text-white drop-shadow-2xl"
          />
          <h2
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-white/95 drop-shadow-lg"
            style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.02em" }}
          >
            {REEL[i].line2}
          </h2>
        </div>

        <ScrollReveal delay={0.2}>
          <p className="mt-4 text-sm sm:text-base md:text-lg text-white/80 max-w-2xl font-light">
            {REEL[i].sub}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.35}>
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/70">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="tracking-widest uppercase">Beta Access · Artist First</span>
            </div>
            {/* Reel dots */}
            <div className="flex items-center gap-1.5 ml-auto">
              {REEL.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Slide ${idx + 1}`}
                  onClick={() => setI(idx)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === idx ? 28 : 10,
                    background: i === idx ? "#fff" : "rgba(255,255,255,0.35)",
                  }}
                />
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
