import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Music, Sparkles, Star, Zap, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, SubscriptionPlan } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";

interface PlanConfig {
  name: string;
  price: string;
  priceAmount: number;
  description: string;
  features: string[];
  icon: typeof Crown;
  popular?: boolean;
  planType: SubscriptionPlan;
  audience: 'artist' | 'fan';
}

const ARTIST_PLANS: PlanConfig[] = [
  {
    name: "Free",
    price: "$0",
    priceAmount: 0,
    description: "Get started with basic features",
    features: [
      "Upload up to 3 tracks",
      "1 album maximum",
      "Basic analytics",
      "Standard audio quality",
    ],
    icon: Music,
    planType: "free",
    audience: 'artist',
  },
  {
    name: "Starter",
    price: "$9.99",
    priceAmount: 999,
    description: "For emerging artists",
    features: [
      "Upload up to 50 tracks",
      "5 albums maximum",
      "Advanced analytics",
      "HD audio quality",
      "1 AI video per month",
      "Priority support",
    ],
    icon: Star,
    planType: "starter",
    audience: 'artist',
  },
  {
    name: "Pro",
    price: "$19.99",
    priceAmount: 1999,
    description: "For professional artists",
    features: [
      "Unlimited tracks",
      "Unlimited albums",
      "Full analytics suite",
      "Dolby Atmos support",
      "5 AI videos per month",
      "Collaboration tools",
      "Custom branding",
    ],
    icon: Sparkles,
    popular: true,
    planType: "pro",
    audience: 'artist',
  },
  {
    name: "Enterprise",
    price: "$49.99",
    priceAmount: 4999,
    description: "For labels & managers",
    features: [
      "Everything in Pro",
      "Unlimited AI videos",
      "Multi-artist management",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "White-label options",
    ],
    icon: Crown,
    planType: "enterprise",
    audience: 'artist',
  },
];

const FAN_PLAN: PlanConfig = {
  name: "Fan",
  price: "$12",
  priceAmount: 1200,
  description: "Unlimited music streaming",
  features: [
    "Unlimited streaming",
    "HD & Dolby Atmos audio",
    "Offline downloads",
    "Ad-free experience",
    "Exclusive content access",
    "Support your favorite artists",
  ],
  icon: Zap,
  planType: "fan",
  audience: 'fan',
};

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPlan, loading: subLoading } = useSubscription(user);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<'artist' | 'fan'>('artist');

  const currentPlan = user ? getPlan() : 'free';

  const handleSelectPlan = async (plan: PlanConfig) => {
    if (!user) {
      navigate(`/auth?plan=${plan.planType}`);
      return;
    }

    if (plan.planType === 'free') {
      toast.info("You're already on the free plan");
      return;
    }

    if (plan.planType === currentPlan) {
      toast.info(`You're already subscribed to the ${plan.name} plan`);
      return;
    }

    // For paid plans, redirect to checkout
    navigate(`/checkout?plan=${plan.planType}`);
  };

  const displayPlans = selectedAudience === 'artist' ? ARTIST_PLANS : [FAN_PLAN];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <img src={tdzLogo} alt="TDZ" className="h-8 w-auto" style={{ mixBlendMode: 'screen' }} />
            </button>
          </div>
          {!user && (
            <Button onClick={() => navigate("/auth")} variant="outline">
              Sign In
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black glow-text mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of artists and fans on the platform that pays $1 per stream
          </p>
        </div>

        {/* Audience Toggle */}
        <div className="flex justify-center mb-8">
          <div className="glass-card p-1 rounded-lg flex gap-1">
            <Button
              variant={selectedAudience === 'artist' ? 'default' : 'ghost'}
              onClick={() => setSelectedAudience('artist')}
              className="px-6"
            >
              <Music className="w-4 h-4 mr-2" />
              For Artists
            </Button>
            <Button
              variant={selectedAudience === 'fan' ? 'default' : 'ghost'}
              onClick={() => setSelectedAudience('fan')}
              className="px-6"
            >
              <Zap className="w-4 h-4 mr-2" />
              For Fans
            </Button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className={`grid gap-6 ${selectedAudience === 'artist' ? 'md:grid-cols-2 lg:grid-cols-4' : 'max-w-md mx-auto'}`}>
          {displayPlans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.planType;
            const isProcessing = processingPlan === plan.planType;

            return (
              <Card
                key={plan.planType}
                className={`glass-card-premium relative overflow-hidden transition-all hover:shadow-glow ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-black glow-text">{plan.price}</span>
                    {plan.priceAmount > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? 'shadow-glow' : ''}`}
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isProcessing || isCurrentPlan}
                  >
                    {isProcessing ? (
                      "Processing..."
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : plan.priceAmount === 0 ? (
                      "Get Started"
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Credit card required for paid plans. Cancel anytime.
          </p>
          <Button variant="link" onClick={() => navigate("/faq")} className="mt-2">
            Have questions? Check our FAQ
          </Button>
        </div>
      </main>
    </div>
  );
}
