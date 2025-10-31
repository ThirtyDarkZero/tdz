import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3, TrendingUp, Globe, DollarSign,
  Music, Users, Play, Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AnalyticsData = {
  totalStreams: number;
  totalRevenue: number;
  totalTracks: number;
  totalListeners: number;
  topTrack: any;
  platformBreakdown: any[];
  recentActivity: any[];
};

export function DistributionAnalytics() {
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

      // Load published tracks
      const { data: tracks, error: tracksError } = await supabase
        .from("tracks")
        .select("*, albums(cover_art_path)")
        .eq("user_id", user.id)
        .eq("is_published", true);

      if (tracksError) throw tracksError;

      // Calculate totals
      const totalStreams = tracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
      const totalTracks = tracks?.length || 0;
      const totalRevenue = totalStreams * 0.004; // Approximate $0.004 per stream

      // Find top track
      const topTrack = tracks?.reduce((top, track) =>
        (track.play_count || 0) > (top?.play_count || 0) ? track : top
      , null);

      // Mock platform data (in real app, this would come from actual platform APIs)
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
        totalListeners: Math.floor(totalStreams * 0.7), // Estimate unique listeners
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

  const StatCard = ({ icon: Icon, label, value, subtext, color }: any) => (
    <Card className="glass-card p-6 hover:border-primary/60 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold mb-1">{value}</p>
          {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );

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

      {/* Platform Breakdown & Top Track */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Platform Breakdown */}
        <Card className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Platform Breakdown
          </h3>
          <div className="space-y-3">
            {analytics.platformBreakdown.map((platform, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-xl flex-shrink-0`}>
                  {platform.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{platform.platform}</span>
                    <span className="text-sm text-muted-foreground">
                      {platform.streams.toLocaleString()} plays
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${platform.color} transition-all`}
                      style={{
                        width: `${(platform.streams / analytics.totalStreams) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Performing Track */}
        <Card className="glass-card p-6">
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
      </div>
    </div>
  );
}
