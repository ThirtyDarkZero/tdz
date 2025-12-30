// Legacy hook - delegates to AuthContext for backward compatibility
import { useAuthContext } from "@/contexts/AuthContext";

export const useAuth = () => {
  const ctx = useAuthContext();
  
  return {
    user: ctx.user,
    session: ctx.session,
    loading: ctx.isAuthLoading,
    signUp: ctx.signUp,
    signIn: ctx.signIn,
    signInWithGoogle: ctx.signInWithGoogle,
    signOut: ctx.signOut,
  };
};