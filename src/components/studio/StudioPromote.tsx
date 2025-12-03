import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FanEngagementHub } from "@/components/FanEngagementHub";
import { StorytellingStudio } from "@/components/StorytellingStudio";
import { CanvasManager } from "@/components/CanvasManager";
import { MerchStore } from "@/components/MerchStore";
import { FeatureGate } from "@/components/FeatureGate";
import { LabelStaff } from "@/components/LabelStaff";

export const StudioPromote = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight mb-2">Promote</h1>
        <p className="text-muted-foreground">Grow your audience and engage with fans</p>
      </div>

      <Tabs defaultValue="ai-assistant" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-background">
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="fans" className="data-[state=active]:bg-background">
            Fan Engagement
          </TabsTrigger>
          <TabsTrigger value="storytelling" className="data-[state=active]:bg-background">
            Storytelling
          </TabsTrigger>
          <TabsTrigger value="canvas" className="data-[state=active]:bg-background">
            Canvas
          </TabsTrigger>
          <TabsTrigger value="merch" className="data-[state=active]:bg-background">
            Merch
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-assistant" className="mt-0">
          <LabelStaff />
        </TabsContent>

        <TabsContent value="fans" className="mt-0">
          <FeatureGate feature="fanEngagement">
            <FanEngagementHub />
          </FeatureGate>
        </TabsContent>

        <TabsContent value="storytelling" className="mt-0">
          <FeatureGate feature="presaveCampaigns">
            <StorytellingStudio />
          </FeatureGate>
        </TabsContent>

        <TabsContent value="canvas" className="mt-0">
          <FeatureGate feature="advancedAnalytics">
            <CanvasManager />
          </FeatureGate>
        </TabsContent>

        <TabsContent value="merch" className="mt-0">
          <MerchStore variant="full" />
        </TabsContent>
      </Tabs>
    </div>
  );
};
