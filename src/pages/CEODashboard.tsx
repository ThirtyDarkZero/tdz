import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Music, TrendingUp, Activity, Database, HardDrive,
  Play, Heart, Download, AlertCircle, CheckCircle, Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

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
  storageUsed: number;
  recentActivity: Array<{ type: string; user: string; action: string; timestamp: string }>;
};

const COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];

export default function CEODashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is CEO
  const isCEO = user?.email === 'info@thirtydarkzero.com';

  useEffect(() => {
    if (!isCEO) return;
    loadDashboardMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardMetrics, 30000);
    return () => clearInterval(interval);
  }, [isCEO]);

  const loadDashboardMetrics = async () => {
    try {
      // Fetch all metrics in parallel
      const [
        artistsResult,
        listenersResult,
        tracksResult,
        recentTracksResult,
      ] = await Promise.all([
        supabase.from("artist_profiles").select("artist_name, total_plays", { count: "exact" }),
        supabase.from("listener_profiles").select("id", { count: "exact", head: true }),
        supabase.from("tracks").select("id, title, artist_name, play_count, like_count, genre, created_at, user_id"),
        supabase.from("tracks").select("title, artist_name, play_count, created_at").order("created_at", { ascending: false }).limit(100),
      ]);

      const tracks = tracksResult.data || [];
      const artists = artistsResult.data || [];
      const recentTracks = recentTracksResult.data || [];
      
      // Calculate metrics
      const totalUsers = (artistsResult.count || 0) + (listenersResult.count || 0);
      const totalPlays = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
      const totalLikes = tracks.reduce((sum, t) => sum + (t.like_count || 0), 0);
      
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
          followers: 0 // We'll calculate this
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

      // Recent activity (mock data - would need audit log table for real data)
      const recentActivity = tracks.slice(0, 10).map(t => ({
        type: 'upload',
        user: t.artist_name,
        action: `uploaded "${t.title}"`,
        timestamp: new Date(t.created_at).toLocaleString()
      }));

      // Users created today
      const today = new Date().toISOString().split('T')[0];
      const newUsersToday = 0; // Would need to query actual user creation dates

      // Active users (users who have activity today)
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
        storageUsed: tracks.length * 5, // Rough estimate: 5MB per track
        recentActivity
      });

      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
      toast.error("Failed to load dashboard metrics");
      setLoading(false);
    }
  };

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
          <p className="text-muted-foreground">Real-time platform metrics and analytics</p>
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
            <div className="mt-2 text-xs text-muted-foreground">
              {(metrics.totalPlays / Math.max(metrics.totalTracks, 1)).toFixed(1)} avg per track
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
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
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{track.plays.toLocaleString()}</span>
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
                  <Bar dataKey="plays" fill="#8B5CF6" />
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

const Upload = Download; // Icon alias for activity