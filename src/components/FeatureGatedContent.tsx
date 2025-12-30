import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, FeatureKey, SubscriptionPlan } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface FeatureGatedContentProps {
  feature: FeatureKey;
  children: ReactNode;
  fallbackMessage?: string;
  inline?: boolean; // For inline content like buttons
}

const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  free: "Free",
  starter: "Starter ($9.99/mo)",
  pro: "Pro ($19.99/mo)",
  enterprise: "Enterprise ($49.99/mo)",
  fan: "Fan ($12/mo)",
};

export function FeatureGatedContent({ 
  feature, 
  children, 
  fallbackMessage,
  inline = false 
}: FeatureGatedContentProps) {
  const { user } = useAuth();
  const { hasFeature, getRequiredPlanForFeature } = useSubscription(user);
  const navigate = useNavigate();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const requiredPlan = getRequiredPlanForFeature(feature);
  const planName = requiredPlan ? PLAN_NAMES[requiredPlan] : "a paid plan";

  const handleUpgrade = () => {
    if (!user) {
      toast.info("Please sign in first");
      navigate("/auth");
      return;
    }
    navigate("/pricing");
    toast.info(`Upgrade to ${planName} to unlock this feature`);
  };

  if (inline) {
    return (
      <Button
        variant="outline"
        onClick={handleUpgrade}
        className="gap-2 border-primary/30 text-muted-foreground"
      >
        <Lock className="w-4 h-4" />
        {fallbackMessage || "Upgrade to unlock"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 opacity-60">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Lock className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        {fallbackMessage || `Requires ${planName}`}
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={handleUpgrade}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Upgrade
      </Button>
    </div>
  );
}

// Hook to check if user can access a feature
export function useFeatureCheck() {
  const { user } = useAuth();
  const { hasFeature, getPlan, getRequiredPlanForFeature } = useSubscription(user);
  const navigate = useNavigate();

  const checkAndPrompt = (feature: FeatureKey, message?: string): boolean => {
    if (hasFeature(feature)) {
      return true;
    }

    const requiredPlan = getRequiredPlanForFeature(feature);
    const planName = requiredPlan ? PLAN_NAMES[requiredPlan] : "a paid plan";
    
    toast.error(message || `This feature requires ${planName}`, {
      action: {
        label: "Upgrade",
        onClick: () => navigate("/pricing"),
      },
    });
    
    return false;
  };

  return { checkAndPrompt, hasFeature, getPlan };
}
