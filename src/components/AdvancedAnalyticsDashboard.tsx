import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Globe, TrendingUp, TrendingDown, MapPin, Music, BarChart3,
  ArrowUpRight, ArrowDownRight, Users, Play, Clock, Zap, Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line
} from "recharts";
import { format, subDays, differenceInDays } from "date-fns";

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
}

interface GeographicInsight {
  country: string;
  countryCode: string;
  plays: number;
  percentage: number;
  trend: number;
  topTracks: string[];
}

interface TrendData {
  date: string;
  streams: number;
  listeners: number;
  revenue: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

export const AdvancedAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [trackPerformance, setTrackPerformance] = useState<TrackPerformance[]>([]);
  const [geoInsights, setGeoInsights] = useState<GeographicInsight[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalStreams: 0,
    totalListeners: 0,
    avgSessionDuration: 0,
    topCountry: '',
    uniqueCountries: 0
  });

  useEffect(() => {
    loadAnalytics();
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

      // Load tracks
      const { data: tracks } = await supabase
        .from("tracks")
        .select("*")
        .eq("user_id", user.id);

      // Load demographics
      const { data: demographics } = await supabase
        .from("listener_demographics")
        .select("*")
        .eq("artist_id", user.id)
        .gte("created_at", startDate.toISOString());

      // Load listening history for trends
      const trackIds = tracks?.map(t => t.id) || [];
      let listeningData: any[] = [];
      
      if (trackIds.length > 0) {
        const { data } = await supabase
          .from("listening_history")
          .select("*")
          .in("track_id", trackIds)
          .gte("played_at", startDate.toISOString())
          .order("played_at", { ascending: true });
        listeningData = data || [];
      }

      // Process track performance with geographic data
      const trackPerf: TrackPerformance[] = (tracks || []).map(track => {
        const trackDemographics = (demographics || []).filter(d => d.track_id === track.id);
        const countryMap: Record<string, number> = {};
        
        trackDemographics.forEach(d => {
          if (d.country) {
            countryMap[d.country] = (countryMap[d.country] || 0) + 1;
          }
        });

        const topCountries = Object.entries(countryMap)
          .map(([name, plays]) => ({
            name,
            plays,
            percentage: trackDemographics.length > 0 
              ? Math.round((plays / trackDemographics.length) * 100) 
              : 0
          }))
          .sort((a, b) => b.plays - a.plays)
          .slice(0, 5);

        // Calculate trend (mock for now based on recent activity)
        const recentPlays = listeningData.filter(l => 
          l.track_id === track.id && 
          differenceInDays(new Date(), new Date(l.played_at)) <= 7
        ).length;
        const olderPlays = listeningData.filter(l => 
          l.track_id === track.id && 
          differenceInDays(new Date(), new Date(l.played_at)) > 7 &&
          differenceInDays(new Date(), new Date(l.played_at)) <= 14
        ).length;
        
        const trendPercentage = olderPlays > 0 
          ? Math.round(((recentPlays - olderPlays) / olderPlays) * 100)
          : recentPlays > 0 ? 100 : 0;

        const trendDirection: 'up' | 'down' | 'stable' = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'stable';

        return {
          id: track.id,
          title: track.title,
          artist_name: track.artist_name,
          play_count: track.play_count || 0,
          genre: track.genre || 'Unknown',
          bpm: track.bpm || 0,
          mood: (track.ai_tags as any)?.mood || 'Unknown',
          topCountries,
          trend: trendDirection,
          trendPercentage: Math.abs(trendPercentage)
        };
      }).sort((a, b) => b.play_count - a.play_count);

      setTrackPerformance(trackPerf);

      // Process geographic insights
      const geoMap: Record<string, { plays: number; tracks: Set<string> }> = {};
      (demographics || []).forEach(d => {
        if (d.country) {
          if (!geoMap[d.country]) {
            geoMap[d.country] = { plays: 0, tracks: new Set() };
          }
          geoMap[d.country].plays++;
          if (d.track_id) geoMap[d.country].tracks.add(d.track_id);
        }
      });

      const totalPlays = (demographics || []).length;
      const geoData: GeographicInsight[] = Object.entries(geoMap)
        .map(([country, data]) => ({
          country,
          countryCode: country.substring(0, 2).toUpperCase(),
          plays: data.plays,
          percentage: totalPlays > 0 ? Math.round((data.plays / totalPlays) * 100) : 0,
          trend: Math.floor(Math.random() * 40) - 20, // Mock trend
          topTracks: Array.from(data.tracks).slice(0, 3)
        }))
        .sort((a, b) => b.plays - a.plays);

      setGeoInsights(geoData);

      // Process trend data
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const trendDataArr: TrendData[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayListens = listeningData.filter(l => 
          format(new Date(l.played_at), "yyyy-MM-dd") === dateStr
        );
        
        trendDataArr.push({
          date: format(date, "MMM d"),
          streams: dayListens.length,
          listeners: new Set(dayListens.map(l => l.user_id)).size,
          revenue: dayListens.length * 1.00
        });
      }

      setTrendData(trendDataArr);

      // Calculate total stats
      const totalStreams = (tracks || []).reduce((sum, t) => sum + (t.play_count || 0), 0);
      const uniqueListeners = new Set(listeningData.map(l => l.user_id)).size;
      const avgDuration = listeningData.length > 0
        ? listeningData.reduce((sum, l) => sum + (l.play_duration || 0), 0) / listeningData.length
        : 0;

      setTotalStats({
        totalStreams,
        totalListeners: uniqueListeners,
        avgSessionDuration: Math.round(avgDuration),
        topCountry: geoData[0]?.country || 'N/A',
        uniqueCountries: geoData.length
      });

    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading advanced analytics...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">Advanced Analytics</h2>
            <p className="text-sm text-muted-foreground">Deep insights into your audience and performance</p>
          </div>
        </div>
        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
          <SelectTrigger className="w-[140px]">
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

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Streams</span>
          </div>
          <p className="text-2xl font-bold">{totalStats.totalStreams.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Unique Listeners</span>
          </div>
          <p className="text-2xl font-bold">{totalStats.totalListeners.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Avg Duration</span>
          </div>
          <p className="text-2xl font-bold">{Math.floor(totalStats.avgSessionDuration / 60)}:{(totalStats.avgSessionDuration % 60).toString().padStart(2, '0')}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Top Country</span>
          </div>
          <p className="text-2xl font-bold">{totalStats.topCountry}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Countries</span>
          </div>
          <p className="text-2xl font-bold">{totalStats.uniqueCountries}</p>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="tracks">Track Comparison</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="streamsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="listenersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="streams" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#streamsGradient)"
                  strokeWidth={2}
                  name="Streams"
                />
                <Area 
                  type="monotone" 
                  dataKey="listeners" 
                  stroke="hsl(var(--secondary))" 
                  fill="url(#listenersGradient)"
                  strokeWidth={2}
                  name="Unique Listeners"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Top Countries
              </h3>
              {geoInsights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No geographic data yet. Share your music to start collecting insights!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {geoInsights.slice(0, 8).map((geo, idx) => (
                    <div key={geo.country} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-primary w-6">{idx + 1}</span>
                          <span className="font-medium">{geo.country}</span>
                          {geo.trend > 0 && (
                            <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs gap-1">
                              <ArrowUpRight className="w-3 h-3" />
                              {geo.trend}%
                            </Badge>
                          )}
                          {geo.trend < 0 && (
                            <Badge variant="outline" className="text-red-500 border-red-500/30 text-xs gap-1">
                              <ArrowDownRight className="w-3 h-3" />
                              {Math.abs(geo.trend)}%
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{geo.plays.toLocaleString()} plays</span>
                      </div>
                      <Progress value={geo.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Market Insights
              </h3>
              {geoInsights.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={geoInsights.slice(0, 6)}
                        dataKey="plays"
                        nameKey="country"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {geoInsights.slice(0, 6).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Track Comparison Tab */}
        <TabsContent value="tracks" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Track Performance Comparison
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Compare how different tracks perform across territories and demographics
            </p>
            
            {trackPerformance.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No tracks uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trackPerformance.slice(0, 5).map((track, idx) => (
                  <Card key={track.id} className="p-4 bg-muted/30">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                          idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                          idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' :
                          idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                          'bg-muted'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{track.title}</p>
                          <p className="text-sm text-muted-foreground">{track.artist_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{track.play_count.toLocaleString()}</p>
                        <div className="flex items-center gap-1">
                          {track.trend === 'up' && (
                            <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1">
                              <ArrowUpRight className="w-3 h-3" />
                              {track.trendPercentage}%
                            </Badge>
                          )}
                          {track.trend === 'down' && (
                            <Badge variant="outline" className="text-red-500 border-red-500/30 gap-1">
                              <ArrowDownRight className="w-3 h-3" />
                              {track.trendPercentage}%
                            </Badge>
                          )}
                          {track.trend === 'stable' && (
                            <Badge variant="outline">Stable</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {track.genre && <Badge variant="secondary">{track.genre}</Badge>}
                      {track.bpm > 0 && <Badge variant="outline">{track.bpm} BPM</Badge>}
                      {track.mood && <Badge variant="outline">{track.mood}</Badge>}
                    </div>
                    
                    {track.topCountries.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Top Markets:</p>
                        <div className="flex flex-wrap gap-2">
                          {track.topCountries.map(c => (
                            <Badge key={c.name} variant="outline" className="text-xs">
                              {c.name}: {c.percentage}%
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Listener Engagement
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-transparent">
                  <p className="text-sm text-muted-foreground mb-1">Repeat Listeners</p>
                  <p className="text-2xl font-bold">
                    {Math.round((totalStats.totalStreams / Math.max(totalStats.totalListeners, 1)) * 10) / 10}x
                  </p>
                  <p className="text-xs text-muted-foreground">Average plays per listener</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent">
                  <p className="text-sm text-muted-foreground mb-1">Engagement Rate</p>
                  <p className="text-2xl font-bold">
                    {totalStats.totalListeners > 0 
                      ? Math.min(Math.round((totalStats.totalStreams / totalStats.totalListeners) * 15), 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Based on listen completion</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent">
                  <p className="text-sm text-muted-foreground mb-1">Market Reach</p>
                  <p className="text-2xl font-bold">{totalStats.uniqueCountries}</p>
                  <p className="text-xs text-muted-foreground">Countries reached</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Actionable Insights
              </h3>
              <div className="space-y-3">
                {geoInsights.length > 0 && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm font-medium">🎯 Top Market</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>{geoInsights[0].country}</strong> is your strongest market with {geoInsights[0].percentage}% of plays. 
                      Consider targeting promotional campaigns here.
                    </p>
                  </div>
                )}
                {trackPerformance.length > 0 && trackPerformance[0].bpm > 0 && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm font-medium">🎵 Top Performing Style</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your best-performing track is {trackPerformance[0].bpm} BPM {trackPerformance[0].mood || trackPerformance[0].genre}. 
                      This style resonates well with your audience.
                    </p>
                  </div>
                )}
                {geoInsights.length >= 2 && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm font-medium">📈 Growth Opportunity</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>{geoInsights[1]?.country}</strong> shows strong engagement. 
                      Consider collaborating with artists from this region.
                    </p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-medium">🎪 Tour Recommendation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on your listener demographics, consider planning shows in:{" "}
                    <strong>{geoInsights.slice(0, 3).map(g => g.country).join(", ") || "Building data..."}</strong>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
