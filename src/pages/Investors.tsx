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
  Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import tdzLogo from "@/assets/tdz-logo.png";

export default function Investors() {
  const navigate = useNavigate();

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
      title: "AI-Powered Distribution Network",
      description: "Intelligent distribution to 150+ streaming platforms with automated metadata optimization, release timing suggestions, and platform-specific formatting.",
      impact: "24-hour go-live across all platforms with AI-optimized discoverability",
      category: "Distribution"
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
    { label: "Time to Market", value: "24hrs", sublabel: "Fastest distribution" }
  ];

  const investmentUse = [
    { area: "AI & Product Development", amount: "$3M", purpose: "Enhance AI capabilities, new features, UX improvements" },
    { area: "Marketing & Growth", amount: "$2M", purpose: "User acquisition, partnerships, brand building" },
    { area: "Team Expansion", amount: "$2M", purpose: "Top talent in engineering, data science, support" },
    { area: "Infrastructure", amount: "$2M", purpose: "Scalability, security, global expansion" },
    { area: "Strategic Partnerships", amount: "$1M", purpose: "Industry integrations, distribution deals" }
  ];

  const competitiveAdvantages = [
    "Comprehensive all-in-one platform (vs. fragmented competitors)",
    "AI-first approach to every feature",
    "Focus on independent artists (largest growing segment)",
    "100% rights retention for artists",
    "Revolutionary video creation capabilities",
    "Quantum AI advisor - market exclusive"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--secondary)/0.15),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-12">
            <img src={tdzLogo} alt="TDZ" className="h-12 w-auto" />
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>

          <div className="text-center space-y-6 mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm">
              <Crown className="w-4 h-4 mr-2 inline" />
              Investment Opportunity
            </Badge>
            <h1 className="text-5xl md:text-7xl font-display font-black">
              THE FUTURE OF
              <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mt-2">
                MUSIC DISTRIBUTION
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto">
              Thirty Dark Zero Records is revolutionizing the $76.9B global music industry with AI-powered tools that empower independent artists to compete with major labels.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {metrics.map((metric, idx) => (
              <Card key={idx} className="bg-card/50 backdrop-blur border-primary/20">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl md:text-4xl font-black text-primary mb-2">
                    {metric.value}
                  </div>
                  <div className="font-semibold text-sm mb-1">{metric.label}</div>
                  <div className="text-xs text-muted-foreground">{metric.sublabel}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <CardContent className="p-8">
                <Shield className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To empower independent artists with cutting-edge AI technology and comprehensive tools that level the playing field. Inspired by "Zero Dark Thirty" military precision, we provide artists with the arsenal they need to succeed in the modern music industry.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20">
              <CardContent className="p-8">
                <Rocket className="w-12 h-12 text-secondary mb-4" />
                <h3 className="text-2xl font-bold mb-4">Market Opportunity</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The global music streaming market is projected to reach $76.9B by 2027. Independent artists represent the fastest-growing segment, seeking innovative platforms to establish their presence and connect with global audiences. We're positioned to capture significant market share.
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

      {/* Financial Projections */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-secondary/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
              Financial Projections
            </h2>
            <p className="text-xl text-muted-foreground">
              Strong revenue model with multiple streams and predictable growth
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-card/50 backdrop-blur border-primary/20">
              <CardContent className="p-6">
                <DollarSign className="w-8 h-8 text-primary mb-4" />
                <div className="text-3xl font-black mb-2">$23.1M</div>
                <div className="font-semibold mb-2">Year 1 Revenue</div>
                <div className="text-sm text-muted-foreground">
                  50,000 artists across three subscription tiers plus distribution fees
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-secondary/20">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-secondary mb-4" />
                <div className="text-3xl font-black mb-2">500K+</div>
                <div className="font-semibold mb-2">Year 5 Target</div>
                <div className="text-sm text-muted-foreground">
                  Projected artist base with 94% retention rate
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-accent/20">
              <CardContent className="p-6">
                <Zap className="w-8 h-8 text-accent mb-4" />
                <div className="text-3xl font-black mb-2">$194M+</div>
                <div className="font-semibold mb-2">Year 5 Revenue</div>
                <div className="text-sm text-muted-foreground">
                  Driven by scale, premium features, and enterprise partnerships
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6">Revenue Streams</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-primary">Subscription Tiers</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Basic ($10/mo): Distribution + basic tools</li>
                    <li>• Premium ($25/mo): Advanced features + AI insights</li>
                    <li>• Pro ($50/mo): Full suite + priority support</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-primary">Additional Revenue</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Distribution fees (per release)</li>
                    <li>• Artist management services</li>
                    <li>• Tour management commissions</li>
                    <li>• Master class partnerships</li>
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
          <div className="pt-8 text-sm text-muted-foreground">
            For investment inquiries: investors@tdzrecords.com
          </div>
        </div>
      </section>
    </div>
  );
}
