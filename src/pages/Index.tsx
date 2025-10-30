import { TopBar } from "@/components/TopBar";
import { UploadPanel } from "@/components/UploadPanel";
import { StoryboardView } from "@/components/StoryboardView";
import { AIDirectorPanel } from "@/components/AIDirectorPanel";
import { TimelinePanel } from "@/components/TimelinePanel";

const Index = () => {
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
};

export default Index;
