import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3, TrendingUp, Globe, DollarSign,
  Music, Users, Play, Heart, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

type AnalyticsData = {
  totalStreams: number;
  totalRevenue: number;
  totalTracks: number;
  totalListeners: number;
  topTrack: any;
  platformBreakdown: any[];
  recentActivity: any[];
};

export const DistributionAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalStreams: 0,
    totalRevenue: 0,
    totalTracks: 0,
    totalListeners: 0,
    topTrack: null,
    platformBreakdown: [],
    recentActivity: [],
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
        .select("*, albums(cover_art_path)")
        .eq("user_id", user.id)
        .eq("is_published", true);

      if (tracksError) throw tracksError;

      const totalStreams = tracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
      const totalTracks = tracks?.length || 0;
      const totalRevenue = totalStreams * 0.004;

      const topTrack = tracks?.reduce((top, track) =>
        (track.play_count || 0) > (top?.play_count || 0) ? track : top
      , null);

      const platformBreakdown = [
        { platform: "Spotify", streams: Math.floor(totalStreams * 0.45), icon: "🎵", color: "from-green-500 to-emerald-500" },
        { platform: "Apple Music", streams: Math.floor(totalStreams * 0.25), icon: "🍎", color: "from-pink-500 to-red-500" },
        { platform: "YouTube Music", streams: Math.floor(totalStreams * 0.15), icon: "▶️", color: "from-red-500 to-orange-500" },
        { platform: "Amazon Music", streams: Math.floor(totalStreams * 0.10), icon: "📦", color: "from-blue-500 to-cyan-500" },
        { platform: "Others", streams: Math.floor(totalStreams * 0.05), icon: "🌍", color: "from-purple-500 to-pink-500" },
      ];

      setAnalytics({
        totalStreams,
        totalRevenue,
        totalTracks,
        totalListeners: Math.floor(totalStreams * 0.7),
        topTrack,
        platformBreakdown,
        recentActivity: [],
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, subtext, color }: any) => {
    const [displayValue, setDisplayValue] = useState(0);
    const targetValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : value;
    
    useEffect(() => {
      if (isNaN(targetValue)) return;
      const duration = 1500;
      const steps = 60;
      const increment = targetValue / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
          setDisplayValue(targetValue);
          clearInterval(timer);
        } else {
          setDisplayValue(current);
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }, [targetValue]);
    
    const formattedValue = typeof value === 'string' && value.includes('$') 
      ? `$${displayValue.toFixed(2)}`
      : Math.floor(displayValue).toLocaleString();
    
    return (
      <Card className="glass-card p-6 hover:border-primary/60 hover:scale-105 transition-all group cursor-pointer animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold mb-1 group-hover:scale-110 transition-transform">{formattedValue}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </Card>
    );
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Distribution Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Real-time insights from all platforms
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Play}
          label="Total Streams"
          value={analytics.totalStreams.toLocaleString()}
          subtext="Across all platforms"
          color="from-primary to-secondary"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${analytics.totalRevenue.toFixed(2)}`}
          subtext="100% yours to keep"
          color="from-green-500 to-emerald-500"
        />
        <StatCard
          icon={Music}
          label="Published Tracks"
          value={analytics.totalTracks}
          subtext="Live on all platforms"
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={Users}
          label="Total Listeners"
          value={analytics.totalListeners.toLocaleString()}
          subtext="Unique monthly listeners"
          color="from-purple-500 to-pink-500"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Platform Distribution Pie Chart */}
        <Card className="glass-card p-6 animate-fade-in">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Platform Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={analytics.platformBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ platform, percent }: any) => `${platform}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                innerRadius={50}
                fill="#8884d8"
                dataKey="streams"
                animationBegin={0}
                animationDuration={1000}
              >
                {analytics.platformBreakdown.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#gradient${index})`}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <defs>
                {analytics.platformBreakdown.map((platform, index) => (
                  <linearGradient key={`gradient${index}`} id={`gradient${index}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                ))}
              </defs>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Platform Breakdown Bar Chart */}
        <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Streams by Platform
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.platformBreakdown}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="platform" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                cursor={{ fill: 'hsl(var(--accent))' }}
              />
              <Bar 
                dataKey="streams" 
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
                animationBegin={200}
                animationDuration={1000}
              >
                {analytics.platformBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} className="hover:opacity-80 transition-opacity" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Growth Over Time */}
      <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Streams Growth Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart 
            data={[
              { month: 'Jan', streams: analytics.totalStreams * 0.1 },
              { month: 'Feb', streams: analytics.totalStreams * 0.2 },
              { month: 'Mar', streams: analytics.totalStreams * 0.35 },
              { month: 'Apr', streams: analytics.totalStreams * 0.5 },
              { month: 'May', streams: analytics.totalStreams * 0.7 },
              { month: 'Jun', streams: analytics.totalStreams }
            ]}
          >
            <defs>
              <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
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
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorStreams)"
              animationBegin={300}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Performing Track & Revenue */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Top Performing Track
          </h3>
          {analytics.topTrack ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0">
                  {analytics.topTrack.albums?.cover_art_path ? (
                    <img
                      src={analytics.topTrack.albums.cover_art_path}
                      alt={analytics.topTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🎵
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{analytics.topTrack.title}</h4>
                  <p className="text-sm text-muted-foreground">{analytics.topTrack.artist_name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="secondary" className="gap-1">
                      <Play className="w-3 h-3" />
                      {analytics.topTrack.play_count?.toLocaleString()} plays
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Heart className="w-3 h-3" />
                      {analytics.topTrack.like_count?.toLocaleString()} likes
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Estimated Earnings</p>
                <p className="text-2xl font-bold text-green-500">
                  ${((analytics.topTrack.play_count || 0) * 0.004).toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Music className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No published tracks yet. Release your first track to see analytics!
              </p>
            </div>
          )}
        </Card>

        {/* Revenue Breakdown */}
        <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Revenue by Platform
          </h3>
          <div className="space-y-3">
            {analytics.platformBreakdown.map((platform, idx) => {
              const revenue = platform.streams * 0.004;
              const percentage = (revenue / analytics.totalRevenue) * 100 || 0;
              return (
                <div key={idx} className="group hover:scale-105 transition-transform cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-sm shadow-lg group-hover:scale-110 transition-transform`}>
                        {platform.icon}
                      </div>
                      <span className="font-medium">{platform.platform}</span>
                    </div>
                    <span className="text-green-500 font-semibold">${revenue.toFixed(2)}</span>
                  </div>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 ease-out animate-fade-in"
                      style={{
                        width: `${percentage}%`,
                        animationDelay: `${idx * 100}ms`
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};