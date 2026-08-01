import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Upload,
  Link2,
  DollarSign,
  Compass,
  Users,
  Rocket,
  ArrowRight,
} from "lucide-react";

type Guide = {
  id: string;
  audience: "artist" | "manager" | "fan";
  icon: typeof Upload;
  title: string;
  minutes: number;
  summary: string;
  steps: { title: string; body: string }[];
  ctaLabel: string;
  ctaTo: string;
};

const GUIDES: Guide[] = [
  {
    id: "first-upload",
    audience: "artist",
    icon: Upload,
    title: "Upload your first release",
    minutes: 4,
    summary:
      "From raw audio to a live release with auto-generated ISRC and UPC codes.",
    steps: [
      { title: "Open the Studio", body: "Everything lives in one place — uploads, artwork, splits and analytics." },
      { title: "Drop your audio", body: "WAV or high-bitrate MP3. Codes are generated for you automatically on save." },
      { title: "Add artwork and metadata", body: "3000×3000 cover, genre, credits. Clean metadata drives better placement." },
      { title: "Publish or schedule", body: "Go live instantly, or set a date and let Autopilot run the rollout for you." },
    ],
    ctaLabel: "Open the Studio",
    ctaTo: "/studio",
  },
  {
    id: "smart-links",
    audience: "artist",
    icon: Link2,
    title: "Promote with smart links",
    minutes: 3,
    summary: "One branded URL for every bio, story and DM — with click tracking behind it.",
    steps: [
      { title: "Create the link", body: "Studio → Promote → Smart Links → New Link. Pick a release, choose a slug." },
      { title: "Put it everywhere", body: "Instagram bio, TikTok profile, YouTube description, email signature." },
      { title: "Read the data", body: "Clicks, sources and conversion feed straight into your Momentum score." },
    ],
    ctaLabel: "Build a smart link",
    ctaTo: "/studio",
  },
  {
    id: "payouts",
    audience: "artist",
    icon: DollarSign,
    title: "How you get paid",
    minutes: 3,
    summary: "The full $1-per-play mechanic, with nothing hidden.",
    steps: [
      { title: "What counts", body: "A play from an active paid subscriber, past 30 seconds or half the track, with the tab in focus. Self-plays never count." },
      { title: "Connect payouts", body: "Studio → Earnings → Connect payout account. One-time verification, then you're live." },
      { title: "Automatic transfers", body: "Once your balance crosses $50 it pays out automatically. Sweeps run hourly." },
      { title: "Track everything", body: "Every transfer's status is visible in Earnings — pending, in transit, paid." },
    ],
    ctaLabel: "Set up payouts",
    ctaTo: "/studio",
  },
  {
    id: "roster",
    audience: "manager",
    icon: Users,
    title: "Run an entire roster",
    minutes: 5,
    summary: "Enterprise roster management, aggregated analytics and white-label branding.",
    steps: [
      { title: "Invite your artists", body: "Manager HQ → Roster → Invite. Artists accept and you gain delegated Studio access." },
      { title: "Release on their behalf", body: "Switch the acting artist and upload, schedule and edit exactly as they would." },
      { title: "Drill into performance", body: "Per-release, per-track and attribution views across the whole roster, with CSV export." },
      { title: "Make it yours", body: "Apply your own logo, palette and custom integrations under white-label settings." },
    ],
    ctaLabel: "Open Manager HQ",
    ctaTo: "/manager-hq",
  },
  {
    id: "momentum",
    audience: "artist",
    icon: Rocket,
    title: "Grow your Momentum score",
    minutes: 3,
    summary: "What actually moves placement across Discovery.",
    steps: [
      { title: "Consistency beats volume", body: "Steady releases outperform a single dump. Autopilot can space them for you." },
      { title: "Convert your own traffic", body: "Smart link clicks that turn into intentional plays weigh heaviest." },
      { title: "Feed the Inner Circle", body: "Exclusive drops to followers raise repeat-listen rate, which raises Momentum." },
    ],
    ctaLabel: "See your Momentum",
    ctaTo: "/studio",
  },
  {
    id: "discovery",
    audience: "fan",
    icon: Compass,
    title: "Get the most out of Discovery",
    minutes: 2,
    summary: "Every play you make sends a full dollar to the artist. Here's how to spend it well.",
    steps: [
      { title: "Mood Morph", body: "Describe a feeling in plain language and Discovery builds the mix around it." },
      { title: "The Live Pulse", body: "See what the platform is listening to right now and how much artists earned today." },
      { title: "Join a journey", body: "Following unlocks Inner Circle drops, early releases and direct artist updates." },
    ],
    ctaLabel: "Open Discovery",
    ctaTo: "/discover",
  },
];

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "artist", label: "Artists" },
  { id: "manager", label: "Managers & Labels" },
  { id: "fan", label: "Participants" },
];

export default function Learn() {
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>("first-upload");

  const guides = useMemo(
    () => (filter === "all" ? GUIDES : GUIDES.filter((g) => g.audience === filter)),
    [filter],
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">
          <Badge variant="outline" className="uppercase tracking-[0.25em] text-[10px] mb-5">
            Learn
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Everything you need to run TDZ properly
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-lg leading-relaxed">
            Short, practical walkthroughs for artists, managers and participants. No fluff — just the
            exact steps, in the order you'll need them.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs uppercase tracking-wider border transition-colors",
                filter === f.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/30 text-muted-foreground border-border hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {guides.map((g) => {
            const Icon = g.icon;
            const open = openId === g.id;
            return (
              <Card
                key={g.id}
                className="bg-card/60 backdrop-blur-xl border-border/50 overflow-hidden"
              >
                <button
                  onClick={() => setOpenId(open ? null : g.id)}
                  className="w-full text-left p-5 flex items-start gap-4"
                  aria-expanded={open}
                >
                  <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/30 shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{g.title}</h2>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                        {g.minutes} min
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{g.summary}</p>
                  </div>
                </button>

                {open && (
                  <div className="px-5 pb-5 pl-[76px] space-y-4">
                    <ol className="space-y-3">
                      {g.steps.map((s, i) => (
                        <li key={s.title} className="flex gap-3">
                          <span className="text-xs font-bold text-primary tabular-nums pt-0.5">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{s.title}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <Button asChild size="sm">
                      <Link to={g.ctaTo}>
                        {g.ctaLabel} <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <Card className="mt-10 p-6 bg-card/40 border-dashed text-center">
          <p className="text-sm text-muted-foreground">
            Still stuck? <Link to="/support" className="text-primary underline">Open a support ticket</Link> and
            a human will answer.
          </p>
        </Card>
      </div>
    </main>
  );
}
