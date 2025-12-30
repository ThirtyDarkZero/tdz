import { supabase } from "@/integrations/supabase/client";

export type HardSignOutOptions = {
  /** If provided, performs a full page navigation after clearing auth state. */
  redirectTo?: string;
};

export const clearAuthStorage = () => {
  try {
    // Supabase v2 stores tokens under keys like: sb-<project-ref>-auth-token
    for (const key of Object.keys(localStorage)) {
      const isLegacy = key === "supabase.auth.token";
      const isSupabaseAuthKey = key.startsWith("sb-") && key.includes("-auth-token");
      if (isLegacy || isSupabaseAuthKey) localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }

  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }
};

export const hardSignOut = async (options: HardSignOutOptions = {}) => {
  let error: unknown = null;

  try {
    // Use local scope so sign-out succeeds even if network/global revoke fails.
    const res = await supabase.auth.signOut({ scope: "local" });
    error = res.error ?? null;
  } catch (e) {
    error = e;
  } finally {
    // Always clear storage so the UI can never "stick" in a signed-in state.
    clearAuthStorage();
  }

  if (options.redirectTo) {
    window.location.assign(options.redirectTo);
  }

  return { error };
};
