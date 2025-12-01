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
  TrendingDown,
  CreditCard,
  Download,
  Radio,
  Layers,
  PiggyBank
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
    { year: "2024", tdz: 0.5, spotify: 31, apple: 15, amazon: 13, others: 40.5 },
    { year: "2025", tdz: 2.8, spotify: 30, apple: 14.5, amazon: 12.5, others: 40.2 },
    { year: "2026", tdz: 6.2, spotify: 29, apple: 14, amazon: 12, others: 38.8 },
    { year: "2027", tdz: 11.5, spotify: 28, apple: 13.5, amazon: 11.5, others: 35.5 },
    { year: "2028", tdz: 18.3, spotify: 27, apple: 13, amazon: 11, others: 30.7 }
  ];

  const revenuePoolData = [
    { name: "Subscriptions", value: 55, color: "hsl(var(--primary))" },
    { name: "Downloads", value: 20, color: "hsl(var(--secondary))" },
    { name: "Ads & Sponsors", value: 15, color: "hsl(var(--accent))" },
    { name: "Premium Features", value: 7, color: "hsl(var(--chart-1))" },
    { name: "Live Events", value: 3, color: "hsl(var(--chart-2))" }
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
      icon: DollarSign,
      title: "$1 Per Stream Payout",
      description: "Revolutionary artist payout model. Artists earn $1.00 for every stream—not $0.003 like Spotify. This attracts top talent and creates unprecedented artist loyalty.",
      impact: "333x higher payout than traditional DSPs",
      category: "Revenue Model"
    },
    {
      icon: Download,
      title: "Artist-Set Download Pricing",
      description: "Artists set their own download prices. Fans buy tracks directly. 100% of download revenue goes to the artist (minus transaction fees).",
      impact: "New revenue stream with 100% artist retention",
      category: "Revenue Model"
    },
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
      description: "TDZ is an independent streaming ecosystem—a direct competitor to Spotify and Apple Music. Artists publish directly to our platform, keeping 100% of their rights.",
      impact: "No middlemen, no gatekeepers, artists own everything",
      category: "Streaming"
    },
    {
      icon: Layers,
      title: "AI Music Welcome",
      description: "First major platform to fully embrace AI-generated music. AI artists earn the same $1 per stream as human artists. Zero stigma, full monetization.",
      impact: "First-mover in $1B+ AI music market",
      category: "Market Position"
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
    }
  ];

  const metrics = [
    { label: "Target Market", value: "$76.9B", sublabel: "Global music streaming by 2027" },
    { label: "Year 1 Revenue", value: "$23.1M", sublabel: "Projected with 50K artists" },
    { label: "Artist Retention", value: "94%", sublabel: "Industry-leading loyalty" },
    { label: "Per-Stream Payout", value: "$1.00", sublabel: "333x more than Spotify" }
  ];

  const investmentUse = [
    { area: "AI & Product Development", amount: "$3M", purpose: "Enhance AI capabilities, new features, UX improvements" },
    { area: "Marketing & Growth", amount: "$2M", purpose: "User acquisition, partnerships, brand building" },
    { area: "Team Expansion", amount: "$2M", purpose: "Top talent in engineering, data science, support" },
    { area: "Infrastructure", amount: "$2M", purpose: "Scalability, security, global expansion" },
    { area: "Strategic Partnerships", amount: "$1M", purpose: "Industry integrations, distribution deals" }
  ];

  const competitiveAdvantages = [
    "$1 per stream vs $0.003 industry average—333x higher payouts",
    "First platform to fully embrace and monetize AI music",
    "Artists set their own download prices, keep 100% revenue",
    "Standalone streaming platform competing directly with Spotify",
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
              ARTISTS EARN
              <span className="block bg-gradient-to-r from-destructive via-orange-500 to-red-600 bg-clip-text text-transparent mt-2">
                $0.003 PER STREAM
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Artists need 250,000 streams just to earn $750. Meanwhile, platforms like Spotify profit billions. TDZ changes everything with <span className="text-green-500 font-bold">$1 per stream</span>.
            </p>
          </div>

          {/* The Enemy - Industry Problems */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <Card className="bg-destructive/5 backdrop-blur border-destructive/20 hover:border-destructive/40 transition-all">
              <CardContent className="p-6 text-center">
                <TrendingDown className="w-8 h-8 text-destructive mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-destructive mb-2">
                  $0.003
                </div>
                <div className="font-semibold text-sm mb-1">Spotify Payout</div>
                <div className="text-xs text-muted-foreground">Per stream average</div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 backdrop-blur border-green-500/30 hover:border-green-500/50 transition-all">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-green-500 mb-2">
                  $1.00
                </div>
                <div className="font-semibold text-sm mb-1">TDZ Payout</div>
                <div className="text-xs text-muted-foreground">Per stream guaranteed</div>
              </CardContent>
            </Card>
            <Card className="bg-primary/10 backdrop-blur border-primary/30 hover:border-primary/50 transition-all">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-primary mb-2">
                  333x
                </div>
                <div className="font-semibold text-sm mb-1">Higher Payout</div>
                <div className="text-xs text-muted-foreground">vs industry average</div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/10 backdrop-blur border-secondary/30 hover:border-secondary/50 transition-all">
              <CardContent className="p-6 text-center">
                <Download className="w-8 h-8 text-secondary mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-secondary mb-2">
                  100%
                </div>
                <div className="font-semibold text-sm mb-1">Download Revenue</div>
                <div className="text-xs text-muted-foreground">Goes to artist</div>
              </CardContent>
            </Card>
          </div>

          {/* The Solution - TDZ as Hero */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-primary/20 to-secondary/20 blur-3xl" />
            <Card className="relative bg-gradient-to-br from-green-500/10 via-primary/10 to-secondary/10 border-green-500/40 backdrop-blur">
              <CardContent className="p-12 text-center">
                <Badge className="bg-green-500 text-background px-6 py-3 text-lg mb-6">
                  <Crown className="w-6 h-6 mr-3 inline" />
                  THE $1 PER STREAM REVOLUTION
                </Badge>
                <h2 className="text-4xl md:text-6xl font-display font-black mb-6">
                  <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-primary bg-clip-text text-transparent">
                    THIRTY DARK ZERO RECORDS
                  </span>
                </h2>
                <p className="text-xl md:text-2xl text-foreground max-w-4xl mx-auto leading-relaxed mb-8">
                  We pay artists <span className="font-black text-green-500">$1.00 per stream</span>. Artists set their own download prices and keep <span className="font-black text-secondary">100% of download revenue</span>. AI music is welcome. The future of music is here.
                </p>
                <div className="grid md:grid-cols-4 gap-6 mt-12">
                  <div>
                    <div className="text-4xl font-black text-green-500 mb-2">$1.00</div>
                    <div className="text-sm font-semibold">Per Stream</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-secondary mb-2">100%</div>
                    <div className="text-sm font-semibold">Download Revenue</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-accent mb-2">AI+Human</div>
                    <div className="text-sm font-semibold">Both Welcome</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-primary mb-2">100%</div>
                    <div className="text-sm font-semibold">Rights Retained</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Revenue Pool Model - NEW SECTION */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-green-500/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-4 py-2 mb-4">
              <PiggyBank className="w-4 h-4 mr-2 inline" />
              REVENUE POOL MODEL
            </Badge>
            <h2 className="text-4xl md:text-6xl font-display font-black mb-4">
              How We Pay $1 Per Stream
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A diversified revenue pool that funds sustainable artist payouts
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  The TDZ Revenue Pool
                </h3>
                <div className="space-y-4">
                  {[
                    { source: "Fan Subscriptions", pct: 55, desc: "Monthly streaming subscriptions" },
                    { source: "Download Purchases", pct: 20, desc: "Direct track purchases" },
                    { source: "Ads & Sponsorships", pct: 15, desc: "Platform advertising revenue" },
                    { source: "Premium Features", pct: 7, desc: "Pro tools and upgrades" },
                    { source: "Live Events", pct: 3, desc: "Concert/event revenue share" }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.source}</span>
                        <span className="font-bold text-green-500">{item.pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-primary" />
                  Why $1/Stream Works
                </h3>
                <div className="space-y-4">
                  {[
                    { title: "Higher Artist Retention", desc: "94% retention vs 60% industry average" },
                    { title: "Premium Fan Engagement", desc: "Fans who pay more, engage more" },
                    { title: "Viral Artist Acquisition", desc: "Artists recruit other artists" },
                    { title: "Lower Marketing Costs", desc: "Word-of-mouth drives growth" },
                    { title: "Multiple Revenue Streams", desc: "Diversified income reduces risk" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Breakdown */}
          <Card className="bg-gradient-to-br from-card/80 to-card/60 border-green-500/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Financial Model Breakdown</h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <p className="text-3xl font-black text-green-500">$9.99</p>
                  <p className="text-sm font-medium">Avg Subscription</p>
                  <p className="text-xs text-muted-foreground mt-1">Fan monthly fee</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-3xl font-black text-primary">10</p>
                  <p className="text-sm font-medium">Streams/Sub</p>
                  <p className="text-xs text-muted-foreground mt-1">Break-even per month</p>
                </div>
                <div className="text-center p-4 bg-secondary/10 rounded-lg">
                  <p className="text-3xl font-black text-secondary">$1.00</p>
                  <p className="text-sm font-medium">Per Stream</p>
                  <p className="text-xs text-muted-foreground mt-1">Artist payout</p>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <p className="text-3xl font-black text-accent">100%</p>
                  <p className="text-sm font-medium">Downloads</p>
                  <p className="text-xs text-muted-foreground mt-1">To artist</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
              A three-front assault on the broken music industry
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 hover:shadow-lg hover:shadow-green-500/20 transition-all">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-green-500">1</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Pay Artists Fairly</h3>
                <p className="text-muted-foreground leading-relaxed">
                  $1 per stream changes everything. Artists no longer need millions of streams to survive. 1,000 streams = $1,000. Real money for real artists.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20 hover:shadow-lg hover:shadow-secondary/20 transition-all">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-secondary">2</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Embrace AI Music</h3>
                <p className="text-muted-foreground leading-relaxed">
                  First-mover advantage in the AI music revolution. AI artists earn the same as human artists. No stigma, full monetization, massive market opportunity.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20 hover:shadow-lg hover:shadow-accent/20 transition-all">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-accent">3</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Build The Platform</h3>
                <p className="text-muted-foreground leading-relaxed">
                  AI-powered tools, video generation, analytics, fan engagement—everything artists need in one place. No middlemen, no gatekeepers.
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
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-semibold text-green-500">
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
          <Card className="bg-gradient-to-br from-green-500/5 to-primary/5 border-green-500/20">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-4">
                {competitiveAdvantages.map((advantage, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <p className="text-muted-foreground">{advantage}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
              Explosive growth backed by the $1/stream revolution
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {metrics.map((metric, idx) => (
              <Card key={idx} className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:shadow-lg transition-all">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-black text-primary mb-2">{metric.value}</div>
                  <div className="font-bold text-sm mb-1">{metric.label}</div>
                  <div className="text-xs text-muted-foreground">{metric.sublabel}</div>
                </CardContent>
              </Card>
            ))}
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
              variant={activeGraph === "pool" ? "default" : "outline"}
              onClick={() => setActiveGraph("pool")}
              className="font-semibold"
            >
              <PiggyBank className="w-4 h-4 mr-2" />
              Revenue Pool
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
                  <h3 className="text-2xl font-bold mb-6 text-center">First Year User Acquisition</h3>
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
                      <Bar yAxisId="left" dataKey="artists" fill="hsl(var(--primary))" name="Artists" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="listeners" fill="hsl(var(--secondary))" name="Listeners" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeGraph === "market" && (
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-center">Projected Market Share Growth</h3>
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
                      <Area type="monotone" dataKey="tdz" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.3)" strokeWidth={3} name="TDZ" />
                      <Area type="monotone" dataKey="spotify" stroke="#1DB954" fill="#1DB954" fillOpacity={0.2} strokeWidth={2} name="Spotify" />
                      <Area type="monotone" dataKey="apple" stroke="#FC3C44" fill="#FC3C44" fillOpacity={0.2} strokeWidth={2} name="Apple Music" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeGraph === "pool" && (
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-center">Revenue Pool Distribution</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={revenuePoolData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {revenuePoolData.map((entry, index) => (
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investment Use */}
          <h3 className="text-3xl font-display font-bold text-center mb-8">
            Investment Allocation
          </h3>
          <div className="grid md:grid-cols-5 gap-4">
            {investmentUse.map((item, idx) => (
              <Card key={idx} className="bg-gradient-to-b from-primary/5 to-transparent border-primary/20 hover:shadow-lg hover:shadow-primary/10 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-black text-primary mb-2">{item.amount}</div>
                  <div className="font-bold text-sm mb-2">{item.area}</div>
                  <div className="text-xs text-muted-foreground">{item.purpose}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-primary/10" />
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30 px-6 py-3 text-lg mb-8">
            <Rocket className="w-6 h-6 mr-3 inline" />
            JOIN THE REVOLUTION
          </Badge>
          <h2 className="text-4xl md:text-6xl font-display font-black mb-6">
            Be Part of the
            <span className="block bg-gradient-to-r from-green-500 via-emerald-500 to-primary bg-clip-text text-transparent">
              $1 Per Stream Revolution
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            We're raising $10M to scale the platform that will change how artists get paid forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-green-500 via-emerald-500 to-primary text-lg px-12 h-16 hover:scale-105 transition-transform">
              Request Investor Deck
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/")} className="text-lg px-12 h-16">
              Explore Platform
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-8">
            Contact: invest@thirtydarkzero.com
          </p>
        </div>
      </section>
    </div>
  );
}
