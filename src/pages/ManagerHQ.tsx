import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioGuard } from "@/components/auth/AuthGuard";
import { RosterManager } from "@/components/manager/RosterManager";
import { RosterInsights } from "@/components/manager/RosterInsights";
import { RosterAnalyticsDrilldown } from "@/components/manager/RosterAnalyticsDrilldown";
import { BrandingStudio } from "@/components/manager/BrandingStudio";
import { IntegrationsHub } from "@/components/manager/IntegrationsHub";
import { Building2, Users, TrendingUp, Palette, Plug, Upload, Sparkles, ArrowLeft } from "lucide-react";

function ManagerHQContent() {
  const { plan, isManager, isAdmin } = useAuthContext();
  const navigate = useNavigate();

  const isEnterprise = plan === "enterprise" || isAdmin;

  if (!isManager && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center glass-card">
          <h2 className="text-xl font-bold mb-2">Manager HQ</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This dashboard is for managers and label staff.
          </p>
          <Button onClick={() => navigate("/studio")}>Go to Studio</Button>
        </Card>
      </div>
    );
  }

  if (!isEnterprise) {
    return (
      <div className="min-h-screen p-6 md:p-10" style={{ background: "#0D0D0D" }}>
        <div className="max-w-3xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/studio")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Card className="p-10 text-center glass-card">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Manager HQ is an Enterprise feature</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Upgrade to Enterprise ($50/mo) to unlock roster management, aggregated insights across all your
              artists, white-label branding, and custom integrations with Google Ads Manager, Meta Ads, TikTok
              Ads, GA4, Mailchimp, and Zapier.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6 text-left">
              {[
                { icon: Users, label: "Full roster" },
                { icon: TrendingUp, label: "Aggregated analytics" },
                { icon: Palette, label: "White-label" },
                { icon: Plug, label: "Custom integrations" },
              ].map((f) => (
                <div key={f.label} className="p-3 rounded-lg border border-border/40 text-center">
                  <f.icon className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <div className="text-xs">{f.label}</div>
                </div>
              ))}
            </div>
            <Button onClick={() => navigate("/pricing")} className="w-full h-11 bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 font-semibold">
              Upgrade to Enterprise
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "#0D0D0D" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Manager HQ</h1>
              <p className="text-xs text-muted-foreground">Enterprise · Full roster management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/studio")}>
              <Upload className="w-3 h-3 mr-1" /> Studio
            </Button>
          </div>
        </div>

        <Tabs defaultValue="roster">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
            <TabsTrigger value="roster"><Users className="w-3 h-3 mr-1" /> Roster</TabsTrigger>
            <TabsTrigger value="releases"><Upload className="w-3 h-3 mr-1" /> Releases</TabsTrigger>
            <TabsTrigger value="insights"><TrendingUp className="w-3 h-3 mr-1" /> Insights</TabsTrigger>
            <TabsTrigger value="drilldown"><TrendingUp className="w-3 h-3 mr-1" /> Drilldown</TabsTrigger>
            <TabsTrigger value="branding"><Palette className="w-3 h-3 mr-1" /> Branding</TabsTrigger>
            <TabsTrigger value="integrations"><Plug className="w-3 h-3 mr-1" /> Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="roster" className="mt-6">
            <RosterManager />
          </TabsContent>

          <TabsContent value="releases" className="mt-6">
            <Card className="p-8 glass-card text-center">
              <Upload className="w-10 h-10 mx-auto text-primary mb-3" />
              <h3 className="font-semibold mb-2">Release music on behalf of your roster</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open Studio to upload tracks. As an enterprise manager, uploads you make against an accepted
                roster invite are published to that artist's profile.
              </p>
              <Button onClick={() => navigate("/studio")}>Open Studio</Button>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <RosterInsights />
          </TabsContent>

          <TabsContent value="drilldown" className="mt-6">
            <RosterAnalyticsDrilldown />
          </TabsContent>

          <TabsContent value="branding" className="mt-6">
            <BrandingStudio />
          </TabsContent>

          <TabsContent value="integrations" className="mt-6">
            <IntegrationsHub />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ManagerHQ() {
  return (
    <StudioGuard>
      <ManagerHQContent />
    </StudioGuard>
  );
}
