import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise" | "fan";
export type SubscriptionStatus = "active" | "canceled" | "expired" | "trial";

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  ai_videos_used: number;
  ai_videos_reset_at: string;
  started_at: string;
  expires_at: string | null;
  canceled_at: string | null;
}

// Feature definitions per plan
const PLAN_FEATURES = {
  free: {
    uploads: false,
    basicAnalytics: false,
    advancedAnalytics: false,
    fanEngagement: false,
    downloadSales: false,
    aiVideos: 0,
    presaveCampaigns: false,
    collaborationTools: false,
    multiArtistManagement: false,
    customBranding: false,
    apiAccess: false,
    prioritySupport: false,
    dedicatedManager: false,
    unlimitedStreaming: false,
    playlists: false,
    socialFeatures: false,
  },
  starter: {
    uploads: true,
    basicAnalytics: true,
    advancedAnalytics: false,
    fanEngagement: true,
    downloadSales: true,
    aiVideos: 0,
    presaveCampaigns: false,
    collaborationTools: false,
    multiArtistManagement: false,
    customBranding: false,
    apiAccess: false,
    prioritySupport: false,
    dedicatedManager: false,
    unlimitedStreaming: false,
    playlists: false,
    socialFeatures: false,
  },
  pro: {
    uploads: true,
    basicAnalytics: true,
    advancedAnalytics: true,
    fanEngagement: true,
    downloadSales: true,
    aiVideos: 10,
    presaveCampaigns: true,
    collaborationTools: true,
    multiArtistManagement: false,
    customBranding: false,
    apiAccess: false,
    prioritySupport: true,
    dedicatedManager: false,
    unlimitedStreaming: false,
    playlists: false,
    socialFeatures: false,
  },
  enterprise: {
    uploads: true,
    basicAnalytics: true,
    advancedAnalytics: true,
    fanEngagement: true,
    downloadSales: true,
    aiVideos: -1, // unlimited
    presaveCampaigns: true,
    collaborationTools: true,
    multiArtistManagement: true,
    customBranding: true,
    apiAccess: true,
    prioritySupport: true,
    dedicatedManager: true,
    unlimitedStreaming: false,
    playlists: false,
    socialFeatures: false,
  },
  fan: {
    uploads: false,
    basicAnalytics: false,
    advancedAnalytics: false,
    fanEngagement: false,
    downloadSales: false,
    aiVideos: 0,
    presaveCampaigns: false,
    collaborationTools: false,
    multiArtistManagement: false,
    customBranding: false,
    apiAccess: false,
    prioritySupport: false,
    dedicatedManager: false,
    unlimitedStreaming: true,
    playlists: true,
    socialFeatures: true,
  },
};

export type FeatureKey = keyof typeof PLAN_FEATURES.free;

export const useSubscription = (user: User | null) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading subscription:", error);
        setSubscription(null);
      } else if (data) {
        setSubscription(data as unknown as Subscription);
      } else {
        // No subscription record - user is on free plan
        setSubscription(null);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const getPlan = (): SubscriptionPlan => {
    if (!subscription) return "free";
    if (subscription.status !== "active" && subscription.status !== "trial") return "free";
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) return "free";
    return subscription.plan;
  };

  const hasFeature = (feature: FeatureKey): boolean => {
    const plan = getPlan();
    return PLAN_FEATURES[plan][feature] as boolean;
  };

  const getAiVideosLimit = (): number => {
    const plan = getPlan();
    return PLAN_FEATURES[plan].aiVideos;
  };

  const getAiVideosRemaining = (): number => {
    const limit = getAiVideosLimit();
    if (limit === -1) return Infinity; // Unlimited
    if (limit === 0) return 0;
    
    const used = subscription?.ai_videos_used || 0;
    return Math.max(0, limit - used);
  };

  const canUseAiVideos = (): boolean => {
    return getAiVideosRemaining() > 0;
  };

  const isPaidPlan = (): boolean => {
    const plan = getPlan();
    return plan !== "free";
  };

  const isArtistPlan = (): boolean => {
    const plan = getPlan();
    return ["starter", "pro", "enterprise"].includes(plan);
  };

  const isFanPlan = (): boolean => {
    const plan = getPlan();
    return plan === "fan";
  };

  const getPlanName = (): string => {
    const plan = getPlan();
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const getRequiredPlanForFeature = (feature: FeatureKey): SubscriptionPlan | null => {
    const plans: SubscriptionPlan[] = ["starter", "pro", "enterprise"];
    for (const plan of plans) {
      if (PLAN_FEATURES[plan][feature]) {
        return plan;
      }
    }
    return null;
  };

  return {
    subscription,
    loading,
    refetch: loadSubscription,
    getPlan,
    hasFeature,
    getAiVideosLimit,
    getAiVideosRemaining,
    canUseAiVideos,
    isPaidPlan,
    isArtistPlan,
    isFanPlan,
    getPlanName,
    getRequiredPlanForFeature,
    PLAN_FEATURES,
  };
};
