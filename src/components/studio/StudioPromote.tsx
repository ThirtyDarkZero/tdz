import { useState } from "react";
import { StorytellingStudio } from "@/components/StorytellingStudio";
import { MerchStore } from "@/components/MerchStore";
import { PreSaveCampaignManager } from "@/components/PreSaveCampaignManager";
import { FeatureGate } from "@/components/FeatureGate";
import { EmailCampaignGenerator } from "@/components/promote/EmailCampaignGenerator";
import { SmartLinkBuilder } from "@/components/promote/SmartLinkBuilder";
import { TourDatesManager } from "@/components/promote/TourDatesManager";
import { FanHub } from "@/components/promote/FanHub";
import { StorytellingAIGenerator } from "@/components/promote/StorytellingAIGenerator";
import { AdsAnalyticsHub } from "@/components/promote/AdsAnalyticsHub";
import { AdCampaigns } from "@/components/promote/AdCampaigns";
import { FanEmail } from "@/components/promote/FanEmail";
import { SocialScheduler } from "@/components/promote/SocialScheduler";
import { PromoteCommandCenter, type PromoteSectionId } from "@/components/promote/PromoteCommandCenter";
import {
  LayoutDashboard, Users, Mail, Link2, BookOpen, ShoppingBag, Calendar, BarChart3, Megaphone, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

const heading = { fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" } as const;
const body = { fontFamily: "'Raleway', sans-serif" } as const;

type SectionId = "overview" | PromoteSectionId;

const GROUPS: {
  group: string;
  items: { id: SectionId; label: string; icon: typeof Users; hint: string }[];
}[] = [
  {
    group: "Command",
    items: [{ id: "overview", label: "Overview", icon: LayoutDashboard, hint: "Readiness & next actions" }],
  },
  {
    group: "Attract",
    items: [
      { id: "ads", label: "Ad campaigns", icon: BarChart3, hint: "Agent-run Meta & Google ads" },
      { id: "social", label: "Social posts", icon: Megaphone, hint: "Post & schedule everywhere" },
      { id: "smart-links", label: "Smart Links", icon: Link2, hint: "Links & pre-saves" },
      { id: "storytelling", label: "Storytelling", icon: BookOpen, hint: "Narrative & AI copy" },
    ],
  },
  {
    group: "Capture",
    items: [{ id: "fans", label: "Fan Hub", icon: Users, hint: "Contacts, tags, insights" }],
  },
  {
    group: "Convert",
    items: [
      { id: "email", label: "Fan email", icon: Send, hint: "Send & track to your list" },
      { id: "campaigns", label: "AI writer", icon: Mail, hint: "Email & press copy" },
      { id: "merch", label: "Merch", icon: ShoppingBag, hint: "Store & drops" },
      { id: "tour", label: "Tour", icon: Calendar, hint: "Dates & ticketing" },
    ],
  },
];

const TITLES: Record<SectionId, { title: string; sub: string }> = {
  overview: { title: "Promote", sub: "One connected funnel: attract, capture, convert." },
  fans: { title: "Fan Hub", sub: "Own your audience — every contact, tagged and reachable." },
  campaigns: { title: "AI writer", sub: "Draft emails and press copy from your story." },
  "smart-links": { title: "Smart Links", sub: "One link per release. Every click measured." },
  storytelling: { title: "Storytelling", sub: "The narrative that makes the rest of the funnel work." },
  merch: { title: "Merch", sub: "Convert attention into owned revenue." },
  tour: { title: "Tour", sub: "Announce, sell and route your live run." },
  ads: { title: "Ad campaigns", sub: "Your budget, our media buyer: 30, 60 or 90 days, reported every morning." },
  email: { title: "Fan email", sub: "Write once, reach your whole list, see who opened and clicked." },
  social: { title: "Social posts", sub: "Plan and schedule posts to every network from one place." },
};

export const StudioPromote = () => {
  const [section, setSection] = useState<SectionId>(() => {
    const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("promote") : null;
    return q && q in TITLES ? (q as SectionId) : "overview";
  });
  const meta = TITLES[section];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Nav rail */}
        <aside className="lg:w-60 shrink-0">
          <div className="rounded-xl border border-border/40 bg-background/40 p-3 backdrop-blur-2xl lg:sticky lg:top-4">
            <div className="mb-3 px-2">
              <h1 style={heading} className="text-3xl leading-none">Promote</h1>
              <p style={body} className="text-[11px] text-muted-foreground">Growth command center</p>
            </div>
            <nav className="flex gap-1 overflow-x-auto lg:block lg:space-y-3 lg:overflow-visible">
              {GROUPS.map((g) => (
                <div key={g.group} className="shrink-0 lg:shrink">
                  <p
                    style={body}
                    className="hidden px-2 pb-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 lg:block"
                  >
                    {g.group}
                  </p>
                  <div className="flex gap-1 lg:block lg:space-y-1">
                    {g.items.map((item) => {
                      const active = section === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSection(item.id)}
                          className={cn(
                            "group flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left transition-colors",
                            active
                              ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="min-w-0">
                            <span style={body} className="block text-sm">{item.label}</span>
                            <span
                              style={body}
                              className="hidden text-[10px] text-muted-foreground/70 lg:block"
                            >
                              {item.hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-6">
          <div>
            <h2 style={heading} className="text-4xl leading-none">{meta.title}</h2>
            <p style={body} className="text-sm text-muted-foreground">{meta.sub}</p>
          </div>

          {section === "overview" && <PromoteCommandCenter onNavigate={(id) => setSection(id)} />}
          {section === "fans" && <FanHub />}
          {section === "campaigns" && <EmailCampaignGenerator />}
          {section === "smart-links" && (
            <div className="space-y-6">
              <SmartLinkBuilder />
              <FeatureGate feature="presaveCampaigns">
                <PreSaveCampaignManager />
              </FeatureGate>
            </div>
          )}
          {section === "storytelling" && (
            <div className="space-y-8">
              <StorytellingStudio />
              <div className="border-t border-border/20 pt-8">
                <StorytellingAIGenerator />
              </div>
            </div>
          )}
          {section === "merch" && <MerchStore variant="full" />}
          {section === "tour" && <TourDatesManager />}
          {section === "ads" && (
            <div className="space-y-8">
              <AdCampaigns />
              <details>
                <summary className="cursor-pointer text-sm font-medium">Tracking pixels and UTM links</summary>
                <div className="mt-4"><AdsAnalyticsHub /></div>
              </details>
            </div>
          )}
          {section === "email" && <FanEmail />}
          {section === "social" && <SocialScheduler />}
        </div>
      </div>
    </div>
  );
};
