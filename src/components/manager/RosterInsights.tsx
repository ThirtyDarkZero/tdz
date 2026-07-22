import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, DollarSign, Music, Download } from "lucide-react";

interface ArtistStats {
  artist_id: string;
  artist_name: string;
  tracks: number;
  streams: number;
  revenue: number;
}

export function RosterInsights() {
  const { user } = useAuthContext();
  const [rows, setRows] = useState<ArtistStats[]>([]);
  const [loading, setLoading] = useState(true);

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
        setRows([]);
        setLoading(false);
        return;
      }

      const [{ data: profiles }, { data: tracks }, { data: payouts }] = await Promise.all([
        supabase.from("artist_profiles").select("user_id, artist_name").in("user_id", artistIds),
        supabase.from("tracks").select("id, user_id, play_count").in("user_id", artistIds),
        supabase.from("artist_payouts").select("artist_id, amount, status").in("artist_id", artistIds),
      ]);

      const stats: ArtistStats[] = artistIds.map((id) => {
        const p = profiles?.find((x: any) => x.user_id === id);
        const ts = (tracks || []).filter((t: any) => t.user_id === id);
        const streams = ts.reduce((sum: number, t: any) => sum + (t.play_count || 0), 0);
        const revenue = (payouts || [])
          .filter((py: any) => py.artist_id === id && py.status === "completed")
          .reduce((s: number, py: any) => s + Number(py.amount || 0), 0);
        return {
          artist_id: id,
          artist_name: p?.artist_name || "Unnamed",
          tracks: ts.length,
          streams,
          revenue,
        };
      });

      setRows(stats.sort((a, b) => b.streams - a.streams));
      setLoading(false);
    })();
  }, [user]);

  const totalStreams = rows.reduce((s, r) => s + r.streams, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalTracks = rows.reduce((s, r) => s + r.tracks, 0);

  const exportCsv = () => {
    const header = "artist,tracks,streams,revenue_usd\n";
    const body = rows.map((r) => `"${r.artist_name}",${r.tracks},${r.streams},${r.revenue.toFixed(2)}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster-insights-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 glass-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <TrendingUp className="w-4 h-4" /> Total streams
          </div>
          <div className="text-3xl font-bold">{totalStreams.toLocaleString()}</div>
        </Card>
        <Card className="p-5 glass-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <DollarSign className="w-4 h-4" /> Roster revenue
          </div>
          <div className="text-3xl font-bold">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </Card>
        <Card className="p-5 glass-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Music className="w-4 h-4" /> Total tracks
          </div>
          <div className="text-3xl font-bold">{totalTracks}</div>
        </Card>
      </div>

      <Card className="p-5 glass-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Per-artist breakdown</h3>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="w-3 h-3 mr-1" /> Export CSV
          </Button>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No roster artists yet. Add artists in the Roster tab to see insights.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground text-left">
                <tr>
                  <th className="py-2">Artist</th>
                  <th className="py-2 text-right">Tracks</th>
                  <th className="py-2 text-right">Streams</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.artist_id} className="border-t border-border/40">
                    <td className="py-3 font-medium">{r.artist_name}</td>
                    <td className="py-3 text-right">{r.tracks}</td>
                    <td className="py-3 text-right">{r.streams.toLocaleString()}</td>
                    <td className="py-3 text-right">${r.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
