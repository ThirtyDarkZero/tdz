import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PulseCity {
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
  topTrack?: { id: string; title: string; artist_name: string } | null;
  color: string;
}

// Seed cities with approximate coords — used both as fallback and to
// distribute live counts deterministically when fine-grained geo isn't queryable.
const SEED_CITIES: Array<Omit<PulseCity, "count" | "topTrack">> = [
  { city: "New York",      country: "US", lat: 40.71, lng: -74.0,  color: "#00CFFF" },
  { city: "Los Angeles",   country: "US", lat: 34.05, lng: -118.2, color: "#FF6347" },
  { city: "London",        country: "UK", lat: 51.51, lng: -0.13,  color: "#A78BFA" },
  { city: "Tokyo",         country: "JP", lat: 35.68, lng: 139.69, color: "#F472B6" },
  { city: "Berlin",        country: "DE", lat: 52.52, lng: 13.40,  color: "#34D399" },
  { city: "Lagos",         country: "NG", lat: 6.52,  lng: 3.38,   color: "#FBB724" },
  { city: "São Paulo",     country: "BR", lat: -23.55,lng: -46.63, color: "#22D3EE" },
  { city: "Mexico City",   country: "MX", lat: 19.43, lng: -99.13, color: "#F43F5E" },
  { city: "Paris",         country: "FR", lat: 48.85, lng: 2.35,   color: "#EAB308" },
  { city: "Sydney",        country: "AU", lat: -33.87,lng: 151.21, color: "#06B6D4" },
];

/**
 * Live pulse — pulls the most recent tracks from the catalog as a proxy
 * for "what's playing right now" (listening_history is RLS-scoped to
 * each user, so we synthesise city-level activity from public signals).
 * Polls every 5s per the privacy memory (no Realtime).
 */
export function useLivePulse(pollMs: number = 5000) {
  const [cities, setCities] = useState<PulseCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const { data, error } = await supabase
          .from("tracks")
          .select("id, title, artist_name, play_count, created_at")
          .eq("is_published", true)
          .order("play_count", { ascending: false })
          .limit(30);

        if (cancelled || error || !data) return;

        const now = Date.now();
        const next: PulseCity[] = SEED_CITIES.map((seed, i) => {
          // Deterministic-ish distribution that breathes over time.
          const phase = Math.sin((now / 4000) + i) * 0.5 + 0.5;
          const baseTrack = data[i % data.length];
          const count = Math.max(
            1,
            Math.round((baseTrack?.play_count ?? 50) * 0.001 * (0.6 + phase) + (i + 2))
          );
          return {
            ...seed,
            count,
            topTrack: baseTrack
              ? { id: baseTrack.id, title: baseTrack.title, artist_name: baseTrack.artist_name }
              : null,
          };
        });

        // Sort by count desc for rail ordering
        next.sort((a, b) => b.count - a.count);
        setCities(next);
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    tick();
    const interval = setInterval(tick, pollMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollMs]);

  return { cities, loading };
}
