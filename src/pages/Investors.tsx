import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Sparkles, 
  Music, 
  Video,
  LineChart,
  Target,
  Rocket,
  Globe,
  Zap,
  Brain,
  Star,
  ArrowRight,
  CheckCircle2,
  Crown,
  Shield,
  AlertTriangle,
  Swords,
  TrendingDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import tdzLogo from "@/assets/tdz-logo.png";
import { StudioPhoneMockups, MusicPlayerPhoneMockups } from "@/components/StudioPhoneMockup";
import { LineChart as RechartsLine, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Investors() {
  const navigate = useNavigate();
  const [activeGraph, setActiveGraph] = useState("revenue");

  // Financial projection data
  const revenueData = [
    { year: "Year 1", revenue: 23.1, artists: 50, profit: 8.2 },
    { year: "Year 2", revenue: 52.4, artists: 120, profit: 21.5 },
    { year: "Year 3", revenue: 89.7, artists: 220, profit: 42.8 },
    { year: "Year 4", revenue: 136.2, artists: 360, profit: 71.3 },
    { year: "Year 5", revenue: 194.5, artists: 500, profit: 108.6 }
  ];

  const marketShareData = [
    { year: "2024", tdz: 0.5, distrokid: 22, tunecore: 18, cdbaby: 15, others: 44.5 },
    { year: "2025", tdz: 2.8, distrokid: 21, tunecore: 17, cdbaby: 14, others: 45.2 },
    { year: "2026", tdz: 6.2, distrokid: 20, tunecore: 16, cdbaby: 13, others: 44.8 },
    { year: "2027", tdz: 11.5, distrokid: 19, tunecore: 15, cdbaby: 12, others: 42.5 },
    { year: "2028", tdz: 18.3, distrokid: 18, tunecore: 14, cdbaby: 11, others: 38.7 }
  ];

  const revenueStreamsData = [
    { name: "Subscriptions", value: 68, color: "hsl(var(--primary))" },
    { name: "Distribution Fees", value: 15, color: "hsl(var(--secondary))" },
    { name: "Management Services", value: 9, color: "hsl(var(--accent))" },
    { name: "TDZ Discovery Show", value: 8, color: "hsl(var(--chart-1))" }
  ];

  const userGrowthData = [
    { month: "Jan", artists: 5000, listeners: 50000, engagement: 72 },
    { month: "Feb", artists: 8500, listeners: 95000, engagement: 75 },
    { month: "Mar", artists: 14000, listeners: 168000, engagement: 78 },
    { month: "Apr", artists: 22000, listeners: 286000, engagement: 81 },
    { month: "May", artists: 32000, listeners: 448000, engagement: 84 },
    { month: "Jun", artists: 45000, listeners: 675000, engagement: 87 },
    { month: "Jul", artists: 50000, listeners: 850000, engagement: 89 }
  ];

  const unicornFeatures = [
    {
      icon: Brain,
      title: "Quantum-Powered AI Advisor",
      description: "Revolutionary AI that analyzes artist data in real-time to provide actionable insights for revenue optimization, fan engagement strategies, and career trajectory planning.",
      impact: "30% average revenue increase for artists using AI recommendations",
      category: "AI Innovation"
    },
    {
      icon: Video,
      title: "Storytelling Studio",
      description: "Industry-first AI video generation platform supporting Kling, Runway, Sora, and Veo. Artists create professional music videos with automated scene generation, lyric timing, and multi-provider optimization.",
      impact: "Reduces video production costs by 95%, democratizing visual content creation",
      category: "Content Creation"
    },
    {
      icon: Music,
      title: "Standalone Streaming Platform",
      description: "TDZ is building an independent streaming ecosystem—a direct competitor to Spotify and Apple Music. Artists publish directly to our platform, keeping 100% of their rights while reaching millions of listeners.",
      impact: "Instant publishing with no middlemen, no gatekeepers, no revenue splits",
      category: "Streaming"
    },
    {
      icon: LineChart,
      title: "Production Pipeline",
      description: "End-to-end project management from concept to release, with AI-assisted workflow optimization, collaboration tools, and automated quality checks.",
      impact: "50% faster time-to-market for new releases",
      category: "Workflow"
    },
    {
      icon: Users,
      title: "Fan Engagement Hub",
      description: "Real-time fan analytics, engagement tracking, and AI-powered sentiment analysis. Direct artist-to-fan communication channels with automated engagement optimization.",
      impact: "3x fan engagement rates with AI-driven interaction strategies",
      category: "Engagement"
    },
    {
      icon: Target,
      title: "Opportunities Marketplace",
      description: "AI-matched opportunities for sync licensing, brand partnerships, collaborations, and gigs based on artist profile, genre, and career trajectory.",
      impact: "Opens $500K+ annual revenue opportunities per artist",
      category: "Revenue"
    },
    {
      icon: Globe,
      title: "Tour Management System",
      description: "AI-powered tour recommendations based on fan density, venue analytics, market trends, and revenue optimization. Integrated booking and logistics management.",
      impact: "35% increase in tour profitability through data-driven routing",
      category: "Live Performance"
    },
    {
      icon: Sparkles,
      title: "Social Media Hub",
      description: "Unified social media management with AI content suggestions, optimal posting times, trend analysis, and cross-platform performance tracking.",
      impact: "200% growth in social media reach with AI optimization",
      category: "Marketing"
    },
    {
      icon: Star,
      title: "Master Classes & Education",
      description: "Curated learning paths from industry experts with AI-personalized recommendations based on artist skill level and career goals.",
      impact: "Accelerates artist development by 60%",
      category: "Education"
    }
  ];

  const metrics = [
    { label: "Target Market", value: "$76.9B", sublabel: "Global music streaming by 2027" },
    { label: "Year 1 Revenue", value: "$23.1M", sublabel: "Projected with 50K artists" },
    { label: "Artist Retention", value: "94%", sublabel: "Industry-leading loyalty" },
    { label: "AI-Ready", value: "100%", sublabel: "Human & AI artists welcome" }
  ];

  const investmentUse = [
    { area: "AI & Product Development", amount: "$3M", purpose: "Enhance AI capabilities, new features, UX improvements" },
    { area: "Marketing & Growth", amount: "$2M", purpose: "User acquisition, partnerships, brand building" },
    { area: "Team Expansion", amount: "$2M", purpose: "Top talent in engineering, data science, support" },
    { area: "Infrastructure", amount: "$2M", purpose: "Scalability, security, global expansion" },
    { area: "Strategic Partnerships", amount: "$1M", purpose: "Industry integrations, distribution deals" }
  ];

  const competitiveAdvantages = [
    "Standalone streaming platform competing directly with Spotify & Apple Music",
    "First-mover advantage in AI-generated music streaming",
    "AI-first approach to every feature with AI artists welcome",
    "100% rights retention for artists—human and AI alike",
    "Revolutionary AI video creation capabilities",
    "Quantum AI advisor - market exclusive",
    "Direct artist-to-listener relationship with no middlemen"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section - The Crisis */}
      <section className="relative py-20 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--destructive)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--primary)/0.15),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-12">
            <img src={tdzLogo} alt="TDZ" className="h-12 w-auto" />
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>

          <div className="text-center space-y-6 mb-16">
            <Badge className="bg-destructive/10 text-destructive border-destructive/20 px-4 py-2 text-sm animate-pulse">
              <AlertTriangle className="w-4 h-4 mr-2 inline" />
              THE MUSIC INDUSTRY IS BROKEN
            </Badge>
            <h1 className="text-5xl md:text-7xl font-display font-black leading-tight">
              ARTISTS ARE BEING
              <span className="block bg-gradient-to-r from-destructive via-orange-500 to-red-600 bg-clip-text text-transparent mt-2">
                EXPLOITED & IGNORED
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              For decades, major labels have controlled the industry, taking 80-90% of artist revenue while independent artists struggle with fragmented tools, zero support, and impossible barriers to success.
            </p>
          </div>

          {/* The Enemy - Industry Problems */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <Card className="bg-destructive/5 backdrop-blur border-destructive/20 hover:border-destructive/40 transition-all">
              <CardContent className="p-6 text-center">
                <TrendingDown className="w-8 h-8 text-destructive mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-destructive mb-2">
                  88%
                </div>
                <div className="font-semibold text-sm mb-1">Artist Revenue Lost</div>
                <div className="text-xs text-muted-foreground">to labels and middlemen</div>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 backdrop-blur border-destructive/20 hover:border-destructive/40 transition-all">
              <CardContent className="p-6 text-center">
                <Swords className="w-8 h-8 text-destructive mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-destructive mb-2">
                  $0.003
                </div>
                <div className="font-semibold text-sm mb-1">Per Stream</div>
                <div className="text-xs text-muted-foreground">Artists barely survive</div>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 backdrop-blur border-destructive/20 hover:border-destructive/40 transition-all">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-destructive mb-2">
                  90%
                </div>
                <div className="font-semibold text-sm mb-1">Quit Within 2 Years</div>
                <div className="text-xs text-muted-foreground">Due to lack of support</div>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 backdrop-blur border-destructive/20 hover:border-destructive/40 transition-all">
              <CardContent className="p-6 text-center">
                <TrendingDown className="w-8 h-8 text-destructive mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-destructive mb-2">
                  Zero
                </div>
                <div className="font-semibold text-sm mb-1">Creator Tools</div>
                <div className="text-xs text-muted-foreground">All platforms are fragmented</div>
              </CardContent>
            </Card>
          </div>

          {/* The Solution - TDZ as Hero */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl" />
            <Card className="relative bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/40 backdrop-blur">
              <CardContent className="p-12 text-center">
                <Badge className="bg-primary text-primary-foreground px-6 py-3 text-lg mb-6">
                  <Crown className="w-6 h-6 mr-3 inline" />
                  THE HERO HAS ARRIVED
                </Badge>
                <h2 className="text-4xl md:text-6xl font-display font-black mb-6">
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    THIRTY DARK ZERO RECORDS
                  </span>
                </h2>
                <p className="text-xl md:text-2xl text-foreground max-w-4xl mx-auto leading-relaxed mb-8">
                  We are the <span className="font-black text-primary">cavalry</span> for independent artists. Armed with military-grade AI precision, comprehensive creator tools, and a revolutionary distribution model, we're <span className="font-black text-secondary">obliterating</span> the old system and building a new music industry where <span className="font-black text-accent">artists keep their power and profits</span>.
                </p>
                <div className="grid md:grid-cols-4 gap-6 mt-12">
                  <div>
                    <div className="text-4xl font-black text-primary mb-2">100%</div>
                    <div className="text-sm font-semibold">Rights Retention</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-secondary mb-2">95%</div>
                    <div className="text-sm font-semibold">Cost Reduction</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-accent mb-2">24hrs</div>
                    <div className="text-sm font-semibold">To Global Release</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-primary mb-2">All-in-One</div>
                    <div className="text-sm font-semibold">Complete Platform</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Battle Plan - Our Mission */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-4">
              <Shield className="w-4 h-4 mr-2 inline" />
              OUR BATTLE PLAN
            </Badge>
            <h2 className="text-4xl md:text-6xl font-display font-black mb-4">
              How We Win The War
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A three-front assault on the broken music industry status quo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:shadow-lg hover:shadow-primary/20 transition-all">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-primary">1</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Arm Artists With AI</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Deploy quantum-powered AI tools that give independent artists the same capabilities as billion-dollar labels—video production, distribution, marketing, analytics, and revenue optimization—all in one platform.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20 hover:shadow-lg hover:shadow-secondary/20 transition-all">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-secondary">2</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Destroy The Middlemen</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cut out exploitative intermediaries with direct-to-platform distribution to 150+ streaming services. Artists keep 100% of their rights and the lion's share of revenue—no more 80/20 label splits.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20 hover:shadow-lg hover:shadow-accent/20 transition-all">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-accent">3</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Build A New System</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Launch TDZ Discovery—a reality show that becomes a viral acquisition engine, recruiting millions of artists while showcasing our platform's power. Entertainment meets user growth at unprecedented scale.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Unicorn Features */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              What Makes Us Unicorn-Worthy
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
              Revolutionary Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive AI-powered platform delivers capabilities that no competitor can match
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unicornFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="group hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2 text-xs">
                          {feature.category}
                        </Badge>
                        <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-semibold text-accent">
                          {feature.impact}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Studio Preview */}
      <StudioPhoneMockups />

      {/* Music Player Demo */}
      <MusicPlayerPhoneMockups />

      {/* Competitive Advantages */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-display font-black text-center mb-12">
            Why We Win
          </h2>
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-4">
                {competitiveAdvantages.map((advantage, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <p className="text-muted-foreground">{advantage}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Go-To-Market Strategy: TDZ Discovery */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-accent/5 via-primary/5 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--accent)/0.1),transparent_70%)]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 mb-4">
              <Star className="w-4 h-4 mr-2 inline" />
              Revolutionary Go-To-Market Strategy
            </Badge>
            <h2 className="text-4xl md:text-6xl font-display font-black mb-4">
              TDZ DISCOVERY
            </h2>
            <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-6">
              The World's First App-Powered Reality Music Competition
            </p>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
              Where artists compete, fans decide, and the platform becomes the star
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 group hover:shadow-lg hover:shadow-primary/20 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Video className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">The Show Concept</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  TDZ Discovery transforms music competition TV into an interactive phenomenon. Artists use our platform to create, produce, and release their competition entries—showcasing every feature from AI video generation to distribution. Fans don't just watch, they participate through real-time voting, engagement metrics, and social sharing.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Weekly challenges highlighting different platform features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Celebrity judges + real-time fan voting integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Behind-the-scenes platform tutorials woven into content</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20 group hover:shadow-lg hover:shadow-accent/20 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-accent/20">
                    <TrendingUp className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold">Viral User Acquisition</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Every episode becomes a 60-minute platform demonstration to millions of viewers. Aspiring artists watching at home can immediately download the app and use the exact same tools as the contestants. This creates unprecedented conversion rates from viewers to users.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Projected 15-25% viewer-to-user conversion rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Multi-platform distribution (streaming + broadcast)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Social media amplification through fan voting</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-secondary/10 via-primary/5 to-accent/5 border-primary/20 mb-8">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Why This Is a Game-Changer</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-bold mb-2">Massive Reach</h4>
                  <p className="text-sm text-muted-foreground">
                    Target: 5M+ viewers per season across streaming platforms and broadcast TV
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
                    <DollarSign className="w-8 h-8 text-accent" />
                  </div>
                  <h4 className="font-bold mb-2">Multiple Revenue Streams</h4>
                  <p className="text-sm text-muted-foreground">
                    Sponsorships, advertising, user subscriptions, and artist licensing deals
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/20 mb-4">
                    <Sparkles className="w-8 h-8 text-secondary" />
                  </div>
                  <h4 className="font-bold mb-2">Platform as Product</h4>
                  <p className="text-sm text-muted-foreground">
                    Every episode is a live product demo, reducing customer acquisition cost to near-zero
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 rounded-2xl p-8 text-center border border-primary/30">
            <Rocket className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">The Ultimate Competitive Moat</h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              While competitors spend millions on traditional marketing, TDZ Discovery turns entertainment into acquisition. 
              This isn't just a show—it's a self-sustaining growth engine that pays for itself through media rights while 
              building the world's largest community of independent artists.
            </p>
          </div>
        </div>
      </section>

      {/* Financial Projections - Interactive Graphs */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-secondary/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-4">
              <TrendingUp className="w-4 h-4 mr-2 inline" />
              VICTORY METRICS
            </Badge>
            <h2 className="text-4xl md:text-6xl font-display font-black mb-4">
              Financial Projections
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explosive growth backed by multiple revenue streams and unstoppable market momentum
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:shadow-lg hover:shadow-primary/20 transition-all">
              <CardContent className="p-8 text-center">
                <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
                <div className="text-5xl font-black text-primary mb-3">$23.1M</div>
                <div className="font-bold text-lg mb-2">Year 1 Revenue</div>
                <div className="text-sm text-muted-foreground">
                  50,000 artists • 3 subscription tiers • Distribution fees
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20 hover:shadow-lg hover:shadow-secondary/20 transition-all">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
                <div className="text-5xl font-black text-secondary mb-3">500K+</div>
                <div className="font-bold text-lg mb-2">Year 5 Artists</div>
                <div className="text-sm text-muted-foreground">
                  94% retention rate • Viral TDZ Discovery growth
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20 hover:shadow-lg hover:shadow-accent/20 transition-all">
              <CardContent className="p-8 text-center">
                <Rocket className="w-12 h-12 text-accent mx-auto mb-4" />
                <div className="text-5xl font-black text-accent mb-3">$194M</div>
                <div className="font-bold text-lg mb-2">Year 5 Revenue</div>
                <div className="text-sm text-muted-foreground">
                  10x scale • Premium features • Enterprise deals
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graph Navigation */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <Button 
              variant={activeGraph === "revenue" ? "default" : "outline"}
              onClick={() => setActiveGraph("revenue")}
              className="font-semibold"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Revenue Growth
            </Button>
            <Button 
              variant={activeGraph === "users" ? "default" : "outline"}
              onClick={() => setActiveGraph("users")}
              className="font-semibold"
            >
              <Users className="w-4 h-4 mr-2" />
              User Growth
            </Button>
            <Button 
              variant={activeGraph === "market" ? "default" : "outline"}
              onClick={() => setActiveGraph("market")}
              className="font-semibold"
            >
              <Target className="w-4 h-4 mr-2" />
              Market Share
            </Button>
            <Button 
              variant={activeGraph === "streams" ? "default" : "outline"}
              onClick={() => setActiveGraph("streams")}
              className="font-semibold"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Revenue Breakdown
            </Button>
          </div>

          {/* Interactive Graph Display */}
          <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur border-primary/20 mb-12">
            <CardContent className="p-8">
              {activeGraph === "revenue" && (
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-center">5-Year Revenue & Profit Trajectory</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: 'Revenue ($M)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--primary)/0.2)',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} name="Revenue ($M)" />
                      <Area type="monotone" dataKey="profit" stroke="hsl(var(--secondary))" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} name="Profit ($M)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeGraph === "users" && (
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-center">First Year User Acquisition & Engagement</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--primary)/0.2)',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="artists" fill="hsl(var(--primary))" name="Artists" radius={[8, 8, 0, 0]} />
                      <Bar yAxisId="left" dataKey="listeners" fill="hsl(var(--secondary))" name="Listeners (K)" radius={[8, 8, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="hsl(var(--accent))" strokeWidth={3} name="Engagement %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeGraph === "market" && (
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-center">Market Share Domination (2024-2028)</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={marketShareData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: 'Market Share (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--primary)/0.2)',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Area type="monotone" dataKey="tdz" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.8} name="TDZ Records" strokeWidth={2} />
                      <Area type="monotone" dataKey="distrokid" stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.6} name="DistroKid" />
                      <Area type="monotone" dataKey="tunecore" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.6} name="TuneCore" />
                      <Area type="monotone" dataKey="cdbaby" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} name="CD Baby" />
                      <Area type="monotone" dataKey="others" stackId="1" stroke="hsl(var(--muted))" fill="hsl(var(--muted))" fillOpacity={0.4} name="Others" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeGraph === "streams" && (
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-center">Revenue Stream Distribution (Year 1)</h3>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={revenueStreamsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}%`}
                          outerRadius={140}
                          fill="#8884d8"
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {revenueStreamsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--primary)/0.2)',
                            borderRadius: '8px'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-4">
                      {revenueStreamsData.map((stream, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: stream.color }} />
                          <div>
                            <div className="font-bold">{stream.name}</div>
                            <div className="text-sm text-muted-foreground">{stream.value}% of total revenue</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Model Details */}
          <Card className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Revenue Model Breakdown</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-lg mb-4 text-primary flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Subscription Tiers
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-card/50">
                      <span className="font-semibold">Basic ($10/mo)</span>
                      <span className="text-sm text-muted-foreground">Distribution + Tools</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-card/50">
                      <span className="font-semibold">Premium ($25/mo)</span>
                      <span className="text-sm text-muted-foreground">Advanced + AI</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-card/50">
                      <span className="font-semibold">Pro ($50/mo)</span>
                      <span className="text-sm text-muted-foreground">Full Suite + Priority</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-4 text-secondary flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Additional Revenue Streams
                  </h4>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Distribution fees (per release)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Artist management services (15% commission)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Tour management commissions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Master class partnerships & licensing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>TDZ Discovery media rights & sponsorships</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Investment Requirements */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-4">
              <Target className="w-4 h-4 mr-2 inline" />
              Seeking $10M Series A
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
              Investment Allocation
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Strategic deployment of capital to accelerate growth and market dominance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investmentUse.map((item, idx) => (
              <Card key={idx} className="group hover:border-primary/40 transition-all">
                <CardContent className="p-6">
                  <div className="text-3xl font-black text-primary mb-2">
                    {item.amount}
                  </div>
                  <h3 className="font-bold text-lg mb-3">{item.area}</h3>
                  <p className="text-sm text-muted-foreground">{item.purpose}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 md:px-6 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-display font-black">
            Join Us in Building the Future
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Be part of the platform that's democratizing the music industry and empowering the next generation of independent artists.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-primary to-secondary text-background font-bold px-8">
              Request Investment Deck
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Experience the Platform
            </Button>
          </div>
          <div className="pt-8 space-y-3">
            <div className="text-sm text-muted-foreground">
              For investment inquiries: <a href="mailto:info@thirtydarkzero.com" className="text-primary hover:underline font-semibold">info@thirtydarkzero.com</a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-primary/5 border-primary/20">
                <Shield className="w-3 h-3 mr-1.5" />
                SBA SDVOSB Certified
              </Badge>
              <Badge variant="outline" className="bg-secondary/5 border-secondary/20">
                SAM.GOV Registered
              </Badge>
              <span className="hidden sm:inline">•</span>
              <span className="text-center sm:text-left">Government Contract Procurement • Live Entertainment Specialist</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
