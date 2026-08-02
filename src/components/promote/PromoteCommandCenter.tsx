import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Users, Link2, Mail, Calendar, MousePointerClick, Sparkles,
  ArrowRight, Radar, Megaphone, ShoppingBag,
} from "lucide-react";

export type PromoteSectionId =
  | "fans" | "campaigns" | "smart-links" | "storytelling" | "merch" | "tour" | "ads";

interface Props {
  onNavigate: (id: PromoteSectionId) => void;
}

const heading = { fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" } as const;
const body = { fontFamily: "'Raleway', sans-serif" } as const;

export function PromoteCommandCenter({ onNavigate }: Props) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["promote-command-center", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const id = user!.id;
      const [contacts, links, tours, drafts, integrations] = await Promise.all([
        supabase.from("artist_contacts").select("id, subscribed", { count: "exact" }).eq("artist_id", id),
        supabase.from("smart_links").select("id, click_count").eq("artist_id", id),
        supabase.from("tour_dates").select("id, event_date").eq("artist_id", id),
        supabase.from("marketing_drafts").select("id, status").eq("artist_id", id),
        supabase.from("manager_integrations").select("provider").eq("manager_id", id),
      ]);

      const contactRows = (contacts.data as any[]) || [];
      const linkRows = (links.data as any[]) || [];
      const tourRows = (tours.data as any[]) || [];
      const draftRows = (drafts.data as any[]) || [];
      const integrationRows = (integrations.data as any[]) || [];

      const now = Date.now();
      return {
        contacts: contactRows.length,
        subscribed: contactRows.filter((c) => c.subscribed !== false).length,
        links: linkRows.length,
        clicks: linkRows.reduce((s, l) => s + (l.click_count || 0), 0),
        upcomingShows: tourRows.filter((t) => t.event_date && new Date(t.event_date).getTime() > now).length,
        pendingDrafts: draftRows.filter((d) => d.status !== "sent").length,
        integrations: integrationRows.length,
      };
    },
  });

  const s = data ?? {
    contacts: 0, subscribed: 0, links: 0, clicks: 0,
    upcomingShows: 0, pendingDrafts: 0, integrations: 0,
  };

  // Readiness score — how "campaign ready" the artist is
  const checks = [
    { label: "Fanbase imported", done: s.contacts > 0, go: "fans" as const },
    { label: "Smart link live", done: s.links > 0, go: "smart-links" as const },
    { label: "Campaign drafted", done: s.pendingDrafts > 0, go: "campaigns" as const },
    { label: "Ads pixel connected", done: s.integrations > 0, go: "ads" as const },
    { label: "Tour date announced", done: s.upcomingShows > 0, go: "tour" as const },
  ];
  const score = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  const nextActions = checks.filter((c) => !c.done).slice(0, 3);

  const stats = [
    { icon: Users, label: "Participants", value: s.contacts, sub: `${s.subscribed} subscribed`, go: "fans" as const },
    { icon: MousePointerClick, label: "Link Clicks", value: s.clicks, sub: `${s.links} smart links`, go: "smart-links" as const },
    { icon: Mail, label: "Drafts Ready", value: s.pendingDrafts, sub: "awaiting review", go: "campaigns" as const },
    { icon: Calendar, label: "Upcoming Shows", value: s.upcomingShows, sub: "on the road", go: "tour" as const },
  ];

  return (
    <div className="space-y-5">
      {/* Readiness banner */}
      <Card className="relative overflow-hidden border-border/40 bg-background/40 backdrop-blur-2xl p-6">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-lg">
            <Badge variant="outline" className="mb-3 gap-1.5 border-primary/40 text-primary">
              <Radar className="h-3 w-3" /> Promotion Command Center
            </Badge>
            <h2 style={heading} className="text-4xl leading-none">
              Campaign Readiness — {isLoading ? "…" : `${score}%`}
            </h2>
            <p style={body} className="mt-2 text-sm text-muted-foreground">
              Every tool below feeds one funnel: discover → resonate → convert. Close the gaps and your next
              release launches with the whole machine running.
            </p>
            <Progress value={score} className="mt-4 h-2" />
          </div>

          <div className="w-full md:w-80 space-y-2">
            <p style={body} className="text-xs uppercase tracking-widest text-muted-foreground">
              Next best actions
            </p>
            {nextActions.length === 0 ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm" style={body}>
                <Sparkles className="mb-1 h-4 w-4 text-primary" />
                Fully armed. Draft your next campaign and push it live.
              </div>
            ) : (
              nextActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => onNavigate(a.go)}
                  className="group flex w-full items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span style={body} className="text-sm">{a.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </button>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((st) => (
          <button
            key={st.label}
            onClick={() => onNavigate(st.go)}
            className="group rounded-xl border border-border/40 bg-background/40 p-4 text-left backdrop-blur-2xl transition-all hover:-translate-y-0.5 hover:border-primary/50"
          >
            <st.icon className="mb-3 h-4 w-4 text-primary" />
            <div style={heading} className="text-4xl leading-none">
              {isLoading ? "—" : st.value.toLocaleString()}
            </div>
            <div style={body} className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {st.label}
            </div>
            <div style={body} className="text-[11px] text-muted-foreground/70">{st.sub}</div>
          </button>
        ))}
      </div>

      {/* Funnel map */}
      <Card className="border-border/40 bg-background/40 p-5 backdrop-blur-2xl">
        <p style={body} className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
          How the funnel connects
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: Megaphone, title: "Attract", copy: "Ads, smart links and storytelling pull new listeners in.", go: "ads" as const },
            { icon: Users, title: "Capture", copy: "Fan Hub turns listeners into owned contacts you can reach.", go: "fans" as const },
            { icon: ShoppingBag, title: "Convert", copy: "Campaigns, merch and tour dates turn attention into revenue.", go: "campaigns" as const },
          ].map((step, i) => (
            <button
              key={step.title}
              onClick={() => onNavigate(step.go)}
              className="group relative rounded-lg border border-border/40 bg-muted/10 p-4 text-left transition-colors hover:border-primary/50"
            >
              <div className="mb-2 flex items-center gap-2">
                <step.icon className="h-4 w-4 text-primary" />
                <span style={heading} className="text-2xl leading-none">{`0${i + 1} ${step.title}`}</span>
              </div>
              <p style={body} className="text-xs text-muted-foreground">{step.copy}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
