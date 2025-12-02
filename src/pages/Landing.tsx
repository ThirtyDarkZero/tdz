import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Upload, TrendingUp, Zap, Globe, Radio, Shield, Users, ArrowRight, CheckCircle2, DollarSign, BarChart3, Headphones, Heart, Play, Mic2, Layers, Library, Image, BookOpen, Film, User, ShoppingBag, LayoutDashboard, Download, CreditCard } from "lucide-react";
import studioBackground from "@/assets/studio-background.jpg";
import tdzLogo from "@/assets/tdz-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { MotionCover } from "@/components/MotionCover";
import { Hero3D } from "@/components/Hero3D";
import { EnhancedCard } from "@/components/EnhancedCard";
import { StudioPhoneMockups, MusicPlayerPhoneMockups } from "@/components/StudioPhoneMockup";
import { MerchStore } from "@/components/MerchStore";

const artistFeatures = [
  {
    icon: DollarSign,
    title: "$1 Per Stream",
    description: "Earn $1.00 for every stream on TDZ—not fractions of a cent",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Download,
    title: "Paid Downloads",
    description: "Set your price, keep 100% of download revenue",
    color: "from-secondary to-accent"
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track streams, downloads, and earnings live",
    color: "from-accent to-primary"
  },
  {
    icon: Layers,
    title: "AI-Friendly Platform",
    description: "Human & AI artists welcome equally",
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
    title: "Support Artists Directly",
    description: "Your streams pay artists $1 each—real money, real impact",
    color: "from-accent to-secondary"
  },
  {
    icon: Download,
    title: "Buy Downloads",
    description: "Purchase tracks at artist-set prices, keep forever",
    color: "from-primary to-secondary"
  },
  {
    icon: Users,
    title: "Connect & Engage",
    description: "Follow artists and join their journey",
    color: "from-secondary to-accent"
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

const studioTabs = [
  { icon: Users, label: "Staff" },
  { icon: Globe, label: "Release" },
  { icon: TrendingUp, label: "Analytics" },
  { icon: Library, label: "Library" },
  { icon: Image, label: "Gallery" },
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Heart, label: "Fans" },
  { icon: BookOpen, label: "Story" },
];

export default function Landing() {
  const [prompt, setPrompt] = useState("");
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });
  const [latestReleases, setLatestReleases] = useState<Track[]>([]);
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
      const sanitized = prompt.trim().slice(0, 500);
      if (sanitized.length > 0) {
        localStorage.setItem("quickPrompt", sanitized);
        navigate("/auth");
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
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
        {/* 3D Background */}
        <Hero3D />
        
        {/* Studio Background */}
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-100" style={{
          backgroundImage: `url(${studioBackground})`,
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px) scale(1.1)`,
          filter: 'brightness(0.3)'
        }}>
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-background" />
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
            <Badge className="bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-primary/20 text-foreground border-green-500/40 backdrop-blur-xl px-4 md:px-6 py-2 text-sm md:text-base neon-border">
              <DollarSign className="w-3 h-3 md:w-4 md:h-4 mr-2 animate-pulse text-green-500" />
              <span className="hidden sm:inline">$1 Per Stream · AI-Friendly · 100% Download Revenue</span>
              <span className="sm:hidden">$1 Per Stream</span>
            </Badge>
          </div>

          {/* 3D Layered Title */}
          <div className="relative px-4 perspective-2000">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-black leading-none tracking-tighter">
              <div className="relative inline-block animate-fade-in float-slow" style={{
                animationDelay: '0.1s'
              }}>
                <span className="relative z-10 bg-gradient-to-b from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent drop-shadow-2xl">
                  THE FIRST PLATFORM
                </span>
              </div>
              <br />
              <div className="relative inline-block animate-scale-in" style={{
                animationDelay: '0.2s'
              }}>
                <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-primary bg-clip-text text-transparent glow-text-rainbow animated-gradient-fast">
                  THAT PAYS $1 PER STREAM
                </span>
              </div>
            </h1>
          </div>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/80 max-w-4xl mx-auto animate-fade-in font-light px-4" style={{
            animationDelay: '0.4s'
          }}>
            <span className="text-green-500 font-semibold">AI-friendly</span>. <span className="text-primary font-semibold">Artist-first</span>. Your music, your profits—<span className="text-emerald-500 font-semibold">100% of download revenue</span>, <span className="text-green-500 font-semibold">$1 for every stream</span>, and real-time earnings.
          </p>

          {/* Quick Start Input */}
          <div className="animate-scale-in max-w-4xl mx-auto px-4" style={{
            animationDelay: '0.5s'
          }}>
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

          {/* Floating CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center animate-fade-in px-4" style={{
            animationDelay: '0.6s'
          }}>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="relative group bg-gradient-to-r from-green-500 via-emerald-500 to-primary text-background font-bold text-base md:text-xl px-8 md:px-12 h-14 md:h-16 hover:scale-110 transition-all duration-300 w-full sm:w-auto animated-gradient neon-border-strong float-slow"
            >
              <span className="relative z-10">START EARNING $1/STREAM</span>
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2 md:ml-3 group-hover:translate-x-3 group-hover:scale-125 transition-all relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-secondary opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/auth")} 
              className="text-base md:text-xl px-8 md:px-12 h-14 md:h-16 border-2 border-primary/60 hover:bg-primary/20 hover:border-primary backdrop-blur-xl transition-all duration-300 hover:scale-110 w-full sm:w-auto neon-border hover-3d"
            >
              <Headphones className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              SIGN IN
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 animate-fade-in px-4" style={{
            animationDelay: '0.7s'
          }}>
            {[{
              value: '$1.00',
              label: 'Per Stream'
            }, {
              value: '100%',
              label: 'Download Revenue'
            }, {
              value: 'AI+Human',
              label: 'Welcome'
            }, {
              value: '100%',
              label: 'Your Rights'
            }].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl md:text-4xl font-display font-black bg-gradient-to-r from-green-500 via-emerald-500 to-primary bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
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
      </section>

      {/* For Artists Section */}
      <section className="py-16 md:py-32 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30 mb-4 md:mb-6 text-sm md:text-base px-4 py-2">
              <Mic2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              FOR ARTISTS
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-black mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-primary bg-clip-text text-transparent">
                EARN REAL MONEY
              </span>
              <br />
              FOR YOUR MUSIC
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              $1 per stream. Set your own download prices. Keep 100% of download revenue.
            </p>
          </div>

          {/* Artist Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-20">
            {artistFeatures.map((feature, idx) => (
              <EnhancedCard 
                key={idx} 
                glowColor={idx % 3 === 0 ? "primary" : idx % 3 === 1 ? "secondary" : "accent"}
                className="animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` } as React.CSSProperties}
              >
                <div className="p-6 md:p-8 space-y-4">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 float`}>
                    <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-background" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-display font-bold mb-2 glow-text">{feature.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </EnhancedCard>
            ))}
          </div>

          {/* Interactive Studio Preview */}
          <StudioPhoneMockups />
        </div>
      </section>

      {/* AI Music Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 relative bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
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
            <Badge variant="outline" className="px-4 py-2">AI-Generated Tracks</Badge>
            <Badge variant="outline" className="px-4 py-2">AI-Assisted Production</Badge>
            <Badge variant="outline" className="px-4 py-2">AI Vocals</Badge>
            <Badge variant="outline" className="px-4 py-2">Hybrid Projects</Badge>
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
                YOUR STREAMS
              </span>
              <br />
              MATTER HERE
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Every stream pays artists $1. Buy downloads at artist-set prices.
            </p>
          </div>

          {/* Fan Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-20">
            {fanFeatures.map((feature, idx) => (
              <Card key={idx} className="glass-card p-6 md:p-8 relative group overflow-hidden hover:border-secondary/60 transition-all duration-500 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 space-y-4">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`}>
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

          {/* Fan Subscription Plan */}
          <div className="mb-12 md:mb-20">
            <Card className="glass-card p-6 md:p-8 max-w-lg mx-auto relative overflow-hidden border-secondary/40 hover:border-secondary/60 transition-all">
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
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => navigate("/auth")} 
                  className="w-full bg-gradient-to-r from-secondary to-accent text-background font-bold h-12"
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

          {/* Latest Releases */}
          {latestReleases.length > 0 && (
            <div className="space-y-8">
              <h3 className="text-2xl md:text-3xl font-display font-bold text-center">
                Latest on <span className="text-secondary">TDZ</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {latestReleases.map((track, idx) => (
                  <div key={track.id} className="group cursor-pointer" onClick={() => navigate("/discover")}>
                    <MotionCover
                      staticCoverPath={track.album_cover_path}
                      staticCoverBucket={track.album_cover_bucket}
                      motionCoverPath={track.motion_cover_path}
                      motionCoverBucket={track.motion_cover_bucket}
                      alt={track.title}
                      className="aspect-square rounded-xl mb-3 group-hover:scale-105 transition-transform"
                    />
                    <p className="font-medium truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <MusicPlayerPhoneMockups />
        </div>
      </section>

      {/* Revenue Pool Explanation - Sales-focused */}
      <section className="py-16 md:py-24 px-4 md:px-6 relative">
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
              <Card key={idx} className="glass-card p-4 text-center hover:scale-105 transition-transform">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="font-bold text-sm mb-1">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>

          <Card className="glass-card p-6 md:p-8 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
            <p className="text-center text-lg md:text-xl leading-relaxed">
              This model ensures artists make <span className="text-green-500 font-bold">more money with fewer plays</span>—and fans <span className="text-primary font-bold">directly support the creators they love</span>.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-green-500/20">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-black text-green-500">1,000</p>
                <p className="text-xs text-muted-foreground">Streams = $1,000</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-black text-primary">10,000</p>
                <p className="text-xs text-muted-foreground">Streams = $10,000</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-black text-secondary">100,000</p>
                <p className="text-xs text-muted-foreground">Streams = $100,000</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Subscription Tiers Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 relative bg-gradient-to-br from-primary/5 via-background to-secondary/5">
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
            <Card className="glass-card p-6 relative hover:scale-105 transition-transform">
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
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
                Get Started
              </Button>
            </Card>

            {/* Pro Plan */}
            <Card className="glass-card p-6 relative border-primary/50 hover:scale-105 transition-transform">
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
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full bg-gradient-to-r from-green-500 to-primary" onClick={() => navigate("/auth")}>
                Start Pro Trial
              </Button>
            </Card>

            {/* Enterprise Plan */}
            <Card className="glass-card p-6 relative hover:scale-105 transition-transform">
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
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
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

      {/* CTA Section */}
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
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-green-500 via-emerald-500 to-primary text-lg px-12 h-16 hover:scale-105 transition-transform"
            >
              Start Earning $1/Stream Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/faq")}
              className="text-lg px-12 h-16"
            >
              See How It Works
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Subscription required. Credit card required at signup. AI artists welcome.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={tdzLogo} alt="TDZ" className="h-8 w-auto" />
              <span className="font-display font-bold">TDZ Distribution</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate("/faq")} className="hover:text-primary transition-colors">FAQ</button>
              <button onClick={() => navigate("/support")} className="hover:text-primary transition-colors">Support</button>
              <button onClick={() => navigate("/terms")} className="hover:text-primary transition-colors">Terms</button>
              <button onClick={() => navigate("/privacy")} className="hover:text-primary transition-colors">Privacy</button>
              <button onClick={() => navigate("/investors")} className="hover:text-primary transition-colors">Investors</button>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Thirty Dark Zero Records. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}