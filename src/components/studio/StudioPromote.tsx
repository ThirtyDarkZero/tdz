import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorytellingStudio } from "@/components/StorytellingStudio";
import { MerchStore } from "@/components/MerchStore";
import { PreSaveCampaignManager } from "@/components/PreSaveCampaignManager";
import { FeatureGate } from "@/components/FeatureGate";
import { CSVFanImport } from "@/components/promote/CSVFanImport";
import { EmailCampaignGenerator } from "@/components/promote/EmailCampaignGenerator";
import { SmartLinkBuilder } from "@/components/promote/SmartLinkBuilder";
import { TourDatesManager } from "@/components/promote/TourDatesManager";
import { FanHub } from "@/components/promote/FanHub";
import { StorytellingAIGenerator } from "@/components/promote/StorytellingAIGenerator";

export const StudioPromote = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight mb-2">Promote</h1>
        <p className="text-muted-foreground">Grow your audience and engage with fans</p>
      </div>

      <Tabs defaultValue="fans" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
          <TabsTrigger value="fans" className="data-[state=active]:bg-background">
            Fans
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-background">
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="smart-links" className="data-[state=active]:bg-background">
            Smart Links
          </TabsTrigger>
          <TabsTrigger value="storytelling" className="data-[state=active]:bg-background">
            Storytelling
          </TabsTrigger>
          <TabsTrigger value="merch" className="data-[state=active]:bg-background">
            Merch
          </TabsTrigger>
          <TabsTrigger value="tour" className="data-[state=active]:bg-background">
            Tour
          </TabsTrigger>
        </TabsList>

        {/* FANS — Fan Hub + CSV Import + Contacts List */}
        <TabsContent value="fans" className="mt-0">
          <FanHub />
        </TabsContent>

        {/* CAMPAIGNS — Email + Press Release */}
        <TabsContent value="campaigns" className="mt-0">
          <EmailCampaignGenerator />
        </TabsContent>

        {/* SMART LINKS — Smart Links + Pre-Save combined */}
        <TabsContent value="smart-links" className="mt-0 space-y-6">
          <SmartLinkBuilder />
          <FeatureGate feature="presaveCampaigns">
            <PreSaveCampaignManager />
          </FeatureGate>
        </TabsContent>

        {/* STORYTELLING — Simple story + AI generator */}
        <TabsContent value="storytelling" className="mt-0 space-y-8">
          <StorytellingStudio />
          <div className="border-t border-border/20 pt-8">
            <StorytellingAIGenerator />
          </div>
        </TabsContent>

        {/* MERCH */}
        <TabsContent value="merch" className="mt-0">
          <MerchStore variant="full" />
        </TabsContent>

        {/* TOUR */}
        <TabsContent value="tour" className="mt-0">
          <TourDatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
