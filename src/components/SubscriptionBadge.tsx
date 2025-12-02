import { useAuth } from "@/hooks/useAuth";
import { useSubscription, SubscriptionPlan } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Star, Zap, Music } from "lucide-react";

const PLAN_CONFIG: Record<SubscriptionPlan, {
  label: string;
  icon: typeof Crown;
  className: string;
}> = {
  free: {
    label: "Free",
    icon: Music,
    className: "bg-muted text-muted-foreground",
  },
  starter: {
    label: "Starter",
    icon: Star,
    className: "bg-primary/20 text-primary border-primary/30",
  },
  pro: {
    label: "Pro",
    icon: Sparkles,
    className: "bg-gradient-to-r from-secondary/20 to-accent/20 text-secondary border-secondary/30",
  },
  enterprise: {
    label: "Enterprise",
    icon: Crown,
    className: "bg-gradient-to-r from-accent/20 to-primary/20 text-accent border-accent/30",
  },
  fan: {
    label: "Fan",
    icon: Zap,
    className: "bg-green-500/20 text-green-500 border-green-500/30",
  },
};

interface SubscriptionBadgeProps {
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SubscriptionBadge({ showIcon = true, size = "md" }: SubscriptionBadgeProps) {
  const { user } = useAuth();
  const { getPlan, loading } = useSubscription(user);

  if (loading || !user) return null;

  const plan = getPlan();
  const config = PLAN_CONFIG[plan];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <Badge className={`${config.className} ${sizeClasses[size]}`}>
      {showIcon && <Icon className={`mr-1 ${size === "sm" ? "w-3 h-3" : "w-4 h-4"}`} />}
      {config.label}
    </Badge>
  );
}
