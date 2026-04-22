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
  isCEO: boolean;
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
  
  // Track latest load request to ignore stale results
  const roleRequestIdRef = useRef(0);
  const subRequestIdRef = useRef(0);
  const initializedRef = useRef(false);

  // ========== Load Role ==========
  const loadRole = useCallback(async (userId: string) => {
    const reqId = ++roleRequestIdRef.current;
    setIsRoleLoading(true);

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("granted_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      // Ignore if a newer request started
      if (reqId !== roleRequestIdRef.current) return;

      if (error) {
        console.error("[Auth] Error loading role:", error);
        setRole(null);
      } else {
        setRole((data?.role as UserRole) ?? null);
      }
    } catch (error) {
      if (reqId !== roleRequestIdRef.current) return;
      console.error("[Auth] Error loading role:", error);
      setRole(null);
    } finally {
      if (reqId === roleRequestIdRef.current) {
        setIsRoleLoading(false);
      }
    }
  }, []);

  // ========== Load Subscription ==========
  const loadSubscription = useCallback(async (userId: string) => {
    const reqId = ++subRequestIdRef.current;
    setIsSubscriptionLoading(true);

    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (reqId !== subRequestIdRef.current) return;

      if (error) {
        console.error("[Auth] Error loading subscription:", error);
        setSubscription(null);
      } else {
        setSubscription(data as unknown as Subscription | null);
      }
    } catch (error) {
      if (reqId !== subRequestIdRef.current) return;
      console.error("[Auth] Error loading subscription:", error);
      setSubscription(null);
    } finally {
      if (reqId === subRequestIdRef.current) {
        setIsSubscriptionLoading(false);
      }
    }
  }, []);

  // ========== Auth State Listener ==========
  useEffect(() => {
    let lastLoadedUserId: string | null = null;

    const handleSession = (newSession: Session | null, source: string) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsAuthLoading(false);

      const newUserId = newSession?.user?.id ?? null;

      if (newUserId) {
        // Avoid duplicate load if same user already loaded
        if (newUserId === lastLoadedUserId) return;
        lastLoadedUserId = newUserId;
        // Defer to avoid potential Supabase deadlock
        setTimeout(() => {
          loadRole(newUserId);
          loadSubscription(newUserId);
        }, 0);
      } else {
        lastLoadedUserId = null;
        setRole(null);
        setSubscription(null);
        setIsRoleLoading(false);
        setIsSubscriptionLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("[Auth] event:", event, "user:", newSession?.user?.email ?? "none");
        initializedRef.current = true;
        handleSession(newSession, "listener");
      }
    );

    // THEN check for existing session (only if listener hasn't already fired)
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (initializedRef.current) return; // listener already handled it
      initializedRef.current = true;
      handleSession(existingSession, "getSession");
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
  const isCEO = role === "ceo";
  
  const plan: SubscriptionPlan = (() => {
    // CEO/admin role grants enterprise — server-side enforced via user_roles + RLS.
    if (role === "ceo" || role === "admin") return "enterprise";
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
    isCEO,
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
    return 0; // AI video feature removed
  };

  const getAiVideosRemaining = (): number => {
    return 0;
  };

  const canUseAiVideos = (): boolean => {
    return false;
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