import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ChevronRight, ChevronDown, Search, Music, Disc3, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Cell,
} from "recharts";

interface TrackRow {
  id: string;
  user_id: string;
  title: string;
  artist_name: string;
  album_id: string | null;
  play_count: number | null;
  is_published: boolean | null;
  created_at: string;
  genre?: string | null;
}
interface AlbumRow {
  id: string;
  user_id: string;
  title: string;
  release_date: string | null;
  play_count: number | null;
  is_published: boolean | null;
}
interface PayoutRow {
  artist_id: string;
  amount: number | string;
  status: string;
}
interface ArtistNode {
  artist_id: string;
  artist_name: string;
  totalStreams: number;
  totalTracks: number;
  totalReleases: number;
  totalRevenue: number;
  releases: ReleaseNode[];
  singles: TrackRow[];
}
interface ReleaseNode {
  album_id: string;
  title: string;
  release_date: string | null;
  is_published: boolean;
  streams: number;
  tracks: TrackRow[];
}
  const [streamSeries, setStreamSeries] = useState<{ date: string; streams: number; revenue: number; artistId: string }[]>([]);


const REVENUE_PER_STREAM = 1; // TDZ $1/stream model

export function RosterAnalyticsDrilldown() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<ArtistNode[]>([]);
  const [expandedArtists, setExpandedArtists] = useState<Set<string>>(new Set());
  const [expandedReleases, setExpandedReleases] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"streams" | "revenue" | "name">("streams");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: mgr } = await supabase
        .from("manager_artists")
        .select("artist_id")
        .eq("manager_id", user.id);
      const artistIds = (mgr || []).map((m: any) => m.artist_id);
      if (artistIds.length === 0) {
        setTree([]);
        setLoading(false);
        return;
      }

      const [{ data: profiles }, { data: tracks }, { data: albums }, { data: payouts }] =
        await Promise.all([
          supabase.from("artist_profiles").select("user_id, artist_name").in("user_id", artistIds),
          supabase
            .from("tracks")
            .select("id, user_id, title, artist_name, album_id, play_count, is_published, created_at, genre")
            .in("user_id", artistIds),
          supabase
            .from("albums")
            .select("id, user_id, title, release_date, play_count, is_published")
            .in("user_id", artistIds),
          supabase
            .from("artist_payouts")
            .select("artist_id, amount, status")
            .in("artist_id", artistIds),
        ]);

      const nodes: ArtistNode[] = artistIds.map((id) => {
        const p = profiles?.find((x: any) => x.user_id === id);
        const artistTracks = ((tracks as TrackRow[]) || []).filter((t) => t.user_id === id);
        const artistAlbums = ((albums as AlbumRow[]) || []).filter((a) => a.user_id === id);
        const revenue = ((payouts as PayoutRow[]) || [])
          .filter((py) => py.artist_id === id && py.status === "completed")
          .reduce((s, py) => s + Number(py.amount || 0), 0);

        const releases: ReleaseNode[] = artistAlbums.map((al) => {
          const rTracks = artistTracks.filter((t) => t.album_id === al.id);
          const streams = rTracks.reduce((s, t) => s + (t.play_count || 0), 0);
          return {
            album_id: al.id,
            title: al.title,
            release_date: al.release_date,
            is_published: !!al.is_published,
            streams,
            tracks: rTracks.sort((a, b) => (b.play_count || 0) - (a.play_count || 0)),
          };
        });

        const singles = artistTracks
          .filter((t) => !t.album_id)
          .sort((a, b) => (b.play_count || 0) - (a.play_count || 0));

        const totalStreams = artistTracks.reduce((s, t) => s + (t.play_count || 0), 0);

        return {
          artist_id: id,
          artist_name: p?.artist_name || "Unnamed Artist",
          totalStreams,
          totalTracks: artistTracks.length,
          totalReleases: artistAlbums.length,
          totalRevenue: revenue,
          releases: releases.sort((a, b) => b.streams - a.streams),
          singles,
        };
      });

      setTree(nodes);
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? tree.filter(
          (a) =>
            a.artist_name.toLowerCase().includes(q) ||
            a.releases.some((r) => r.title.toLowerCase().includes(q)) ||
            a.singles.some((t) => t.title.toLowerCase().includes(q)),
        )
      : tree;
    return [...list].sort((a, b) => {
      if (sortBy === "name") return a.artist_name.localeCompare(b.artist_name);
      if (sortBy === "revenue") return b.totalRevenue - a.totalRevenue;
      return b.totalStreams - a.totalStreams;
    });
  }, [tree, query, sortBy]);

  const toggle = (set: Set<string>, key: string, setFn: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setFn(next);
  };

  const csvEscape = (v: any) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const download = (name: string, rows: (string | number)[][]) => {
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTrackLevel = () => {
    const rows: (string | number)[][] = [
      [
        "artist",
        "artist_id",
        "release_title",
        "release_type",
        "release_date",
        "release_published",
        "track_title",
        "track_id",
        "track_published",
        "genre",
        "track_created_at",
        "streams",
        "attributed_revenue_usd",
      ],
    ];
    filtered.forEach((a) => {
      a.releases.forEach((r) => {
        r.tracks.forEach((t) => {
          rows.push([
            a.artist_name,
            a.artist_id,
            r.title,
            r.tracks.length === 1 ? "single" : r.tracks.length <= 6 ? "EP" : "album",
            r.release_date || "",
            r.is_published ? "yes" : "no",
            t.title,
            t.id,
            t.is_published ? "yes" : "no",
            t.genre || "",
            t.created_at,
            t.play_count || 0,
            ((t.play_count || 0) * REVENUE_PER_STREAM).toFixed(2),
          ]);
        });
      });
      a.singles.forEach((t) => {
        rows.push([
          a.artist_name,
          a.artist_id,
          t.title,
          "loose_single",
          "",
          "",
          t.title,
          t.id,
          t.is_published ? "yes" : "no",
          t.genre || "",
          t.created_at,
          t.play_count || 0,
          ((t.play_count || 0) * REVENUE_PER_STREAM).toFixed(2),
        ]);
      });
    });
    download("roster-track-analytics", rows);
  };

  const exportReleaseLevel = () => {
    const rows: (string | number)[][] = [
      ["artist", "release_title", "release_date", "published", "tracks", "streams", "attributed_revenue_usd"],
    ];
    filtered.forEach((a) => {
      a.releases.forEach((r) => {
        rows.push([
          a.artist_name,
          r.title,
          r.release_date || "",
          r.is_published ? "yes" : "no",
          r.tracks.length,
          r.streams,
          (r.streams * REVENUE_PER_STREAM).toFixed(2),
        ]);
      });
    });
    download("roster-release-analytics", rows);
  };

  const exportArtistSummary = () => {
    const rows: (string | number)[][] = [
      ["artist", "releases", "tracks", "streams", "paid_revenue_usd", "attributed_revenue_usd"],
    ];
    filtered.forEach((a) =>
      rows.push([
        a.artist_name,
        a.totalReleases,
        a.totalTracks,
        a.totalStreams,
        a.totalRevenue.toFixed(2),
        (a.totalStreams * REVENUE_PER_STREAM).toFixed(2),
      ]),
    );
    download("roster-artist-summary", rows);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <Card className="p-8 glass-card text-center text-sm text-muted-foreground">
        No roster artists yet. Add artists in the Roster tab to unlock drilldowns.
      </Card>
    );
  }

  const totals = filtered.reduce(
    (acc, a) => {
      acc.streams += a.totalStreams;
      acc.tracks += a.totalTracks;
      acc.releases += a.totalReleases;
      acc.revenue += a.totalRevenue;
      return acc;
    },
    { streams: 0, tracks: 0, releases: 0, revenue: 0 },
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 glass-card">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Streams</div>
          <div className="text-2xl font-bold">{totals.streams.toLocaleString()}</div>
        </Card>
        <Card className="p-4 glass-card">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Disc3 className="w-3 h-3" /> Releases</div>
          <div className="text-2xl font-bold">{totals.releases}</div>
        </Card>
        <Card className="p-4 glass-card">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Music className="w-3 h-3" /> Tracks</div>
          <div className="text-2xl font-bold">{totals.tracks}</div>
        </Card>
        <Card className="p-4 glass-card">
          <div className="text-xs text-muted-foreground">Attributed rev</div>
          <div className="text-2xl font-bold">${(totals.streams * REVENUE_PER_STREAM).toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Paid: ${totals.revenue.toFixed(2)}</div>
        </Card>
      </div>

      <Card className="p-4 glass-card">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search artist, release, or track…"
              className="pl-9 h-9"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3 rounded-md bg-background border border-border/50 text-sm"
          >
            <option value="streams">Sort: Streams</option>
            <option value="revenue">Sort: Revenue</option>
            <option value="name">Sort: Name</option>
          </select>
          <Button size="sm" variant="outline" onClick={exportArtistSummary}>
            <Download className="w-3 h-3 mr-1" /> Artists
          </Button>
          <Button size="sm" variant="outline" onClick={exportReleaseLevel}>
            <Download className="w-3 h-3 mr-1" /> Releases
          </Button>
          <Button size="sm" onClick={exportTrackLevel}>
            <Download className="w-3 h-3 mr-1" /> All tracks
          </Button>
        </div>

        <div className="space-y-2">
          {filtered.map((a) => {
            const open = expandedArtists.has(a.artist_id);
            return (
              <div key={a.artist_id} className="rounded-lg border border-border/40 overflow-hidden">
                <button
                  onClick={() => toggle(expandedArtists, a.artist_id, setExpandedArtists)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] text-left"
                >
                  {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{a.artist_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.totalReleases} releases · {a.totalTracks} tracks
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{a.totalStreams.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">
                      ${(a.totalStreams * REVENUE_PER_STREAM).toLocaleString()} attributed
                    </div>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-border/40 bg-black/20 p-3 space-y-2">
                    {a.releases.length === 0 && a.singles.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No releases yet</p>
                    )}
                    {a.releases.map((r) => {
                      const rOpen = expandedReleases.has(r.album_id);
                      return (
                        <div key={r.album_id} className="rounded border border-border/30 bg-black/30">
                          <button
                            onClick={() => toggle(expandedReleases, r.album_id, setExpandedReleases)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.03] text-left"
                          >
                            {rOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            <Disc3 className="w-4 h-4 text-primary/70" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{r.title}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {r.release_date || "unreleased"} · {r.tracks.length} tracks
                              </div>
                            </div>
                            {!r.is_published && <Badge variant="outline" className="text-[10px]">draft</Badge>}
                            <div className="text-right">
                              <div className="text-xs font-semibold">{r.streams.toLocaleString()}</div>
                              <div className="text-[10px] text-muted-foreground">
                                ${(r.streams * REVENUE_PER_STREAM).toLocaleString()}
                              </div>
                            </div>
                          </button>
                          {rOpen && (
                            <div className="border-t border-border/20 divide-y divide-border/20">
                              {r.tracks.map((t) => (
                                <div key={t.id} className="flex items-center gap-3 px-3 py-2 pl-9 text-xs">
                                  <Music className="w-3 h-3 text-muted-foreground" />
                                  <div className="flex-1 truncate">{t.title}</div>
                                  {!t.is_published && <Badge variant="outline" className="text-[9px]">draft</Badge>}
                                  <div className="w-20 text-right font-mono">
                                    {(t.play_count || 0).toLocaleString()}
                                  </div>
                                  <div className="w-16 text-right text-muted-foreground font-mono">
                                    ${((t.play_count || 0) * REVENUE_PER_STREAM).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {a.singles.length > 0 && (
                      <div className="rounded border border-border/30 bg-black/30">
                        <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/20">
                          Loose singles
                        </div>
                        <div className="divide-y divide-border/20">
                          {a.singles.map((t) => (
                            <div key={t.id} className="flex items-center gap-3 px-3 py-2 text-xs">
                              <Music className="w-3 h-3 text-muted-foreground" />
                              <div className="flex-1 truncate">{t.title}</div>
                              {!t.is_published && <Badge variant="outline" className="text-[9px]">draft</Badge>}
                              <div className="w-20 text-right font-mono">
                                {(t.play_count || 0).toLocaleString()}
                              </div>
                              <div className="w-16 text-right text-muted-foreground font-mono">
                                ${((t.play_count || 0) * REVENUE_PER_STREAM).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
