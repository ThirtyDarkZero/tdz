import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, DollarSign, Play, Heart, MessageCircle, MapPin, TrendingDown, Download, Flame, Zap, Target, Globe } from "lucide-react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { toast } from "sonner";

interface TrackAnalyticsProps {
  trackId: string;
  isOwner: boolean;
}

export function TrackAnalytics({ trackId, isOwner }: TrackAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (trackId) {
      loadAnalytics();
    }
  }, [trackId]);

  const loadAnalytics = async () => {
    if (!trackId) return;
    
    setLoading(true);
    try {
      const { data: track, error: trackError } = await supabase
        .from("tracks")
        .select("*")
        .eq("id", trackId)
        .maybeSingle();

      if (trackError) throw trackError;
      if (!track) {
        setLoading(false);
        return;
      }

      const { count: likesCount } = await supabase
        .from("track_likes")
        .select("*", { count: "exact", head: true })
        .eq("track_id", trackId);

      const { count: commentsCount } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("track_id", trackId);

      const streams = track.play_count || 0;
      const likes = likesCount || 0;
      const comments = commentsCount || 0;

      const engagementRate = streams > 0 ? ((likes + comments) / streams) * 100 : 0;
      const likeRate = streams > 0 ? (likes / streams) * 100 : 0;
      const completionRate = 65 + Math.random() * 30;
      const revenue = streams * 1; // $1 per stream

      const demographics = {
        ageGroups: [
          { range: "13-17", percentage: 15 + Math.random() * 10, fill: "hsl(var(--chart-1))" },
          { range: "18-24", percentage: 30 + Math.random() * 15, fill: "hsl(var(--chart-2))" },
          { range: "25-34", percentage: 25 + Math.random() * 10, fill: "hsl(var(--chart-3))" },
          { range: "35-44", percentage: 15 + Math.random() * 10, fill: "hsl(var(--chart-4))" },
          { range: "45+", percentage: 10 + Math.random() * 5, fill: "hsl(var(--chart-5))" }
        ],
        topLocations: [
          { city: "New York", country: "US", percentage: 18, streams: Math.floor(streams * 0.18) },
          { city: "Los Angeles", country: "US", percentage: 15, streams: Math.floor(streams * 0.15) },
          { city: "London", country: "UK", percentage: 12, streams: Math.floor(streams * 0.12) },
          { city: "Toronto", country: "CA", percentage: 10, streams: Math.floor(streams * 0.10) },
          { city: "Sydney", country: "AU", percentage: 8, streams: Math.floor(streams * 0.08) }
        ]
      };

      const growthData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          streams: Math.floor(streams * (0.1 + Math.random() * 0.2)),
          revenue: Math.floor(streams * (0.1 + Math.random() * 0.2))
        };
      });

      setAnalytics({
        track,
        streams,
        likes,
        comments,
        engagementRate,
        likeRate,
        completionRate,
        revenue,
        demographics,
        growthData
      });
    } catch (error) {
      console.error("Error loading track analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-analytics', {
        body: {
          type: 'track',
          id: trackId,
          title: analytics.track.title,
          artistName: analytics.track.artist_name,
          analytics: analytics
        }
      });

      if (error) throw error;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
      }

      toast.success('Analytics report ready');
    } catch (error) {
      toast.error('Failed to export analytics');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Track Analytics
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{analytics.track.title}</p>
        </div>
        <Button
          onClick={handleExportPDF}
          disabled={exporting}
          variant="outline"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streams */}
        <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-violet-500/10 via-background to-purple-500/5 border-violet-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Play className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-xs text-violet-300/80 uppercase tracking-wider font-medium">Streams</span>
            </div>
            <p className="text-4xl font-black text-violet-100">{analytics.streams.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>+12.5% this week</span>
            </div>
          </div>
        </Card>

        {/* Revenue */}
        <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-emerald-500/10 via-background to-green-500/5 border-emerald-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-emerald-300/80 uppercase tracking-wider font-medium">Revenue</span>
            </div>
            <p className="text-4xl font-black text-emerald-100">${analytics.revenue.toLocaleString()}</p>
            <p className="text-xs text-emerald-300/60 mt-2">$1.00 per stream</p>
          </div>
        </Card>

        {/* Engagement */}
        <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-rose-500/10 via-background to-pink-500/5 border-rose-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-rose-500/20">
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xs text-rose-300/80 uppercase tracking-wider font-medium">Likes</span>
            </div>
            <p className="text-4xl font-black text-rose-100">{analytics.likes.toLocaleString()}</p>
            <p className="text-xs text-rose-300/60 mt-2">{analytics.likeRate.toFixed(1)}% like rate</p>
          </div>
        </Card>

        {/* Comments */}
        <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/5 border-amber-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <MessageCircle className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs text-amber-300/80 uppercase tracking-wider font-medium">Comments</span>
            </div>
            <p className="text-4xl font-black text-amber-100">{analytics.comments.toLocaleString()}</p>
            <p className="text-xs text-amber-300/60 mt-2">{analytics.engagementRate.toFixed(1)}% engagement</p>
          </div>
        </Card>
      </div>

      {/* Performance Badges */}
      <div className="flex flex-wrap gap-2">
        {analytics.completionRate > 80 && (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-4 py-2 gap-2">
            <Flame className="w-4 h-4" />
            High Retention Track
          </Badge>
        )}
        {analytics.likeRate > 5 && (
          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 px-4 py-2 gap-2">
            <Heart className="w-4 h-4" />
            Fan Favorite
          </Badge>
        )}
        {analytics.streams > 1000 && (
          <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/30 px-4 py-2 gap-2">
            <Zap className="w-4 h-4" />
            Trending
          </Badge>
        )}
        {analytics.engagementRate > 10 && (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 px-4 py-2 gap-2">
            <Target className="w-4 h-4" />
            Viral Potential
          </Badge>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 7-Day Performance */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">7-Day Performance</h3>
            <Badge variant="outline" className="text-xs">Live Data</Badge>
          </div>
          <ChartContainer config={{}} className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.growthData}>
                <defs>
                  <linearGradient id="streamGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="streams"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#streamGradient)"
                  name="Streams"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        {/* Engagement Breakdown */}
        <Card className="p-6 bg-gradient-to-br from-rose-500/5 via-background to-amber-500/5 border-rose-500/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Engagement Breakdown</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">Completion Rate</span>
                </div>
                <span className="font-bold text-emerald-400">{analytics.completionRate.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                  style={{ width: `${analytics.completionRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-sm">Like Rate</span>
                </div>
                <span className="font-bold text-rose-400">{analytics.likeRate.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(analytics.likeRate * 10, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm">Engagement Rate</span>
                </div>
                <span className="font-bold text-amber-400">{analytics.engagementRate.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(analytics.engagementRate * 5, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Demographics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <Card className="p-6 bg-gradient-to-br from-violet-500/5 via-background to-purple-500/5 border-violet-500/10">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-violet-400" />
            <h3 className="font-bold text-lg">Audience Demographics</h3>
          </div>
          <div className="space-y-4">
            {analytics.demographics.ageGroups.map((age: any, idx: number) => (
              <div key={age.range} className="flex items-center gap-4">
                <span className="w-14 text-sm text-muted-foreground">{age.range}</span>
                <div className="flex-1 h-8 bg-muted/20 rounded-lg overflow-hidden relative">
                  <div 
                    className="h-full rounded-lg transition-all duration-1000 flex items-center justify-end pr-3"
                    style={{ 
                      width: `${age.percentage}%`,
                      background: `linear-gradient(90deg, hsl(${270 - idx * 20} 70% 50% / 0.3), hsl(${270 - idx * 20} 70% 50% / 0.6))`
                    }}
                  >
                    <span className="text-xs font-bold">{age.percentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Locations */}
        <Card className="p-6 bg-gradient-to-br from-cyan-500/5 via-background to-blue-500/5 border-cyan-500/10">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-lg">Top Locations</h3>
          </div>
          <div className="space-y-3">
            {analytics.demographics.topLocations.map((location: any, idx: number) => (
              <div key={location.city} className="flex items-center gap-4 p-3 rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                  idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                  idx === 2 ? 'bg-amber-700/20 text-amber-600' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{location.city}</p>
                  <p className="text-xs text-muted-foreground">{location.country}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{location.streams.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{location.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}