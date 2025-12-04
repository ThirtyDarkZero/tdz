import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasterClasses } from "@/components/MasterClasses";
import { LabelStaff } from "@/components/LabelStaff";
import { FeatureGate } from "@/components/FeatureGate";

export const StudioLearn = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight mb-2">Learn</h1>
        <p className="text-muted-foreground">Master your craft with expert courses and quantum AI guidance</p>
      </div>

      <Tabs defaultValue="masterclasses" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="masterclasses" className="data-[state=active]:bg-background">
            Master Classes
          </TabsTrigger>
          <TabsTrigger value="quantum" className="data-[state=active]:bg-background">
            Quantum Advisors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="masterclasses" className="mt-0">
          <MasterClasses />
        </TabsContent>

        <TabsContent value="quantum" className="mt-0">
          <FeatureGate feature="advancedAnalytics">
            <LabelStaff />
          </FeatureGate>
        </TabsContent>
      </Tabs>
    </div>
  );
};