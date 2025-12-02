import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, TrendingUp, DollarSign,
  Music, Users, Play, Heart, Activity, Calendar, Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { format, subDays, endOfMonth } from "date-fns";

type AnalyticsData = {
  totalStreams: number;
  streamingRevenue: number;
  totalDownloads: number;
  downloadRevenue: number;
  totalEarnings: number;
  totalTracks: number;
  totalPublishedTracks: number;
  totalListeners: number;
  totalLikes: number;
  topTracks: any[];
  dailyStreams: any[];
  upcomingPayout: string;
};

interface DistributionAnalyticsProps {
  showAdvanced?: boolean;
}

export const DistributionAnalytics = ({ showAdvanced = true }: DistributionAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalStreams: 0,
    streamingRevenue: 0,
    totalDownloads: 0,
    downloadRevenue: 0,
    totalEarnings: 0,
    totalTracks: 0,
    totalPublishedTracks: 0,
    totalListeners: 0,
    totalLikes: 0,
    topTracks: [],
    dailyStreams: [],
    upcomingPayout: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tracks, error: tracksError } = await supabase
        .from("tracks")
        .select("*")
        .eq("user_id", user.id);

      if (tracksError) throw tracksError;

      const publishedTracks = tracks?.filter(t => t.is_published) || [];
      const totalStreams = tracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
      const totalLikes = tracks?.reduce((sum, t) => sum + (t.like_count || 0), 0) || 0;
      const totalTracks = tracks?.length || 0;
      const totalPublishedTracks = publishedTracks.length;
      
      // $1.00 per stream - the TDZ model
      const streamingRevenue = totalStreams * 1.00;
      const totalDownloads = 0;
      const downloadRevenue = 0;
      const totalEarnings = streamingRevenue + downloadRevenue;

      const topTracks = [...(tracks || [])]
        .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
        .slice(0, 5);

      const thirtyDaysAgo = subDays(new Date(), 30);
      const trackIds = tracks?.map(t => t.id) || [];
      
      let totalListeners = 0;
      if (trackIds.length > 0) {
        const { data: listeners } = await supabase
          .from("listening_history")
          .select("user_id")
          .in("track_id", trackIds)
          .gte("played_at", thirtyDaysAgo.toISOString());
        
        totalListeners = new Set(listeners?.map(l => l.user_id)).size;
      }

      const dailyStreams = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayFactor = (30 - i) / 30;
        const variance = 0.8 + Math.random() * 0.4;
        const dailyCount = Math.floor((totalStreams / 30) * dayFactor * variance);
        
        dailyStreams.push({
          date: format(date, "MMM d"),
          streams: dailyCount,
          revenue: dailyCount * 1.00,
        });
      }

      const payoutDate = format(endOfMonth(new Date()), "MMMM d, yyyy");

      setAnalytics({
        totalStreams,
        streamingRevenue,
        totalDownloads,
        downloadRevenue,
        totalEarnings,
        totalTracks,
        totalPublishedTracks,
        totalListeners,
        totalLikes,
        topTracks,
        dailyStreams,
        upcomingPayout: payoutDate,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Artist Earnings Dashboard</h2>
          <p className="text-sm text-muted-foreground">$1 per stream · 100% download revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-green-500">${analytics.totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Streams + Downloads</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="glass-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Streaming Revenue</p>
              <p className="text-3xl font-bold">${analytics.streamingRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{analytics.totalStreams.toLocaleString()} × $1.00</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="glass-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Download Revenue</p>
              <p className="text-3xl font-bold">${analytics.downloadRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{analytics.totalDownloads} downloads</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="glass-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Monthly Listeners</p>
              <p className="text-3xl font-bold">{analytics.totalListeners.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="glass-card p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold">Next Payout: {analytics.upcomingPayout}</p>
              <p className="text-sm text-muted-foreground">Estimated: ${analytics.totalEarnings.toFixed(2)}</p>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">$1.00/Stream</Badge>
        </div>
      </Card>

      {/* Advanced Analytics - Only shown for Pro+ plans */}
      {showAdvanced ? (
        <>
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Earnings Over Time (Last 30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.dailyStreams}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(142, 76%, 36%)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Top Earning Tracks
              </h3>
              {analytics.topTracks.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topTracks.map((track, idx) => (
                    <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <span className="text-2xl font-bold text-muted-foreground w-8">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{track.title}</p>
                        <p className="text-sm text-muted-foreground">{track.artist_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-500">${(track.play_count || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{(track.play_count || 0).toLocaleString()} streams</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No tracks yet. Upload and publish your first track!</p>
                </div>
              )}
            </Card>

            <Card className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Stats Summary
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>Total Likes</span>
                  </div>
                  <p className="text-2xl font-bold text-red-500">{analytics.totalLikes.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-primary" />
                    <span>Published Tracks</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{analytics.totalPublishedTracks}</p>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card className="glass-card p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Upgrade for Advanced Analytics</h3>
          <p className="text-muted-foreground mb-4">
            Get detailed charts, top tracks breakdown, and earnings over time with the Pro plan.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{analytics.totalLikes.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Likes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{analytics.totalPublishedTracks}</p>
              <p className="text-xs text-muted-foreground">Published Tracks</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};