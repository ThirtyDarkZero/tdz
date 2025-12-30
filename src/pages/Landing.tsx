import { useState, useEffect, useRef, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Upload, TrendingUp, Zap, Globe, Radio, Shield, Users, ArrowRight, CheckCircle2, DollarSign, BarChart3, Headphones, Heart, Play, Mic2, Layers, Library, Image, BookOpen, Film, User, ShoppingBag, LayoutDashboard, Download, CreditCard, ChevronDown, Sparkles, Star, MessageCircle, Palette } from "lucide-react";
import studioBackground from "@/assets/studio-background.jpg";
import tdzLogo from "@/assets/tdz-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { MotionCover } from "@/components/MotionCover";
import { Hero3D } from "@/components/Hero3D";
import { EnhancedCard } from "@/components/EnhancedCard";
import { StudioPhoneMockups, MusicPlayerPhoneMockups, DiscoveryPhoneMockups } from "@/components/StudioPhoneMockup";
import { MerchStore } from "@/components/MerchStore";
import { ScrollRevealText } from "@/components/ScrollRevealText";
import { HeroScrollText } from "@/components/HeroScrollText";
import { Canvas } from "@react-three/fiber";
import { DecorativeVisualizerScene } from "@/components/3D/DecorativeVisualizer";

const artistFeatures = [
  {
    icon: DollarSign,
    title: "$1 Per Stream",
    description: "Earn $1.00 for every stream on TDZ—not fractions of a cent",
    color: "from-green-500 to-emerald-500",
    expandedInfo: "Unlike Spotify's $0.003, every play on TDZ earns you a full dollar. Build real wealth from your art."
  },
  {
    icon: Download,
    title: "Paid Downloads",
    description: "Set your price, keep 100% of download revenue",
    color: "from-secondary to-accent",
    expandedInfo: "You decide what your music is worth. $0.99 or $99—your call, your revenue."
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track streams, downloads, and earnings live",
    color: "from-accent to-primary",
    expandedInfo: "Watch your earnings grow in real-time. No waiting for quarterly reports."
  },
  {
    icon: Layers,
    title: "AI-Friendly Platform",
    description: "Human & AI artists welcome equally",
    color: "from-primary to-accent",
    expandedInfo: "AI-generated, AI-assisted, or fully human—all music is monetized equally on TDZ."
  }
];

const fanFeatures = [
  {
    icon: Headphones,
    title: "Premium Listening",
    description: "High-fidelity audio streaming experience",
    color: "from-secondary to-primary",
    expandedInfo: "Experience music the way artists intended—crystal clear, studio-quality audio."
  },
  {
    icon: Heart,
    title: "Support Artists Directly",
    description: "Your streams pay artists $1 each—real money, real impact",
    color: "from-accent to-secondary",
    expandedInfo: "Every play directly supports the artist. No middlemen, no exploitation."
  },
  {
    icon: Download,
    title: "Buy Downloads",
    description: "Purchase tracks at artist-set prices, keep forever",
    color: "from-primary to-secondary",
    expandedInfo: "Own your music. Download once, keep forever—even offline."
  },
  {
    icon: Users,
    title: "Connect & Engage",
    description: "Follow artists and join their journey",
    color: "from-secondary to-accent",
    expandedInfo: "Be part of an artist's story. Get early access, exclusive content, and direct updates."
  }
];

interface Track {
  id: string;
  title: string;
  artist_name: string;
  album_cover_path: string | null;
  album_cover_bucket: string | null;
  motion_cover_path: string | null;
  motion_cover_bucket: string | null;
}

// PHP-Admin Box Pattern Feature Card
function InteractiveFeatureCard({ 
  feature, 
  index, 
  variant = "artist" 
}: { 
  feature: typeof artistFeatures[0]; 
  index: number;
  variant?: "artist" | "fan";
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  
  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsRevealed(false); }}
      onClick={() => setIsRevealed(!isRevealed)}
      style={{ 
        animationDelay: `${index * 0.1}s`,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* PHP Admin Box Pattern */}
      <div className={`
        relative overflow-hidden rounded-xl border border-border/50
        bg-card/90 backdrop-blur-xl
        transition-all duration-300
        ${isHovered ? 'border-primary/60 shadow-lg shadow-primary/10' : ''}
      `}>
        {/* PHP-style Title Bar */}
        <div className={`
          px-4 py-3 border-b border-border/50 
          bg-gradient-to-r ${feature.color} bg-opacity-10
          flex items-center justify-between
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} 
              flex items-center justify-center transition-transform duration-300
              ${isHovered ? 'scale-110 rotate-3' : ''}
            `}>
              <feature.icon className="w-5 h-5 text-background" />
            </div>
            <h3 className={`
              font-display font-bold transition-colors duration-300
              ${isHovered ? 'text-primary' : 'text-foreground'}
            `}>
              {feature.title}
            </h3>
          </div>
          <Sparkles className={`w-4 h-4 transition-opacity ${isHovered ? 'opacity-100 text-primary' : 'opacity-0'}`} />
        </div>
        
        {/* Content Area */}
        <div className="p-4 space-y-3">
          <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>

          {/* Expandable info section */}
          <div className={`
            overflow-hidden transition-all duration-500 ease-out
            ${isRevealed || isHovered ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-foreground/80 leading-relaxed">
                {feature.expandedInfo}
              </p>
            </div>
          </div>

          {/* Status indicator bar */}
          <div className="flex items-center justify-between pt-2">
            <div className={`h-1 flex-1 bg-muted rounded-full overflow-hidden mr-3`}>
              <div 
                className={`h-full bg-gradient-to-r ${feature.color} rounded-full transition-all duration-700`}
                style={{ width: isHovered ? '100%' : '60%' }}
              />
            </div>
            <span className={`text-xs transition-colors ${isHovered ? 'text-primary' : 'text-muted-foreground'}`}>
              Learn more
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// PHP-Admin Section Divider with box styling
function SectionDivider({ label, scrollTo }: { label: string; scrollTo?: string }) {
  const handleClick = () => {
    if (scrollTo) {
      document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      className="flex flex-col items-center py-8 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-border/50" />
      <div className="my-3 px-5 py-2 rounded-lg border border-border/50 backdrop-blur-xl
        bg-card/80 group-hover:bg-primary/10 group-hover:border-primary/50 transition-all duration-300
        shadow-sm">
        <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground group-hover:text-primary transition-colors">
          {label}
        </span>
      </div>
      <ChevronDown className="w-4 h-4 text-muted-foreground animate-bounce group-hover:text-primary transition-colors" />
    </div>
  );
}

// PHP-Admin Stat Card with box pattern
function StatCard({ value, label, index }: { value: string; label: string; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`
        text-center cursor-default group p-4 rounded-lg border border-border/30
        bg-card/50 backdrop-blur-sm transition-all duration-300
        ${isHovered ? 'border-primary/50 bg-primary/5 shadow-md' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        text-xl md:text-3xl font-display font-black 
        bg-gradient-to-r from-green-500 via-emerald-500 to-primary bg-clip-text text-transparent
        transition-all duration-300
      `}>
        {value}
      </div>
      <div className={`
        text-xs md:text-sm mt-1 font-medium transition-colors duration-300
        ${isHovered ? 'text-foreground' : 'text-muted-foreground'}
      `}>
        {label}
      </div>
    </div>
  );
}

// Prominent CTA Button with Ferrari-style hover
function PremiumCTA({ 
  children, 
  onClick, 
  variant = "primary",
  icon: Icon
}: { 
  children: React.ReactNode; 
  onClick: () => void;
  variant?: "primary" | "outline";
  icon?: React.ElementType;
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (variant === "outline") {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative group px-8 md:px-12 h-14 md:h-16 rounded-xl
          border-2 border-primary/60 backdrop-blur-xl
          font-bold text-base md:text-xl
          transition-all duration-500 w-full sm:w-auto
          ${isHovered ? 'bg-primary/20 border-primary scale-105' : ''}
        `}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {Icon && <Icon className="w-5 h-5" />}
          {children}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group px-8 md:px-12 h-14 md:h-16 rounded-xl
        bg-gradient-to-r from-green-500 via-emerald-500 to-primary
        font-bold text-base md:text-xl text-background
        transition-all duration-500 overflow-hidden w-full sm:w-auto
        ${isHovered ? 'scale-105 shadow-2xl shadow-primary/40' : ''}
      `}
    >
      {/* Animated shine effect */}
      <div className={`
        absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
        transition-transform duration-700
        ${isHovered ? 'translate-x-full' : '-translate-x-full'}
      `} />
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
        {Icon && (
          <Icon className={`
            w-5 h-5 md:w-6 md:h-6 transition-all duration-300
            ${isHovered ? 'translate-x-2 scale-110' : ''}
          `} />
        )}
      </span>
    </button>
  );
}

// Gallery-style Track Card with hover reveal
function GalleryTrackCard({ track, onClick }: { track: Track; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className={`
        relative overflow-hidden rounded-xl transition-all duration-500
        ${isHovered ? 'scale-105 shadow-2xl shadow-primary/30' : ''}
      `}>
        <MotionCover
          staticCoverPath={track.album_cover_path}
          staticCoverBucket={track.album_cover_bucket}
          motionCoverPath={track.motion_cover_path}
          motionCoverBucket={track.motion_cover_bucket}
          alt={track.title}
          className="aspect-square w-full"
        />
        
        {/* Hover overlay with info */}
        <div className={`
          absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent
          flex flex-col justify-end p-4 transition-opacity duration-300
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-8 h-8 text-primary" />
          </div>
          <p className="font-bold truncate text-foreground">{track.title}</p>
          <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [prompt, setPrompt] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [latestReleases, setLatestReleases] = useState<Track[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      const { data } = await supabase
        .from('tracks')
        .select('id, title, artist_name, album_cover_path, album_cover_bucket, motion_cover_path, motion_cover_bucket')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (data) {
        setLatestReleases(data);
      }
    };
    
    fetchTracks();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleQuickGenerate = () => {
    if (prompt.trim()) {
      const sanitized = prompt.trim().slice(0, 500);
      if (sanitized.length > 0) {
        localStorage.setItem("quickPrompt", sanitized);
        navigate("/auth");
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Animated Grid Background with parallax */}
      <div 
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      >
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'grid-flow 20s linear infinite'
        }} />
      </div>

      {/* Floating Orbs with parallax */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"
          style={{ 
            animationDuration: '4s',
            transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.02}px)`
          }} 
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-secondary/20 rounded-full blur-[120px] animate-pulse"
          style={{ 
            animationDuration: '6s', 
            animationDelay: '1s',
            transform: `translate(${-scrollY * 0.03}px, ${-scrollY * 0.01}px)`
          }} 
        />
        <div 
          className="absolute top-1/2 right-1/3 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse"
          style={{ 
            animationDuration: '5s', 
            animationDelay: '2s',
            transform: `translate(${scrollY * 0.04}px, ${scrollY * 0.03}px)`
          }} 
        />
      </div>

      {/* ========== HERO SECTION ========== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <Hero3D />
        
        {/* Studio Background with parallax mouse tracking */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-100" 
          style={{
            backgroundImage: `url(${studioBackground})`,
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px) scale(1.1)`,
            filter: 'brightness(0.3)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_100%)]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-10 py-16 md:py-20">
          {/* Logo with entrance animation */}
          <div className="animate-fade-in flex justify-center">
            <img 
              src={tdzLogo} 
              alt="TDZ Distribution Logo" 
              className="h-32 md:h-48 lg:h-56 w-auto object-contain drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 60px hsl(var(--primary) / 0.4))'
              }}
            />
          </div>

          {/* Floating Badge */}
          <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <Badge className="bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-primary/20 text-foreground border-green-500/40 backdrop-blur-xl px-4 md:px-6 py-2 text-sm md:text-base neon-border">
              <DollarSign className="w-3 h-3 md:w-4 md:h-4 mr-2 animate-pulse text-green-500" />
              <span className="hidden sm:inline">$1 Per Stream · AI-Friendly · 100% Download Revenue</span>
              <span className="sm:hidden">$1 Per Stream</span>
            </Badge>
          </div>

          {/* 3D Layered Title with scroll-reveal interaction */}
          <div className="relative px-4 perspective-2000">
            <div className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-black leading-none tracking-tighter">
              <div 
                className="relative inline-block animate-fade-in mb-2" 
                style={{ animationDelay: '0.1s' }}
              >
                <span className="relative z-10 bg-gradient-to-b from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent drop-shadow-2xl">
                  THE FIRST PLATFORM
                </span>
              </div>
              <br />
              <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <HeroScrollText 
                  text="THAT PAYS $1 PER STREAM" 
                  gradientColors="from-green-500 via-emerald-500 to-primary"
                />
              </div>
            </div>
          </div>

          <p 
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/80 max-w-4xl mx-auto animate-fade-in font-light px-4" 
            style={{ animationDelay: '0.4s' }}
          >
            <span className="text-green-500 font-semibold">AI-friendly</span>. <span className="text-primary font-semibold">Artist-first</span>. Your music, your profits—<span className="text-emerald-500 font-semibold">100% of download revenue</span>, <span className="text-green-500 font-semibold">$1 for every stream</span>, and real-time earnings.
          </p>

          {/* Quick Start Input */}
          <div className="animate-scale-in max-w-4xl mx-auto px-4" style={{ animationDelay: '0.5s' }}>
            <EnhancedCard glowColor="primary">
              <div className="p-4 md:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    placeholder="🎵 Enter your artist name..." 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    className="bg-background/90 backdrop-blur-sm border-primary/50 focus:border-primary text-base md:text-lg h-12 md:h-14 px-4 md:px-6 neon-border" 
                    onKeyDown={e => e.key === "Enter" && handleQuickGenerate()} 
                  />
                  <Button 
                    size="lg" 
                    onClick={handleQuickGenerate} 
                    className="bg-gradient-to-r from-green-500 via-emerald-500 to-primary animated-gradient h-12 md:h-14 px-6 md:px-8 group animate-pulse-glow"
                  >
                    <Upload className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-y-1 group-hover:rotate-12 transition-all" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs md:text-sm">
                  <div className="flex items-center gap-2 text-green-500">
                    <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
                    <span>$1 Per Stream</span>
                  </div>
                  <div className="flex items-center gap-2 text-secondary">
                    <Globe className="w-3 h-3 md:w-4 md:h-4" />
                    <span>AI Artists Welcome</span>
                  </div>
                  <div className="flex items-center gap-2 text-accent">
                    <Download className="w-3 h-3 md:w-4 md:h-4" />
                    <span>100% Download Revenue</span>
                  </div>
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Premium CTA Buttons */}
          <div 
            className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center animate-fade-in px-4" 
            style={{ animationDelay: '0.6s' }}
          >
            <PremiumCTA onClick={() => navigate("/auth")} icon={ArrowRight}>
              START EARNING $1/STREAM
            </PremiumCTA>
            <PremiumCTA onClick={() => navigate("/auth")} variant="outline" icon={Headphones}>
              SIGN IN
            </PremiumCTA>
          </div>

          {/* Interactive Stats Bar */}
          <div 
            className="flex flex-wrap justify-center gap-6 md:gap-12 animate-fade-in px-4" 
            style={{ animationDelay: '0.7s' }}
          >
            {[
              { value: '$1.00', label: 'Per Stream' },
              { value: '100%', label: 'Download Revenue' },
              { value: 'AI+Human', label: 'Welcome' },
              { value: '100%', label: 'Your Rights' }
            ].map((stat, idx) => (
              <StatCard key={idx} value={stat.value} label={stat.label} index={idx} />
            ))}
          </div>

          {/* Subscription Notice */}
          <div className="animate-fade-in px-4" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span>Subscription required. Credit card required at signup.</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-primary/50" />
        </div>
      </section>

      {/* ========== MISSION STATEMENT SECTION ========== */}
      <section className="py-20 md:py-32 px-4 md:px-6 relative overflow-hidden">
        {/* 3D Visualizer Background */}
        <div className="absolute inset-0 opacity-30">
          <Suspense fallback={null}>
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
              <DecorativeVisualizerScene />
            </Canvas>
          </Suspense>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* TDZ Logo watermark */}
          <div className="absolute -top-10 -left-10 opacity-5 pointer-events-none">
            <img src={tdzLogo} alt="" className="w-64 h-64" />
          </div>
          
          <div className="text-center mb-12">
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-6 px-4 py-2">
              <Heart className="w-4 h-4 mr-2" />
              OUR MISSION
            </Badge>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-black mb-8">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                MUSIC IS MORE THAN DATA
              </span>
            </h2>
          </div>

          {/* Mission Pillars */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Users, title: "Build Culture", desc: "Artists build culture, context, and community — not just monthly listeners." },
              { icon: MessageCircle, title: "Share & Discuss", desc: "Music isn't just streamed — it's shared, discussed, and explored together." },
              { icon: Play, title: "Active Listening", desc: "Listening is active, intentional, immersive — not passive consumption." },
              { icon: Palette, title: "Artist Identity", desc: "Technology amplifies depth over distraction, artist identity over utility." },
              { icon: Heart, title: "Human Expression", desc: "Human expression should be the point — not just another data point." },
              { icon: Sparkles, title: "Be Part of the Story", desc: "Fans aren't \"users\" — they're participants in the story." }
            ].map((pillar, idx) => (
              <Card 
                key={idx} 
                className="glass-card-premium p-6 hover:scale-105 hover:border-primary/50 transition-all duration-500 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <pillar.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">{pillar.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{pillar.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Mission Statement Card */}
          <Card className="glass-ultra p-8 md:p-12 text-center border-primary/30 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <img src={tdzLogo} alt="" className="w-12 h-12 opacity-30" />
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-light leading-relaxed text-foreground/90">
              "We believe the future of music belongs to <span className="text-primary font-semibold">artists who tell stories</span>, 
              <span className="text-secondary font-semibold"> fans who care deeply</span>, and 
              <span className="text-accent font-semibold"> platforms that value human connection</span> over algorithmic scale."
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <img src={tdzLogo} alt="TDZ" className="h-8 w-auto" />
              <span className="font-display text-muted-foreground">TDZ Distribution</span>
            </div>
          </Card>
        </div>
      </section>

      {/* ========== FERRARI-STYLE SCROLL REVEAL - ARTIST EARNINGS ========== */}
      <ScrollRevealText 
        text="$1 PER STREAM"
        gradientColors="from-green-500 via-emerald-500 to-primary"
        previewType="earnings"
        sectionId="scroll-reveal-earnings"
      />

      <SectionDivider label="For Artists" scrollTo="artists-section" />

      {/* ========== FOR ARTISTS SECTION ========== */}
      <section id="artists-section" className="py-16 md:py-32 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section logo accent */}
          <div className="flex justify-center mb-8">
            <img src={tdzLogo} alt="" className="h-16 w-auto opacity-20" />
          </div>
          
          <div className="text-center mb-12 md:mb-20">
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30 mb-4 md:mb-6 text-sm md:text-base px-4 py-2">
              <Mic2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              FOR ARTISTS
            </Badge>
            
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-black mb-6">
              <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-primary bg-clip-text text-transparent">
                EARN REAL MONEY FOR YOUR MUSIC
              </span>
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              $1 per stream. Set your own download prices. Keep 100% of download revenue.
            </p>
          </div>

          {/* Interactive Artist Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-20">
            {artistFeatures.map((feature, idx) => (
              <InteractiveFeatureCard key={idx} feature={feature} index={idx} variant="artist" />
            ))}
          </div>

          <StudioPhoneMockups />
        </div>
      </section>

      <SectionDivider label="AI Welcome" scrollTo="ai-section" />

      {/* ========== AI MUSIC SECTION ========== */}
      <section id="ai-section" className="py-16 md:py-24 px-4 md:px-6 relative bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="bg-accent/20 text-accent border-accent/30 mb-6 px-4 py-2">
            <Layers className="w-4 h-4 mr-2" />
            AI MUSIC WELCOME
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-black mb-6">
            <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
              AI ARTISTS EARN THE SAME
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            TDZ welcomes AI-generated music, AI-assisted creation, and human-led production equally. 
            If you can create it, you can distribute and monetize it on TDZ. 
            <span className="text-primary font-semibold"> Same $1 per stream. Same 100% download revenue.</span>
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {["AI-Generated Tracks", "AI-Assisted Production", "AI Vocals", "Hybrid Projects"].map((badge, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="px-4 py-2 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 cursor-default"
              >
                {badge}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider label="For Fans" scrollTo="fans-section" />

      {/* ========== FERRARI-STYLE SCROLL REVEAL - FAN DISCOVERY ========== */}
      <ScrollRevealText 
        text="YOUR STREAMS MATTER"
        gradientColors="from-secondary via-accent to-primary"
        previewType="discover"
        sectionId="scroll-reveal-discover"
      />

      {/* ========== FOR FANS SECTION ========== */}
      <section id="fans-section" className="py-16 md:py-32 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 md:mb-20">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-4 md:mb-6 text-sm md:text-base px-4 py-2">
              <Headphones className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              FOR FANS
            </Badge>
            
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-black mb-6">
              <span className="bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
                YOUR STREAMS MATTER HERE
              </span>
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Every stream pays artists $1. Buy downloads at artist-set prices.
            </p>
          </div>

          {/* Interactive Fan Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-20">
            {fanFeatures.map((feature, idx) => (
              <InteractiveFeatureCard key={idx} feature={feature} index={idx} variant="fan" />
            ))}
          </div>

          {/* Fan Subscription Plan */}
          <div className="mb-12 md:mb-20">
            <Card className="glass-card p-6 md:p-8 max-w-lg mx-auto relative overflow-hidden border-secondary/40 hover:border-secondary/60 transition-all hover:scale-[1.02] duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-2xl" />
              <div className="relative z-10 text-center">
                <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-4">
                  <Headphones className="w-3 h-3 mr-1" />
                  FAN SUBSCRIPTION
                </Badge>
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-2">Unlimited Streaming</h3>
                <div className="text-4xl md:text-5xl font-black text-secondary mb-2">
                  $12<span className="text-lg font-normal text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mb-6">
                  Stream unlimited, support artists directly
                </p>
                <div className="space-y-3 text-left mb-6">
                  {[
                    "Unlimited high-fidelity streaming",
                    "Every stream pays artists $1",
                    "Create & share unlimited playlists",
                    "Access motion covers & social features",
                    "Follow artists & get exclusive updates",
                    "No ads, ever"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm group">
                      <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => navigate("/auth")} 
                  className="w-full bg-gradient-to-r from-secondary to-accent text-background font-bold h-12 hover:scale-105 transition-transform"
                >
                  Start Listening
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  30-second previews free • Full access requires subscription
                </p>
              </div>
            </Card>
          </div>

          {/* Gallery-style Latest Releases */}
          {latestReleases.length > 0 && (
            <div className="space-y-8">
              <h3 className="text-2xl md:text-3xl font-display font-bold text-center">
                Latest on <span className="text-secondary">TDZ</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {latestReleases.map((track) => (
                  <GalleryTrackCard 
                    key={track.id} 
                    track={track} 
                    onClick={() => navigate("/discover")} 
                  />
                ))}
              </div>
            </div>
          )}

          <MusicPlayerPhoneMockups />
          
          <DiscoveryPhoneMockups />
        </div>
      </section>

      <SectionDivider label="How It Works" scrollTo="revenue-section" />

      {/* ========== REVENUE POOL SECTION ========== */}
      <section id="revenue-section" className="py-16 md:py-24 px-4 md:px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30 mb-6 px-4 py-2">
              <DollarSign className="w-4 h-4 mr-2" />
              HOW WE PAY ARTISTS
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-black mb-6">
              <span className="text-green-500">$1</span> For Every Stream
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              We pay artists $1 for every stream on TDZ, funded by a diverse revenue pool that includes:
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: CreditCard, label: "Subscriptions", desc: "Fan & artist plans" },
              { icon: Radio, label: "Advertisements", desc: "Platform ad revenue" },
              { icon: Download, label: "Downloads", desc: "Artist keeps 100%" },
              { icon: Zap, label: "Premium Tools", desc: "AI studio & features" }
            ].map((item, idx) => (
              <Card 
                key={idx} 
                className="glass-card p-4 text-center hover:scale-105 hover:border-primary/50 transition-all duration-300 cursor-default group"
              >
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-green-500/30 transition-all">
                  <item.icon className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="font-bold text-sm mb-1">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>

          <Card className="glass-card p-6 md:p-8 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30 hover:border-green-500/50 transition-all duration-300">
            <p className="text-center text-lg md:text-xl leading-relaxed">
              This model ensures artists make <span className="text-green-500 font-bold">more money with fewer plays</span>—and fans <span className="text-primary font-bold">directly support the creators they love</span>.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-green-500/20">
              {[
                { value: "1,000", streams: "$1,000", color: "text-green-500" },
                { value: "10,000", streams: "$10,000", color: "text-primary" },
                { value: "100,000", streams: "$100,000", color: "text-secondary" }
              ].map((stat, idx) => (
                <div key={idx} className="text-center group cursor-default">
                  <p className={`text-2xl md:text-3xl font-black ${stat.color} group-hover:scale-110 transition-transform`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">Streams = {stat.streams}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <SectionDivider label="Pricing" scrollTo="pricing-section" />

      {/* ========== SUBSCRIPTION TIERS SECTION ========== */}
      <section id="pricing-section" className="py-16 md:py-24 px-4 md:px-6 relative bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-6 px-4 py-2">
              <CreditCard className="w-4 h-4 mr-2" />
              SUBSCRIPTION PLANS
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-black mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start earning $1 per stream today. All plans include full platform access.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <Card className="glass-card p-6 relative hover:scale-105 hover:border-primary/50 transition-all duration-500 group">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <div className="text-4xl font-black text-primary mb-1">$9.99<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                <p className="text-sm text-muted-foreground">Perfect for new artists</p>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  "$1 per stream payout",
                  "Unlimited uploads",
                  "Basic analytics",
                  "Fan engagement tools",
                  "Download sales (100% revenue)"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full group-hover:bg-primary/20" variant="outline" onClick={() => navigate("/auth")}>
                Get Started
              </Button>
            </Card>

            {/* Pro Plan */}
            <Card className="glass-card p-6 relative border-primary/50 hover:scale-105 hover:border-primary transition-all duration-500 group shadow-lg shadow-primary/20">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Most Popular</Badge>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-black text-primary mb-1">$19.99<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                <p className="text-sm text-muted-foreground">For serious artists</p>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  "Everything in Starter",
                  "AI video generation (10/mo)",
                  "Advanced analytics",
                  "Priority support",
                  "Presave campaigns",
                  "Collaboration tools"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full bg-gradient-to-r from-green-500 to-primary hover:opacity-90" onClick={() => navigate("/auth")}>
                Start Pro Trial
              </Button>
            </Card>

            {/* Enterprise Plan */}
            <Card className="glass-card p-6 relative hover:scale-105 hover:border-primary/50 transition-all duration-500 group">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <div className="text-4xl font-black text-primary mb-1">$49.99<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                <p className="text-sm text-muted-foreground">For labels & teams</p>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  "Everything in Pro",
                  "Unlimited AI videos",
                  "Multi-artist management",
                  "Custom branding",
                  "API access",
                  "Dedicated account manager"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full group-hover:bg-primary/20" variant="outline" onClick={() => navigate("/auth")}>
                Contact Sales
              </Button>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            All plans require a credit card. Cancel anytime. AI music welcome on all tiers.
          </p>
        </div>
      </section>

      {/* Merch Store Section */}
      <MerchStore variant="hero" />

      {/* ========== FINAL CTA SECTION ========== */}
      <section className="py-16 md:py-32 px-4 md:px-6 relative">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-black mb-6">
            Stop Earning Pennies.
            <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-primary bg-clip-text text-transparent"> Start Earning Dollars.</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Every stream on TDZ pays you <span className="text-green-500 font-bold">$1.00</span>. Not $0.003. One. Full. Dollar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PremiumCTA onClick={() => navigate("/auth")} icon={ArrowRight}>
              Start Earning $1/Stream Now
            </PremiumCTA>
            <PremiumCTA onClick={() => navigate("/faq")} variant="outline">
              See How It Works
            </PremiumCTA>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Subscription required. Credit card required at signup. AI artists welcome.
          </p>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-16 px-4 md:px-6 border-t border-border/50 relative">
        {/* Footer background accent */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Large logo */}
          <div className="flex justify-center mb-8">
            <img 
              src={tdzLogo} 
              alt="TDZ Distribution" 
              className="h-20 md:h-24 w-auto opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </div>
          
          {/* Mission tagline */}
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-8">
            Where artists build culture, fans participate in stories, and every stream matters.
          </p>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src={tdzLogo} alt="TDZ" className="h-8 w-auto group-hover:scale-110 transition-transform" />
              <span className="font-display font-bold">TDZ Distribution</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              {[
                { label: "FAQ", path: "/faq" },
                { label: "Support", path: "/support" },
                { label: "Terms", path: "/terms" },
                { label: "Privacy", path: "/privacy" },
                { label: "Investors", path: "/investors" }
              ].map((link) => (
                <button 
                  key={link.path}
                  onClick={() => navigate(link.path)} 
                  className="hover:text-primary transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
                </button>
              ))}
            </div>
          </div>
          <div className="text-center mt-8 pt-8 border-t border-border/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src={tdzLogo} alt="" className="h-5 w-auto opacity-50" />
              <span className="text-sm text-muted-foreground">Thirty Dark Zero Records</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved. Music is more than data.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
