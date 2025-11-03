import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Music, LayoutDashboard, Library, TrendingUp, Users, Globe, Image, Heart, BookOpen, Zap, Film, User, ShoppingBag, Sparkles, Compass } from "lucide-react";
import { MusicPlayer } from "@/components/MusicPlayer";
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
import { MerchAndTickets } from "@/components/MerchAndTickets";
import { QuantumAdvisor } from "@/components/QuantumAdvisor";
import { TopBar } from "@/components/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [artistName, setArtistName] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Protect studio from listeners/fans
  useEffect(() => {
    if (!roleLoading && role && role === 'listener') {
      toast.error("Studio access is only available for artists and managers");
      navigate("/discover");
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    const fetchArtistProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("artist_profiles")
        .select("artist_name")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching artist profile:", error);
        return;
      }
      
      // If no profile exists, redirect to complete setup without deleting roles
      if (!data) {
        console.log("No artist profile found, redirecting to complete setup");
        toast.error("Profile incomplete", {
          description: "Please complete your artist profile setup"
        });
        navigate("/role-selection");
        return;
      }
      
      if (data.artist_name) {
        setArtistName(data.artist_name);
      } else {
        setArtistName("Artist");
      }
    };
    
    fetchArtistProfile();
  }, [user, navigate]);

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

  const handlePlayTrack = (track: Track, trackQueue: Track[]) => {
    setCurrentTrack(track);
    setQueue(trackQueue);
    const index = trackQueue.findIndex(t => t.id === track.id);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1];
      setCurrentTrack(nextTrack);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1];
      setCurrentTrack(prevTrack);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTrackEnd = () => {
    handleNext();
  };

  return (
    <div className="min-h-screen bg-background pb-32 relative overflow-hidden">
      {/* Epic background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-1/3 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
      </div>
      
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <TopBar onUploadClick={() => setUploadDialogOpen(true)} />
          <Button
            variant="outline"
            onClick={() => navigate("/discover")}
            className="gap-2"
          >
            <Compass className="h-4 w-4" />
            Discover
          </Button>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Epic hero section */}
        <div className="mb-8 md:mb-12 text-center space-y-4 md:space-y-6">
          <div className="inline-block">
            <div className="relative">
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent mb-4 glow-text-lg animate-fade-in tracking-tight">
                Welcome {artistName}
              </h1>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 blur-3xl -z-10 animate-pulse" />
            </div>
          </div>
          
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground font-light tracking-wide animate-fade-in px-4" style={{ animationDelay: '0.2s' }}>
            Your Complete <span className="text-primary font-semibold">Record Label Studio</span>
          </p>
          
          <div className="flex items-center justify-center gap-2 md:gap-3 text-xs sm:text-sm text-muted-foreground animate-fade-in flex-wrap px-4" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Live</span>
            </div>
            <span className="text-border">•</span>
            <span>Powered by AI</span>
            <span className="text-border hidden sm:inline">•</span>
            <span className="hidden sm:inline">Real-time Analytics</span>
          </div>
        </div>

        {/* Epic tabs with glass morphism */}
        <Tabs defaultValue={role === 'manager' ? 'manager' : 'label-staff'} className="space-y-6 md:space-y-8">
          <div className="flex justify-center animate-fade-in overflow-x-auto pb-2 -mx-4 px-4" style={{ animationDelay: '0.6s' }}>
            <TabsList className="glass-card-premium p-1.5 md:p-2 gap-1 md:gap-2 h-auto inline-flex min-w-max">
              {role === 'manager' && (
                <TabsTrigger 
                  value="manager" 
                  className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
                >
                  <Users className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Manager</span>
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="label-staff" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
              >
                <Users className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Staff</span>
              </TabsTrigger>
              <TabsTrigger 
                value="release" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
              >
                <Globe className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Release</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
              >
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="library" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
              >
                <Library className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Library</span>
              </TabsTrigger>
              <TabsTrigger 
                value="gallery" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
              >
                <Image className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Gallery</span>
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
              >
                <LayoutDashboard className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fans" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
              >
                <Heart className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Fans</span>
              </TabsTrigger>
              <TabsTrigger 
                value="storytelling" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
              >
                <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Story</span>
              </TabsTrigger>
              <TabsTrigger 
                value="momentum" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
              >
                <Zap className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Momentum</span>
              </TabsTrigger>
              <TabsTrigger 
                value="canvas" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
              >
                <Film className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Canvas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
              >
                <User className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger 
                value="merch" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap"
              >
                <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Merch</span>
              </TabsTrigger>
              <TabsTrigger 
                value="quantum" 
                className="gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap animate-pulse"
              >
                <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Quantum</span>
              </TabsTrigger>
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

            <TabsContent value="quantum" className="mt-0">
              <QuantumAdvisor />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <MusicPlayer
        currentTrack={currentTrack}
        queue={queue}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onTrackEnd={handleTrackEnd}
      />

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