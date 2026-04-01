import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export type UserRole = 
  | "artist" 
  | "listener" 
  | "verified_artist" 
  | "admin" 
  | "moderator" 
  | "user" 
  | "manager" 
  | "ceo" 
  | null;

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

export type AuthState = 
  | "loading"           // Initial state - determining auth status
  | "unauthenticated"   // No user session
  | "needs_role"        // User exists but has no role
  | "needs_profile"     // User has role but profile incomplete
  | "authenticated";    // Fully authenticated with role and profile

interface AuthContextType {
  // Core state
  user: User | null;
  session: Session | null;
  role: UserRole;
  subscription: Subscription | null;
  authState: AuthState;
  
  // Loading states
  isLoading: boolean;
  isAuthLoading: boolean;
  isRoleLoading: boolean;
  isSubscriptionLoading: boolean;
  
  // Computed helpers
  isArtist: boolean;
  isListener: boolean;
  isManager: boolean;
  isAdmin: boolean;
  plan: SubscriptionPlan;
  
  // Actions
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  
  // Refresh functions
  refreshRole: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

// ============================================================================
// Plan Features Configuration
// ============================================================================

export const PLAN_FEATURES = {
  free: {
    uploads: true,
    basicAnalytics: true,
    advancedAnalytics: false,
    fanEngagement: false,
    downloadSales: false,
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
    territoryRights: false,
    maxTracks: 3,
    maxAlbums: 1,
  },
  starter: {
    uploads: true,
    basicAnalytics: true,
    advancedAnalytics: false,
    fanEngagement: true,
    downloadSales: true,
    presaveCampaigns: false,
    collaborationTools: false,
    multiArtistManagement: false,
    customBranding: false,
    apiAccess: false,
    prioritySupport: false,
    dedicatedManager: false,
    unlimitedStreaming: false,
    playlists: true,
    socialFeatures: true,
    territoryRights: false,
    maxTracks: 50,
    maxAlbums: 5,
  },
  pro: {
    uploads: true,
    basicAnalytics: true,
    advancedAnalytics: true,
    fanEngagement: true,
    downloadSales: true,
    presaveCampaigns: true,
    collaborationTools: true,
    multiArtistManagement: false,
    customBranding: false,
    apiAccess: false,
    prioritySupport: true,
    dedicatedManager: false,
    unlimitedStreaming: false,
    playlists: true,
    socialFeatures: true,
    territoryRights: true,
    maxTracks: -1,
    maxAlbums: -1,
  },
  enterprise: {
    uploads: true,
    basicAnalytics: true,
    advancedAnalytics: true,
    fanEngagement: true,
    downloadSales: true,
    presaveCampaigns: true,
    collaborationTools: true,
    multiArtistManagement: true,
    customBranding: true,
    apiAccess: true,
    prioritySupport: true,
    dedicatedManager: true,
    unlimitedStreaming: false,
    playlists: true,
    socialFeatures: true,
    territoryRights: true,
    maxTracks: -1,
    maxAlbums: -1,
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
    territoryRights: false,
    maxTracks: 0,
    maxAlbums: 0,
  },
} as const;

export type FeatureKey = keyof typeof PLAN_FEATURES.free;

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Auth Storage Helpers
// ============================================================================

const clearAuthStorage = () => {
  try {
    for (const key of Object.keys(localStorage)) {
      const isLegacy = key === "supabase.auth.token";
      const isSupabaseAuthKey = key.startsWith("sb-") && key.includes("-auth-token");
      if (isLegacy || isSupabaseAuthKey) localStorage.removeItem(key);
    }
  } catch { /* ignore */ }

  try {
    sessionStorage.clear();
  } catch { /* ignore */ }
};

// ============================================================================
// Provider Component
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  
  // Loading states
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  
  // Prevent concurrent loads
  const loadingRoleRef = useRef(false);
  const loadingSubRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // ========== Load Role ==========
  const loadRole = useCallback(async (userId: string) => {
    if (loadingRoleRef.current && lastUserIdRef.current === userId) return;
    
    loadingRoleRef.current = true;
    lastUserIdRef.current = userId;
    setIsRoleLoading(true);

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("granted_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error loading role:", error);
        setRole(null);
      } else {
        setRole((data?.role as UserRole) ?? null);
      }
    } catch (error) {
      console.error("Error loading role:", error);
      setRole(null);
    } finally {
      loadingRoleRef.current = false;
      setIsRoleLoading(false);
    }
  }, []);

  // ========== Load Subscription ==========
  const loadSubscription = useCallback(async (userId: string) => {
    if (loadingSubRef.current) return;
    
    loadingSubRef.current = true;
    setIsSubscriptionLoading(true);

    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error loading subscription:", error);
        setSubscription(null);
      } else {
        setSubscription(data as unknown as Subscription | null);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
      setSubscription(null);
    } finally {
      loadingSubRef.current = false;
      setIsSubscriptionLoading(false);
    }
  }, []);

  // ========== Auth State Listener ==========
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsAuthLoading(false);

        // When user changes, load role and subscription
        if (newSession?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => {
            loadRole(newSession.user.id);
            loadSubscription(newSession.user.id);
          }, 0);
        } else {
          // Clear all state on sign out
          setRole(null);
          setSubscription(null);
          setIsRoleLoading(false);
          setIsSubscriptionLoading(false);
          lastUserIdRef.current = null;
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setIsAuthLoading(false);

      if (existingSession?.user) {
        loadRole(existingSession.user.id);
        loadSubscription(existingSession.user.id);
      } else {
        setIsRoleLoading(false);
        setIsSubscriptionLoading(false);
      }
    });

    return () => authSubscription.unsubscribe();
  }, [loadRole, loadSubscription]);

  // ========== Auth Actions ==========
  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    return { error };
  };

  const signOut = async () => {
    let error: unknown = null;

    try {
      const res = await supabase.auth.signOut({ scope: "local" });
      error = res.error ?? null;
    } catch (e) {
      error = e;
    } finally {
      clearAuthStorage();
      setSession(null);
      setUser(null);
      setRole(null);
      setSubscription(null);
    }

    return { error: (error as any) ?? null };
  };

  // ========== Refresh Functions ==========
  const refreshRole = useCallback(async () => {
    if (user) {
      loadingRoleRef.current = false;
      await loadRole(user.id);
    }
  }, [user, loadRole]);

  const refreshSubscription = useCallback(async () => {
    if (user) {
      loadingSubRef.current = false;
      await loadSubscription(user.id);
    }
  }, [user, loadSubscription]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshRole(), refreshSubscription()]);
  }, [refreshRole, refreshSubscription]);

  // ========== Computed Values ==========
  const isLoading = isAuthLoading || isRoleLoading || isSubscriptionLoading;
  
  const isArtist = role === "artist" || role === "verified_artist";
  const isListener = role === "listener";
  const isManager = role === "manager";
  const isAdmin = role === "admin" || role === "ceo";
  
  const plan: SubscriptionPlan = (() => {
    // CEO always has enterprise
    if (user?.email === 'info@thirtydarkzero.com') return "enterprise";
    if (!subscription) return "free";
    if (subscription.status !== "active" && subscription.status !== "trial") return "free";
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) return "free";
    return subscription.plan;
  })();

  const authState: AuthState = (() => {
    if (isAuthLoading || isRoleLoading) return "loading";
    if (!user) return "unauthenticated";
    if (!role) return "needs_role";
    return "authenticated";
  })();

  // ========== Context Value ==========
  const value: AuthContextType = {
    user,
    session,
    role,
    subscription,
    authState,
    
    isLoading,
    isAuthLoading,
    isRoleLoading,
    isSubscriptionLoading,
    
    isArtist,
    isListener,
    isManager,
    isAdmin,
    plan,
    
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    
    refreshRole,
    refreshSubscription,
    refreshAll,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

// ============================================================================
// Feature Access Hook
// ============================================================================

export function useFeatureAccess() {
  const { plan, subscription, user } = useAuthContext();
  
  const hasFeature = (feature: FeatureKey): boolean => {
    return PLAN_FEATURES[plan][feature] as boolean;
  };

  const getAiVideosLimit = (): number => {
    return PLAN_FEATURES[plan].aiVideos;
  };

  const getAiVideosRemaining = (): number => {
    const limit = getAiVideosLimit();
    if (limit === -1) return Infinity;
    if (limit === 0) return 0;
    const used = subscription?.ai_videos_used || 0;
    return Math.max(0, limit - used);
  };

  const canUseAiVideos = (): boolean => {
    return getAiVideosRemaining() > 0;
  };

  const isPaidPlan = (): boolean => {
    return plan !== "free";
  };

  const isArtistPlan = (): boolean => {
    return ["starter", "pro", "enterprise"].includes(plan);
  };

  const isFanPlan = (): boolean => {
    return plan === "fan";
  };

  const getPlanName = (): string => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const getMaxTracks = (): number => {
    return PLAN_FEATURES[plan].maxTracks;
  };

  const getMaxAlbums = (): number => {
    return PLAN_FEATURES[plan].maxAlbums;
  };

  return {
    plan,
    hasFeature,
    getAiVideosLimit,
    getAiVideosRemaining,
    canUseAiVideos,
    isPaidPlan,
    isArtistPlan,
    isFanPlan,
    getPlanName,
    getMaxTracks,
    getMaxAlbums,
    PLAN_FEATURES,
  };
}