import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { MultiTrackUploader } from "@/components/MultiTrackUploader";
import { PendingInvitesPanel } from "@/components/PendingInvitesPanel";
import { ManagerDashboard } from "@/components/ManagerDashboard";
import { StudioSidebar } from "@/components/studio/StudioSidebar";
import { StudioHome } from "@/components/studio/StudioHome";
import { StudioMusic } from "@/components/studio/StudioMusic";
import { StudioInsights } from "@/components/studio/StudioInsights";
import { StudioAgentPanel } from "@/components/studio/StudioAgentPanel";
import { StudioAutopilot } from "@/components/studio/StudioAutopilot";
import { StudioPromote } from "@/components/studio/StudioPromote";
import { StudioLearn } from "@/components/studio/StudioLearn";
import { StudioSettings } from "@/components/studio/StudioSettings";
import { StudioConnectAI } from "@/components/studio/StudioConnectAI";
import { useAuthContext } from "@/contexts/AuthContext";
import { useActingArtist } from "@/contexts/ActingArtistContext";
import { ActingArtistSwitcher } from "@/components/manager/ActingArtistSwitcher";
import { StudioGuard } from "@/components/auth/AuthGuard";
import { supabase } from "@/integrations/supabase/client";

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

function StudioContent() {
  const { user, role, isManager } = useAuthContext();
  const { isDelegated, effectiveUserId, actingArtistName, canDelegate } = useActingArtist();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState("home");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [artistName, setArtistName] = useState<string>("Artist");
  const [profileImage, setProfileImage] = useState<string | undefined>();
  // Default to collapsed on mobile so content is visible
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  );

  // Load artist profile (or delegated roster artist's profile when acting on their behalf)
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const loadFor = effectiveUserId || user.id;

    const fetchArtistProfile = async () => {
      const { data, error } = await supabase
        .from("artist_profiles")
        .select("artist_name, profile_image_path")
        .eq("user_id", loadFor)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Error fetching artist profile:", error);
        return;
      }

      if (data) {
        setArtistName(data.artist_name || "Artist");
        if (data.profile_image_path) {
          const url = supabase.storage
            .from("artist-images")
            .getPublicUrl(data.profile_image_path).data.publicUrl;
          setProfileImage(url);
        }
      }
    };

    fetchArtistProfile();

    return () => {
      cancelled = true;
    };
  }, [user, effectiveUserId]);

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
    if (isManager && activeSection === 'home') {
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
      case "agent":
        return <StudioAgentPanel />;
      case "autopilot":
        return <StudioAutopilot />;
      case "connect-ai":
        return <StudioConnectAI />;
      case "learn":
        setActiveSection("home");
        return null;
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
      <div className="min-h-screen studio-fonts" style={{ background: "#141414" }}>
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
        <div className={cn(
          "transition-all duration-300 min-h-screen pb-32",
          "ml-0",
          sidebarCollapsed ? "md:ml-16" : "md:ml-[240px] lg:ml-[350px]"
        )}>
          {/* Subtle cyan radial gradient */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full blur-[120px]" style={{ background: "rgba(0,207,255,0.04)" }} />
            <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: "rgba(139,92,246,0.03)" }} />
          </div>

          <div className="relative z-10 p-3 pt-16 sm:p-4 sm:pt-16 md:pt-6 md:p-6 lg:p-10 max-w-7xl mx-auto">
            {canDelegate && (
              <div className="mb-4 flex items-center justify-between gap-3 flex-wrap p-3 rounded-lg glass-card border border-primary/20">
                <div className="text-xs">
                  {isDelegated ? (
                    <span className="text-white/90">
                      You are currently releasing music &amp; viewing analytics as{" "}
                      <b className="text-primary">{actingArtistName}</b>. Actions taken here belong to that artist.
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Enterprise manager mode — switch to any roster artist to release music or view their analytics.
                    </span>
                  )}
                </div>
                <ActingArtistSwitcher />
              </div>
            )}
            <PendingInvitesPanel />
            {renderContent()}
          </div>
        </div>




        {/* Release Quest Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
            <DialogHeader className="sr-only">
              <DialogTitle>Release Your Music</DialogTitle>
            </DialogHeader>
            <ReleaseQuest
              onSuccess={() => setUploadDialogOpen(false)}
              targetUserId={isDelegated ? effectiveUserId ?? undefined : undefined}
              targetArtistName={isDelegated ? actingArtistName ?? undefined : undefined}
            />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// Wrap with StudioGuard for role-based access
export default function Studio() {
  return (
    <StudioGuard>
      <StudioContent />
    </StudioGuard>
  );
}