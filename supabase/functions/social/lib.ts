// Pure helpers for social posting (tested in lib_test.ts).

export const PLATFORMS = ["instagram", "tiktok", "facebook", "twitter", "youtube", "threads"] as const;
export type Platform = typeof PLATFORMS[number];

/** Character limits per network (the strictest one wins). */
export const LIMITS: Record<Platform, number> = {
  twitter: 280, threads: 500, instagram: 2200, tiktok: 2200, facebook: 63206, youtube: 5000,
};

export interface PostInput { body: string; platforms: string[]; mediaUrls: string[]; scheduledAt: string | null }

/** Validate a post. Returns problems in plain words (empty = OK). */
export function postProblems(p: PostInput, now = new Date()): string[] {
  const out: string[] = [];
  const plats = p.platforms.filter((x): x is Platform => (PLATFORMS as readonly string[]).includes(x));
  if (!plats.length) out.push("Choose at least one network.");
  if (!p.body.trim() && !p.mediaUrls.length) out.push("Write something or add a photo or video.");
  for (const pl of plats) {
    if (p.body.length > LIMITS[pl]) out.push(`Too long for ${pl}: ${p.body.length}/${LIMITS[pl]} characters.`);
  }
  if ((plats.includes("instagram") || plats.includes("tiktok") || plats.includes("youtube")) && !p.mediaUrls.length) {
    out.push("Instagram, TikTok and YouTube need a photo or video.");
  }
  if ((plats.includes("tiktok") || plats.includes("youtube")) && p.mediaUrls.length && !p.mediaUrls.some(isVideo)) {
    out.push("TikTok and YouTube need a video.");
  }
  if (p.mediaUrls.some((u) => !/^https:\/\//i.test(u))) out.push("Media links must start with https://");
  if (p.scheduledAt) {
    const t = new Date(p.scheduledAt);
    if (Number.isNaN(t.getTime())) out.push("That schedule time isn't valid.");
    else if (t.getTime() < now.getTime() + 5 * 60_000) out.push("Schedule at least 5 minutes ahead, or post now.");
  }
  return out;
}

export function isVideo(url: string): boolean {
  return /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

/** Ayrshare wants "YYYY-MM-DDThh:mm:ssZ" in UTC. */
export function ayrshareDate(iso: string): string {
  return new Date(iso).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Overall status from Ayrshare's per-network results. */
export function overallStatus(scheduled: boolean, results: { status?: string }[], errors: unknown[]): string {
  if (scheduled && !errors.length) return "scheduled";
  const ok = results.filter((r) => r.status === "success").length;
  if (ok && (errors.length || ok < results.length)) return "partial";
  if (ok) return "posted";
  return "failed";
}
