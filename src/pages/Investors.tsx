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
import { StudioPhoneMockups, MusicPlayerPhoneMockups, DiscoveryPhoneMockups } from "@/components/StudioPhoneMockup";
import { LineChart as RechartsLine, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Investors() {
  const navigate = useNavigate();
  const [activeGraph, setActiveGraph] = useState("revenue");

  // Financial projection data - $200M by Year 5
  const revenueData = [
    { year: "Year 1", revenue: 8, streams: 6, profit: 2, arps: 1.33 },
    { year: "Year 2", revenue: 20, streams: 15, profit: 5, arps: 1.33 },
    { year: "Year 3", revenue: 45, streams: 38, profit: 7, arps: 1.18 },
    { year: "Year 4", revenue: 70, streams: 55, profit: 15, arps: 1.27 },
    { year: "Year 5", revenue: 200, streams: 150, profit: 50, arps: 1.33 }
  ];

  const yearlyBreakdown = [
    { year: "Year 1", target: "$8M", maxStreams: "6M", cumulative: "$8M", arps: "$1.33" },
    { year: "Year 2", target: "$20M", maxStreams: "15M", cumulative: "$28M", arps: "$1.33" },
    { year: "Year 3", target: "$45M", maxStreams: "38M", cumulative: "$73M", arps: "$1.18" },
    { year: "Year 4", target: "$70M", maxStreams: "55M", cumulative: "$143M", arps: "$1.27" },
    { year: "Year 5", target: "$200M", maxStreams: "150M", cumulative: "$200M+", arps: "$1.33" }
  ];

  const revenueStreamsYear5 = [
    { source: "Artist Subscriptions", amount: "$120M", detail: "400K artists × $25/mo" },
    { source: "Fan Subscriptions", amount: "$144M", detail: "1M fans × $12/mo" },
    { source: "Ads Revenue", amount: "$20M", detail: "3-5M free users" },
    { source: "Premium AI Tools", amount: "$18M", detail: "150K pro users × $10/mo" },
    { source: "Marketplace Fees", amount: "$5M", detail: "Sync, collabs, gigs" },
    { source: "Download Fees", amount: "$1.8M", detail: "1M downloads × $0.15 fee" },
    { source: "Sponsorships", amount: "$6M", detail: "Brand partnerships" }
  ];

  const marketShareData = [
    { year: "2024", tdz: 0.5, spotify: 31, apple: 15, amazon: 13, others: 40.5 },
    { year: "2025", tdz: 2.8, spotify: 30, apple: 14.5, amazon: 12.5, others: 40.2 },
    { year: "2026", tdz: 6.2, spotify: 29, apple: 14, amazon: 12, others: 38.8 },
    { year: "2027", tdz: 11.5, spotify: 28, apple: 13.5, amazon: 11.5, others: 35.5 },
    { year: "2028", tdz: 18.3, spotify: 27, apple: 13, amazon: 11, others: 30.7 }
  ];

  const revenuePoolData = [
    { name: "Fan Subscriptions", value: 46, color: "hsl(var(--primary))" },
    { name: "Artist Subscriptions", value: 38, color: "hsl(var(--secondary))" },
    { name: "Ads & Sponsors", value: 8, color: "hsl(var(--accent))" },
    { name: "Premium AI Tools", value: 6, color: "hsl(var(--chart-1))" },
    { name: "Downloads & Other", value: 2, color: "hsl(var(--chart-2))" }
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
    { label: "Year 5 Revenue", value: "$200M+", sublabel: "With $314M total pool capacity" },
    { label: "Target ARPS", value: "$1.35", sublabel: "Average Revenue Per Stream" },
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
      {/* Hero Section - The Crisis - PHP Admin Box Pattern */}
      <section className="relative py-16 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--destructive)/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* PHP Admin Header Bar */}
          <div className="flex items-center justify-between mb-8 p-4 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
            <img src={tdzLogo} alt="TDZ" className="h-10 w-auto" />
            <div className="flex items-center gap-3">
              <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                Investor Portal
              </Badge>
              <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </div>
          </div>

          {/* Hero Content Box */}
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden mb-8">
            {/* Title Bar */}
            <div className="px-6 py-4 border-b border-border/50 bg-destructive/5 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-wide text-destructive">The Music Industry is Broken</span>
            </div>
            {/* Content */}
            <div className="p-8 md:p-12 text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-display font-black leading-tight">
                ARTISTS EARN
                <span className="block bg-gradient-to-r from-destructive via-orange-500 to-red-600 bg-clip-text text-transparent mt-2">
                  $0.003 PER STREAM
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Artists need 250,000 streams just to earn $750. Meanwhile, platforms like Spotify profit billions. TDZ changes everything with <span className="text-green-500 font-bold">$1 per stream</span>.
              </p>
            </div>
          </div>

          {/* Comparison Cards - PHP Admin Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: TrendingDown, value: "$0.003", label: "Spotify Payout", sub: "Per stream average", color: "destructive", bg: "from-destructive/10 to-destructive/5" },
              { icon: DollarSign, value: "$1.00", label: "TDZ Payout", sub: "Per stream guaranteed", color: "green-500", bg: "from-green-500/10 to-green-500/5" },
              { icon: TrendingUp, value: "333x", label: "Higher Payout", sub: "vs industry average", color: "primary", bg: "from-primary/10 to-primary/5" },
              { icon: Download, value: "100%", label: "Download Revenue", sub: "Goes to artist", color: "secondary", bg: "from-secondary/10 to-secondary/5" }
            ].map((stat, idx) => (
              <div key={idx} className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-primary/50 transition-all group">
                <div className={`px-4 py-3 border-b border-border/30 bg-gradient-to-r ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                </div>
                <div className="p-4 text-center">
                  <div className={`text-2xl md:text-3xl font-black text-${stat.color} mb-1`}>
                    {stat.value}
                  </div>
                  <div className="font-semibold text-sm">{stat.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Solution Box - PHP Admin Pattern */}
          <div className="rounded-xl border border-green-500/40 bg-gradient-to-br from-green-500/5 via-primary/5 to-secondary/5 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-green-500/30 bg-green-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-green-500">THE $1 PER STREAM REVOLUTION</span>
              </div>
              <Badge className="bg-green-500 text-background">Solution</Badge>
            </div>
            <div className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-5xl font-display font-black mb-6">
                <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-primary bg-clip-text text-transparent">
                  THIRTY DARK ZERO RECORDS
                </span>
              </h2>
              <p className="text-lg md:text-xl text-foreground max-w-4xl mx-auto leading-relaxed mb-8">
                We pay artists <span className="font-black text-green-500">$1.00 per stream</span>. Artists set their own download prices and keep <span className="font-black text-secondary">100% of download revenue</span>. AI music is welcome. The future of music is here.
              </p>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { value: "$1.00", label: "Per Stream" },
                  { value: "100%", label: "Download Revenue" },
                  { value: "AI+Human", label: "Both Welcome" },
                  { value: "100%", label: "Rights Retained" }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-card/50 border border-border/30">
                    <div className="text-2xl md:text-3xl font-black text-green-500">{item.value}</div>
                    <div className="text-sm font-medium text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TAM / SAM / SOM Market Opportunity - PHP Admin Box Pattern */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          {/* Section Header Box */}
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-border/50 bg-blue-500/10 flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-500 uppercase tracking-wide">Market Opportunity</span>
            </div>
            <div className="p-6 text-center">
              <h2 className="text-3xl md:text-4xl font-display font-black mb-3">
                $100B+ Market Opportunity
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The global music streaming market is exploding—and independent + AI music is the fastest-growing segment.
              </p>
            </div>
          </div>

          {/* TAM / SAM / SOM Cards - PHP Admin Box Pattern */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { abbr: "TAM", label: "Total Addressable Market", value: "$106B", desc: "Global Music Streaming (2029)", color: "blue", icon: Globe, stats: [{ l: "2024:", v: "$43.7B" }, { l: "2029:", v: "$106.6B" }, { l: "CAGR:", v: "19.5%" }] },
              { abbr: "SAM", label: "Serviceable Addressable Market", value: "$38B", desc: "Independent + AI Music (2029)", color: "purple", icon: Target, stats: [{ l: "Independent:", v: "$26B (2029)" }, { l: "AI Music:", v: "$12B (2029)" }, { l: "Combined CAGR:", v: "28%" }] },
              { abbr: "SOM", label: "Serviceable Obtainable Market", value: "$2.5B", desc: "TDZ Target (Year 5)", color: "green", icon: Rocket, stats: [{ l: "Market Share:", v: "6.5% of SAM" }, { l: "Artists:", v: "400K+ creators" }, { l: "Fans:", v: "5M+ subscribers" }] }
            ].map((item, idx) => (
              <div key={idx} className={`rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-${item.color}-500/50 transition-all`}>
                <div className={`px-4 py-3 border-b border-border/30 bg-${item.color}-500/10 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-5 h-5 text-${item.color}-500`} />
                    <span className={`text-sm font-semibold text-${item.color}-500`}>{item.abbr}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <div className="p-6 text-center">
                  <div className={`text-4xl md:text-5xl font-black text-${item.color}-500 mb-2`}>{item.value}</div>
                  <p className="text-sm text-muted-foreground mb-4">{item.desc}</p>
                  <div className="pt-4 border-t border-border/30 text-left space-y-2">
                    {item.stats.map((stat, sIdx) => (
                      <p key={sIdx} className="text-xs flex justify-between">
                        <span className={`text-${item.color}-400`}>{stat.l}</span>
                        <span className="font-medium">{stat.v}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Market Growth Timeline */}
          <Card className="bg-card/50 backdrop-blur border-border/50 mb-12">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-center mb-8">Global Music Market 5-Year Projection</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { year: "2024", total: 43.7, independent: 12.5, ai: 1.2 },
                    { year: "2025", total: 52.2, independent: 15.8, ai: 2.8 },
                    { year: "2026", total: 62.4, independent: 19.2, ai: 5.1 },
                    { year: "2027", total: 74.5, independent: 22.8, ai: 7.8 },
                    { year: "2028", total: 89.0, independent: 26.5, ai: 10.2 },
                    { year: "2029", total: 106.6, independent: 30.8, ai: 12.4 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}B`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      formatter={(value: number) => [`$${value}B`, '']}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="total" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.3)" name="Total Market" />
                    <Area type="monotone" dataKey="independent" stackId="2" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1)/0.5)" name="Independent Music" />
                    <Area type="monotone" dataKey="ai" stackId="3" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2)/0.5)" name="AI Music" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Independent + AI Music Details */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/30">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Music className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Independent Music</h3>
                    <p className="text-sm text-muted-foreground">The fastest-growing segment</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-orange-500/20">
                    <span className="text-muted-foreground">2024 Market Size</span>
                    <span className="font-bold text-orange-500">$12.5B</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-orange-500/20">
                    <span className="text-muted-foreground">2029 Projected</span>
                    <span className="font-bold text-orange-500">$30.8B</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-orange-500/20">
                    <span className="text-muted-foreground">CAGR</span>
                    <span className="font-bold text-orange-500">19.8%</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-orange-500/20">
                    <span className="text-muted-foreground">Share of Total Streams</span>
                    <span className="font-bold text-orange-500">35%+ by 2029</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-muted-foreground">Active Independent Artists</span>
                    <span className="font-bold text-orange-500">120M+ globally</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-orange-500/10 rounded-lg">
                  <p className="text-sm text-orange-200">
                    <strong>Key Insight:</strong> Independent artists are leaving major labels at record rates. They want higher payouts, ownership, and direct fan relationships—exactly what TDZ offers.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/30">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">AI-Generated Music</h3>
                    <p className="text-sm text-muted-foreground">The next frontier</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-cyan-500/20">
                    <span className="text-muted-foreground">2024 Market Size</span>
                    <span className="font-bold text-cyan-500">$1.2B</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-cyan-500/20">
                    <span className="text-muted-foreground">2029 Projected</span>
                    <span className="font-bold text-cyan-500">$12.4B</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-cyan-500/20">
                    <span className="text-muted-foreground">CAGR</span>
                    <span className="font-bold text-cyan-500">59.4%</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-cyan-500/20">
                    <span className="text-muted-foreground">AI Tracks on DSPs (2024)</span>
                    <span className="font-bold text-cyan-500">100M+ tracks</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-muted-foreground">Daily AI Track Uploads</span>
                    <span className="font-bold text-cyan-500">150K+ per day</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-cyan-500/10 rounded-lg">
                  <p className="text-sm text-cyan-200">
                    <strong>First-Mover Advantage:</strong> TDZ is the ONLY platform paying AI artists $1/stream. While competitors ban or throttle AI music, we embrace it—capturing a $12B+ market.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Why TDZ Wins */}
          <Card className="bg-gradient-to-br from-green-500/10 via-primary/5 to-secondary/10 border-green-500/30">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-center mb-6">Why TDZ Captures This Market</h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-green-500 mb-2">$1.00</div>
                  <p className="text-sm font-semibold mb-1">Per Stream</p>
                  <p className="text-xs text-muted-foreground">333x more than Spotify attracts top indie talent</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-500 mb-2">100%</div>
                  <p className="text-sm font-semibold mb-1">Rights Retention</p>
                  <p className="text-xs text-muted-foreground">Artists keep full ownership of their music</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-cyan-500 mb-2">AI = Human</div>
                  <p className="text-sm font-semibold mb-1">Equal Treatment</p>
                  <p className="text-xs text-muted-foreground">AI artists earn the same $1/stream payout</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-orange-500 mb-2">Direct</div>
                  <p className="text-sm font-semibold mb-1">No Middlemen</p>
                  <p className="text-xs text-muted-foreground">Artist-to-fan, no label gatekeeping</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* THE GOLDEN RULE Section */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-green-500/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-4 py-2 mb-4">
              <Star className="w-4 h-4 mr-2 inline" />
              THE GOLDEN RULE
            </Badge>
            <h2 className="text-4xl md:text-6xl font-display font-black mb-4">
              ARPS &gt; $1.00
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Average Revenue Per Stream must always exceed $1.00 to stay profitable. TDZ achieves this through diversified revenue streams.
            </p>
          </div>

          <Card className="bg-gradient-to-br from-green-500/10 via-primary/5 to-secondary/10 border-green-500/30 mb-12">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">The Profit Formula</h3>
              <div className="text-3xl md:text-4xl font-mono font-black text-green-500 mb-4">
                Profit = (Total Revenue) – (Total Streams × $1)
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                You win when: <span className="text-green-500 font-bold">ARPS &gt; $1.00</span>
              </p>
              <div className="mt-6 p-4 bg-background/50 rounded-lg inline-block">
                <p className="text-sm">Most streaming platforms generate <span className="font-bold">$1.40–$3.00</span> revenue per user per month.</p>
                <p className="text-sm text-green-500 font-semibold mt-2">TDZ generates much more through downloads, AI tools, and subscriptions.</p>
              </div>
            </CardContent>
          </Card>

          {/* Year-by-Year Revenue Goals */}
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-2">$200 Million Revenue by Year 5</h3>
            <p className="text-muted-foreground">40-50% annual growth curve – exactly what investors want</p>
          </div>

          <div className="grid lg:grid-cols-5 gap-4 mb-12">
            {yearlyBreakdown.map((year, idx) => (
              <Card key={idx} className={`${idx === 4 ? 'bg-gradient-to-br from-green-500/20 to-primary/20 border-green-500/40' : 'bg-card/50 border-border/50'}`}>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">{year.year}</p>
                  <p className="text-3xl font-black text-green-500 mb-1">{year.target}</p>
                  <p className="text-xs text-muted-foreground">Revenue Target</p>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm font-medium">{year.maxStreams} streams</p>
                    <p className="text-xs text-primary">ARPS: {year.arps}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Streams Breakdown */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  Year 5 Revenue Streams
                </h3>
                <div className="space-y-4">
                  {revenueStreamsYear5.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.source}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <p className="text-xl font-black text-green-500">{item.amount}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-4 bg-green-500/20 rounded-lg border border-green-500/40">
                    <p className="text-lg font-bold">Total Revenue Capacity</p>
                    <p className="text-2xl font-black text-green-500">$314M</p>
                  </div>
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
                    { title: "Multiple Revenue Streams", desc: "Diversified income reduces risk" },
                    { title: "Controlled Stream Volume", desc: "TDZ streams ramp slower than Spotify, giving room to scale" }
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

          {/* Streaming Cost vs Revenue */}
          <Card className="bg-gradient-to-br from-card/80 to-card/60 border-green-500/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Streaming Cost Model</h3>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                {[
                  { streams: "10M", payout: "$10M", revenue: "$13.5M", profit: "$3.5M" },
                  { streams: "50M", payout: "$50M", revenue: "$67.5M", profit: "$17.5M" },
                  { streams: "100M", payout: "$100M", revenue: "$135M", profit: "$35M" },
                  { streams: "200M", payout: "$200M", revenue: "$270M", profit: "$70M" }
                ].map((item, idx) => (
                  <div key={idx} className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-2xl font-black text-primary mb-1">{item.streams}</p>
                    <p className="text-xs text-muted-foreground mb-3">Streams</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-destructive">Payout:</span> {item.payout}</p>
                      <p><span className="text-green-500">Revenue:</span> {item.revenue}</p>
                      <p className="font-bold text-green-500">Profit: {item.profit}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="text-lg font-semibold">At ARPS = $1.35, TDZ can support <span className="text-green-500 font-black">200M+ streams annually</span> while generating <span className="text-green-500 font-black">$300M+ revenue</span></p>
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

      {/* Fan Discovery Demo */}
      <MusicPlayerPhoneMockups />
      
      {/* Global Library Demo */}
      <DiscoveryPhoneMockups />

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

      {/* Investor Summary */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-green-500/10 via-primary/5 to-secondary/10 border-green-500/40">
            <CardContent className="p-8 md:p-12">
              <div className="text-center mb-6">
                <Badge className="bg-green-500 text-background px-4 py-2 mb-4">
                  INVESTOR SUMMARY
                </Badge>
              </div>
              <blockquote className="text-lg md:text-xl leading-relaxed text-center italic mb-8">
                "TDZ generates an average of <span className="text-green-500 font-bold not-italic">$1.35–$1.80</span> per stream in revenue from subscriptions, ads, premium tools, and marketplace activity. We pay artists <span className="text-green-500 font-bold not-italic">$1.00</span> per stream. The margin between ARPS and artist payout ensures profitability even at high streaming volume."
              </blockquote>
              <p className="text-center text-lg text-muted-foreground">
                "At scale, TDZ can support <span className="text-green-500 font-semibold">200M+ streams annually</span> while generating <span className="text-green-500 font-semibold">$300M+ revenue</span> and paying artists fairly."
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-green-500/20">
                <div className="text-center">
                  <p className="text-3xl font-black text-green-500">$314M</p>
                  <p className="text-sm text-muted-foreground">Year 5 Revenue Pool</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-primary">40-50%</p>
                  <p className="text-sm text-muted-foreground">Annual Growth Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-secondary">$200M+</p>
                  <p className="text-sm text-muted-foreground">Year 5 Target</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
