import { useState, useLayoutEffect } from "react";
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

  const loadRole = async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
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
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    // Prevent Studio redirect races: set loading=true synchronously before any
    // route-guard effects run when user transitions null -> user.
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { role, loading, refetch: loadRole };
};

