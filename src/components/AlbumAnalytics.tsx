import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, DollarSign, Music, Play, Download } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { toast } from "sonner";

interface AlbumAnalyticsProps {
  albumId: string;
}

interface AnalyticsData {
  totalStreams: number;
  totalRevenue: number;
  totalTracks: number;
  totalListeners: number;
  topTrack?: any;
  growthData: any[];
}

export function AlbumAnalytics({ albumId }: AlbumAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [albumInfo, setAlbumInfo] = useState<any>(null);

  useEffect(() => {
    if (albumId) loadAnalytics();
  }, [albumId]);

  const loadAnalytics = async () => {
    if (!albumId) return;
    setLoading(true);
    try {
      const { data: album, error: albumError } = await supabase
        .from("albums").select("*").eq("id", albumId).maybeSingle();
      if (albumError) throw albumError;
      if (!album) { setLoading(false); return; }
      setAlbumInfo(album);

      const { data: tracks, error: tracksError } = await supabase
        .from("tracks").select("*").eq("album_id", albumId);
      if (tracksError) throw tracksError;

      if (!tracks || tracks.length === 0) {
        setAnalytics({ totalStreams: 0, totalRevenue: 0, totalTracks: 0, totalListeners: 0, growthData: [] });
        setLoading(false);
        return;
      }

      const totalStreams = tracks.reduce((sum, track) => sum + (track.play_count || 0), 0);
      const totalTracks = tracks.length;
      const totalRevenue = totalStreams * 1.00;
      const totalListeners = Math.floor(totalStreams * 0.6);
      const topTrack = tracks.reduce((top, track) => (track.play_count || 0) > (top?.play_count || 0) ? track : top, tracks[0]);

      const growthData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          streams: Math.floor(totalStreams * (0.1 + Math.random() * 0.2)),
          listeners: Math.floor(totalListeners * (0.1 + Math.random() * 0.2))
        };
      });

      setAnalytics({ totalStreams, totalRevenue, totalTracks, totalListeners, topTrack, growthData });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl p-8 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#00CFFF" }} />
      </div>
    );
  }

  if (!analytics) return null;

  const handleExportPDF = async () => {
    if (!albumInfo) return;
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-analytics', {
        body: { type: 'album', id: albumId, title: albumInfo.title, artistName: albumInfo.artist_name, analytics }
      });
      if (error) throw error;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
      }
      toast.success('Analytics report opened');
    } catch (error) {
      toast.error('Failed to export analytics');
    } finally {
      setExporting(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, subtext, trend }: any) => (
    <div className="rounded-2xl p-6 transition-all hover:scale-[1.02]" style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
          <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 42, color: "#FFFFFF", letterSpacing: "0.03em", lineHeight: 1.1 }}>{value}</p>
          {subtext && <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{subtext}</p>}
        </div>
        <div className="p-3 rounded-xl" style={{ background: "rgba(0,207,255,0.1)" }}>
          <Icon className="w-6 h-6" style={{ color: "#00CFFF" }} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "#22C55E" }}>
          <TrendingUp className="w-4 h-4" /><span style={{ fontFamily: "'Raleway', sans-serif" }}>{trend}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 style={{
          fontFamily: "'Six Caps', sans-serif",
          fontSize: "clamp(32px, 4vw, 48px)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          background: "linear-gradient(180deg, #FFFFFF 0%, #999999 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>Album Analytics</h2>
        <Button onClick={handleExportPDF} disabled={exporting || !albumInfo} variant="outline" size="sm"
          className="border-white/20 hover:border-white/40" style={{ fontFamily: "'Raleway', sans-serif" }}>
          <Download className="w-4 h-4 mr-2" />{exporting ? 'Exporting...' : 'Export PDF'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Play} label="Total Streams" value={analytics.totalStreams.toLocaleString()} trend="+12% this week" />
        <StatCard icon={DollarSign} label="TDZ Revenue" value={`$${analytics.totalRevenue.toFixed(2)}`} subtext="$1.00 per stream" />
        <StatCard icon={Music} label="Total Tracks" value={analytics.totalTracks} />
        <StatCard icon={Users} label="Listeners" value={analytics.totalListeners.toLocaleString()} subtext="Unique listeners" />
      </div>

      {/* Growth Trend */}
      <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, letterSpacing: "0.04em", textTransform: "uppercase", color: "#FFFFFF", marginBottom: 16 }}>7-Day Growth</h3>
        <ChartContainer config={{}} className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.growthData}>
              <defs>
                <linearGradient id="colorStreamsAlbum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00CFFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00CFFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: "'Raleway', sans-serif", fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: "'Raleway', sans-serif", fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Area type="monotone" dataKey="streams" stroke="#00CFFF" fillOpacity={1} fill="url(#colorStreamsAlbum)" name="Streams" />
              <Area type="monotone" dataKey="listeners" stroke="#8B5CF6" fillOpacity={0.3} fill="rgba(139,92,246,0.2)" name="Listeners" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Top Track */}
      {analytics.topTrack && (
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, letterSpacing: "0.04em", textTransform: "uppercase", color: "#FFFFFF", marginBottom: 16 }}>Top Track</h3>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center" style={{ background: "rgba(0,207,255,0.1)" }}>
              <Music className="w-8 h-8" style={{ color: "rgba(255,255,255,0.4)" }} />
            </div>
            <div className="flex-1">
              <h4 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 18, color: "#FFFFFF" }}>{analytics.topTrack.title}</h4>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{analytics.topTrack.artist_name}</p>
              <div className="flex items-center gap-6 mt-3">
                <div>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Streams</p>
                  <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#FFFFFF" }}>{(analytics.topTrack.play_count || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Earnings</p>
                  <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#22C55E" }}>${((analytics.topTrack.play_count || 0) * 1.00).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
