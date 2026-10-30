import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ReleaseContext {
  id: string;
  title: string;
  artist_name: string;
  release_date: string | null;
  scheduled_release_date: string | null;
  genre: string | null;
  release_type: string | null;
  is_published: boolean;
  total_tracks: number | null;
  play_count: number | null;
  track_titles: string[];
}

export interface ArtistActivity {
  total_plays: number;
  monthly_listeners: number;
  total_tracks: number;
  total_albums: number;
  follower_count: number;
  top_tracks: { title: string; play_count: number }[];
  recent_releases: ReleaseContext[];
  upcoming_releases: ReleaseContext[];
  active_release: ReleaseContext | null;
  tour_dates: { venue: string; city: string; date_time: string }[];
  smart_links: { title: string; click_count: number; slug: string }[];
}

export interface NarrativeIdentity {
  origin_story: string;
  artist_mission: string;
  emotional_core: string;
  target_audience: string;
  brand_voice: string;
  artist_name: string;
  bio: string;
  genre: string;
}

export interface ReleaseCyclePhase {
  phase: "no-release" | "pre-release" | "release-week" | "post-release";
  release: ReleaseContext | null;
  daysUntilRelease: number | null;
  daysSinceRelease: number | null;
}

export interface FullNarrativeContext {
  identity: NarrativeIdentity;
  activity: ArtistActivity;
  releaseCycle: ReleaseCyclePhase;
  loading: boolean;
  refresh: () => Promise<void>;
}

const EMPTY_IDENTITY: NarrativeIdentity = {
  origin_story: "", artist_mission: "", emotional_core: "",
  target_audience: "", brand_voice: "", artist_name: "", bio: "", genre: "",
};

const EMPTY_ACTIVITY: ArtistActivity = {
  total_plays: 0, monthly_listeners: 0, total_tracks: 0, total_albums: 0,
  follower_count: 0, top_tracks: [], recent_releases: [], upcoming_releases: [],
  active_release: null, tour_dates: [], smart_links: [],
};

function detectReleaseCycle(releases: ReleaseContext[]): ReleaseCyclePhase {
  const now = new Date();
  
  // Check upcoming (scheduled but not published)
  const upcoming = releases
    .filter(r => !r.is_published && r.scheduled_release_date)
    .sort((a, b) => new Date(a.scheduled_release_date!).getTime() - new Date(b.scheduled_release_date!).getTime());
  
  if (upcoming.length > 0) {
    const next = upcoming[0];
    const releaseDate = new Date(next.scheduled_release_date!);
    const daysUntil = Math.ceil((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 0) {
      return { phase: "pre-release", release: next, daysUntilRelease: daysUntil, daysSinceRelease: null };
    }
  }

  // Check recent releases (published in last 14 days)
  const recentPublished = releases
    .filter(r => r.is_published && r.release_date)
    .sort((a, b) => new Date(b.release_date!).getTime() - new Date(a.release_date!).getTime());

  if (recentPublished.length > 0) {
    const latest = recentPublished[0];
    const releaseDate = new Date(latest.release_date!);
    const daysSince = Math.ceil((now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) {
      return { phase: "release-week", release: latest, daysUntilRelease: null, daysSinceRelease: daysSince };
    }
    if (daysSince <= 30) {
      return { phase: "post-release", release: latest, daysUntilRelease: null, daysSinceRelease: daysSince };
    }
  }

  return { phase: "no-release", release: null, daysUntilRelease: null, daysSinceRelease: null };
}

export function useArtistNarrativeContext(): FullNarrativeContext {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<NarrativeIdentity>(EMPTY_IDENTITY);
  const [activity, setActivity] = useState<ArtistActivity>(EMPTY_ACTIVITY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Parallel fetch all artist data
      const [narrativeRes, profileRes, albumsRes, tracksRes, followsRes, tourRes, linksRes] = await Promise.all([
        supabase.from("artist_narrative").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("artist_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("albums").select("id, title, artist_name, release_date, scheduled_release_date, genre, release_type, is_published, total_tracks, play_count").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("tracks").select("id, title, play_count, album_id, is_published").eq("user_id", user.id).order("play_count", { ascending: false }),
        supabase.from("artist_follows").select("id", { count: "exact", head: true }).eq("artist_id", user.id),
        (supabase as any).from("tour_dates").select("venue, city, date_time").eq("artist_id", user.id).gte("date_time", new Date().toISOString()).order("date_time", { ascending: true }).limit(10),
        (supabase as any).from("smart_links").select("title, click_count:clicks, slug:short_code").eq("user_id", user.id).order("clicks", { ascending: false }).limit(10),
      ]);

      const narrative = narrativeRes.data;
      const profile = profileRes.data;
      const albums = albumsRes.data || [];
      const tracks = tracksRes.data || [];

      // Build identity
      setIdentity({
        origin_story: narrative?.origin_story || "",
        artist_mission: narrative?.artist_mission || "",
        emotional_core: narrative?.emotional_core || "",
        target_audience: narrative?.target_audience || "",
        brand_voice: narrative?.brand_voice || "",
        artist_name: profile?.artist_name || "",
        bio: profile?.bio || "",
        genre: albums[0]?.genre || "",
      });

      // Build releases with track titles
      const releaseContexts: ReleaseContext[] = albums.map((a: any) => ({
        ...a,
        track_titles: tracks.filter((t: any) => t.album_id === a.id).map((t: any) => t.title),
      }));

      const totalPlays = tracks.reduce((sum: number, t: any) => sum + (t.play_count || 0), 0);
      const topTracks = tracks.slice(0, 5).map((t: any) => ({ title: t.title, play_count: t.play_count || 0 }));

      setActivity({
        total_plays: profile?.total_plays || totalPlays,
        monthly_listeners: profile?.monthly_listeners || 0,
        total_tracks: tracks.length,
        total_albums: albums.length,
        follower_count: followsRes.count || 0,
        top_tracks: topTracks,
        recent_releases: releaseContexts.filter(r => r.is_published).slice(0, 5),
        upcoming_releases: releaseContexts.filter(r => !r.is_published && r.scheduled_release_date),
        active_release: releaseContexts.find(r => r.is_published && r.release_date) || null,
        tour_dates: (tourRes.data || []) as any[],
        smart_links: (linksRes.data || []) as any[],
      });
    } catch (err) {
      console.error("Failed to load narrative context:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const releaseCycle = detectReleaseCycle([...activity.recent_releases, ...activity.upcoming_releases]);

  return { identity, activity, releaseCycle, loading, refresh };
}

/** Serialize the full context into a string for AI prompts */
export function serializeNarrativeContext(ctx: FullNarrativeContext): string {
  const { identity: id, activity: act, releaseCycle: rc } = ctx;
  
  const phaseLabels: Record<string, string> = {
    "no-release": "No active release cycle",
    "pre-release": `PRE-RELEASE: "${rc.release?.title}" drops in ${rc.daysUntilRelease} days (${rc.release?.release_type || "single"})`,
    "release-week": `🔥 RELEASE WEEK: "${rc.release?.title}" dropped ${rc.daysSinceRelease} day(s) ago — MAXIMIZE MOMENTUM`,
    "post-release": `POST-RELEASE: "${rc.release?.title}" released ${rc.daysSinceRelease} days ago — sustain engagement`,
  };

  return `
═══ ARTIST IDENTITY ═══
Name: ${id.artist_name || "Unknown"}
Genre: ${id.genre || "Not set"}
Origin: ${id.origin_story || "Not provided"}
Mission: ${id.artist_mission || "Not provided"}
Emotional Core: ${id.emotional_core || "Not provided"}
Target Audience: ${id.target_audience || "Not provided"}
Brand Voice: ${id.brand_voice || "Not provided"}
Bio: ${id.bio || "Not written"}

═══ LIVE METRICS ═══
Total Streams: ${act.total_plays.toLocaleString()}
Monthly Listeners: ${act.monthly_listeners.toLocaleString()}
Followers: ${act.follower_count.toLocaleString()}
Catalog: ${act.total_tracks} tracks across ${act.total_albums} releases
Top Tracks: ${act.top_tracks.map(t => `${t.title} (${t.play_count.toLocaleString()} plays)`).join(", ") || "None yet"}

═══ RELEASE CYCLE ═══
Phase: ${phaseLabels[rc.phase]}
${rc.release ? `Release: "${rc.release.title}" — ${rc.release.release_type || "single"} — ${rc.release.total_tracks || 1} track(s)
Tracks: ${rc.release.track_titles.join(", ") || "TBD"}
Genre: ${rc.release.genre || id.genre || "Not set"}` : ""}

═══ UPCOMING RELEASES ═══
${act.upcoming_releases.length > 0 ? act.upcoming_releases.map(r => `• "${r.title}" (${r.release_type}) — scheduled ${r.scheduled_release_date}`).join("\n") : "None scheduled"}

═══ RECENT RELEASES ═══
${act.recent_releases.length > 0 ? act.recent_releases.map(r => `• "${r.title}" (${r.release_type}) — ${r.release_date} — ${(r.play_count || 0).toLocaleString()} plays`).join("\n") : "None yet"}

═══ TOUR DATES ═══
${act.tour_dates.length > 0 ? act.tour_dates.map(t => `• ${t.venue}, ${t.city} — ${t.date_time}`).join("\n") : "No upcoming shows"}

═══ SMART LINKS ═══
${act.smart_links.length > 0 ? act.smart_links.map(l => `• "${l.title}" — ${l.click_count} clicks`).join("\n") : "None created"}
`.trim();
}
