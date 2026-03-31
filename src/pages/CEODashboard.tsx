import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Users, Music, TrendingUp, Activity, Database, HardDrive,
  Play, Heart, Download, AlertCircle, CheckCircle, Clock, Sparkles,
  DollarSign, PiggyBank, CreditCard, ArrowUpRight, ArrowDownRight, Bot, Workflow,
  MessageCircle, Zap, Crown, Menu
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
import { CEOArtistMessaging } from "@/components/CEOArtistMessaging";
import { SystemDiagnosticsPanel } from "@/components/SystemDiagnosticsPanel";
import { AdminSidebar, CEORevenueControl } from "@/components/admin";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const [activeTab, setActiveTab] = useState("executive");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is CEO using server-side role check
  const [isCEO, setIsCEO] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc('has_role', { _user_id: user.id, _role: 'ceo' })
      .then(({ data }) => {
        setIsCEO(!!data);
        setRoleChecked(true);
      });
  }, [user]);

  useEffect(() => {
    if (authLoading || !roleChecked) return;
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Admin Sidebar - Always visible on desktop, overlay on mobile */}
      <div className={cn(
        "fixed inset-0 z-40 transition-opacity md:hidden",
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
      </div>
      
      {/* Sidebar Container */}
      <div className={cn(
        "fixed top-0 left-0 h-full z-50 transition-transform duration-300",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <AdminSidebar activeTab={activeTab} onTabChange={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }} />
      </div>
      
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-sm">CEO Dashboard</span>
          </div>
          <Badge variant="outline" className="gap-1 border-green-500/50 text-green-500 bg-green-500/10 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Online
          </Badge>
        </div>
      </header>
      
      {/* Subtle Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none md:ml-[72px]">
        <div className="absolute -top-40 -right-40 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="pt-16 md:pt-0 md:ml-[72px] transition-all duration-300 p-4 md:p-6 relative z-10">
        {/* PHP Admin Header Box - Hidden on mobile (shown in header instead) */}
        <div className="hidden md:block mb-6 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-amber-500/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">CEO Dashboard</h1>
                <p className="text-xs text-muted-foreground">Executive Command Center</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-2 border-green-500/50 text-green-500 bg-green-500/10">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Systems Online
              </Badge>
              <Badge variant="secondary" className="gap-2 bg-amber-500/20 border-amber-500/30 text-amber-500">
                <Activity className="w-3 h-3" />
                Live
              </Badge>
            </div>
          </div>
          <div className="px-6 py-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Real-time platform metrics, revenue pool, and artist liability</span>
            <span className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Revenue Pool Overview - PHP Admin Box Pattern */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Artist Liability Card */}
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-green-500/50 transition-all group">
            <div className="px-4 py-3 border-b border-border/30 bg-green-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Artist Liability</span>
              </div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">$1/stream</Badge>
            </div>
            <div className="p-4">
              <p className="text-3xl font-black text-green-500">${metrics.artistLiability.toLocaleString()}</p>
              <div className="mt-2 text-xs flex items-center gap-1 text-muted-foreground">
                <Zap className="w-3 h-3 text-green-500" />
                <span>{metrics.totalPlays.toLocaleString()} streams × $1.00</span>
              </div>
            </div>
          </div>

          {/* Platform Revenue Card */}
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-primary/50 transition-all group">
            <div className="px-4 py-3 border-b border-border/30 bg-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Revenue Pool</span>
              </div>
              <Badge variant="outline" className="border-primary/30 text-xs">Total</Badge>
            </div>
            <div className="p-4">
              <p className="text-3xl font-black">${metrics.totalPlatformRevenue.toLocaleString()}</p>
              <div className="mt-2 text-xs">
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
            </div>
          </div>

          {/* Download Revenue Card */}
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-secondary/50 transition-all group">
            <div className="px-4 py-3 border-b border-border/30 bg-secondary/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium">Downloads</span>
              </div>
              <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs">{metrics.totalDownloads}</Badge>
            </div>
            <div className="p-4">
              <p className="text-3xl font-black">${metrics.totalDownloadRevenue.toFixed(2)}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                Avg: ${metrics.avgDownloadPrice.toFixed(2)} per download
              </div>
            </div>
          </div>

          {/* Pool Buffer Card */}
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-accent/50 transition-all group">
            <div className="px-4 py-3 border-b border-border/30 bg-accent/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Pool Buffer</span>
              </div>
              {metrics.revenuePoolBalance >= 0 ? (
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">Healthy</Badge>
              ) : (
                <Badge className="bg-destructive/20 text-destructive text-xs">Low</Badge>
              )}
            </div>
            <div className="p-4">
              <p className="text-3xl font-black">${((metrics.artistLiability * 1.2) - metrics.artistLiability).toLocaleString()}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                Break-even: {Math.ceil(metrics.totalPlays / 10).toLocaleString()} subs
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview - PHP Admin Box Pattern */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Users */}
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-primary/50 transition-all">
            <div className="px-4 py-3 border-b border-border/30 bg-primary/5 flex items-center justify-between">
              <Users className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-xs">{metrics.newUsersToday > 0 ? `+${metrics.newUsersToday}` : '0'} today</Badge>
            </div>
            <div className="p-4">
              <p className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <div className="mt-2 text-xs">
                <span className="text-purple-400">{metrics.totalArtists} Artists</span>
                <span className="mx-2 text-border">•</span>
                <span className="text-pink-400">{metrics.totalListeners} Listeners</span>
              </div>
            </div>
          </div>

          {/* Total Tracks */}
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-primary/50 transition-all">
            <div className="px-4 py-3 border-b border-border/30 bg-primary/5 flex items-center justify-between">
              <Music className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-xs">{metrics.activeUsersToday} active</Badge>
            </div>
            <div className="p-4">
              <p className="text-2xl font-bold">{metrics.totalTracks.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Tracks</p>
              <div className="mt-2 text-xs text-muted-foreground">
                Across {metrics.genreDistribution.length} genres
              </div>
            </div>
          </div>

          {/* Total Plays */}
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-green-500/50 transition-all">
            <div className="px-4 py-3 border-b border-border/30 bg-green-500/5 flex items-center justify-between">
              <Play className="w-5 h-5 text-green-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="p-4">
              <p className="text-2xl font-bold">{metrics.totalPlays.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Plays</p>
              <div className="mt-2 text-xs text-green-500">
                = ${metrics.totalPlays.toLocaleString()} artist payout
              </div>
            </div>
          </div>

          {/* Total Likes */}
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-pink-500/50 transition-all">
            <div className="px-4 py-3 border-b border-border/30 bg-pink-500/5 flex items-center justify-between">
              <Heart className="w-5 h-5 text-pink-500" />
              <Badge variant="outline" className="text-xs">
                {((metrics.totalLikes / Math.max(metrics.totalPlays, 1)) * 100).toFixed(1)}% rate
              </Badge>
            </div>
            <div className="p-4">
              <p className="text-2xl font-bold">{metrics.totalLikes.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Likes</p>
              <div className="mt-2 text-xs text-muted-foreground">
                Engagement trending up
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analytics - Sidebar-controlled */}
        <div className="space-y-6">
          {/* Executive Advisory Tab */}
          {activeTab === "executive" && (
            <div className="space-y-6 animate-fade-in">
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
                        <p className={cn("text-xl font-bold", metrics.totalPlatformRevenue >= metrics.artistLiability ? 'text-green-500' : 'text-destructive')}>
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
            </div>
          )}

          {/* Artist Messaging Tab */}
          {activeTab === "messaging" && (
            <div className="animate-fade-in">
              <CEOArtistMessaging />
            </div>
          )}

          {/* Revenue Pool Tab */}
          {activeTab === "revenue" && (
            <div className="space-y-6 animate-fade-in">
              <CEORevenueControl />
              
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
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
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
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Daily Activity (Last 7 Days)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={metrics.dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                      <Legend />
                      <Line type="monotone" dataKey="plays" stroke="#8B5CF6" strokeWidth={2} />
                      <Line type="monotone" dataKey="uploads" stroke="#EC4899" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

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
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-fade-in">
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
            </div>
          )}

          {/* Content Tab */}
          {activeTab === "content" && (
            <div className="space-y-6 animate-fade-in">
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
            </div>
          )}

          {/* System Health Tab */}
          {activeTab === "health" && (
            <div className="space-y-6 animate-fade-in">
              <SystemDiagnosticsPanel />
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Upload = Download;
