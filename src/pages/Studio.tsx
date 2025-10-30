import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { UploadPanel } from "@/components/UploadPanel";
import { StoryboardView } from "@/components/StoryboardView";
import { AIDirectorPanel } from "@/components/AIDirectorPanel";
import { TimelinePanel } from "@/components/TimelinePanel";
import { useAuth } from "@/hooks/useAuth";

export default function Studio() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <UploadPanel />
        <StoryboardView />
        <AIDirectorPanel />
      </div>
      <TimelinePanel />
    </div>
  );
}
