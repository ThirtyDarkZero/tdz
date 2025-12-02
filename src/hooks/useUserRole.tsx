import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type UserRole = "artist" | "listener" | "verified_artist" | "admin" | "moderator" | "user" | "manager" | "ceo" | null;

export const useUserRole = (user: User | null) => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    loadRole();
  }, [user]);

  const loadRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .order("granted_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error loading role:", error);
        setRole(null);
      } else {
        setRole(data?.role || null);
      }
    } catch (error) {
      console.error("Error loading role:", error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  return { role, loading, refetch: loadRole };
};
