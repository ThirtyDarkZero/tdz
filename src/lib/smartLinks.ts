import { supabase } from "@/integrations/supabase/client";

export const PLATFORMS = [
  "Spotify", "Apple Music", "YouTube", "YouTube Music", "Amazon Music", "TIDAL",
  "SoundCloud", "Deezer", "Audiomack", "Bandcamp",
] as const;

/** Lowercase letters, numbers and dashes; 2–64 chars. */
export function toCode(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}

export function isValidCode(code: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{1,63}$/i.test(code);
}

/** Accepts http(s) URLs only (no javascript: etc). Adds https:// if missing. */
export function cleanUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^[a-z]+:\/\//i.test(v) ? v : `https://${v}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function smartLinkUrl(code: string): string {
  return `${window.location.origin}/link/${code}`;
}

const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string, args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

export function recordClick(code: string, platform: string): void {
  void rpc("record_smart_link_click", {
    p_code: code, p_platform: platform,
    p_user_agent: navigator.userAgent, p_referrer: document.referrer || null,
  });
}

export async function linkStats(id: string): Promise<{ platform: string; clicks: number }[]> {
  const { data } = await rpc("smart_link_stats", { p_link: id });
  return ((data as { platform: string; clicks: number }[]) ?? []).map((r) => ({ ...r, clicks: Number(r.clicks) }));
}
