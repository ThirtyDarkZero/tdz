export type MoveSignals = {
  trackCount: number;
  publishedCount: number;
  streams7d: number;
  streamsPrev7d: number;
  topTrackTitle?: string;
};

export type Move = {
  id: string;
  title: string;
  why: string;
  cta: string;
  section: string | "upload";
};

/** Picks the single highest-leverage action for today from real signals. */
export function pickTodaysMove(s: MoveSignals): Move {
  if (s.trackCount === 0)
    return { id: "first-upload", title: "Drop your first track", why: "Every Intentional Play pays $1 — but only once your music is live.", cta: "Start Release Quest", section: "upload" };
  if (s.publishedCount === 0)
    return { id: "publish", title: "Publish what you've uploaded", why: `You have ${s.trackCount} track${s.trackCount > 1 ? "s" : ""} waiting. Unpublished music can't earn.`, cta: "Open My Music", section: "music" };
  if (s.streams7d === 0)
    return { id: "first-impact", title: "Get your first 10 Intentional Plays", why: "Share your top track with your circle — 10 plays = $10 in your pocket.", cta: "Open Promote", section: "promote" };
  if (s.streams7d < s.streamsPrev7d)
    return { id: "recover", title: "Win back your momentum", why: `Impact dipped from ${s.streamsPrev7d} to ${s.streams7d} this week. A quick campaign usually reverses it.`, cta: "Launch a campaign", section: "promote" };
  return { id: "double-down", title: `Double down on ${s.topTrackTitle ?? "your top track"}`, why: `${s.streams7d} plays this week and climbing. Push it while it's hot.`, cta: "See what's working", section: "insights" };
}

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Streak continues if the last completion was yesterday; same-day completes are idempotent. */
export function nextStreak(prev: { streak: number; last?: string }, now: Date) {
  const today = dayKey(now);
  if (prev.last === today) return prev;
  const yesterday = dayKey(new Date(now.getTime() - DAY));
  return { streak: prev.last === yesterday ? prev.streak + 1 : 1, last: today };
}

export function currentStreak(prev: { streak: number; last?: string }, now: Date) {
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - DAY));
  return prev.last === today || prev.last === yesterday ? prev.streak : 0;
}
