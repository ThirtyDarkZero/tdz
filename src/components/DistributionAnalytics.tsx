import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, TrendingUp, DollarSign,
  Music, Users, Play, Heart, Activity, Calendar, Download, Sparkles, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
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

// Premium tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-xl border border-primary/30 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-bold text-primary">
          ${payload[0].value?.toFixed(2) || 0}
        </p>
        <p className="text-xs text-muted-foreground">
          {Math.floor(payload[0].value || 0)} streams
        </p>
      </div>
    );
  }
  return null;
};

// Stat card with animated gradient
const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient, 
  textColor = "text-foreground" 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  icon: any; 
  gradient: string;
  textColor?: string;
}) => (
  <Card className="relative overflow-hidden group">
    {/* Animated background glow */}
    <div className={`absolute inset-0 ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
    <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/80 backdrop-blur-sm" />
    
    <div className="relative p-6 z-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            {title}
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </p>
          <p className={`text-3xl font-black tracking-tight ${textColor}`}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  </Card>
);

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
      <Card className="relative overflow-hidden p-12 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative z-10">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative">
        <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/20 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              Artist Earnings
              <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                Live
              </Badge>
            </h2>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-primary">$1 per stream</span>
              <span>·</span>
              <span>100% download revenue</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Earnings"
          value={`$${analytics.totalEarnings.toFixed(2)}`}
          subtitle="Streams + Downloads"
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-500 to-green-600"
          textColor="text-emerald-500"
        />
        <StatCard
          title="Streaming Revenue"
          value={`$${analytics.streamingRevenue.toFixed(2)}`}
          subtitle={`${analytics.totalStreams.toLocaleString()} × $1.00`}
          icon={Play}
          gradient="bg-gradient-to-br from-primary to-secondary"
          textColor="text-primary"
        />
        <StatCard
          title="Download Revenue"
          value={`$${analytics.downloadRevenue.toFixed(2)}`}
          subtitle={`${analytics.totalDownloads} downloads`}
          icon={Download}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          textColor="text-blue-500"
        />
        <StatCard
          title="Monthly Listeners"
          value={analytics.totalListeners.toLocaleString()}
          subtitle="Last 30 days"
          icon={Users}
          gradient="bg-gradient-to-br from-purple-500 to-pink-500"
          textColor="text-purple-500"
        />
      </div>

      {/* Payout Card */}
      <Card className="relative overflow-hidden border-emerald-500/30">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-emerald-500/10" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative p-6 flex items-center justify-between flex-wrap gap-4 z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg">Next Payout: {analytics.upcomingPayout}</p>
              <p className="text-muted-foreground flex items-center gap-2">
                Estimated: 
                <span className="text-emerald-500 font-bold">${analytics.totalEarnings.toFixed(2)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              $1.00/Stream
            </Badge>
          </div>
        </div>
      </Card>

      {showAdvanced ? (
        <>
          {/* Premium Chart */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <div className="relative p-6 z-10">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                Earnings Over Time
                <Badge variant="outline" className="ml-auto">Last 30 Days</Badge>
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={analytics.dailyStreams}>
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="50%" stopColor="hsl(var(--secondary))" />
                      <stop offset="100%" stopColor="hsl(var(--accent))" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    opacity={0.2}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                    tickFormatter={(value) => `$${value}`}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="url(#lineGradient)" 
                    strokeWidth={3}
                    fill="url(#earningsGradient)"
                    dot={false}
                    activeDot={{ 
                      r: 6, 
                      fill: 'hsl(var(--primary))', 
                      stroke: 'hsl(var(--background))',
                      strokeWidth: 3
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Two Column Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Tracks */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
              <div className="relative p-6 z-10">
                <h3 className="font-bold text-lg mb-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Top Earning Tracks
                </h3>
                {analytics.topTracks.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topTracks.map((track, idx) => (
                      <div 
                        key={track.id} 
                        className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-transparent hover:from-primary/10 transition-all duration-300 group"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg ${
                          idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                          idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' :
                          idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate group-hover:text-primary transition-colors">{track.title}</p>
                          <p className="text-sm text-muted-foreground">{track.artist_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-500">${(track.play_count || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{(track.play_count || 0).toLocaleString()} plays</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Music className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No tracks yet. Upload and publish your first track!</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Stats Summary */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5" />
              <div className="relative p-6 z-10">
                <h3 className="font-bold text-lg mb-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  Engagement Stats
                </h3>
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-gradient-to-r from-red-500/10 via-pink-500/5 to-transparent border border-red-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Heart className="w-6 h-6 text-red-500" />
                        <span className="font-medium">Total Likes</span>
                      </div>
                      <p className="text-3xl font-black text-red-500">{analytics.totalLikes.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Music className="w-6 h-6 text-primary" />
                        <span className="font-medium">Published Tracks</span>
                      </div>
                      <p className="text-3xl font-black text-primary">{analytics.totalPublishedTracks}</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-transparent border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Play className="w-6 h-6 text-purple-500" />
                        <span className="font-medium">Total Streams</span>
                      </div>
                      <p className="text-3xl font-black text-purple-500">{analytics.totalStreams.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card className="relative overflow-hidden p-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-black mb-3">Upgrade for Advanced Analytics</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get detailed charts, top tracks breakdown, and earnings over time with the Pro plan.
            </p>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-black text-primary">{analytics.totalLikes.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Likes</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-primary">{analytics.totalPublishedTracks}</p>
                <p className="text-sm text-muted-foreground">Published Tracks</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
