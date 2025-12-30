import { useState, useLayoutEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

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

export const useUserRole = (user: User | null) => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const loadRole = useCallback(async (userId: string) => {
    // Prevent concurrent loads for the same user
    if (loadingRef.current && lastUserIdRef.current === userId) {
      return;
    }
    
    loadingRef.current = true;
    lastUserIdRef.current = userId;

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
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useLayoutEffect(() => {
    // No user - clear state immediately
    if (!user) {
      setRole(null);
      setLoading(false);
      lastUserIdRef.current = null;
      loadingRef.current = false;
      return;
    }

    // User exists - set loading and fetch role
    setLoading(true);
    loadRole(user.id);
  }, [user, loadRole]);

  const refetch = useCallback(() => {
    if (user) {
      setLoading(true);
      loadRole(user.id);
    }
  }, [user, loadRole]);

  return { role, loading, refetch };
};

