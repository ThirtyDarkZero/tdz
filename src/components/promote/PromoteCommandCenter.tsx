import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PromoteWalkthrough, WALKTHROUGH_KEY } from "./PromoteWalkthrough";
import {
  Users, Mail, Calendar, MousePointerClick, Sparkles, Check,
  ArrowRight, Radar, Megaphone, ShoppingBag, HelpCircle, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PromoteSectionId =
  | "fans" | "campaigns" | "smart-links" | "storytelling" | "merch" | "tour" | "ads";

interface Props {
  onNavigate: (id: PromoteSectionId) => void;
}

const heading = { fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" } as const;
const body = { fontFamily: "'Raleway', sans-serif" } as const;

export function PromoteCommandCenter({ onNavigate }: Props) {
  const { user } = useAuth();
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(WALKTHROUGH_KEY)) setTourOpen(true);
    } catch {
      /* storage blocked — skip auto tour */
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["promote-command-center", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const id = user!.id;
      const db = supabase as any;
      const [contacts, links, tours, drafts, integrations, merch] = await Promise.all([
        db.from("artist_contacts").select("id, subscribed").eq("artist_id", id),
        db.from("smart_links").select("id, clicks").eq("user_id", id),
        db.from("tour_dates").select("id, event_date").eq("artist_id", id),
        db.from("marketing_drafts").select("id, status").eq("artist_id", id),
        db.from("manager_integrations").select("provider").eq("manager_id", id),
        db.from("merch_purchases").select("id").eq("artist_id", id).limit(1),
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
        clicks: linkRows.reduce((s, l) => s + (l.clicks || 0), 0),
        upcomingShows: tourRows.filter((t) => t.event_date && new Date(t.event_date).getTime() > now).length,
        pendingDrafts: draftRows.filter((d) => d.status !== "sent").length,
        integrations: integrationRows.length,
        hasMerch: (((merch.data as any[]) || []).length > 0),
      };
    },
  });

  const s = data ?? {
    contacts: 0, subscribed: 0, links: 0, clicks: 0,
    upcomingShows: 0, pendingDrafts: 0, integrations: 0, hasMerch: false,
  };

  /* ---- Funnel stages: each stage owns its own checks, so progress is per-step ---- */
  const stages = [
    {
      id: "attract",
      icon: Megaphone,
      title: "Attract",
      copy: "Ads, smart links and storytelling pull new listeners in.",
      go: "ads" as PromoteSectionId,
      checks: [
        { label: "Ads pixel connected", done: s.integrations > 0, go: "ads" as PromoteSectionId, why: "Connect Google, Meta or TikTok so paid reach is attributed back to real plays." },
        { label: "Smart link live", done: s.links > 0, go: "smart-links" as PromoteSectionId, why: "One measurable link per release — every click is tracked and retargetable." },
      ],
    },
    {
      id: "capture",
      icon: Users,
      title: "Capture",
      copy: "Fan Hub turns listeners into contacts you own.",
      go: "fans" as PromoteSectionId,
      checks: [
        { label: "Fanbase imported", done: s.contacts > 0, go: "fans" as PromoteSectionId, why: "Owned contacts reach your audience without depending on any algorithm." },
      ],
    },
    {
      id: "convert",
      icon: ShoppingBag,
      title: "Convert",
      copy: "Campaigns, merch and tour turn attention into revenue.",
      go: "campaigns" as PromoteSectionId,
      checks: [
        { label: "Campaign drafted", done: s.pendingDrafts > 0, go: "campaigns" as PromoteSectionId, why: "A ready-to-send email means launch day is one click, not one week." },
        { label: "Tour date announced", done: s.upcomingShows > 0, go: "tour" as PromoteSectionId, why: "Live dates are the highest-conversion moment in the whole funnel." },
      ],
    },
  ];

  const allChecks = stages.flatMap((st) => st.checks);
  const score = Math.round((allChecks.filter((c) => c.done).length / allChecks.length) * 100);
  const nextActions = allChecks.filter((c) => !c.done).slice(0, 3);

  const stats = [
    { icon: Users, label: "Participants", value: s.contacts, sub: `${s.subscribed} subscribed`, go: "fans" as PromoteSectionId, tip: "Contacts you own in Fan Hub — imported, tagged and reachable by email." },
    { icon: MousePointerClick, label: "Link Clicks", value: s.clicks, sub: `${s.links} smart links`, go: "smart-links" as PromoteSectionId, tip: "Total clicks across every smart link you've published." },
    { icon: Mail, label: "Drafts Ready", value: s.pendingDrafts, sub: "awaiting review", go: "campaigns" as PromoteSectionId, tip: "AI-generated campaign drafts waiting for your review — nothing sends automatically." },
    { icon: Calendar, label: "Upcoming Shows", value: s.upcomingShows, sub: "on the road", go: "tour" as PromoteSectionId, tip: "Future-dated tour stops currently published on your profile." },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <PromoteWalkthrough open={tourOpen} onClose={() => setTourOpen(false)} />

      <div className="space-y-5">
        {/* Readiness banner */}
        <Card className="relative overflow-hidden border-border/40 bg-background/40 backdrop-blur-2xl p-6">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-lg">
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
                  <Radar className="h-3 w-3" /> Promotion Command Center
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setTourOpen(true)}
                      aria-label="Replay the Promote walkthrough"
                      className="rounded-full p-1 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent style={body}>Replay the guided walkthrough</TooltipContent>
                </Tooltip>
              </div>

              <h2 style={heading} className="text-4xl leading-none">
                Campaign Readiness — {isLoading ? "…" : `${score}%`}
              </h2>
              <p style={body} className="mt-2 text-sm text-muted-foreground">
                Every tool below feeds one funnel: attract → capture → convert. Close the gaps and your next
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
                  <Tooltip key={a.label}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onNavigate(a.go)}
                        className="group flex w-full items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        <span style={body} className="text-sm">{a.label}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-56" style={body}>{a.why}</TooltipContent>
                  </Tooltip>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Live stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((st) => (
            <Tooltip key={st.label}>
              <TooltipTrigger asChild>
                <button
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
              </TooltipTrigger>
              <TooltipContent className="max-w-56" style={body}>{st.tip}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Connected funnel */}
        <Card className="border-border/40 bg-background/40 p-5 backdrop-blur-2xl">
          <div className="mb-4 flex items-center gap-2">
            <p style={body} className="text-xs uppercase tracking-widest text-muted-foreground">
              The funnel, end to end
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
              </TooltipTrigger>
              <TooltipContent className="max-w-64" style={body}>
                Each stage feeds the next. A stage is complete when every task inside it is done.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            {stages.map((stage, i) => {
              const done = stage.checks.filter((c) => c.done).length;
              const pct = Math.round((done / stage.checks.length) * 100);
              const complete = pct === 100;
              return (
                <div key={stage.id} className="flex flex-1 items-center gap-3">
                  <div
                    className={cn(
                      "relative flex-1 rounded-lg border p-4 transition-colors",
                      complete ? "border-primary/50 bg-primary/5" : "border-border/40 bg-muted/10",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onNavigate(stage.go)}
                        className="group flex items-center gap-2 text-left"
                      >
                        <stage.icon className={cn("h-4 w-4", complete ? "text-primary" : "text-muted-foreground")} />
                        <span style={heading} className="text-2xl leading-none">
                          {`0${i + 1} ${stage.title}`}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                      <span style={body} className={cn("text-[11px]", complete ? "text-primary" : "text-muted-foreground")}>
                        {done}/{stage.checks.length}
                      </span>
                    </div>

                    <p style={body} className="text-xs text-muted-foreground">{stage.copy}</p>
                    <Progress value={pct} className="mt-3 h-1" />

                    <div className="mt-3 space-y-1.5">
                      {stage.checks.map((c) => (
                        <Tooltip key={c.label}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onNavigate(c.go)}
                              className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left transition-colors hover:bg-primary/5"
                            >
                              <span
                                className={cn(
                                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                  c.done ? "border-primary bg-primary/20 text-primary" : "border-border/60 text-transparent",
                                )}
                              >
                                <Check className="h-2.5 w-2.5" />
                              </span>
                              <span
                                style={body}
                                className={cn(
                                  "text-[11px]",
                                  c.done ? "text-muted-foreground line-through" : "text-foreground/80",
                                )}
                              >
                                {c.label}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-56" style={body}>{c.why}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  {i < stages.length - 1 && (
                    <ArrowRight
                      className={cn(
                        "hidden h-4 w-4 shrink-0 lg:block",
                        complete ? "text-primary" : "text-muted-foreground/40",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}
