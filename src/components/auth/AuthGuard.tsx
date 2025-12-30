import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext, UserRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// ============================================================================
// Loading Screen Component
// ============================================================================

function AuthLoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

// ============================================================================
// RequireAuth - Ensures user is authenticated
// ============================================================================

interface RequireAuthProps {
  children: ReactNode;
  redirectTo?: string;
}

export function RequireAuth({ children, redirectTo = "/auth" }: RequireAuthProps) {
  const { authState } = useAuthContext();
  const location = useLocation();

  if (authState === "loading") {
    return <AuthLoadingScreen message="Verifying session..." />;
  }

  if (authState === "unauthenticated") {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// ============================================================================
// RequireRole - Ensures user has specific role(s)
// ============================================================================

interface RequireRoleProps {
  children: ReactNode;
  allowed: UserRole[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export function RequireRole({ 
  children, 
  allowed, 
  redirectTo,
  fallback 
}: RequireRoleProps) {
  const { authState, role } = useAuthContext();

  if (authState === "loading") {
    return <AuthLoadingScreen message="Verifying access..." />;
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/auth" replace />;
  }

  if (authState === "needs_role") {
    return <Navigate to="/role-selection" replace />;
  }

  // Check if user has an allowed role
  if (role && allowed.includes(role)) {
    return <>{children}</>;
  }

  // Role not allowed
  if (fallback) {
    return <>{fallback}</>;
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  // Default redirect based on role
  if (role === "listener") {
    return <Navigate to="/discover" replace />;
  }

  return <Navigate to="/studio" replace />;
}

// ============================================================================
// RequireGuest - Only allows unauthenticated users (for login page)
// ============================================================================

interface RequireGuestProps {
  children: ReactNode;
}

export function RequireGuest({ children }: RequireGuestProps) {
  const { authState, role, isRoleLoading } = useAuthContext();

  if (authState === "loading") {
    return <AuthLoadingScreen message="Loading..." />;
  }

  // Must wait for role loading before redirecting
  if (authState !== "unauthenticated" && isRoleLoading) {
    return <AuthLoadingScreen message="Loading..." />;
  }

  if (authState === "authenticated") {
    // Redirect based on role
    const studioRoles: UserRole[] = ["artist", "verified_artist", "manager", "ceo", "admin"];
    if (role && studioRoles.includes(role)) {
      return <Navigate to="/studio" replace />;
    }
    return <Navigate to="/discover" replace />;
  }

  if (authState === "needs_role") {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
}

// ============================================================================
// RequireNoRole - For role selection page
// ============================================================================

interface RequireNoRoleProps {
  children: ReactNode;
}

export function RequireNoRole({ children }: RequireNoRoleProps) {
  const { authState, role } = useAuthContext();

  if (authState === "loading") {
    return <AuthLoadingScreen message="Loading..." />;
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/auth" replace />;
  }

  // If user already has a role, redirect them
  if (authState === "authenticated" && role) {
    const studioRoles: UserRole[] = ["artist", "verified_artist", "manager", "ceo", "admin"];
    if (studioRoles.includes(role)) {
      return <Navigate to="/studio" replace />;
    }
    return <Navigate to="/discover" replace />;
  }

  return <>{children}</>;
}

// ============================================================================
// StudioGuard - Specific guard for Studio (artists, managers, admins)
// ============================================================================

export function StudioGuard({ children }: { children: ReactNode }) {
  return (
    <RequireRole
      allowed={["artist", "verified_artist", "manager", "ceo", "admin"]}
      redirectTo="/discover"
    >
      {children}
    </RequireRole>
  );
}

// ============================================================================
// DiscoverGuard - Anyone authenticated can access Discover
// ============================================================================

export function DiscoverGuard({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      {children}
    </RequireAuth>
  );
}