import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FanEngagementHub } from "@/components/FanEngagementHub";
import { StorytellingStudio } from "@/components/StorytellingStudio";
import { CanvasManager } from "@/components/CanvasManager";
import { MerchStore } from "@/components/MerchStore";
import { PreSaveCampaignManager } from "@/components/PreSaveCampaignManager";
import { FeatureGate } from "@/components/FeatureGate";
import { LabelStaff } from "@/components/LabelStaff";
import { CSVFanImport } from "@/components/promote/CSVFanImport";
import { EmailCampaignGenerator } from "@/components/promote/EmailCampaignGenerator";
import { SmartLinkBuilder } from "@/components/promote/SmartLinkBuilder";
import { TourDatesManager } from "@/components/promote/TourDatesManager";
import { FanDirectMessages } from "@/components/promote/FanDirectMessages";

export const StudioPromote = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight mb-2">Promote</h1>
        <p className="text-muted-foreground">Grow your audience and engage with fans</p>
      </div>

      <Tabs defaultValue="ai-assistant" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
          <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-background">
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="smart-links" className="data-[state=active]:bg-background">
            Smart Links
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-background">
            Email Campaigns
          </TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-background">
            Fan Messages
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-background">
            Import Fans
          </TabsTrigger>
          <TabsTrigger value="tour" className="data-[state=active]:bg-background">
            Tour Dates
          </TabsTrigger>
          <TabsTrigger value="presave" className="data-[state=active]:bg-background">
            Pre-Save
          </TabsTrigger>
          <TabsTrigger value="fans" className="data-[state=active]:bg-background">
            Fan Hub
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

        <TabsContent value="smart-links" className="mt-0">
          <SmartLinkBuilder />
        </TabsContent>

        <TabsContent value="email" className="mt-0">
          <EmailCampaignGenerator />
        </TabsContent>

        <TabsContent value="messages" className="mt-0">
          <FanDirectMessages />
        </TabsContent>

        <TabsContent value="import" className="mt-0">
          <CSVFanImport />
        </TabsContent>

        <TabsContent value="tour" className="mt-0">
          <TourDatesManager />
        </TabsContent>

        <TabsContent value="presave" className="mt-0">
          <FeatureGate feature="presaveCampaigns">
            <PreSaveCampaignManager />
          </FeatureGate>
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
