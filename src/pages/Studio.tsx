import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Music, LayoutDashboard, Library, TrendingUp, Users, Globe, Image, Heart, BookOpen, Zap, Film, User, ShoppingBag } from "lucide-react";
import { MusicLibrary } from "@/components/MusicLibrary";
import { ArtistDashboard } from "@/components/ArtistDashboard";
import { ManagerDashboard } from "@/components/ManagerDashboard";
import { LabelStaff } from "@/components/LabelStaff";
import { ReleaseManager } from "@/components/ReleaseManager";
import { DistributionAnalytics } from "@/components/DistributionAnalytics";
import { MusicUploadPro } from "@/components/MusicUploadPro";
import { ArtistGalleryManager } from "@/components/ArtistGalleryManager";
import { FanEngagementHub } from "@/components/FanEngagementHub";
import { StorytellingStudio } from "@/components/StorytellingStudio";
import { MomentumTracker } from "@/components/MomentumTracker";
import { CanvasManager } from "@/components/CanvasManager";
import { ArtistProfileEditor } from "@/components/ArtistProfileEditor";
import { ListenerProfileEditor } from "@/components/ListenerProfileEditor";
import { MerchAndTickets } from "@/components/MerchAndTickets";
import { TopBar } from "@/components/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  duration: number;
  file_path: string;
  play_count: number;
  album?: {
    title: string;
    cover_art_path?: string;
  };
}

const Studio = () => {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user);
  const navigate = useNavigate();
  const { playTrack } = useMusicPlayer();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handlePlayTrack = (track: any, trackQueue: any[]) => {
    playTrack(track, trackQueue);
  };

  return (
    <div className="min-h-screen bg-background pb-32 relative overflow-hidden">
      {/* Epic background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-1/3 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
      </div>
      
      <TopBar onUploadClick={() => setUploadDialogOpen(true)} />
      
      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Epic hero section */}
        <div className="mb-12 text-center space-y-6">
          <div className="inline-block">
            <div className="relative">
              <h1 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent mb-4 glow-text-lg animate-fade-in tracking-tight">
                TDZ Distribution
              </h1>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 blur-3xl -z-10 animate-pulse" />
            </div>
          </div>
          
          <p className="text-2xl md:text-3xl text-muted-foreground font-light tracking-wide animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Your Complete <span className="text-primary font-semibold">Record Label Studio</span>
          </p>
          
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Live</span>
            </div>
            <span className="text-border">•</span>
            <span>Powered by AI</span>
            <span className="text-border">•</span>
            <span>Real-time Analytics</span>
          </div>
        </div>

        {/* Epic tabs with glass morphism */}
        <Tabs defaultValue={role === 'manager' ? 'manager' : 'label-staff'} className="space-y-8">
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <TabsList className="glass-card-premium p-2 gap-2 h-auto">
              {role === 'manager' && (
                <TabsTrigger 
                  value="manager" 
                  className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
                >
                  <Users className="h-5 w-5" />
                  <span className="hidden sm:inline">Manager</span>
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="label-staff" 
                className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
              >
                <Users className="h-5 w-5" />
                <span className="hidden sm:inline">Label Staff</span>
              </TabsTrigger>
              <TabsTrigger 
                value="release" 
                className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
              >
                <Globe className="h-5 w-5" />
                <span className="hidden sm:inline">Release</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="library" 
                className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
              >
                <Library className="h-5 w-5" />
                <span className="hidden sm:inline">Library</span>
              </TabsTrigger>
              <TabsTrigger 
                value="gallery" 
                className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
              >
                <Image className="h-5 w-5" />
                <span className="hidden sm:inline">Gallery</span>
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fans" 
                className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
              >
                <Heart className="h-5 w-5" />
                <span className="hidden sm:inline">Fans</span>
              </TabsTrigger>
              <TabsTrigger 
                value="storytelling" 
                className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
              >
                <BookOpen className="h-5 w-5" />
                <span className="hidden sm:inline">Story</span>
              </TabsTrigger>
              <TabsTrigger 
                value="momentum" 
                className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
              >
                <Zap className="h-5 w-5" />
                <span className="hidden sm:inline">Momentum</span>
              </TabsTrigger>
              <TabsTrigger 
                value="canvas" 
                className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
              >
                <Film className="h-5 w-5" />
                <span className="hidden sm:inline">Canvas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger 
                value="merch" 
                className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="hidden sm:inline">Merch</span>
              </TabsTrigger>
              
              {/* Listener Profile Tab */}
              {role === 'listener' && (
                <TabsTrigger 
                  value="listener-profile" 
                  className="gap-2 px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">My Profile</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
            {role === 'manager' && (
              <TabsContent value="manager" className="mt-0">
                <ManagerDashboard />
              </TabsContent>
            )}

            <TabsContent value="label-staff" className="mt-0">
              <LabelStaff />
            </TabsContent>

            <TabsContent value="release" className="mt-0">
              <ReleaseManager />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <DistributionAnalytics />
            </TabsContent>

            <TabsContent value="library" className="mt-0">
              <MusicLibrary onPlayTrack={handlePlayTrack} />
            </TabsContent>

            <TabsContent value="gallery" className="mt-0">
              <ArtistGalleryManager />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-0">
              <ArtistDashboard />
            </TabsContent>

            <TabsContent value="fans" className="mt-0">
              <FanEngagementHub />
            </TabsContent>

            <TabsContent value="storytelling" className="mt-0">
              <StorytellingStudio />
            </TabsContent>

            <TabsContent value="momentum" className="mt-0">
              <MomentumTracker />
            </TabsContent>

            <TabsContent value="canvas" className="mt-0">
              <CanvasManager />
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              <ArtistProfileEditor />
            </TabsContent>

            <TabsContent value="merch" className="mt-0">
              <MerchAndTickets />
            </TabsContent>

            <TabsContent value="listener-profile" className="mt-0">
              <ListenerProfileEditor />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card-premium border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Upload Your Music
            </DialogTitle>
          </DialogHeader>
          <MusicUploadPro onSuccess={() => setUploadDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Studio;