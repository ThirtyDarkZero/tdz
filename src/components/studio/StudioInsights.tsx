import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DistributionAnalytics } from "@/components/DistributionAnalytics";
import { FanDemographics } from "@/components/FanDemographics";
import { MomentumTracker } from "@/components/MomentumTracker";
import { TourRecommendations } from "@/components/TourRecommendations";
import { FeatureGate } from "@/components/FeatureGate";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

export const StudioInsights = () => {
  const { user } = useAuth();
  const { hasFeature } = useSubscription(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight mb-2">Insights</h1>
        <p className="text-muted-foreground">Track your performance, audience, and growth</p>
      </div>

      <Tabs defaultValue="streams" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="streams" className="data-[state=active]:bg-background">
            Streams
          </TabsTrigger>
          <TabsTrigger value="demographics" className="data-[state=active]:bg-background">
            Demographics
          </TabsTrigger>
          <TabsTrigger value="momentum" className="data-[state=active]:bg-background">
            Momentum
          </TabsTrigger>
          <TabsTrigger value="tour" className="data-[state=active]:bg-background">
            Tour
          </TabsTrigger>
        </TabsList>

        <TabsContent value="streams" className="mt-0">
          <DistributionAnalytics showAdvanced={hasFeature('advancedAnalytics')} />
        </TabsContent>

        <TabsContent value="demographics" className="mt-0">
          <FanDemographics />
        </TabsContent>

        <TabsContent value="momentum" className="mt-0">
          <FeatureGate feature="advancedAnalytics">
            <MomentumTracker />
          </FeatureGate>
        </TabsContent>

        <TabsContent value="tour" className="mt-0">
          <TourRecommendations />
        </TabsContent>
      </Tabs>
    </div>
  );
};
