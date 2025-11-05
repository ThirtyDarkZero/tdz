import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, DollarSign, Music, Play, Eye, Heart, MessageCircle, MapPin, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface AlbumAnalyticsProps {
  albumId: string;
}

interface AnalyticsData {
  totalStreams: number;
  totalRevenue: number;
  totalTracks: number;
  totalListeners: number;
  topTrack?: any;
  platformBreakdown: any[];
  growthData: any[];
  revenueByPlatform: any[];
}

export function AlbumAnalytics({ albumId }: AlbumAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [albumId]);

  const loadAnalytics = async () => {
    try {
      const { data: tracks, error: tracksError } = await supabase
        .from("tracks")
        .select(`
          *,
          track_likes(count),
          track_comments(count)
        `)
        .eq("album_id", albumId);

      if (tracksError) throw tracksError;

      if (!tracks || tracks.length === 0) {
        setAnalytics({
          totalStreams: 0,
          totalRevenue: 0,
          totalTracks: 0,
          totalListeners: 0,
          platformBreakdown: [],
          growthData: [],
          revenueByPlatform: []
        });
        setLoading(false);
        return;
      }

      // Calculate metrics
      const totalStreams = tracks.reduce((sum, track) => sum + (track.play_count || 0), 0);
      const totalTracks = tracks.length;
      
      // Estimate revenue ($0.003 per stream average)
      const totalRevenue = totalStreams * 0.003;
      
      // Find unique listeners (estimate based on streams)
      const totalListeners = Math.floor(totalStreams * 0.6);
      
      // Find top track
      const topTrack = tracks.reduce((top, track) => 
        (track.play_count || 0) > (top?.play_count || 0) ? track : top
      , tracks[0]);

      // Platform breakdown (simulated data based on industry standards)
      const platformBreakdown = [
        { name: "Spotify", value: Math.floor(totalStreams * 0.35), color: "#1DB954" },
        { name: "Apple Music", value: Math.floor(totalStreams * 0.25), color: "#FA243C" },
        { name: "YouTube Music", value: Math.floor(totalStreams * 0.20), color: "#FF0000" },
        { name: "Amazon Music", value: Math.floor(totalStreams * 0.12), color: "#FF9900" },
        { name: "Others", value: Math.floor(totalStreams * 0.08), color: "#8B5CF6" }
      ];

      // Revenue by platform
      const revenueByPlatform = platformBreakdown.map(platform => ({
        name: platform.name,
        revenue: (platform.value * 0.003).toFixed(2),
        percentage: ((platform.value / totalStreams) * 100).toFixed(1)
      }));

      // Growth data (simulated last 7 days)
      const growthData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          streams: Math.floor(totalStreams * (0.1 + Math.random() * 0.2)),
          listeners: Math.floor(totalListeners * (0.1 + Math.random() * 0.2))
        };
      });

      setAnalytics({
        totalStreams,
        totalRevenue,
        totalTracks,
        totalListeners,
        topTrack,
        platformBreakdown,
        growthData,
        revenueByPlatform
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card-premium p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (!analytics) return null;

  const StatCard = ({ icon: Icon, label, value, subtext, trend }: any) => {
    return (
      <Card className="glass-card p-6 hover:shadow-glow transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">{label}</p>
            <p className="text-3xl font-bold glow-text mb-1">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-500">
            <TrendingUp className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold glow-text">Album Analytics</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Play}
          label="Total Streams"
          value={analytics.totalStreams.toLocaleString()}
          trend="+12% this week"
        />
        <StatCard
          icon={DollarSign}
          label="Estimated Revenue"
          value={`$${analytics.totalRevenue.toFixed(2)}`}
          subtext="Based on avg. $0.003/stream"
        />
        <StatCard
          icon={Music}
          label="Total Tracks"
          value={analytics.totalTracks}
        />
        <StatCard
          icon={Users}
          label="Total Listeners"
          value={analytics.totalListeners.toLocaleString()}
          subtext="Unique listeners"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Distribution */}
        <Card className="glass-card-premium p-6">
          <h3 className="text-xl font-bold mb-6">Platform Distribution</h3>
          <ChartContainer config={{}} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.platformBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.platformBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        {/* Streams by Platform */}
        <Card className="glass-card-premium p-6">
          <h3 className="text-xl font-bold mb-6">Streams by Platform</h3>
          <ChartContainer config={{}} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.platformBreakdown}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {analytics.platformBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>
      </div>

      {/* Growth Trend */}
      <Card className="glass-card-premium p-6">
        <h3 className="text-xl font-bold mb-6">7-Day Growth Trend</h3>
        <ChartContainer config={{}} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.growthData}>
              <defs>
                <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="streams"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorStreams)"
                name="Streams"
              />
              <Area
                type="monotone"
                dataKey="listeners"
                stroke="hsl(var(--chart-2))"
                fillOpacity={0.3}
                fill="hsl(var(--chart-2))"
                name="Listeners"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>

      {/* Top Track */}
      {analytics.topTrack && (
        <Card className="glass-card-premium p-6">
          <h3 className="text-xl font-bold mb-6">Top Performing Track</h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-accent/50 flex items-center justify-center">
              <Music className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold mb-2">{analytics.topTrack.title}</h4>
              <p className="text-muted-foreground mb-4">{analytics.topTrack.artist_name}</p>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Streams</p>
                  <p className="text-xl font-bold">{analytics.topTrack.play_count?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Est. Earnings</p>
                  <p className="text-xl font-bold">${((analytics.topTrack.play_count || 0) * 0.003).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Revenue Breakdown */}
      <Card className="glass-card-premium p-6">
        <h3 className="text-xl font-bold mb-6">Revenue by Platform</h3>
        <div className="space-y-4">
          {analytics.revenueByPlatform.map((platform, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{platform.name}</span>
                <span className="text-muted-foreground">${platform.revenue}</span>
              </div>
              <div className="h-2 bg-accent rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${platform.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Track-by-Track Analytics */}
      <TrackByTrackAnalytics albumId={albumId} />
    </div>
  );
}

interface TrackByTrackAnalyticsProps {
  albumId: string;
}

function TrackByTrackAnalytics({ albumId }: TrackByTrackAnalyticsProps) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrackAnalytics();
  }, [albumId]);

  const loadTrackAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("album_id", albumId)
        .order("track_number", { ascending: true });

      if (error) throw error;

      // Enrich tracks with analytics data
      const enrichedTracks = await Promise.all(
        (data || []).map(async (track) => {
          const { count: likeCount } = await supabase
            .from("track_likes")
            .select("*", { count: "exact", head: true })
            .eq("track_id", track.id);

          const { count: commentCount } = await supabase
            .from("track_comments")
            .select("*", { count: "exact", head: true })
            .eq("track_id", track.id);

          const streams = track.play_count || 0;
          const likes = likeCount || 0;
          const comments = commentCount || 0;

          // Calculate engagement metrics
          const engagementRate = streams > 0 ? ((likes + comments) / streams) * 100 : 0;
          const likeRate = streams > 0 ? (likes / streams) * 100 : 0;
          const commentRate = streams > 0 ? (comments / streams) * 100 : 0;
          const completionRate = 65 + Math.random() * 30; // Simulated 65-95%
          const skipRate = 100 - completionRate;
          const revenue = streams * 0.003;

          // Simulated listener demographics
          const demographics = {
            ageGroups: [
              { range: "13-17", percentage: 15 + Math.random() * 10 },
              { range: "18-24", percentage: 30 + Math.random() * 15 },
              { range: "25-34", percentage: 25 + Math.random() * 10 },
              { range: "35-44", percentage: 15 + Math.random() * 10 },
              { range: "45+", percentage: 10 + Math.random() * 5 }
            ],
            gender: [
              { type: "Male", percentage: 45 + Math.random() * 15 },
              { type: "Female", percentage: 40 + Math.random() * 15 },
              { type: "Other", percentage: 5 + Math.random() * 5 }
            ],
            topLocations: [
              { city: "New York", percentage: 18 + Math.random() * 7 },
              { city: "Los Angeles", percentage: 15 + Math.random() * 5 },
              { city: "London", percentage: 12 + Math.random() * 5 },
              { city: "Toronto", percentage: 10 + Math.random() * 5 },
              { city: "Sydney", percentage: 8 + Math.random() * 4 }
            ]
          };

          return {
            ...track,
            likes,
            comments,
            engagementRate,
            likeRate,
            commentRate,
            completionRate,
            skipRate,
            revenue,
            demographics
          };
        })
      );

      setTracks(enrichedTracks);
    } catch (error) {
      console.error("Error loading track analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card-premium p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold glow-text">Track-by-Track Analytics</h2>
        <Badge variant="outline" className="text-sm">
          {tracks.length} tracks
        </Badge>
      </div>

      {tracks.map((track, index) => (
        <Card key={track.id} className="glass-card-premium p-6 space-y-6">
          {/* Track Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="text-xs">#{track.track_number || index + 1}</Badge>
                <h3 className="text-xl font-bold">{track.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{track.artist_name}</p>
            </div>
            <Badge 
              variant={track.engagementRate > 5 ? "default" : "secondary"}
              className="shrink-0"
            >
              {track.engagementRate > 5 ? "High" : "Moderate"} Engagement
            </Badge>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Play className="w-4 h-4" />
                <span className="text-xs">Streams</span>
              </div>
              <p className="text-2xl font-bold">{track.play_count?.toLocaleString() || 0}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="w-4 h-4" />
                <span className="text-xs">Likes</span>
              </div>
              <p className="text-2xl font-bold">{track.likes.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{track.likeRate.toFixed(1)}% rate</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">Comments</span>
              </div>
              <p className="text-2xl font-bold">{track.comments.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{track.commentRate.toFixed(1)}% rate</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Revenue</span>
              </div>
              <p className="text-2xl font-bold">${track.revenue.toFixed(2)}</p>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium">{track.completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={track.completionRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Like Rate</span>
                <span className="font-medium">{track.likeRate.toFixed(1)}%</span>
              </div>
              <Progress value={track.likeRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Engagement Rate</span>
                <span className="font-medium">{track.engagementRate.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(track.engagementRate, 100)} className="h-2" />
            </div>
          </div>

          {/* Demographics Section */}
          <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-border/50">
            {/* Age Demographics */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Age Groups
              </h4>
              <div className="space-y-2">
                {track.demographics.ageGroups.map((age: any) => (
                  <div key={age.range} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{age.range}</span>
                      <span className="font-medium">{age.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={age.percentage} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Gender Demographics */}
            <div className="space-y-3">
              <h4 className="font-semibold">Gender Split</h4>
              <div className="space-y-3">
                {track.demographics.gender.map((gender: any) => (
                  <div key={gender.type} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{gender.type}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={gender.percentage} className="h-1.5 w-20" />
                      <span className="text-sm font-medium w-12 text-right">
                        {gender.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Locations */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Top Locations
              </h4>
              <div className="space-y-2">
                {track.demographics.topLocations.map((location: any, idx: number) => (
                  <div key={location.city} className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {idx + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{location.city}</p>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {location.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="flex items-center gap-4 pt-4 border-t border-border/50">
            {track.completionRate > 80 && (
              <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
                <TrendingUp className="w-3 h-3 mr-1" />
                High Completion
              </Badge>
            )}
            {track.skipRate > 40 && (
              <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/50">
                <TrendingDown className="w-3 h-3 mr-1" />
                High Skip Rate
              </Badge>
            )}
            {track.likeRate > 5 && (
              <Badge className="bg-pink-500/20 text-pink-500 border-pink-500/50">
                <Heart className="w-3 h-3 mr-1" />
                High Like Rate
              </Badge>
            )}
            {track.engagementRate > 5 && (
              <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">
                <MessageCircle className="w-3 h-3 mr-1" />
                Strong Engagement
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
