import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe, TrendingUp, TrendingDown, MapPin, Music, BarChart3,
  ArrowUpRight, ArrowDownRight, Users, Play, Clock, Zap, Target,
  DollarSign, Sparkles, RefreshCw, Brain, Activity, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

interface TrackPerformance {
  id: string;
  title: string;
  artist_name: string;
  play_count: number;
  genre: string;
  bpm: number;
  mood: string;
  topCountries: { name: string; plays: number; percentage: number }[];
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  revenue: number;
}

interface GeographicInsight {
  country: string;
  countryCode: string;
  plays: number;
  percentage: number;
  trend: number;
  city?: string;
}

interface TrendData {
  date: string;
  streams: number;
  listeners: number;
  revenue: number;
}

const COLORS = ['hsl(var(--primary))', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#06B6D4'];

const GlassCard = ({ children, className = "", gradient = "" }: { children: React.ReactNode; className?: string; gradient?: string }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-border/20 ${className}`}
    style={{
      background: gradient || "rgba(255,255,255,0.03)",
      backdropFilter: "blur(40px) saturate(200%)",
      WebkitBackdropFilter: "blur(40px) saturate(200%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)",
    }}>
    {children}
  </div>
);

export const AdvancedAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [trackPerformance, setTrackPerformance] = useState<TrackPerformance[]>([]);
  const [geoInsights, setGeoInsights] = useState<GeographicInsight[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalStreams: 0,
    totalListeners: 0,
    avgSessionDuration: 0,
    topCountry: '',
    uniqueCountries: 0,
    totalRevenue: 0,
    revenueChange: 0,
  });

  useEffect(() => { loadAnalytics(); }, [timeRange]);

  // Real-time subscription to stream_events
  useEffect(() => {
    const channel = supabase
      .channel('analytics-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listening_history' }, () => {
        loadAnalytics();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [timeRange]);

  const getDateRange = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    return subDays(new Date(), days);
  };

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = getDateRange();

      // Parallel data fetching
      const [tracksRes, demographicsRes, earningsRes, streamEventsRes] = await Promise.all([
        supabase.from("tracks").select("*").eq("user_id", user.id),
        supabase.from("listener_demographics").select("*").eq("artist_id", user.id).gte("created_at", startDate.toISOString()),
        supabase.from("artist_earnings").select("*").eq("artist_id", user.id).order("period_start", { ascending: false }).limit(12),
        supabase.from("stream_events").select("*").eq("artist_id", user.id).gte("streamed_at", startDate.toISOString()).order("streamed_at", { ascending: true }).limit(1000),
      ]);

      const tracks = tracksRes.data || [];
      const demographics = demographicsRes.data || [];
      const earnings = earningsRes.data || [];
      const streamEvents = streamEventsRes.data || [];

      // Also get listening_history for the range
      const trackIds = tracks.map(t => t.id);
      let listeningData: any[] = [];
      if (trackIds.length > 0) {
        const { data } = await supabase.from("listening_history").select("*")
          .in("track_id", trackIds)
          .gte("played_at", startDate.toISOString())
          .order("played_at", { ascending: true })
          .limit(1000);
        listeningData = data || [];
      }

      // --- Process geographic data from stream_events ---
      const geoMap: Record<string, { plays: number; cities: Set<string> }> = {};
      streamEvents.forEach((evt: any) => {
        const country = evt.country_code || (demographics.find(d => d.track_id === evt.track_id)?.country);
        if (country) {
          if (!geoMap[country]) geoMap[country] = { plays: 0, cities: new Set() };
          geoMap[country].plays++;
          if (evt.city) geoMap[country].cities.add(evt.city);
        }
      });
      // Also merge demographics
      demographics.forEach((d: any) => {
        if (d.country) {
          if (!geoMap[d.country]) geoMap[d.country] = { plays: 0, cities: new Set() };
          geoMap[d.country].plays++;
        }
      });

      const totalGeoPlays = Object.values(geoMap).reduce((s, g) => s + g.plays, 0);
      const geoData: GeographicInsight[] = Object.entries(geoMap)
        .map(([country, data]) => ({
          country,
          countryCode: country.substring(0, 2).toUpperCase(),
          plays: data.plays,
          percentage: totalGeoPlays > 0 ? Math.round((data.plays / totalGeoPlays) * 100) : 0,
          trend: 0,
          city: Array.from(data.cities)[0],
        }))
        .sort((a, b) => b.plays - a.plays);
      setGeoInsights(geoData);

      // --- Process track performance ---
      const trackPerf: TrackPerformance[] = tracks.map(track => {
        const trackStreams = streamEvents.filter((e: any) => e.track_id === track.id);
        const trackDemos = demographics.filter((d: any) => d.track_id === track.id);
        const countryMap: Record<string, number> = {};
        [...trackStreams, ...trackDemos].forEach((d: any) => {
          const c = d.country_code || d.country;
          if (c) countryMap[c] = (countryMap[c] || 0) + 1;
        });
        const topCountries = Object.entries(countryMap)
          .map(([name, plays]) => ({ name, plays, percentage: Math.round((plays / Math.max(trackStreams.length + trackDemos.length, 1)) * 100) }))
          .sort((a, b) => b.plays - a.plays).slice(0, 5);

        // Calculate 7-day trend
        const now = new Date();
        const recentPlays = listeningData.filter(l => l.track_id === track.id && (now.getTime() - new Date(l.played_at).getTime()) < 7 * 86400000).length;
        const olderPlays = listeningData.filter(l => l.track_id === track.id && (now.getTime() - new Date(l.played_at).getTime()) >= 7 * 86400000 && (now.getTime() - new Date(l.played_at).getTime()) < 14 * 86400000).length;
        const trendPct = olderPlays > 0 ? Math.round(((recentPlays - olderPlays) / olderPlays) * 100) : recentPlays > 0 ? 100 : 0;

        return {
          id: track.id,
          title: track.title,
          artist_name: track.artist_name,
          play_count: track.play_count || 0,
          genre: track.genre || 'Unknown',
          bpm: track.bpm || 0,
          mood: (track.ai_tags as any)?.mood || 'Unknown',
          topCountries,
          trend: trendPct > 0 ? 'up' : trendPct < 0 ? 'down' : 'stable',
          trendPercentage: Math.abs(trendPct),
          revenue: (track.play_count || 0) * 1.00,
        };
      }).sort((a, b) => b.play_count - a.play_count);
      setTrackPerformance(trackPerf);

      // --- Build trend data ---
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const trendArr: TrendData[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayListens = listeningData.filter(l => format(new Date(l.played_at), "yyyy-MM-dd") === dateStr);
        const dayStreamEvents = streamEvents.filter((e: any) => format(new Date(e.streamed_at), "yyyy-MM-dd") === dateStr);
        const totalDayPlays = Math.max(dayListens.length, dayStreamEvents.length);
        trendArr.push({
          date: days <= 30 ? format(date, "MMM d") : format(date, "MMM"),
          streams: totalDayPlays,
          listeners: new Set([...dayListens.map(l => l.user_id), ...dayStreamEvents.map((e: any) => e.listener_id)].filter(Boolean)).size,
          revenue: totalDayPlays * 1.00,
        });
      }
      setTrendData(trendArr);

      // --- Total stats ---
      const totalStreams = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
      const uniqueListeners = new Set([...listeningData.map(l => l.user_id), ...streamEvents.map((e: any) => e.listener_id)].filter(Boolean)).size;
      const avgDuration = listeningData.length > 0 ? listeningData.reduce((s, l) => s + (l.play_duration || 0), 0) / listeningData.length : 0;
      const totalRevenue = earnings.reduce((s, e) => s + (e.total_earnings || e.streaming_revenue || 0), 0);
      const currentMonthRevenue = earnings[0]?.streaming_revenue || 0;
      const lastMonthRevenue = earnings[1]?.streaming_revenue || 0;
      const revenueChange = lastMonthRevenue > 0 ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

      setTotalStats({
        totalStreams,
        totalListeners: uniqueListeners,
        avgSessionDuration: Math.round(avgDuration),
        topCountry: geoData[0]?.country || 'N/A',
        uniqueCountries: geoData.length,
        totalRevenue,
        revenueChange,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsight = useCallback(async () => {
    setAiLoading(true);
    try {
      const payload = {
        totalStreams: totalStats.totalStreams,
        totalListeners: totalStats.totalListeners,
        topCountry: totalStats.topCountry,
        uniqueCountries: totalStats.uniqueCountries,
        totalRevenue: totalStats.totalRevenue,
        revenueChange: totalStats.revenueChange,
        topTracks: trackPerformance.slice(0, 5).map(t => ({ title: t.title, plays: t.play_count, trend: t.trend, genre: t.genre })),
        geoTop: geoInsights.slice(0, 5).map(g => ({ country: g.country, plays: g.plays, pct: g.percentage })),
        timeRange,
      };

      const { data } = await supabase.functions.invoke("campaign-brain", {
        body: {
          type: "analytics_insight",
          context: JSON.stringify(payload),
          prompt: `Analyze this artist's performance data and provide: 1) Key insights about their growth trajectory, 2) Geographic strategy recommendations, 3) Revenue optimization suggestions, 4) Specific actionable next steps. Be concise and data-driven. Format with emoji headers.`,
        },
      });
      setAiInsight(data?.response || data?.analysis || "Unable to generate insight at this time.");
    } catch {
      setAiInsight("AI analysis temporarily unavailable. Your data is still being tracked in real-time.");
    } finally {
      setAiLoading(false);
    }
  }, [totalStats, trackPerformance, geoInsights, timeRange]);

  const toggleTrackSelection = (id: string) => {
    setSelectedTrackIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(0, 5));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const comparisonTracks = selectedTrackIds.length > 0
    ? trackPerformance.filter(t => selectedTrackIds.includes(t.id))
    : trackPerformance.slice(0, 3);

  const radarData = comparisonTracks.map(t => ({
    track: t.title.length > 12 ? t.title.slice(0, 12) + "…" : t.title,
    plays: Math.min(t.play_count, 100),
    trend: Math.max(t.trendPercentage, 0),
    markets: t.topCountries.length * 20,
    engagement: Math.min(t.play_count * 2, 100),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), #8B5CF6)",
            boxShadow: "0 8px 32px hsla(var(--primary), 0.3)",
          }}>
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "2rem", letterSpacing: "0.04em" }}>ADVANCED ANALYTICS</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-green-400 animate-pulse" />
              Real-time performance tracking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadAnalytics()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-[130px]" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats - 6 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Streams", value: totalStats.totalStreams.toLocaleString(), icon: Play, color: "hsl(var(--primary))", gradient: "from-primary/15 to-transparent" },
          { label: "Unique Listeners", value: totalStats.totalListeners.toLocaleString(), icon: Users, color: "#3B82F6", gradient: "from-blue-500/15 to-transparent" },
          { label: "Revenue", value: `$${totalStats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "#10B981", gradient: "from-green-500/15 to-transparent",
            badge: totalStats.revenueChange !== 0 ? `${totalStats.revenueChange > 0 ? '+' : ''}${totalStats.revenueChange}%` : undefined, badgeColor: totalStats.revenueChange >= 0 ? "text-green-400" : "text-red-400" },
          { label: "Avg Listen", value: `${Math.floor(totalStats.avgSessionDuration / 60)}:${(totalStats.avgSessionDuration % 60).toString().padStart(2, '0')}`, icon: Clock, color: "#F59E0B", gradient: "from-amber-500/15 to-transparent" },
          { label: "Top Country", value: totalStats.topCountry, icon: Globe, color: "#8B5CF6", gradient: "from-purple-500/15 to-transparent" },
          { label: "Countries", value: totalStats.uniqueCountries.toString(), icon: MapPin, color: "#EC4899", gradient: "from-pink-500/15 to-transparent" },
        ].map(stat => (
          <GlassCard key={stat.label} className={`p-4 bg-gradient-to-br ${stat.gradient}`}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</span>
            </div>
            <p className="text-xl font-bold" style={{ color: "var(--text-1)" }}>{stat.value}</p>
            {stat.badge && <span className={`text-[10px] font-bold ${stat.badgeColor}`}>{stat.badge}</span>}
          </GlassCard>
        ))}
      </div>

      {/* AI Insight Panel */}
      <GlassCard className="p-5" gradient="linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.05), rgba(0,0,0,0))">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-sm">AI Analytics Intelligence</h3>
          </div>
          <Button size="sm" variant="outline" onClick={generateAIInsight} disabled={aiLoading} className="gap-1.5 text-xs">
            <Sparkles className="w-3 h-3" />
            {aiLoading ? "Analyzing..." : "Generate Insight"}
          </Button>
        </div>
        {aiInsight ? (
          <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{aiInsight}</div>
        ) : (
          <p className="text-xs text-muted-foreground/60">Click "Generate Insight" for an AI-powered analysis of your performance data.</p>
        )}
      </GlassCard>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 p-1" style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12 }}>
          <TabsTrigger value="trends" className="data-[state=active]:bg-primary/20 rounded-lg text-xs">
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Trends
          </TabsTrigger>
          <TabsTrigger value="geographic" className="data-[state=active]:bg-primary/20 rounded-lg text-xs">
            <Globe className="w-3.5 h-3.5 mr-1.5" /> Geographic
          </TabsTrigger>
          <TabsTrigger value="tracks" className="data-[state=active]:bg-primary/20 rounded-lg text-xs">
            <Music className="w-3.5 h-3.5 mr-1.5" /> Comparison
          </TabsTrigger>
          <TabsTrigger value="audience" className="data-[state=active]:bg-primary/20 rounded-lg text-xs">
            <Users className="w-3.5 h-3.5 mr-1.5" /> Audience
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Performance Trends
              </h3>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--primary))" }} /> Streams</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#8B5CF6" }} /> Listeners</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="streamsG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="listenersG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(10,10,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, backdropFilter: 'blur(20px)' }} />
                <Area type="monotone" dataKey="streams" stroke="hsl(var(--primary))" fill="url(#streamsG)" strokeWidth={2.5} name="Streams" />
                <Area type="monotone" dataKey="listeners" stroke="#8B5CF6" fill="url(#listenersG)" strokeWidth={2} name="Unique Listeners" />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Revenue trend */}
          <GlassCard className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Earnings Trend <span className="text-xs text-muted-foreground font-normal">($1.00 per stream)</span>
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(10,10,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {trendData.map((_, i) => <Cell key={i} fill={`rgba(16,185,129,${0.3 + (i / trendData.length) * 0.7})`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <GlassCard className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Top Countries
              </h3>
              {geoInsights.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No geographic data yet</p>
                  <p className="text-xs mt-1 opacity-60">Share your music to collect global insights</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {geoInsights.slice(0, 10).map((geo, idx) => (
                    <div key={geo.country} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold w-5 text-xs" style={{ color: COLORS[idx % COLORS.length] }}>{idx + 1}</span>
                          <span className="font-medium text-sm">{geo.country}</span>
                          {geo.city && <span className="text-[10px] text-muted-foreground">({geo.city})</span>}
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">{geo.plays.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{
                          width: `${geo.percentage}%`,
                          background: `linear-gradient(90deg, ${COLORS[idx % COLORS.length]}, ${COLORS[(idx + 1) % COLORS.length]})`,
                          boxShadow: `0 0 8px ${COLORS[idx % COLORS.length]}40`,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Market Distribution
              </h3>
              {geoInsights.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={geoInsights.slice(0, 8)} dataKey="plays" nameKey="country" cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                        {geoInsights.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.3)" />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(10,10,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No data available</div>
              )}
            </GlassCard>
          </div>
        </TabsContent>

        {/* Track Comparison Tab - Interactive */}
        <TabsContent value="tracks" className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Track Performance Comparison
              </h3>
              <p className="text-[10px] text-muted-foreground">Click tracks to compare (max 5)</p>
            </div>

            {trackPerformance.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No tracks uploaded yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Track list with selection */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {trackPerformance.map((track, idx) => {
                    const isSelected = selectedTrackIds.includes(track.id);
                    return (
                      <div key={track.id} onClick={() => toggleTrackSelection(track.id)}
                        className="p-3 rounded-xl cursor-pointer transition-all duration-200 border"
                        style={{
                          background: isSelected ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.02)",
                          borderColor: isSelected ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)",
                        }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs" style={{
                              background: idx < 3 ? `linear-gradient(135deg, ${COLORS[idx]}, ${COLORS[idx]}88)` : "rgba(255,255,255,0.06)",
                              color: idx < 3 ? "#fff" : "var(--text-3)",
                            }}>{idx + 1}</div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{track.title}</p>
                              <div className="flex items-center gap-1.5">
                                {track.genre !== 'Unknown' && <Badge variant="outline" className="text-[9px] h-4 px-1.5">{track.genre}</Badge>}
                                {track.bpm > 0 && <span className="text-[9px] text-muted-foreground">{track.bpm}bpm</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{track.play_count.toLocaleString()}</p>
                            <div className="flex items-center justify-end gap-0.5">
                              {track.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-400" />}
                              {track.trend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-400" />}
                              <span className={`text-[10px] font-bold ${track.trend === 'up' ? 'text-green-400' : track.trend === 'down' ? 'text-red-400' : 'text-muted-foreground'}`}>
                                {track.trendPercentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                        {track.topCountries.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {track.topCountries.slice(0, 3).map(c => (
                              <span key={c.name} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-3)" }}>
                                {c.name} {c.percentage}%
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Radar comparison chart */}
                <div className="flex flex-col items-center justify-center">
                  <p className="text-xs text-muted-foreground mb-3">Multi-dimensional comparison</p>
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <RadarChart data={[
                        { metric: "Plays", ...Object.fromEntries(comparisonTracks.map(t => [t.title.slice(0, 10), Math.min(t.play_count, 100)])) },
                        { metric: "Trend", ...Object.fromEntries(comparisonTracks.map(t => [t.title.slice(0, 10), t.trendPercentage])) },
                        { metric: "Markets", ...Object.fromEntries(comparisonTracks.map(t => [t.title.slice(0, 10), t.topCountries.length * 20])) },
                        { metric: "Revenue", ...Object.fromEntries(comparisonTracks.map(t => [t.title.slice(0, 10), Math.min(t.revenue, 100)])) },
                      ]}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <PolarRadiusAxis tick={false} axisLine={false} />
                        {comparisonTracks.map((t, i) => (
                          <Radar key={t.id} name={t.title} dataKey={t.title.slice(0, 10)} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                        ))}
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(10,10,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select tracks to compare</p>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm">Repeat Rate</h3>
              </div>
              <p className="text-3xl font-bold" style={{ color: "var(--text-1)" }}>
                {(totalStats.totalStreams / Math.max(totalStats.totalListeners, 1)).toFixed(1)}x
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Average plays per listener</p>
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.min((totalStats.totalStreams / Math.max(totalStats.totalListeners, 1)) * 20, 100)}%`,
                  background: "linear-gradient(90deg, hsl(var(--primary)), #8B5CF6)",
                }} />
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Engagement Score</h3>
              </div>
              <p className="text-3xl font-bold" style={{ color: "var(--text-1)" }}>
                {totalStats.totalListeners > 0 ? Math.min(Math.round((totalStats.totalStreams / totalStats.totalListeners) * 15), 100) : 0}%
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Listen completion rate</p>
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.min(Math.round((totalStats.totalStreams / Math.max(totalStats.totalListeners, 1)) * 15), 100)}%`,
                  background: "linear-gradient(90deg, #F59E0B, #EF4444)",
                }} />
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm">Global Reach</h3>
              </div>
              <p className="text-3xl font-bold" style={{ color: "var(--text-1)" }}>{totalStats.uniqueCountries}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Countries reached</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {geoInsights.slice(0, 5).map(g => (
                  <span key={g.country} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(6,182,212,0.1)", color: "#06B6D4" }}>
                    {g.country}
                  </span>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Actionable Insights */}
          <GlassCard className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Actionable Insights
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {geoInsights.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <p className="text-sm font-medium">🎯 Top Market</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>{geoInsights[0].country}</strong> leads with {geoInsights[0].percentage}% of plays. Focus marketing here.
                  </p>
                </div>
              )}
              {trackPerformance.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <p className="text-sm font-medium">💰 Revenue Leader</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    "{trackPerformance[0].title}" earned ${trackPerformance[0].revenue.toLocaleString()}
                    {trackPerformance[0].trend === 'up' && ` (+${trackPerformance[0].trendPercentage}% growth)`}
                  </p>
                </div>
              )}
              {geoInsights.length >= 2 && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <p className="text-sm font-medium">📈 Growth Opportunity</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>{geoInsights[1]?.country}</strong> is gaining traction. Consider collaborating with local artists.
                  </p>
                </div>
              )}
              <div className="p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <p className="text-sm font-medium">🎪 Tour Hotspots</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Top markets: <strong>{geoInsights.slice(0, 3).map(g => g.country).join(", ") || "Building data..."}</strong>
                </p>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};
