import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { UploadPanel } from "@/components/UploadPanel";
import { StoryboardView } from "@/components/StoryboardView";
import { TimelinePanel } from "@/components/TimelinePanel";
import { AIDirectorPanel } from "@/components/AIDirectorPanel";
import { ProductionPipeline } from "@/components/ProductionPipeline";
import { ProjectsList } from "@/components/ProjectsList";
import { TemplatesList } from "@/components/TemplatesList";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Film, Package, FolderOpen, LayoutTemplate } from "lucide-react";
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
    <ProjectProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <UploadPanel />
        <Tabs defaultValue="storyboard" className="flex-1 flex flex-col">
          <div className="border-b px-6">
            <TabsList className="h-12">
              <TabsTrigger value="storyboard" className="gap-2">
                <Film className="w-4 h-4" />
                Storyboard
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="gap-2">
                <Package className="w-4 h-4" />
                Production
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-2">
                <FolderOpen className="w-4 h-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <LayoutTemplate className="w-4 h-4" />
                Templates
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <TabsContent value="storyboard" className="flex-1 m-0 overflow-auto">
              <StoryboardView />
            </TabsContent>
            <TabsContent value="pipeline" className="flex-1 m-0 overflow-auto">
              <ProductionPipeline />
            </TabsContent>
            <TabsContent value="projects" className="flex-1 m-0 overflow-auto">
              <ProjectsList />
            </TabsContent>
            <TabsContent value="templates" className="flex-1 m-0 overflow-auto">
              <TemplatesList />
            </TabsContent>
            <AIDirectorPanel />
          </div>
        </Tabs>
      </div>
      <TimelinePanel />
      </div>
    </ProjectProvider>
  );
}
