import { useState, useEffect } from "react";
import { Upload, TrendingUp, Users, Play, DollarSign, Music, MapPin, Target, Sparkles, GraduationCap, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MusicUploadPro } from "./MusicUploadPro";
import { SocialMediaHub } from "./SocialMediaHub";
import { TourRecommendations } from "./TourRecommendations";
import { PitchingHub } from "./PitchingHub";
import { OpportunitiesMarketplace } from "./OpportunitiesMarketplace";
import { MasterClasses } from "./MasterClasses";

interface Stats {
  totalPlays: number;
  totalTracks: number;
  totalAlbums: number;
  monthlyListeners: number;
  recentPlays: Array<{
    track_title: string;
    play_count: number;
  }>;
}

export const ArtistDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalPlays: 0,
    totalTracks: 0,
    totalAlbums: 0,
    monthlyListeners: 0,
    recentPlays: []
  });
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get total tracks
      const { count: tracksCount } = await supabase
        .from('tracks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get total albums
      const { count: albumsCount } = await supabase
        .from('albums')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get total plays
      const { data: tracks } = await supabase
        .from('tracks')
        .select('id, play_count, title')
        .eq('user_id', user.id);

      const totalPlays = tracks?.reduce((sum, track) => sum + track.play_count, 0) || 0;

      // Get monthly listeners (unique users who played in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: listeners } = await supabase
        .from('listening_history')
        .select('user_id')
        .in('track_id', tracks?.map(t => t.id) || [])
        .gte('played_at', thirtyDaysAgo.toISOString());

      const uniqueListeners = new Set(listeners?.map(l => l.user_id)).size;

      // Get top tracks
      const topTracks = tracks
        ?.sort((a, b) => b.play_count - a.play_count)
        .slice(0, 5)
        .map(t => ({ track_title: t.title, play_count: t.play_count })) || [];

      setStats({
        totalPlays,
        totalTracks: tracksCount || 0,
        totalAlbums: albumsCount || 0,
        monthlyListeners: uniqueListeners,
        recentPlays: topTracks
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast({
        title: "Failed to load stats",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Artist Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">Your complete record label suite</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button size="default" className="w-full sm:w-auto" data-upload-track>
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Upload Music</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New Music</DialogTitle>
              <DialogDescription>
                Complete metadata, artwork, and publishing information
              </DialogDescription>
            </DialogHeader>
            <MusicUploadPro onSuccess={() => {
              setUploadOpen(false);
              loadStats();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Plays</CardTitle>
            <Play className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalPlays.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Listeners</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.monthlyListeners.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tracks</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalTracks}</div>
            <p className="text-xs text-muted-foreground">{stats.totalAlbums} albums</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">${(stats.totalPlays * 0.004).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Streams</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
        <div className="overflow-x-auto -mx-4 px-4">
          <TabsList className="inline-flex min-w-max">
            <TabsTrigger value="overview" className="gap-1 md:gap-2 text-xs md:text-sm">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1 md:gap-2 text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
            <TabsTrigger value="tour" className="gap-1 md:gap-2 text-xs md:text-sm">
              <MapPin className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Tours</span>
            </TabsTrigger>
            <TabsTrigger value="pitching" className="gap-1 md:gap-2 text-xs md:text-sm">
              <Target className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Pitching</span>
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="gap-1 md:gap-2 text-xs md:text-sm">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Opps</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-1 md:gap-2 text-xs md:text-sm">
              <GraduationCap className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Learn</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Tracks</CardTitle>
              <CardDescription>Your most played songs</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentPlays.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tracks yet. Upload your first track!</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentPlays.map((track, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-muted-foreground w-8">#{index + 1}</span>
                        <div>
                          <p className="font-medium">{track.track_title}</p>
                          <p className="text-sm text-muted-foreground">{track.play_count.toLocaleString()} plays</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <SocialMediaHub />
        </TabsContent>

        <TabsContent value="tour">
          <TourRecommendations />
        </TabsContent>

        <TabsContent value="pitching">
          <PitchingHub />
        </TabsContent>

        <TabsContent value="opportunities">
          <OpportunitiesMarketplace />
        </TabsContent>

        <TabsContent value="education">
          <MasterClasses />
        </TabsContent>
      </Tabs>
    </div>
  );
};