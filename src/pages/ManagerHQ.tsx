import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioGuard } from "@/components/auth/AuthGuard";
import { RosterManager } from "@/components/manager/RosterManager";
import { RosterInsights } from "@/components/manager/RosterInsights";
import { RosterAnalyticsDrilldown } from "@/components/manager/RosterAnalyticsDrilldown";
import { RosterReleasesPanel } from "@/components/manager/RosterReleasesPanel";
import { BrandingStudio } from "@/components/manager/BrandingStudio";
import { IntegrationsHub } from "@/components/manager/IntegrationsHub";
import { ActingArtistSwitcher } from "@/components/manager/ActingArtistSwitcher";
import { Building2, Users, TrendingUp, Palette, Plug, Upload, Sparkles, ArrowLeft, Loader2 } from "lucide-react";

const MAX_SYNC_ATTEMPTS = 10; // ~20s of polling while Stripe's webhook lands

function ManagerHQContent() {
  const { plan, isManager, isAdmin, refreshAll } = useAuthContext();
  const navigate = useNavigate();

  const isEnterprise = plan === "enterprise" || isAdmin;

  // After Stripe checkout the local subscription snapshot is stale, so the page
  // would flash the paywall ("failed to load"). Re-sync plan + role before gating.
  const [syncing, setSyncing] = useState(!isEnterprise);
  const attemptsRef = useRef(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (isEnterprise) {
      setSyncing(false);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (cancelledRef.current) return;
      attemptsRef.current += 1;
      try {
        await refreshAll();
      } catch {
        /* transient network issue — retry below */
      }
      if (cancelledRef.current) return;
      if (attemptsRef.current >= MAX_SYNC_ATTEMPTS) {
        setSyncing(false);
        return;
      }
      timer = setTimeout(poll, 2000);
    };

    setSyncing(true);
    poll();

    return () => {
      cancelledRef.current = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnterprise]);


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

  if (!isEnterprise && syncing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#0D0D0D" }}>
        <Card className="p-10 max-w-md text-center glass-card space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <h2 className="text-lg font-bold">Activating Manager HQ</h2>
          <p className="text-sm text-muted-foreground">
            Confirming your Enterprise subscription with our payment processor. This usually takes a few
            seconds.
          </p>
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
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                attemptsRef.current = 0;
                setSyncing(true);
              }}
            >
              Already subscribed? Re-check my plan
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
          <div className="flex gap-2 items-center">
            <ActingArtistSwitcher />
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
            <RosterReleasesPanel />
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
