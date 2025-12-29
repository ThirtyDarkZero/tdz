import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MusicPlayer } from "@/components/MusicPlayer";
import { MultiTrackUploader } from "@/components/MultiTrackUploader";
import { PendingInvitesPanel } from "@/components/PendingInvitesPanel";
import { ManagerDashboard } from "@/components/ManagerDashboard";
import { ArtistDashboard } from "@/components/ArtistDashboard";
import { StudioSidebar } from "@/components/studio/StudioSidebar";
import { StudioHome } from "@/components/studio/StudioHome";
import { StudioMusic } from "@/components/studio/StudioMusic";
import { StudioInsights } from "@/components/studio/StudioInsights";
import { StudioPromote } from "@/components/studio/StudioPromote";
import { StudioLearn } from "@/components/studio/StudioLearn";
import { StudioSettings } from "@/components/studio/StudioSettings";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
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
  const { loading: subLoading } = useSubscription(user);
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState("home");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [artistName, setArtistName] = useState<string>("Artist");
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // CRITICAL: Block render completely until auth AND role are verified
  // This prevents fans from ever seeing Studio UI even briefly
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
  }, [user, loading, navigate]);

  // Redirect listeners BEFORE any UI render
  useEffect(() => {
    if (!roleLoading && role === 'listener') {
      toast.error("Studio access is only available for artists and managers");
      navigate("/discover", { replace: true });
    }
  }, [role, roleLoading, navigate]);

  // Load artist profile once access is verified (must be declared before conditional returns)
  useEffect(() => {
    if (!user) return;
    if (roleLoading) return;
    if (role === "listener" || !role) return;

    let cancelled = false;

    const fetchArtistProfile = async () => {
      const { data, error } = await supabase
        .from("artist_profiles")
        .select("artist_name, profile_image_path")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Error fetching artist profile:", error);
        return;
      }

      if (!data) {
        toast.error("Profile incomplete", {
          description: "Please complete your artist profile setup",
        });
        navigate("/role-selection");
        return;
      }

      setArtistName(data.artist_name || "Artist");
      if (data.profile_image_path) {
        const url = supabase.storage
          .from("artist-images")
          .getPublicUrl(data.profile_image_path).data.publicUrl;
        setProfileImage(url);
      }
    };

    fetchArtistProfile();

    return () => {
      cancelled = true;
    };
  }, [user, role, roleLoading, navigate]);

  // SECURITY: Return loading until we CONFIRM user is NOT a listener
  // This is the key fix - we don't render ANY Studio UI until role is verified
  if (loading || roleLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // SECURITY: Double-check - if no role or listener, show nothing
  if (!user || role === 'listener' || !role) {
    return null;
  }


  // This block is now handled above for security
  // Removed duplicate loading check

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

  const renderContent = () => {
    // Manager gets their own dashboard
    if (role === 'manager' && activeSection === 'home') {
      return <ManagerDashboard />;
    }

    switch (activeSection) {
      case "home":
        return (
          <StudioHome 
            artistName={artistName} 
            onNavigate={setActiveSection}
            onUploadClick={() => setUploadDialogOpen(true)}
          />
        );
      case "music":
        return <StudioMusic onPlayTrack={handlePlayTrack} />;
      case "insights":
        return <StudioInsights />;
      case "promote":
        return <StudioPromote />;
      case "learn":
        return <StudioLearn />;
      case "settings":
        return <StudioSettings />;
      default:
        return (
          <StudioHome 
            artistName={artistName} 
            onNavigate={setActiveSection}
            onUploadClick={() => setUploadDialogOpen(true)}
          />
        );
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <StudioSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onUploadClick={() => setUploadDialogOpen(true)}
          artistName={artistName}
          profileImage={profileImage}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* Main Content */}
        <main className={`${sidebarCollapsed ? 'ml-[72px]' : 'ml-[72px] md:ml-[240px]'} transition-all duration-300 min-h-screen pb-32`}>
          {/* Background Effects */}
          <div className={`fixed inset-0 pointer-events-none z-0 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[72px] md:ml-[240px]'}`}>
            <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 p-6 md:p-8 lg:p-10 max-w-7xl">
            <PendingInvitesPanel />
            {renderContent()}
          </div>
        </main>

        {/* Music Player */}
        <MusicPlayer
          currentTrack={currentTrack}
          queue={queue}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onTrackEnd={handleTrackEnd}
        />

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold">
                Upload Your Music
              </DialogTitle>
            </DialogHeader>
            <MultiTrackUploader onSuccess={() => setUploadDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default Studio;
