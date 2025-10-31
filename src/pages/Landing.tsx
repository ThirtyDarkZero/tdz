import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Upload, TrendingUp, Zap, Globe, Radio, Shield, Download, ArrowRight, CheckCircle2, DollarSign, BarChart3, Headphones } from "lucide-react";
import studioBackground from "@/assets/studio-background.jpg";
import tdzLogo from "@/assets/tdz-logo.png";
const features = [{
  icon: Globe,
  title: "Global Distribution",
  description: "Distribute to Spotify, Apple Music, Amazon, YouTube Music, and 150+ platforms worldwide",
  color: "from-primary to-secondary"
}, {
  icon: TrendingUp,
  title: "Real-Time Analytics",
  description: "Track streams, revenue, and audience demographics across all platforms in real-time",
  color: "from-secondary to-accent"
}, {
  icon: Music,
  title: "Premium Streaming",
  description: "High-fidelity audio streaming with advanced player features and offline support",
  color: "from-accent to-primary"
}, {
  icon: Zap,
  title: "Instant Publishing",
  description: "Upload once and go live on all major platforms within 24-48 hours",
  color: "from-primary to-accent"
}, {
  icon: Radio,
  title: "Playlist Pitching",
  description: "Submit directly to Spotify and Apple Music curators for playlist consideration",
  color: "from-secondary to-primary"
}, {
  icon: DollarSign,
  title: "100% Royalties",
  description: "Keep every penny you earn. No hidden fees. Transparent payment processing",
  color: "from-accent to-secondary"
}];
const benefits = ["Distribute unlimited tracks to 150+ platforms", "Keep 100% of your streaming royalties", "Real-time analytics and earnings dashboard", "Professional metadata and artwork optimization", "Direct playlist pitching to curators", "24/7 artist support and guidance"];
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
          {/* Floating Badge */}
          <div className="animate-fade-in">
            <Badge className="bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 text-foreground border-primary/40 backdrop-blur-xl px-6 py-2 text-base neon-border">
              <Globe className="w-4 h-4 mr-2 animate-pulse" />
              Global Distribution · Premium Streaming · 100% Royalties
            </Badge>
          </div>

          {/* Logo */}
          <div className="animate-fade-in flex justify-center" style={{ animationDelay: '0.05s' }}>
            <img 
              src={tdzLogo} 
              alt="TDZ Distribution Logo" 
              className="h-64 md:h-80 lg:h-96 w-auto object-contain"
            />
          </div>

          {/* 3D Layered Title */}
          <div className="relative">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-black leading-none tracking-tighter perspective-1000">
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

          <p className="text-xl md:text-3xl text-foreground/80 max-w-4xl mx-auto animate-fade-in font-light" style={{
          animationDelay: '0.4s'
        }}>
            From <span className="text-primary font-semibold">local artist</span> to <span className="text-secondary font-semibold">global sensation</span> in <span className="text-accent font-semibold">24 hours</span>
          </p>

          {/* Quick Start Input */}
          <div className="animate-scale-in max-w-4xl mx-auto" style={{
          animationDelay: '0.5s'
        }}>
            <Card className="relative group glass-card p-8 border-primary/30 hover:border-primary/60 transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-primary via-secondary to-accent rounded-lg opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
              <div className="relative space-y-4">
                <div className="flex gap-3">
                  <Input placeholder="🎵 Enter your artist name to get started..." value={prompt} onChange={e => setPrompt(e.target.value)} className="bg-background/80 backdrop-blur-sm border-primary/40 focus:border-primary text-lg h-14 px-6" onKeyDown={e => e.key === "Enter" && handleQuickGenerate()} />
                  <Button size="lg" onClick={handleQuickGenerate} className="bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-glow h-14 px-8 group">
                    <Upload className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <Zap className="w-4 h-4" />
                    <span>Instant Setup</span>
                  </div>
                  <div className="flex items-center gap-2 text-secondary">
                    <Globe className="w-4 h-4" />
                    <span>150+ Platforms</span>
                  </div>
                  <div className="flex items-center gap-2 text-accent">
                    <DollarSign className="w-4 h-4" />
                    <span>100% Royalties</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Floating CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in" style={{
          animationDelay: '0.6s'
        }}>
            <Button size="lg" onClick={() => navigate("/auth")} className="relative group bg-gradient-to-r from-primary via-secondary to-accent text-background font-bold text-xl px-12 h-16 hover:scale-105 transition-all duration-300">
              <span className="relative z-10">START DISTRIBUTING</span>
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-secondary opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-xl px-12 h-16 border-2 border-primary/60 hover:bg-primary/20 hover:border-primary backdrop-blur-xl transition-all duration-300 hover:scale-105">
              <Headphones className="w-5 h-5 mr-2" />
              SIGN IN
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 animate-fade-in" style={{
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
                <div className="text-3xl md:text-4xl font-display font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Features Grid - Bento Style */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-display font-black mb-6">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                COMPLETE
              </span>
              <br />
              DISTRIBUTION SUITE
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to reach millions of listeners globally
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[200px]">
            {/* Large Feature */}
            <Card className="md:col-span-4 md:row-span-2 glass-card p-8 relative group overflow-hidden hover:border-primary/60 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Globe className="w-8 h-8 text-background" />
                  </div>
                  <h3 className="text-3xl font-display font-bold mb-4">Global Distribution</h3>
                  <p className="text-muted-foreground text-lg max-w-lg">
                    Distribute to Spotify, Apple Music, Amazon, YouTube Music, and 150+ platforms. Your music everywhere, all at once.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-primary/20 text-primary border-primary/30">150+ Platforms</Badge>
                  <Badge className="bg-secondary/20 text-secondary border-secondary/30">24hr Go-Live</Badge>
                </div>
              </div>
            </Card>

            {/* Medium Feature */}
            <Card className="md:col-span-2 md:row-span-2 glass-card p-8 relative group overflow-hidden hover:border-secondary/60 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <BarChart3 className="w-7 h-7 text-background" />
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-3">Analytics</h3>
                  <p className="text-muted-foreground">
                    Real-time streams, earnings, and audience insights across all platforms.
                  </p>
                </div>
              </div>
            </Card>

            {/* Small Features */}
            {[{
            icon: Music,
            title: "Premium Audio",
            desc: "High-fidelity streaming quality",
            color: "from-accent to-primary"
          }, {
            icon: Radio,
            title: "Playlist Pitch",
            desc: "Direct curator access",
            color: "from-primary to-secondary"
          }, {
            icon: DollarSign,
            title: "100% Royalties",
            desc: "Keep everything you earn",
            color: "from-secondary to-accent"
          }, {
            icon: Shield,
            title: "Rights Protected",
            desc: "You own your music",
            color: "from-accent to-primary"
          }].map((feature, idx) => <Card key={idx} className="md:col-span-2 glass-card p-6 relative group overflow-hidden hover:border-primary/60 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className="w-6 h-6 text-background" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.desc}</p>
                  </div>
                </div>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Benefits Section - Split Design */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Diagonal Split Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 100%)'
        }} />
          <div className="absolute inset-0 bg-gradient-to-tl from-secondary/10 to-transparent" style={{
          clipPath: 'polygon(0 50%, 100% 0, 100% 100%, 0 100%)'
        }} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Big Statement */}
            <div className="space-y-8">
              <div>
                <Badge className="bg-accent/20 text-accent border-accent/30 mb-6 text-base px-4 py-2">
                  <Zap className="w-4 h-4 mr-2" />
                  Built By Artists, For Artists
                </Badge>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-black leading-none mb-6">
                  <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
                    YOUR MUSIC
                  </span>
                  <br />
                  YOUR RULES
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  No hidden fees. No complicated contracts. Just powerful tools to help you 
                  reach <span className="text-primary font-semibold">millions of listeners</span> worldwide.
                </p>
              </div>
              <Button size="lg" onClick={() => navigate("/auth")} className="bg-gradient-to-r from-accent via-primary to-secondary hover:scale-105 transition-all duration-300 h-16 px-10 text-lg font-bold">
                <Upload className="w-6 h-6 mr-2" />
                START NOW
              </Button>
            </div>

            {/* Right - Floating Benefits */}
            <div className="space-y-4 relative">
              {benefits.map((benefit, idx) => <Card key={idx} className="glass-card p-6 relative group overflow-hidden border-primary/30 hover:border-primary transition-all duration-500 hover:translate-x-2" style={{
              animationDelay: `${idx * 0.1}s`,
              animation: 'fade-in 0.5s ease-out forwards'
            }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle2 className="w-5 h-5 text-background" />
                    </div>
                    <span className="text-lg font-medium pt-1">{benefit}</span>
                  </div>
                </Card>)}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Immersive */}
      <section className="py-40 px-6 relative overflow-hidden">
        {/* Radial Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.2)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--secondary)/0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--accent)/0.15)_0%,transparent_50%)]" />
        
        <div className="max-w-6xl mx-auto text-center space-y-12 relative z-10">
          {/* Massive CTA */}
          <div className="space-y-8">
            <h2 className="text-6xl md:text-8xl lg:text-9xl font-display font-black leading-none">
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
            <p className="text-2xl md:text-3xl text-muted-foreground max-w-3xl mx-auto font-light animate-fade-in" style={{
            animationDelay: '0.3s'
          }}>
              Join 50,000+ independent artists distributing their music to <span className="text-primary font-semibold">millions of listeners</span> worldwide.
            </p>
          </div>

          {/* Giant CTA Button */}
          <div className="flex flex-col items-center gap-6 animate-scale-in" style={{
          animationDelay: '0.4s'
        }}>
            <Button size="lg" onClick={() => navigate("/auth")} className="relative group bg-gradient-to-r from-primary via-secondary to-accent text-background font-black text-2xl md:text-3xl px-16 h-20 md:h-24 rounded-2xl hover:scale-110 transition-all duration-500 shadow-2xl">
              <span className="relative z-10 flex items-center gap-4">
                <Upload className="w-8 h-8 group-hover:-translate-y-2 transition-transform duration-500" />
                LAUNCH NOW
                <ArrowRight className="w-8 h-8 group-hover:translate-x-4 transition-transform duration-500" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-secondary opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 rounded-2xl" />
            </Button>
            <p className="text-muted-foreground text-lg">
              No credit card required · Keep 100% rights · 24/7 support
            </p>
          </div>

          {/* Social Proof Pills */}
          <div className="flex flex-wrap justify-center gap-4 pt-8 animate-fade-in" style={{
          animationDelay: '0.5s'
        }}>
            {["🌍 150+ Platforms", "⚡ 24hr Go-Live", "💰 100% Royalties", "🚀 Zero Setup Fees"].map((pill, idx) => <Badge key={idx} className="bg-card/50 backdrop-blur-xl border-primary/30 text-foreground px-6 py-3 text-base">
                {pill}
              </Badge>)}
          </div>
        </div>
      </section>

      {/* Footer - Futuristic */}
      <footer className="relative border-t border-primary/20 py-12 px-6">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Music className="w-6 h-6 text-background" />
              </div>
              <span className="font-display font-bold text-xl">TDZ DISTRIBUTION</span>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              <p className="text-muted-foreground">
                Next-Gen Music Distribution · Built for Independent Artists
              </p>
              <p className="text-sm text-muted-foreground/60">
                © 2025 TDZ Distribution. Empowering artists worldwide.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>;
}