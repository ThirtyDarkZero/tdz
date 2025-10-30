import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Music, 
  Video, 
  Wand2, 
  Zap, 
  Camera, 
  Palette,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";

const features = [
  {
    icon: Music,
    title: "Audio Intelligence",
    description: "AI-powered beat detection, tempo analysis, and mood tagging that understands your music",
    color: "from-primary to-secondary"
  },
  {
    icon: Video,
    title: "Cinematic Scene Generation",
    description: "Generate 4K scenes with perfect motion sync, camera movements, and lighting",
    color: "from-secondary to-accent"
  },
  {
    icon: Wand2,
    title: "Lyric Intelligence",
    description: "NLP-powered scene breakdown that turns lyrics into visual storytelling",
    color: "from-accent to-primary"
  },
  {
    icon: Camera,
    title: "AI Director",
    description: "Automatic camera work, transitions, and shot composition synced to beats",
    color: "from-primary to-accent"
  },
  {
    icon: Palette,
    title: "Style Presets",
    description: "Cinematic, anime, surreal themes with custom mood and color grading",
    color: "from-secondary to-primary"
  },
  {
    icon: Zap,
    title: "Beat-Perfect Sync",
    description: "Frame-accurate synchronization between visual cuts and musical beats",
    color: "from-accent to-secondary"
  }
];

const benefits = [
  "Generate music videos in minutes, not days",
  "No technical skills or expensive equipment needed",
  "Unlimited creative variations and styles",
  "Professional cinematic quality every time",
  "Full control over mood, pacing, and aesthetics",
  "Export in multiple formats for all platforms"
];

export default function Landing() {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleQuickGenerate = () => {
    if (prompt.trim()) {
      localStorage.setItem("quickPrompt", prompt);
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center space-y-8">
          <Badge className="bg-primary/20 text-primary border-primary/30 animate-fade-in">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by AI · Generate Cinematic Music Videos
          </Badge>

          <h1 className="text-5xl md:text-7xl font-display font-black leading-tight animate-fade-in tracking-tight">
            Create Any Music Video
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              You Can Imagine
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-in">
            AI-powered music video generation with beat-synced visuals, 
            cinematic scenes, and professional editing. From audio to stunning video in minutes.
          </p>

          {/* Quick Prompt Generator */}
          <Card className="glass-card p-6 max-w-3xl mx-auto space-y-4 animate-scale-in">
            <div className="flex gap-2">
              <Input
                placeholder="Describe your music video idea... (e.g., 'Luxury car chase at night with neon lights')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-background/50 border-primary/30 focus:border-primary text-lg"
                onKeyDown={(e) => e.key === "Enter" && handleQuickGenerate()}
              />
              <Button 
                size="lg"
                onClick={handleQuickGenerate}
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-glow"
              >
                <Wand2 className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Or start with a template · No credit card required
            </p>
          </Card>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-secondary text-lg px-8 h-14 hover:shadow-glow group"
            >
              Start Creating Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 h-14 border-primary/50 hover:bg-primary/10"
            >
              Sign In
            </Button>
          </div>

          {/* Trust Indicators */}
          <p className="text-sm text-muted-foreground animate-fade-in">
            Join thousands of creators making professional music videos
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary/20 text-secondary border-secondary/30">
              Platform Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Everything You Need for
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Professional Music Videos
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className="glass-card p-6 hover:border-primary/50 transition-all hover-scale group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-accent/20 text-accent border-accent/30">
                Why Choose Us
              </Badge>
              <h2 className="text-4xl md:text-5xl font-display font-bold">
                From Concept to
                <br />
                <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  Cinematic Reality
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Our AI understands music like a professional director. 
                Every beat, every lyric, every emotion - transformed into stunning visual storytelling.
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-accent to-primary hover:shadow-glow"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, idx) => (
                <Card
                  key={idx}
                  className="glass-card p-4 flex items-start gap-3 hover:border-primary/50 transition-all"
                >
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit}</span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-display font-black">
            Ready to Create Your
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Next Music Video?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Join the future of music video production. No experience needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-secondary text-lg px-8 h-14 hover:shadow-glow group"
            >
              Start Free Now
              <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold">AI Music Video Studio</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 AI Music Video Studio. Powered by Lovable AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
