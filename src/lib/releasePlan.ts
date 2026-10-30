import { format, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toCode } from "@/lib/smartLinks";

export type ReleaseMode = "now" | "scheduled" | "draft";

export interface ReleaseFields {
  is_published: boolean;
  release_date: string | null;
  scheduled_release_date: string | null;
}

/** What to write on the tracks and album for the artist's release choice. */
export function releaseFields(mode: ReleaseMode, date: Date | null, now = new Date()): ReleaseFields {
  const today = format(now, "yyyy-MM-dd");
  if (mode === "draft") return { is_published: false, release_date: null, scheduled_release_date: null };
  if (mode === "scheduled" && date && startOfDay(date) > startOfDay(now)) {
    const d = format(date, "yyyy-MM-dd");
    return { is_published: false, release_date: d, scheduled_release_date: d };
  }
  // "now", or a scheduled date that is today or earlier
  return { is_published: true, release_date: today, scheduled_release_date: null };
}

/** First free code: "title", then "title-2", "title-3"... */
async function freeCode(table: "smart_links" | "presave_campaigns", column: string, base: string): Promise<string> {
  const root = toCode(base) || "release";
  for (let i = 1; i <= 20; i++) {
    const code = i === 1 ? root : `${root.slice(0, 60)}-${i}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from(table).select("id").ilike(column, code).maybeSingle();
    if (!data) return code;
  }
  return `${root.slice(0, 50)}-${Date.now().toString(36)}`;
}

export interface ReleaseLinks { smartLink?: string; presave?: string }

/**
 * After upload: a smart link to the release, and a pre-save page when it's
 * scheduled. Failures are reported but never undo the upload.
 */
export async function createReleaseLinks(opts: {
  ownerId: string;
  title: string;
  target: { type: "track" | "album"; id: string };
  smartLink: boolean;
  presave: boolean;
  releaseDate: string | null;
}): Promise<ReleaseLinks> {
  const out: ReleaseLinks = {};
  if (opts.smartLink) {
    const code = await freeCode("smart_links", "short_code", opts.title);
    const { error } = await supabase.from("smart_links").insert({
      user_id: opts.ownerId, short_code: code, title: opts.title,
      target_type: opts.target.type, target_id: opts.target.id,
    } as never);
    if (!error) out.smartLink = `${window.location.origin}/link/${code}`;
  }
  if (opts.presave && opts.releaseDate) {
    const slug = await freeCode("presave_campaigns", "slug", opts.title);
    const { error } = await supabase.from("presave_campaigns").insert({
      user_id: opts.ownerId, campaign_name: opts.title, slug, release_date: opts.releaseDate,
      track_id: opts.target.type === "track" ? opts.target.id : null,
      album_id: opts.target.type === "album" ? opts.target.id : null,
    } as never);
    if (!error) out.presave = `${window.location.origin}/presave/${slug}`;
  }
  return out;
}
