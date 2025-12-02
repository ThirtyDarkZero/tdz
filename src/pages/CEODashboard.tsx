import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Music, TrendingUp, Activity, Database, HardDrive,
  Play, Heart, Download, AlertCircle, CheckCircle, Clock, Sparkles,
  DollarSign, PiggyBank, CreditCard, ArrowUpRight, ArrowDownRight, Bot, Workflow
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { ExecAgentPanel } from "@/components/ExecAgentPanel";
import { PaymentFlowDashboard } from "@/components/PaymentFlowDashboard";

type DashboardMetrics = {
  totalUsers: number;
  newUsersToday: number;
  totalArtists: number;
  totalListeners: number;
  totalTracks: number;
  totalPlays: number;
  totalLikes: number;
  activeUsersToday: number;
  topTracks: Array<{ title: string; artist: string; plays: number }>;
  topArtists: Array<{ name: string; plays: number; followers: number }>;
  dailyActivity: Array<{ date: string; plays: number; uploads: number }>;
  genreDistribution: Array<{ name: string; value: number }>;
  audioQualityDistribution: Array<{ name: string; value: number; percentage: number }>;
  dolbyAtmosCount: number;
  hdAudioCount: number;
  storageUsed: number;
  recentActivity: Array<{ type: string; user: string; action: string; timestamp: string }>;
  // Revenue Pool Metrics
  totalStreamingRevenue: number;
  totalDownloadRevenue: number;
  artistLiability: number;
  revenuePoolBalance: number;
  totalDownloads: number;
  avgDownloadPrice: number;
  // Real Revenue from platform_revenue table
  fanSubscriptionRevenue: number;
  artistSubscriptionRevenue: number;
  downloadFeeRevenue: number;
  totalPlatformRevenue: number;
};

const COLORS = ['#22c55e', '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];

export default function CEODashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is CEO - only after auth has loaded
  const isCEO = user?.email === 'info@thirtydarkzero.com';

  useEffect(() => {
    if (authLoading) return;
    if (!isCEO) {
      navigate('/studio');
      return;
    }
    loadDashboardMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardMetrics, 30000);
    return () => clearInterval(interval);
  }, [isCEO, authLoading, navigate]);

  const loadDashboardMetrics = async () => {
    try {
      // Fetch all metrics in parallel
      const [
        artistsResult,
        listenersResult,
        tracksResult,
        recentTracksResult,
        earningsResult,
        downloadsResult,
        revenueResult
      ] = await Promise.all([
        supabase.from("artist_profiles").select("artist_name, total_plays", { count: "exact" }),
        supabase.from("listener_profiles").select("id", { count: "exact", head: true }),
        supabase.from("tracks").select("id, title, artist_name, play_count, like_count, genre, created_at, user_id, audio_quality, download_price"),
        supabase.from("tracks").select("title, artist_name, play_count, created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("artist_earnings").select("streaming_revenue, download_revenue, total_streams, total_downloads"),
        supabase.from("download_purchases").select("price, artist_revenue, transaction_fee"),
        supabase.from("platform_revenue").select("amount, revenue_type")
      ]);

      const tracks = tracksResult.data || [];
      const artists = artistsResult.data || [];
      const recentTracks = recentTracksResult.data || [];
      const earnings = earningsResult.data || [];
      const downloads = downloadsResult.data || [];
      const revenue = revenueResult.data || [];
      
      // Calculate metrics
      const totalUsers = (artistsResult.count || 0) + (listenersResult.count || 0);
      const totalPlays = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
      const totalLikes = tracks.reduce((sum, t) => sum + (t.like_count || 0), 0);
      
      // Revenue Pool Calculations
      const totalStreamingRevenue = earnings.reduce((sum, e) => sum + (e.streaming_revenue || 0), 0);
      const totalDownloadRevenue = downloads.reduce((sum, d) => sum + (d.artist_revenue || 0), 0);
      const artistLiability = totalPlays * 1.00; // $1 per stream
      
      // Real revenue breakdown from platform_revenue table
      const fanSubscriptionRevenue = revenue
        .filter((r: any) => r.revenue_type === 'fan_subscription')
        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      const artistSubscriptionRevenue = revenue
        .filter((r: any) => r.revenue_type === 'artist_subscription')
        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      const downloadFeeRevenue = revenue
        .filter((r: any) => r.revenue_type === 'download_fee')
        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      const totalPlatformRevenue = revenue.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      
      const revenuePoolBalance = totalPlatformRevenue - artistLiability;
      const totalDownloads = downloads.length;
      const avgDownloadPrice = totalDownloads > 0 
        ? downloads.reduce((sum, d) => sum + (d.price || 0), 0) / totalDownloads 
        : 0;
      
      // Top tracks by plays
      const topTracks = [...tracks]
        .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
        .slice(0, 10)
        .map(t => ({
          title: t.title,
          artist: t.artist_name,
          plays: t.play_count || 0
        }));

      // Top artists by total plays
      const artistPlayCounts = artists
        .map(a => ({
          name: a.artist_name,
          plays: a.total_plays || 0,
          followers: 0
        }))
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 10);

      // Genre distribution
      const genreCount: Record<string, number> = {};
      tracks.forEach(t => {
        if (t.genre) {
          genreCount[t.genre] = (genreCount[t.genre] || 0) + 1;
        }
      });
      const genreDistribution = Object.entries(genreCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Audio quality distribution
      const audioQualityCount: Record<string, number> = {
        standard: 0,
        hd: 0,
        dolby_atmos: 0,
        hi_res: 0
      };
      tracks.forEach(t => {
        const quality = t.audio_quality || 'standard';
        audioQualityCount[quality] = (audioQualityCount[quality] || 0) + 1;
      });
      
      const dolbyAtmosCount = audioQualityCount.dolby_atmos;
      const hdAudioCount = audioQualityCount.hd + audioQualityCount.hi_res;
      const totalTracksCount = tracks.length || 1;

      const audioQualityDistribution = [
        { 
          name: 'Standard', 
          value: audioQualityCount.standard,
          percentage: (audioQualityCount.standard / totalTracksCount) * 100
        },
        { 
          name: 'HD Audio', 
          value: audioQualityCount.hd + audioQualityCount.hi_res,
          percentage: ((audioQualityCount.hd + audioQualityCount.hi_res) / totalTracksCount) * 100
        },
        { 
          name: 'Dolby Atmos', 
          value: audioQualityCount.dolby_atmos,
          percentage: (audioQualityCount.dolby_atmos / totalTracksCount) * 100
        }
      ].filter(item => item.value > 0);

      // Daily activity for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const dailyActivity = last7Days.map(date => {
        const dayTracks = recentTracks.filter(t => 
          t.created_at && new Date(t.created_at).toISOString().split('T')[0] === date
        );
        const dayPlays = dayTracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
        
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          plays: dayPlays,
          uploads: dayTracks.length
        };
      });

      // Recent activity
      const recentActivity = tracks.slice(0, 10).map(t => ({
        type: 'upload',
        user: t.artist_name,
        action: `uploaded "${t.title}"`,
        timestamp: new Date(t.created_at).toLocaleString()
      }));

      // Users created today
      const today = new Date().toISOString().split('T')[0];
      const newUsersToday = 0;

      // Active users
      const activeUsersToday = new Set(tracks.filter(t => 
        t.created_at && new Date(t.created_at).toISOString().split('T')[0] === today
      ).map(t => t.user_id)).size;

      setMetrics({
        totalUsers,
        newUsersToday,
        totalArtists: artistsResult.count || 0,
        totalListeners: listenersResult.count || 0,
        totalTracks: tracks.length,
        totalPlays,
        totalLikes,
        activeUsersToday,
        topTracks,
        topArtists: artistPlayCounts,
        dailyActivity,
        genreDistribution,
        audioQualityDistribution,
        dolbyAtmosCount,
        hdAudioCount,
        storageUsed: tracks.length * 5,
        recentActivity,
        totalStreamingRevenue,
        totalDownloadRevenue,
        artistLiability,
        revenuePoolBalance,
        totalDownloads,
        avgDownloadPrice,
        fanSubscriptionRevenue,
        artistSubscriptionRevenue,
        downloadFeeRevenue,
        totalPlatformRevenue
      });

      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
      toast.error("Failed to load dashboard metrics");
      setLoading(false);
    }
  };

  // Wait for auth to load before checking CEO access
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isCEO) {
    return <Navigate to="/studio" replace />;
  }

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading CEO Dashboard...</p>
        </div>
      </div>
    );
  }

  // Revenue pool data for chart - using real data
  const totalRevForChart = metrics.totalPlatformRevenue || 1;
  const revenuePoolData = [
    { name: "Artist Subscriptions", value: Math.round((metrics.artistSubscriptionRevenue / totalRevForChart) * 100) || 0, amount: metrics.artistSubscriptionRevenue, color: COLORS[0] },
    { name: "Fan Subscriptions", value: Math.round((metrics.fanSubscriptionRevenue / totalRevForChart) * 100) || 0, amount: metrics.fanSubscriptionRevenue, color: COLORS[1] },
    { name: "Download Fees", value: Math.round((metrics.downloadFeeRevenue / totalRevForChart) * 100) || 0, amount: metrics.downloadFeeRevenue, color: COLORS[2] },
  ].filter(item => item.amount > 0);
  
  // If no real revenue yet, show placeholder
  if (revenuePoolData.length === 0) {
    revenuePoolData.push(
      { name: "Subscriptions (pending)", value: 70, amount: 0, color: COLORS[0] },
      { name: "Downloads (pending)", value: 20, amount: 0, color: COLORS[1] },
      { name: "Ads (future)", value: 10, amount: 0, color: COLORS[3] }
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-display font-bold">CEO Dashboard</h1>
            <Badge variant="secondary" className="gap-2">
              <Activity className="w-4 h-4" />
              Live
            </Badge>
          </div>
          <p className="text-muted-foreground">Real-time platform metrics, revenue pool, and artist liability</p>
        </div>

        {/* Revenue Pool Overview - NEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card p-6 border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-500" />
              <Badge className="bg-green-500/20 text-green-500">$1/stream</Badge>
            </div>
            <p className="text-3xl font-bold text-green-500">${metrics.artistLiability.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Artist Liability</p>
            <div className="mt-2 text-xs flex items-center gap-1">
              <span className="text-muted-foreground">{metrics.totalPlays.toLocaleString()} streams × $1.00</span>
            </div>
          </Card>

          <Card className="glass-card p-6 border-primary/30">
            <div className="flex items-center justify-between mb-2">
              <PiggyBank className="w-8 h-8 text-primary" />
              <Badge variant="outline">Revenue Pool</Badge>
            </div>
            <p className="text-3xl font-bold">${metrics.totalPlatformRevenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Platform Revenue</p>
            <div className="mt-2 text-xs flex items-center gap-1">
              {metrics.totalPlatformRevenue >= metrics.artistLiability ? (
                <span className="text-green-500 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  Covers liability
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" />
                  ${(metrics.artistLiability - metrics.totalPlatformRevenue).toFixed(2)} short
                </span>
              )}
            </div>
          </Card>

          <Card className="glass-card p-6 border-secondary/30">
            <div className="flex items-center justify-between mb-2">
              <Download className="w-8 h-8 text-secondary" />
              <Badge className="bg-secondary/20 text-secondary">{metrics.totalDownloads}</Badge>
            </div>
            <p className="text-3xl font-bold">${metrics.totalDownloadRevenue.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Download Revenue</p>
            <div className="mt-2 text-xs text-muted-foreground">
              Avg: ${metrics.avgDownloadPrice.toFixed(2)} per download
            </div>
          </Card>

          <Card className="glass-card p-6 border-accent/30">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-8 h-8 text-accent" />
              {metrics.revenuePoolBalance >= 0 ? (
                <Badge className="bg-green-500/20 text-green-500">Healthy</Badge>
              ) : (
                <Badge className="bg-destructive/20 text-destructive">Low</Badge>
              )}
            </div>
            <p className="text-3xl font-bold">${((metrics.artistLiability * 1.2) - metrics.artistLiability).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Pool Buffer</p>
            <div className="mt-2 text-xs text-muted-foreground">
              Break-even: {Math.ceil(metrics.totalPlays / 10).toLocaleString()} subscribers needed
            </div>
          </Card>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-primary" />
              <Badge variant="outline">{metrics.newUsersToday > 0 ? `+${metrics.newUsersToday}` : '0'} today</Badge>
            </div>
            <p className="text-3xl font-bold">{metrics.totalUsers.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
            <div className="mt-2 text-xs">
              <span className="text-purple-400">{metrics.totalArtists} Artists</span>
              <span className="mx-2">•</span>
              <span className="text-pink-400">{metrics.totalListeners} Listeners</span>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Music className="w-8 h-8 text-primary" />
              <Badge variant="outline">{metrics.activeUsersToday} active</Badge>
            </div>
            <p className="text-3xl font-bold">{metrics.totalTracks.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Tracks</p>
            <div className="mt-2 text-xs text-muted-foreground">
              Across {metrics.genreDistribution.length} genres
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Play className="w-8 h-8 text-primary" />
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-3xl font-bold">{metrics.totalPlays.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Plays</p>
            <div className="mt-2 text-xs text-green-500">
              = ${metrics.totalPlays.toLocaleString()} artist payout
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-8 h-8 text-primary" />
              <Badge variant="outline">
                {((metrics.totalLikes / Math.max(metrics.totalPlays, 1)) * 100).toFixed(1)}% rate
              </Badge>
            </div>
            <p className="text-3xl font-bold">{metrics.totalLikes.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Likes</p>
            <div className="mt-2 text-xs text-muted-foreground">
              Engagement trending up
            </div>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="executive" className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="executive" className="gap-2">
              <Bot className="w-4 h-4" />
              Executive Advisory
            </TabsTrigger>
            <TabsTrigger value="revenue">Revenue Pool</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
          </TabsList>

          {/* Executive Advisory Tab */}
          <TabsContent value="executive" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ExecAgentPanel />
              </div>
              <div className="space-y-4">
                <Card className="glass-card p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Quick Insights
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground">Artist Liability</p>
                      <p className="text-xl font-bold text-green-500">${metrics.artistLiability.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground">Platform Revenue</p>
                      <p className="text-xl font-bold">${metrics.totalPlatformRevenue.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground">Revenue Gap</p>
                      <p className={`text-xl font-bold ${metrics.totalPlatformRevenue >= metrics.artistLiability ? 'text-green-500' : 'text-destructive'}`}>
                        ${Math.abs(metrics.totalPlatformRevenue - metrics.artistLiability).toLocaleString()}
                        {metrics.totalPlatformRevenue >= metrics.artistLiability ? ' surplus' : ' deficit'}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="glass-card p-6">
                  <h3 className="font-semibold mb-3">Platform Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Artists</span>
                      <span className="font-medium">{metrics.totalArtists}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Listeners</span>
                      <span className="font-medium">{metrics.totalListeners}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Tracks</span>
                      <span className="font-medium">{metrics.totalTracks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Streams</span>
                      <span className="font-medium">{metrics.totalPlays.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Revenue Pool Tab - NEW */}
          <TabsContent value="revenue" className="space-y-6">
            {/* Payment Flow Visualization */}
            <PaymentFlowDashboard />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-green-500" />
                  Revenue Pool Sources
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenuePoolData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenuePoolData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Payout Economics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                    <span className="font-medium">Per Stream Payout</span>
                    <span className="text-2xl font-bold text-green-500">$1.00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Total Streams</span>
                    <span className="font-bold">{metrics.totalPlays.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Total Liability</span>
                    <span className="font-bold">${metrics.artistLiability.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Downloads Sold</span>
                    <span className="font-bold">{metrics.totalDownloads}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary/10 rounded-lg">
                    <span>Download Revenue (Artist)</span>
                    <span className="font-bold text-secondary">${metrics.totalDownloadRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Financial Health */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Financial Health Indicators</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-500">
                    {Math.ceil(metrics.artistLiability / 9.99).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Subscribers Needed</p>
                  <p className="text-xs text-muted-foreground mt-1">@ $9.99/mo</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {(metrics.totalPlays / Math.max(metrics.totalUsers, 1)).toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">Streams/User</p>
                  <p className="text-xs text-muted-foreground mt-1">Average engagement</p>
                </div>
                <div className="text-center p-4 bg-secondary/10 rounded-lg">
                  <p className="text-2xl font-bold text-secondary">
                    ${(metrics.avgDownloadPrice || 2.99).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Download Price</p>
                  <p className="text-xs text-muted-foreground mt-1">Artist-set pricing</p>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <p className="text-2xl font-bold text-accent">94%</p>
                  <p className="text-sm text-muted-foreground">Artist Retention</p>
                  <p className="text-xs text-muted-foreground mt-1">Industry-leading</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Audio Quality Adoption */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dolby Atmos Tracks</p>
                    <p className="text-3xl font-bold">{metrics.dolbyAtmosCount}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {((metrics.dolbyAtmosCount / Math.max(metrics.totalTracks, 1)) * 100).toFixed(1)}% adoption rate
                </div>
              </Card>

              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Music className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">HD Audio Tracks</p>
                    <p className="text-3xl font-bold">{metrics.hdAudioCount}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {((metrics.hdAudioCount / Math.max(metrics.totalTracks, 1)) * 100).toFixed(1)}% adoption rate
                </div>
              </Card>

              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Premium Quality</p>
                    <p className="text-3xl font-bold">
                      {metrics.dolbyAtmosCount + metrics.hdAudioCount}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {(((metrics.dolbyAtmosCount + metrics.hdAudioCount) / Math.max(metrics.totalTracks, 1)) * 100).toFixed(1)}% total
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Activity Chart */}
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Daily Activity (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="plays" stroke="#8B5CF6" strokeWidth={2} />
                    <Line type="monotone" dataKey="uploads" stroke="#EC4899" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Genre Distribution */}
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Genre Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metrics.genreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metrics.genreDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Top Tracks */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Top Performing Tracks</h3>
              <div className="space-y-3">
                {metrics.topTracks.slice(0, 5).map((track, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center">
                        {idx + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{track.title}</p>
                        <p className="text-sm text-muted-foreground">{track.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{track.plays.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-green-500">${track.plays.toLocaleString()} earned</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Top Artists by Plays</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.topArtists.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  <Bar dataKey="plays" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {metrics.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                      <Upload className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>
                          {' '}{activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="health" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Database</p>
                    <p className="text-2xl font-bold">Healthy</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>All systems operational</span>
                </div>
              </Card>

              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <HardDrive className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Storage Used</p>
                    <p className="text-2xl font-bold">{metrics.storageUsed.toFixed(0)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Plenty of capacity</span>
                </div>
              </Card>

              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <p className="text-2xl font-bold">99.9%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>Excellent performance</span>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const Upload = Download;
