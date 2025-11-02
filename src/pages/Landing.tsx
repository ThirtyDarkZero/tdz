import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Upload, TrendingUp, Zap, Globe, Radio, Shield, Users, ArrowRight, CheckCircle2, DollarSign, BarChart3, Headphones, Heart, Play, Mic2, Layers } from "lucide-react";
import studioBackground from "@/assets/studio-background.jpg";
import tdzLogo from "@/assets/tdz-logo.png";

const artistFeatures = [
  {
    icon: Upload,
    title: "Instant Distribution",
    description: "Upload once, reach 150+ platforms in 24 hours",
    color: "from-primary to-secondary"
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track your growth with live streaming data",
    color: "from-secondary to-accent"
  },
  {
    icon: DollarSign,
    title: "100% Royalties",
    description: "Keep everything you earn, forever",
    color: "from-accent to-primary"
  },
  {
    icon: Layers,
    title: "Professional Tools",
    description: "Studio-grade features for your music",
    color: "from-primary to-accent"
  }
];

const fanFeatures = [
  {
    icon: Headphones,
    title: "Premium Listening",
    description: "High-fidelity audio streaming experience",
    color: "from-secondary to-primary"
  },
  {
    icon: Heart,
    title: "Support Artists",
    description: "Your streams directly support independent creators",
    color: "from-accent to-secondary"
  },
  {
    icon: TrendingUp,
    title: "Discover New Music",
    description: "Find rising artists before they hit mainstream",
    color: "from-primary to-secondary"
  },
  {
    icon: Users,
    title: "Connect & Engage",
    description: "Follow artists and join their journey",
    color: "from-secondary to-accent"
  }
];

const latestReleases = [
  {
    id: 1,
    title: "Midnight Dreams",
    artist: "Luna Sky",
    cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop"
  },
  {
    id: 2,
    title: "Electric Pulse",
    artist: "Neon Wave",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
  },
  {
    id: 3,
    title: "Sunset Boulevard",
    artist: "Valley Vista",
    cover: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&h=300&fit=crop"
  },
  {
    id: 4,
    title: "Ocean Waves",
    artist: "Blue Horizon",
    cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop"
  }
];
export default function Landing() {
  const [prompt, setPrompt] = useState("");
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  const handleQuickGenerate = () => {
    if (prompt.trim()) {
      localStorage.setItem("quickPrompt", prompt);
      navigate("/auth");
    }
  };
  return <div className="min-h-screen relative overflow-hidden">

      {/* Animated Grid Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        animation: 'grid-flow 20s linear infinite'
      }} />
      </div>

      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" style={{
        animationDuration: '4s'
      }} />
        <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-secondary/20 rounded-full blur-[120px] animate-pulse" style={{
        animationDuration: '6s',
        animationDelay: '1s'
      }} />
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{
        animationDuration: '5s',
        animationDelay: '2s'
      }} />
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Studio Background */}
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-100" style={{
        backgroundImage: `url(${studioBackground})`,
        transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px) scale(1.1)`,
        filter: 'brightness(0.4)'
      }}>
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_100%)]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-12 py-20">
          {/* Logo */}
          <div className="animate-fade-in flex justify-center">
            <img 
              src={tdzLogo} 
              alt="TDZ Distribution Logo" 
              className="h-48 md:h-64 lg:h-80 w-auto object-contain"
            />
          </div>

          {/* Floating Badge */}
          <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <Badge className="bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 text-foreground border-primary/40 backdrop-blur-xl px-4 md:px-6 py-2 text-sm md:text-base neon-border">
              <Globe className="w-3 h-3 md:w-4 md:h-4 mr-2 animate-pulse" />
              <span className="hidden sm:inline">Global Distribution · Premium Streaming · 100% Royalties</span>
              <span className="sm:hidden">For Artists & Fans</span>
            </Badge>
          </div>

          {/* 3D Layered Title */}
          <div className="relative px-4">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-display font-black leading-none tracking-tighter perspective-1000">
              <div className="relative inline-block animate-fade-in" style={{
              animationDelay: '0.1s'
            }}>
                <span className="relative z-10 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                  DISTRIBUTE
                </span>
                <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-primary via-secondary to-accent opacity-50" style={{
                transform: 'translateZ(-50px)'
              }}>
                  DISTRIBUTE
                </span>
              </div>
              <br />
              <div className="relative inline-block animate-fade-in" style={{
              animationDelay: '0.2s'
            }}>
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent glow-text">
                  YOUR MUSIC
                </span>
              </div>
              <br />
              <div className="relative inline-block animate-fade-in" style={{
              animationDelay: '0.3s'
            }}>
                <span className="relative z-10 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                  WORLDWIDE
                </span>
              </div>
            </h1>
          </div>

          <p className="text-base sm:text-lg md:text-2xl lg:text-3xl text-foreground/80 max-w-4xl mx-auto animate-fade-in font-light px-4" style={{
          animationDelay: '0.4s'
        }}>
            From <span className="text-primary font-semibold">local artist</span> to <span className="text-secondary font-semibold">global sensation</span> in <span className="text-accent font-semibold">24 hours</span>
          </p>

          {/* Quick Start Input */}
          <div className="animate-scale-in max-w-4xl mx-auto px-4" style={{
          animationDelay: '0.5s'
        }}>
            <Card className="relative group glass-card p-4 md:p-8 border-primary/30 hover:border-primary/60 transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-primary via-secondary to-accent rounded-lg opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
              <div className="relative space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input placeholder="🎵 Enter your artist name..." value={prompt} onChange={e => setPrompt(e.target.value)} className="bg-background/80 backdrop-blur-sm border-primary/40 focus:border-primary text-base md:text-lg h-12 md:h-14 px-4 md:px-6" onKeyDown={e => e.key === "Enter" && handleQuickGenerate()} />
                  <Button size="lg" onClick={handleQuickGenerate} className="bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-glow h-12 md:h-14 px-6 md:px-8 group">
                    <Upload className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs md:text-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <Zap className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Instant Setup</span>
                  </div>
                  <div className="flex items-center gap-2 text-secondary">
                    <Globe className="w-3 h-3 md:w-4 md:h-4" />
                    <span>150+ Platforms</span>
                  </div>
                  <div className="flex items-center gap-2 text-accent">
                    <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
                    <span>100% Royalties</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Floating CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center animate-fade-in px-4" style={{
          animationDelay: '0.6s'
        }}>
            <Button size="lg" onClick={() => navigate("/auth")} className="relative group bg-gradient-to-r from-primary via-secondary to-accent text-background font-bold text-base md:text-xl px-8 md:px-12 h-14 md:h-16 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <span className="relative z-10">START DISTRIBUTING</span>
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2 md:ml-3 group-hover:translate-x-2 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-secondary opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-base md:text-xl px-8 md:px-12 h-14 md:h-16 border-2 border-primary/60 hover:bg-primary/20 hover:border-primary backdrop-blur-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto">
              <Headphones className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              SIGN IN
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 animate-fade-in px-4" style={{
          animationDelay: '0.7s'
        }}>
            {[{
            value: '50K+',
            label: 'Artists'
          }, {
            value: '24hrs',
            label: 'Go Live'
          }, {
            value: '150+',
            label: 'Platforms'
          }, {
            value: '100%',
            label: 'Your Rights'
          }].map((stat, idx) => <div key={idx} className="text-center">
                <div className="text-2xl md:text-4xl font-display font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* For Artists Section */}
      <section className="py-16 md:py-32 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 md:mb-6 text-sm md:text-base px-4 py-2">
              <Mic2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              FOR ARTISTS
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-black mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                YOUR MUSIC
              </span>
              <br />
              EVERYWHERE
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional distribution tools designed for independent artists
            </p>
          </div>

          {/* Artist Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-20">
            {artistFeatures.map((feature, idx) => (
              <Card key={idx} className="glass-card p-6 md:p-8 relative group overflow-hidden hover:border-primary/60 transition-all duration-500 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 space-y-4">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-background" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-display font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Demo Phone - Studio */}
          <div className="relative max-w-sm mx-auto">
            <div className="glass-card p-3 rounded-3xl border-2 border-primary/40 overflow-hidden">
              <div className="relative aspect-[9/19] rounded-2xl overflow-hidden bg-background">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-background/80" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Studio</h3>
                    <Badge className="bg-primary/20 text-primary border-primary/30">Demo</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="glass-card p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary" />
                        <div className="flex-1">
                          <div className="h-3 bg-primary/40 rounded w-3/4 mb-2" />
                          <div className="h-2 bg-muted/40 rounded w-1/2" />
                        </div>
                        <Play className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-accent" />
                        <div className="flex-1">
                          <div className="h-3 bg-secondary/40 rounded w-2/3 mb-2" />
                          <div className="h-2 bg-muted/40 rounded w-1/3" />
                        </div>
                        <Upload className="w-6 h-6 text-secondary" />
                      </div>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-primary" />
                        <div className="flex-1">
                          <div className="h-3 bg-accent/40 rounded w-4/5 mb-2" />
                          <div className="h-2 bg-muted/40 rounded w-2/5" />
                        </div>
                        <BarChart3 className="w-6 h-6 text-accent" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Fans Section */}
      <section className="py-16 md:py-32 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 md:mb-20">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-4 md:mb-6 text-sm md:text-base px-4 py-2">
              <Headphones className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              FOR FANS
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-black mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
                DISCOVER
              </span>
              <br />
              NEW MUSIC
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Support independent artists and discover your next favorite track
            </p>
          </div>

          {/* Fan Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-20">
            {fanFeatures.map((feature, idx) => (
              <Card key={idx} className="glass-card p-6 md:p-8 relative group overflow-hidden hover:border-secondary/60 transition-all duration-500 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 space-y-4">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-background" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-display font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Demo Phone - Discovery */}
          <div className="relative max-w-sm mx-auto">
            <div className="glass-card p-3 rounded-3xl border-2 border-secondary/40 overflow-hidden">
              <div className="relative aspect-[9/19] rounded-2xl overflow-hidden bg-background">
                <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-transparent to-background/80" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Discover</h3>
                    <Badge className="bg-secondary/20 text-secondary border-secondary/30">Demo</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {latestReleases.slice(0, 4).map((release) => (
                      <div key={release.id} className="space-y-2">
                        <div className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer">
                          <img src={release.cover} alt={release.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <div className="text-xs space-y-0.5">
                          <p className="text-foreground/80 truncate font-medium">{release.title}</p>
                          <p className="text-muted-foreground truncate">{release.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Releases Section */}
      <section className="py-16 md:py-32 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-black mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
                LATEST
              </span>
              <br />
              RELEASES
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Fresh tracks from independent artists around the world
            </p>
          </div>

          {/* Mobile: Swipeable, Desktop: Grid */}
          <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-4 pb-4" style={{ width: `${latestReleases.length * 180}px` }}>
              {latestReleases.map((release) => (
                <div key={release.id} className="flex-shrink-0 w-40 space-y-2 cursor-pointer" onClick={() => navigate(`/track/${release.id}`)}>
                  <div className="aspect-square rounded-lg overflow-hidden relative group">
                    <img src={release.cover} alt={release.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-active:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="text-foreground truncate font-medium">{release.title}</p>
                    <p className="text-muted-foreground truncate">{release.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
            {latestReleases.map((release) => (
              <Card key={release.id} className="glass-card p-4 cursor-pointer hover:scale-105 transition-all duration-300 hover:border-primary/60" onClick={() => navigate(`/track/${release.id}`)}>
                <div className="aspect-square rounded-lg overflow-hidden mb-4 relative group">
                  <img src={release.cover} alt={release.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h3 className="font-bold truncate mb-1">{release.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{release.artist}</p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate("/discover")} className="bg-gradient-to-r from-accent via-primary to-secondary hover:scale-105 transition-all duration-300">
              <Music className="w-5 h-5 mr-2" />
              EXPLORE MORE
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA - Immersive */}
      <section className="py-20 md:py-40 px-4 md:px-6 relative overflow-hidden">
        {/* Radial Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.2)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--secondary)/0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--accent)/0.15)_0%,transparent_50%)]" />
        
        <div className="max-w-6xl mx-auto text-center space-y-8 md:space-y-12 relative z-10">
          {/* Massive CTA */}
          <div className="space-y-6 md:space-y-8">
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-display font-black leading-none px-4">
              <span className="block animate-fade-in">READY TO</span>
              <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in glow-text" style={{
              animationDelay: '0.1s'
            }}>
                GO GLOBAL
              </span>
              <span className="block animate-fade-in" style={{
              animationDelay: '0.2s'
            }}>?</span>
            </h2>
            <p className="text-base sm:text-lg md:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto font-light animate-fade-in px-4" style={{
            animationDelay: '0.3s'
          }}>
              Join 50,000+ independent artists distributing their music to <span className="text-primary font-semibold">millions of listeners</span> worldwide.
            </p>
          </div>

          {/* Giant CTA Button */}
          <div className="flex flex-col items-center gap-4 md:gap-6 animate-scale-in px-4" style={{
          animationDelay: '0.4s'
        }}>
            <Button size="lg" onClick={() => navigate("/auth")} className="relative group bg-gradient-to-r from-primary via-secondary to-accent text-background font-black text-xl md:text-2xl lg:text-3xl px-12 md:px-16 h-16 md:h-20 lg:h-24 rounded-xl md:rounded-2xl hover:scale-110 transition-all duration-500 shadow-2xl w-full sm:w-auto">
              <span className="relative z-10 flex items-center gap-3 md:gap-4">
                <Upload className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-y-2 transition-transform duration-500" />
                LAUNCH NOW
                <ArrowRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-4 transition-transform duration-500" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-secondary opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 rounded-xl md:rounded-2xl" />
            </Button>
            <p className="text-muted-foreground text-sm md:text-lg">
              No credit card required · Keep 100% rights · 24/7 support
            </p>
          </div>

          {/* Social Proof Pills */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 pt-4 md:pt-8 animate-fade-in px-4" style={{
          animationDelay: '0.5s'
        }}>
            {["🌍 150+ Platforms", "⚡ 24hr Go-Live", "💰 100% Royalties", "🚀 Zero Setup Fees"].map((pill, idx) => <Badge key={idx} className="bg-card/50 backdrop-blur-xl border-primary/30 text-foreground px-3 md:px-6 py-2 md:py-3 text-xs md:text-base">
                {pill}
              </Badge>)}
          </div>
        </div>
      </section>

      {/* Footer - Futuristic */}
      <footer className="relative border-t border-primary/20 py-8 md:py-12 px-4 md:px-6">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3">
              <img 
                src={tdzLogo} 
                alt="TDZ Distribution Logo" 
                className="h-8 md:h-10 w-auto object-contain"
              />
              <span className="font-display font-bold text-base md:text-xl">TDZ DISTRIBUTION</span>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1 md:gap-2">
              <p className="text-muted-foreground text-xs md:text-base text-center md:text-right">
                Next-Gen Music Distribution · Built for Independent Artists
              </p>
              <p className="text-xs md:text-sm text-muted-foreground/60">
                © 2025 TDZ Distribution. Empowering artists worldwide.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>;
}