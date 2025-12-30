// Legacy hook - delegates to AuthContext for backward compatibility
import { useAuthContext, useFeatureAccess, PLAN_FEATURES, SubscriptionPlan, Subscription, FeatureKey } from "@/contexts/AuthContext";
import { User } from "@supabase/supabase-js";

export type { SubscriptionPlan, Subscription, FeatureKey };
export type SubscriptionStatus = "active" | "canceled" | "expired" | "trial";

export const useSubscription = (user: User | null) => {
  const ctx = useAuthContext();
  const features = useFeatureAccess();
  
  return {
    subscription: ctx.subscription,
    loading: ctx.isSubscriptionLoading,
    refetch: ctx.refreshSubscription,
    getPlan: () => features.plan,
    hasFeature: features.hasFeature,
    getAiVideosLimit: features.getAiVideosLimit,
    getAiVideosRemaining: features.getAiVideosRemaining,
    canUseAiVideos: features.canUseAiVideos,
    isPaidPlan: features.isPaidPlan,
    isArtistPlan: features.isArtistPlan,
    isFanPlan: features.isFanPlan,
    getPlanName: features.getPlanName,
    getRequiredPlanForFeature: (feature: FeatureKey): SubscriptionPlan | null => {
      const plans: SubscriptionPlan[] = ["starter", "pro", "enterprise"];
      for (const plan of plans) {
        if (PLAN_FEATURES[plan][feature]) return plan;
      }
      return null;
    },
    PLAN_FEATURES,
  };
};