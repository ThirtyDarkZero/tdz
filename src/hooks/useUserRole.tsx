// Legacy hook - delegates to AuthContext for backward compatibility
import { useAuthContext, UserRole } from "@/contexts/AuthContext";
import { User } from "@supabase/supabase-js";

export type { UserRole };

export const useUserRole = (user: User | null) => {
  const ctx = useAuthContext();
  
  return {
    role: ctx.role,
    loading: ctx.isRoleLoading,
    refetch: ctx.refreshRole,
  };
};