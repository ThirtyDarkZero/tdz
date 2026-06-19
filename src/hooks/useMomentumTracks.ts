import { useMemo } from "react";

export interface MomentumTrack {
  track: any;
  velocity: number;       // plays per day
  growthPct: number;      // synthesised vs catalog average
  rank: number;
}

/**
 * Computes momentum (velocity = play_count / age_in_days) over the
 * tracks already loaded into Discovery. No extra network calls.
 */
export function useMomentumTracks(tracks: any[], limit = 12): MomentumTrack[] {
  return useMemo(() => {
    if (!tracks?.length) return [];
    const now = Date.now();
    const scored = tracks
      .filter((t) => t?.id)
      .map((t) => {
        const created = t.created_at ? new Date(t.created_at).getTime() : now - 30 * 86_400_000;
        const ageDays = Math.max(1, (now - created) / 86_400_000);
        const plays = t.play_count ?? 0;
        const velocity = plays / ageDays;
        return { t, velocity, plays };
      })
      .filter((x) => x.velocity > 0);

    if (!scored.length) return [];

    const avgVelocity =
      scored.reduce((a, b) => a + b.velocity, 0) / scored.length || 1;

    return scored
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, limit)
      .map((x, i) => ({
        track: x.t,
        velocity: Math.round(x.velocity),
        growthPct: Math.min(999, Math.round((x.velocity / avgVelocity) * 100)),
        rank: i + 1,
      }));
  }, [tracks, limit]);
}
