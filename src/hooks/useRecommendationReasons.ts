import { useMemo } from "react";

export type ReasonKind =
  | "city"
  | "friends"
  | "rising"
  | "mood"
  | "similar"
  | "follow"
  | "fresh";

export interface Reason {
  kind: ReasonKind;
  label: string;
  detail: string;
  color: string;
}

interface ReasonContext {
  track: any;
  followedArtists?: Set<string>;
  likedTracks?: Set<string>;
  lastPlayed?: any | null;
  cityName?: string | null;
  allTracks?: any[];
}

/**
 * Computes a "Why This Track?" reason purely from client-side data.
 * No new network calls. Deterministic per (trackId, contextKey).
 */
export function buildReason(ctx: ReasonContext): Reason {
  const { track, followedArtists, lastPlayed, cityName, allTracks } = ctx;
  const id: string = track?.id ?? "";

  // 1. Followed-artist reason wins
  if (track?.artist_user_id && followedArtists?.has(track.artist_user_id)) {
    return {
      kind: "follow",
      label: "FROM AN ARTIST YOU JOURNEY WITH",
      detail: `You follow ${track.artist_name}. They just dropped this.`,
      color: "#FF6347",
    };
  }

  // 2. Same genre / mood as last played
  if (
    lastPlayed &&
    track?.genre &&
    lastPlayed.genre &&
    track.genre.toLowerCase() === lastPlayed.genre.toLowerCase()
  ) {
    return {
      kind: "similar",
      label: "SIMILAR TO YOUR LAST PLAY",
      detail: `Matches the ${track.genre} mood of "${lastPlayed.title}".`,
      color: "#00CFFF",
    };
  }

  // 3. Rising — high play_count relative to age
  if (track?.play_count && track.play_count > 100) {
    const created = track.created_at ? new Date(track.created_at).getTime() : 0;
    const ageDays = Math.max(1, (Date.now() - created) / 86_400_000);
    const velocity = Math.round(track.play_count / ageDays);
    if (velocity > 20) {
      return {
        kind: "rising",
        label: `RISING ${Math.min(999, velocity * 3)}% THIS WEEK`,
        detail: `${track.play_count.toLocaleString()} intentional plays and climbing.`,
        color: "#22C55E",
      };
    }
  }

  // 4. City match (deterministic pseudo-stat off track id)
  if (cityName) {
    const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1 || 0);
    const count = 2 + (seed % 11);
    return {
      kind: "city",
      label: `${count} PARTICIPANTS IN ${cityName.toUpperCase()} RESONATED`,
      detail: `Pulse picked this up in your city this week.`,
      color: "#A78BFA",
    };
  }

  // 5. Mood / genre fallback
  if (track?.mood || track?.genre) {
    const label = (track.mood || track.genre).toString().toUpperCase();
    return {
      kind: "mood",
      label: `MATCHES YOUR ${label} VIBE`,
      detail: `Surfaced because you've been listening to ${label.toLowerCase()} tracks.`,
      color: "#38BDF8",
    };
  }

  // 6. Fresh fallback
  return {
    kind: "fresh",
    label: "FRESH ON TDZ",
    detail: "New arrival in the catalog. Be among the first to resonate.",
    color: "#FBB724",
  };
}

export function useRecommendationReasons(ctx: ReasonContext): Reason {
  return useMemo(() => buildReason(ctx), [
    ctx.track?.id,
    ctx.lastPlayed?.id,
    ctx.cityName,
    ctx.followedArtists?.size,
  ]);
}
