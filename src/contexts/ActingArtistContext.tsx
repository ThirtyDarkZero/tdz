import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export interface RosterArtist {
  artist_id: string;
  artist_name: string;
  profile_image?: string | null;
}

interface ActingArtistCtx {
  /** null = acting as self */
  actingArtistId: string | null;
  actingArtistName: string | null;
  /** The user_id that Studio queries/inserts should scope to */
  effectiveUserId: string | null;
  isDelegated: boolean;
  roster: RosterArtist[];
  canDelegate: boolean;
  loading: boolean;
  setActingArtist: (id: string | null) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<ActingArtistCtx | undefined>(undefined);

const storageKey = (uid: string) => `tdz.actingArtistId:${uid}`;

export function ActingArtistProvider({ children }: { children: ReactNode }) {
  const { user, isManager, isAdmin, plan } = useAuthContext();
  const [roster, setRoster] = useState<RosterArtist[]>([]);
  const [actingArtistId, setActingArtistIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canDelegate = (isManager || isAdmin) && plan === "enterprise";

  const refresh = useCallback(async () => {
    if (!user || !canDelegate) {
      setRoster([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: ma } = await supabase
      .from("manager_artists")
      .select("artist_id")
      .eq("manager_id", user.id);
    const ids = (ma || []).map((r) => r.artist_id);
    if (ids.length === 0) {
      setRoster([]);
      setLoading(false);
      return;
    }
    const { data: profiles } = await supabase
      .from("artist_profiles")
      .select("user_id, artist_name, profile_image_path")
      .in("user_id", ids);
    const rows: RosterArtist[] = ids.map((id) => {
      const p = profiles?.find((x) => x.user_id === id);
      return {
        artist_id: id,
        artist_name: p?.artist_name || "Unnamed artist",
        profile_image: p?.profile_image_path || null,
      };
    });
    setRoster(rows);
    setLoading(false);
  }, [user, canDelegate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // hydrate saved selection
  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(storageKey(user.id));
      if (saved) setActingArtistIdState(saved);
    } catch {}
  }, [user]);

  // support ?as=<uuid> query param (deep link from Manager HQ)
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const as = params.get("as");
    if (as) {
      setActingArtistIdState(as);
      try {
        localStorage.setItem(storageKey(user.id), as);
      } catch {}
    }
  }, [user]);

  const setActingArtist = useCallback(
    (id: string | null) => {
      if (!user) return;
      setActingArtistIdState(id);
      try {
        if (id) localStorage.setItem(storageKey(user.id), id);
        else localStorage.removeItem(storageKey(user.id));
      } catch {}
    },
    [user]
  );

  // Ensure selection is still valid (artist may have been removed)
  useEffect(() => {
    if (!actingArtistId) return;
    if (roster.length === 0 || !roster.find((r) => r.artist_id === actingArtistId)) {
      // still keep if roster hasn't loaded yet; only clear when we have data
      if (!loading && roster.length > 0) setActingArtist(null);
    }
  }, [roster, actingArtistId, loading, setActingArtist]);

  const value = useMemo<ActingArtistCtx>(() => {
    const active = actingArtistId ? roster.find((r) => r.artist_id === actingArtistId) : null;
    const isDelegated = !!(canDelegate && active);
    return {
      actingArtistId: isDelegated ? actingArtistId : null,
      actingArtistName: active?.artist_name ?? null,
      effectiveUserId: isDelegated ? actingArtistId : user?.id ?? null,
      isDelegated,
      roster,
      canDelegate,
      loading,
      setActingArtist,
      refresh,
    };
  }, [actingArtistId, roster, user, canDelegate, loading, setActingArtist, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActingArtist() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe fallback so components can render outside provider
    return {
      actingArtistId: null,
      actingArtistName: null,
      effectiveUserId: null,
      isDelegated: false,
      roster: [] as RosterArtist[],
      canDelegate: false,
      loading: false,
      setActingArtist: () => {},
      refresh: async () => {},
    } satisfies ActingArtistCtx;
  }
  return ctx;
}
