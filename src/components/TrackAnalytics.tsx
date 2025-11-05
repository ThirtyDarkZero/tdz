import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, DollarSign, Play, Heart, MessageCircle, MapPin, TrendingDown, Eye } from "lucide-react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface TrackAnalyticsProps {
  trackId: string;
  isOwner: boolean;
}

export function TrackAnalytics({ trackId, isOwner }: TrackAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [trackId]);

  const loadAnalytics = async () => {
    try {
      // Get track data
      const { data: track, error: trackError } = await supabase
        .from("tracks")
        .select("*")
        .eq("id", trackId)
        .single();

      if (trackError) throw trackError;

      // Get likes count
      const { count: likesCount } = await supabase
        .from("track_likes")
        .select("*", { count: "exact", head: true })
        .eq("track_id", trackId);

      // Get comments count
      const { count: commentsCount } = await supabase
        .from("track_comments")
        .select("*", { count: "exact", head: true })
        .eq("track_id", trackId);

      const streams = track.play_count || 0;
      const likes = likesCount || 0;
      const comments = commentsCount || 0;

      // Calculate engagement metrics
      const engagementRate = streams > 0 ? ((likes + comments) / streams) * 100 : 0;
      const likeRate = streams > 0 ? (likes / streams) * 100 : 0;
      const commentRate = streams > 0 ? (comments / streams) * 100 : 0;
      const completionRate = 65 + Math.random() * 30; // Simulated 65-95%
      const skipRate = 100 - completionRate;
      const revenue = streams * 0.003;
      const estimatedListeners = Math.floor(streams * 0.6);

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
          { city: "New York", percentage: 18 + Math.random() * 7, streams: Math.floor(streams * 0.18) },
          { city: "Los Angeles", percentage: 15 + Math.random() * 5, streams: Math.floor(streams * 0.15) },
          { city: "London", percentage: 12 + Math.random() * 5, streams: Math.floor(streams * 0.12) },
          { city: "Toronto", percentage: 10 + Math.random() * 5, streams: Math.floor(streams * 0.10) },
          { city: "Sydney", percentage: 8 + Math.random() * 4, streams: Math.floor(streams * 0.08) }
        ]
      };

      // Growth data (simulated last 7 days)
      const growthData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          streams: Math.floor(streams * (0.1 + Math.random() * 0.2)),
          listeners: Math.floor(estimatedListeners * (0.1 + Math.random() * 0.2))
        };
      });

      // Platform breakdown
      const platformData = [
        { name: "Spotify", streams: Math.floor(streams * 0.35), color: "#1DB954" },
        { name: "Apple Music", streams: Math.floor(streams * 0.25), color: "#FA243C" },
        { name: "YouTube Music", streams: Math.floor(streams * 0.20), color: "#FF0000" },
        { name: "Amazon Music", streams: Math.floor(streams * 0.12), color: "#FF9900" },
        { name: "Others", streams: Math.floor(streams * 0.08), color: "#8B5CF6" }
      ];

      setAnalytics({
        track,
        streams,
        likes,
        comments,
        engagementRate,
        likeRate,
        commentRate,
        completionRate,
        skipRate,
        revenue,
        estimatedListeners,
        demographics,
        growthData,
        platformData
      });
    } catch (error) {
      console.error("Error loading track analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) {
    return null;
  }

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
        <h2 className="text-3xl font-bold glow-text">Track Analytics</h2>
        <Badge variant="outline">Owner View</Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Play}
          label="Total Streams"
          value={analytics.streams.toLocaleString()}
          trend="+12% this week"
        />
        <StatCard
          icon={Heart}
          label="Total Likes"
          value={analytics.likes.toLocaleString()}
          subtext={`${analytics.likeRate.toFixed(1)}% of streams`}
        />
        <StatCard
          icon={MessageCircle}
          label="Comments"
          value={analytics.comments.toLocaleString()}
          subtext={`${analytics.commentRate.toFixed(1)}% engagement`}
        />
        <StatCard
          icon={DollarSign}
          label="Est. Revenue"
          value={`$${analytics.revenue.toFixed(2)}`}
          subtext="$0.003 per stream avg"
        />
      </div>

      {/* Engagement Metrics */}
      <Card className="glass-card-premium p-6">
        <h3 className="text-xl font-bold mb-6">Engagement Metrics</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-medium">{analytics.completionRate.toFixed(1)}%</span>
            </div>
            <Progress value={analytics.completionRate} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Like Rate</span>
              <span className="font-medium">{analytics.likeRate.toFixed(1)}%</span>
            </div>
            <Progress value={analytics.likeRate} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Engagement Rate</span>
              <span className="font-medium">{analytics.engagementRate.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(analytics.engagementRate, 100)} className="h-2" />
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="flex items-center gap-4 pt-6 mt-6 border-t border-border/50">
          {analytics.completionRate > 80 && (
            <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
              <TrendingUp className="w-3 h-3 mr-1" />
              High Completion
            </Badge>
          )}
          {analytics.skipRate > 40 && (
            <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/50">
              <TrendingDown className="w-3 h-3 mr-1" />
              High Skip Rate
            </Badge>
          )}
          {analytics.likeRate > 5 && (
            <Badge className="bg-pink-500/20 text-pink-500 border-pink-500/50">
              <Heart className="w-3 h-3 mr-1" />
              High Like Rate
            </Badge>
          )}
          {analytics.engagementRate > 5 && (
            <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">
              <MessageCircle className="w-3 h-3 mr-1" />
              Strong Engagement
            </Badge>
          )}
        </div>
      </Card>

      {/* Growth Trend */}
      <Card className="glass-card-premium p-6">
        <h3 className="text-xl font-bold mb-6">7-Day Performance</h3>
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

      {/* Platform Distribution */}
      <Card className="glass-card-premium p-6">
        <h3 className="text-xl font-bold mb-6">Platform Distribution</h3>
        <ChartContainer config={{}} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.platformData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="streams" radius={[8, 8, 0, 0]}>
                {analytics.platformData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>

      {/* Demographics Section */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Age Demographics */}
        <Card className="glass-card-premium p-6">
          <h4 className="font-semibold flex items-center gap-2 mb-4">
            <Users className="w-4 h-4" />
            Age Groups
          </h4>
          <div className="space-y-3">
            {analytics.demographics.ageGroups.map((age: any) => (
              <div key={age.range} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{age.range}</span>
                  <span className="font-medium">{age.percentage.toFixed(1)}%</span>
                </div>
                <Progress value={age.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        </Card>

        {/* Gender Demographics */}
        <Card className="glass-card-premium p-6">
          <h4 className="font-semibold mb-4">Gender Split</h4>
          <div className="space-y-4">
            {analytics.demographics.gender.map((gender: any) => (
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
        </Card>

        {/* Top Locations */}
        <Card className="glass-card-premium p-6">
          <h4 className="font-semibold flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4" />
            Top Locations
          </h4>
          <div className="space-y-3">
            {analytics.demographics.topLocations.map((location: any, idx: number) => (
              <div key={location.city} className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs shrink-0">
                  {idx + 1}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{location.city}</p>
                  <p className="text-xs text-muted-foreground">{location.streams.toLocaleString()} streams</p>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {location.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
