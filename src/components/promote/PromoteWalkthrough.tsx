import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Megaphone, Users, ShoppingBag, Radar, ArrowRight, ArrowLeft, X } from "lucide-react";

const heading = { fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" } as const;
const body = { fontFamily: "'Raleway', sans-serif" } as const;

export const WALKTHROUGH_KEY = "tdz-promote-walkthrough-v1";

const STEPS = [
  {
    icon: Radar,
    title: "This is your command center",
    copy: "Everything in Promote feeds one funnel. The readiness score at the top tells you how armed you are for your next release, and the next-best-actions close the gaps in order.",
  },
  {
    icon: Megaphone,
    title: "01 — Attract",
    copy: "Ads & Analytics, Smart Links and Storytelling pull new listeners in. Connect a pixel, publish one smart link per release, and let every click be measured.",
  },
  {
    icon: Users,
    title: "02 — Capture",
    copy: "Fan Hub turns anonymous listeners into contacts you own — tagged, segmented and reachable without any algorithm in between.",
  },
  {
    icon: ShoppingBag,
    title: "03 — Convert",
    copy: "Campaigns, Merch and Tour turn that owned attention into revenue. Draft an email, drop a product, announce a date — the funnel closes here.",
  },
];

export function PromoteWalkthrough({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const finish = () => {
    try {
      localStorage.setItem(WALKTHROUGH_KEY, "done");
    } catch {
      /* storage blocked — non-fatal */
    }
    setI(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && finish()}>
      <DialogContent className="max-w-lg overflow-hidden border-border/40 bg-background/80 p-0 backdrop-blur-2xl">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
        />
        <div className="relative p-7">
          <button
            onClick={finish}
            aria-label="Skip walkthrough"
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/40 text-primary">
            <step.icon className="h-3 w-3" /> Step {i + 1} of {STEPS.length}
          </Badge>

          <h2 style={heading} className="text-4xl leading-none">{step.title}</h2>
          <p style={body} className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {step.copy}
          </p>

          <Progress value={((i + 1) / STEPS.length) * 100} className="mt-6 h-1.5" />

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setI((v) => Math.max(0, v - 1))}
              disabled={i === 0}
              style={body}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={finish} style={body} className="text-muted-foreground">
                Skip
              </Button>
              <Button size="sm" onClick={() => (last ? finish() : setI((v) => v + 1))} style={body}>
                {last ? "Start promoting" : "Next"} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
