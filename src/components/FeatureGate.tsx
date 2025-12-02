import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, FeatureKey, SubscriptionPlan } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

const PLAN_PRICES: Record<SubscriptionPlan, string> = {
  free: "$0",
  starter: "$9.99",
  pro: "$19.99",
  enterprise: "$49.99",
  fan: "$12",
};

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  free: "bg-muted",
  starter: "bg-primary/20 text-primary border-primary/30",
  pro: "bg-secondary/20 text-secondary border-secondary/30",
  enterprise: "bg-accent/20 text-accent border-accent/30",
  fan: "bg-green-500/20 text-green-500 border-green-500/30",
};

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: FeatureGateProps) {
  const { user } = useAuth();
  const { hasFeature, getRequiredPlanForFeature, getPlan } = useSubscription(user);
  const navigate = useNavigate();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const requiredPlan = getRequiredPlanForFeature(feature);
  const currentPlan = getPlan();

  return (
    <Card className="glass-card p-6 md:p-8 text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
      <div className="relative z-10 space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        
        <h3 className="text-xl font-bold">Upgrade Required</h3>
        
        <p className="text-muted-foreground max-w-md mx-auto">
          This feature requires the{" "}
          <span className="font-semibold text-foreground">
            {requiredPlan?.charAt(0).toUpperCase()}{requiredPlan?.slice(1)} Plan
          </span>{" "}
          or higher.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Badge className={PLAN_COLORS[currentPlan]}>
            Current: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </Badge>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          {requiredPlan && (
            <Badge className={PLAN_COLORS[requiredPlan]}>
              <Crown className="w-3 h-3 mr-1" />
              {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} {PLAN_PRICES[requiredPlan]}/mo
            </Badge>
          )}
        </div>

        <Button 
          onClick={() => navigate("/pricing")}
          className="bg-gradient-to-r from-primary to-secondary"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade Now
        </Button>
      </div>
    </Card>
  );
}

// Hook version for conditional rendering
export function useFeatureAccess() {
  const { user } = useAuth();
  const subscription = useSubscription(user);

  return {
    ...subscription,
    canAccess: (feature: FeatureKey) => subscription.hasFeature(feature),
  };
}
