import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Music, Sparkles, Star, Zap, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, SubscriptionPlan } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { openStripeCheckout, isCheckoutPlan } from "@/lib/subscription-checkout";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAudience?: 'artist' | 'fan';
}

interface PlanConfig {
  name: string;
  price: string;
  priceAmount: number;
  features: string[];
  icon: typeof Crown;
  popular?: boolean;
  planType: SubscriptionPlan;
}

const ARTIST_PLANS: PlanConfig[] = [
  {
    name: "Free",
    price: "$0",
    priceAmount: 0,
    features: ["3 tracks", "1 album", "Basic analytics"],
    icon: Music,
    planType: "free",
  },
  {
    name: "Starter",
    price: "$9.99",
    priceAmount: 999,
    features: ["50 tracks", "5 albums", "HD audio", "1 AI video/mo"],
    icon: Star,
    planType: "starter",
  },
  {
    name: "Pro",
    price: "$19.99",
    priceAmount: 1999,
    features: ["Unlimited tracks", "Dolby Atmos", "5 AI videos/mo"],
    icon: Sparkles,
    popular: true,
    planType: "pro",
  },
  {
    name: "Enterprise",
    price: "$49.99",
    priceAmount: 4999,
    features: ["Everything in Pro", "Unlimited AI", "API access"],
    icon: Crown,
    planType: "enterprise",
  },
];

const FAN_PLAN: PlanConfig = {
  name: "Participant",
  price: "$12",
  priceAmount: 1200,
  features: ["Immersive listening", "HD & Dolby Atmos", "Offline exploration", "Ad-free experience"],
  icon: Zap,
  planType: "fan",
};

export function SubscriptionModal({ open, onOpenChange, defaultAudience = 'fan' }: SubscriptionModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPlan } = useSubscription(user);
  const [selectedAudience, setSelectedAudience] = useState<'artist' | 'fan'>(defaultAudience);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const currentPlan = user ? getPlan() : 'free';
  const displayPlans = selectedAudience === 'artist' ? ARTIST_PLANS : [FAN_PLAN];

  const handleSelectPlan = async (plan: PlanConfig) => {
    if (!user) {
      onOpenChange(false);
      navigate(`/auth?plan=${plan.planType}`);
      return;
    }

    if (plan.planType === 'free' || plan.planType === currentPlan) {
      return;
    }

    if (isCheckoutPlan(plan.planType)) {
      openStripeCheckout(plan.planType);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass-card-premium border-primary/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-2xl font-black">
            Join the Movement
          </DialogTitle>
          <DialogDescription>
            Support artists directly with $1 per stream — be part of stories that matter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Audience Toggle */}
          <div className="flex justify-center">
            <div className="glass-card p-1 rounded-lg flex gap-1">
              <Button
                variant={selectedAudience === 'artist' ? 'default' : 'ghost'}
                onClick={() => setSelectedAudience('artist')}
                size="sm"
                className="px-4"
              >
                <Music className="w-4 h-4 mr-2" />
                Artist
              </Button>
              <Button
                variant={selectedAudience === 'fan' ? 'default' : 'ghost'}
                onClick={() => setSelectedAudience('fan')}
                size="sm"
                className="px-4"
              >
                <Zap className="w-4 h-4 mr-2" />
                Participant
              </Button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className={cn(
            "grid gap-3",
            selectedAudience === 'artist' ? 'grid-cols-2 lg:grid-cols-4' : 'max-w-xs mx-auto'
          )}>
            {displayPlans.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlan === plan.planType;
              const isProcessing = processingPlan === plan.planType;

              return (
                <div
                  key={plan.planType}
                  className={cn(
                    "glass-card p-4 rounded-xl relative transition-all cursor-pointer hover:ring-2 hover:ring-primary/50",
                    plan.popular && "ring-2 ring-primary",
                    isCurrentPlan && "opacity-60 cursor-default"
                  )}
                  onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-xs">
                      Popular
                    </Badge>
                  )}
                  
                  <div className="text-center space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">{plan.name}</h3>
                      <div className="text-xl font-black text-primary">{plan.price}</div>
                      {plan.priceAmount > 0 && (
                        <span className="text-xs text-muted-foreground">/month</span>
                      )}
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs">
                        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn(
                      "w-full mt-3",
                      plan.popular && "shadow-glow"
                    )}
                    size="sm"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    disabled={isProcessing || isCurrentPlan}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      "Current"
                    ) : (
                      "Select"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Continue with preview option */}
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              Continue with previews
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Cancel anytime. No commitment required.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
