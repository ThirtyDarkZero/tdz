import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Bot,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Draft = {
  id: string;
  draft_date: string;
  funnel_stage: string;
  audience: string;
  subject_line: string;
  preview_text: string | null;
  body_markdown: string;
  cta_label: string | null;
  cta_url: string | null;
  feature_focus: string | null;
  screenshot_hint: string | null;
  status: string;
  created_at: string;
};

const AUDIENCE_STYLES: Record<string, string> = {
  artist: "bg-primary/15 text-primary border-primary/30",
  manager: "bg-accent/15 text-accent border-accent/30",
  fan: "bg-secondary/40 text-foreground border-border",
};

export const MarketingBrainPanel = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState<string>("all");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("marketing_drafts")
      .select("*")
      .order("draft_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) {
      toast.error("Could not load marketing drafts", { description: error.message });
    } else {
      setDrafts((data ?? []) as Draft[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const generateNow = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("marketing-brain", {
        body: { force: true },
      });
      if (error) throw new Error(error.message);
      if (data && data.success === false) throw new Error(data.error || "Generation failed");
      toast.success(`Marketing Brain generated ${data?.generated ?? 0} new drafts`);
      await load();
    } catch (e) {
      toast.error("Marketing Brain failed", { description: (e as Error).message });
    } finally {
      setGenerating(false);
    }
  };

  const markStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("marketing_drafts").update({ status }).eq("id", id);
    if (error) return toast.error("Could not update", { description: error.message });
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  };

  const copyDraft = async (d: Draft) => {
    const text = [
      `Subject: ${d.subject_line}`,
      d.preview_text ? `Preview: ${d.preview_text}` : "",
      "",
      d.body_markdown,
      "",
      d.cta_label ? `CTA: ${d.cta_label} → ${d.cta_url}` : "",
      d.screenshot_hint ? `\nScreenshot direction: ${d.screenshot_hint}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Draft copied — paste into your marketing platform");
  };

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = [
      "date",
      "audience",
      "funnel_stage",
      "feature_focus",
      "subject_line",
      "preview_text",
      "body_markdown",
      "cta_label",
      "cta_url",
      "screenshot_hint",
      "status",
    ];
    const rows = filtered.map((d) =>
      [
        d.draft_date,
        d.audience,
        d.funnel_stage,
        d.feature_focus,
        d.subject_line,
        d.preview_text,
        d.body_markdown,
        d.cta_label,
        d.cta_url,
        d.screenshot_hint,
        d.status,
      ]
        .map(esc)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tdz-marketing-funnel-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(
    () => (audienceFilter === "all" ? drafts : drafts.filter((d) => d.audience === audienceFilter)),
    [drafts, audienceFilter],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Draft[]>();
    for (const d of filtered) {
      if (!map.has(d.draft_date)) map.set(d.draft_date, []);
      map.get(d.draft_date)!.push(d);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-card/60 backdrop-blur-xl border-border/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/30">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide">MARKETING BRAIN</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mt-1">
                Your autonomous head of marketing. It writes a fresh daily funnel set — subject
                lines, tutorial copy and screenshot direction in TDZ's brand voice — grounded in live
                platform metrics. Runs every day on its own; drafts stage here for export.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Button size="sm" onClick={generateNow} disabled={generating}>
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate today
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {["all", "artist", "manager", "fan"].map((a) => (
            <button
              key={a}
              onClick={() => setAudienceFilter(a)}
              className={cn(
                "px-3 py-1 rounded-full text-xs uppercase tracking-wider border transition-colors",
                audienceFilter === a
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/30 text-muted-foreground border-border hover:text-foreground",
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading drafts…
        </div>
      ) : grouped.length === 0 ? (
        <Card className="p-10 text-center bg-card/50 border-dashed">
          <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            No drafts yet. Hit “Generate today” — after that it runs itself, daily.
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-320px)] pr-3">
          <div className="space-y-8">
            {grouped.map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {date}
                  </h3>
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-xs text-muted-foreground">{items.length} drafts</span>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {items.map((d) => (
                    <Card
                      key={d.id}
                      className="p-4 bg-card/60 backdrop-blur-xl border-border/50 flex flex-col"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge
                          variant="outline"
                          className={cn("uppercase text-[10px] tracking-wider", AUDIENCE_STYLES[d.audience])}
                        >
                          {d.audience}
                        </Badge>
                        <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
                          {d.funnel_stage}
                        </Badge>
                        {d.feature_focus && (
                          <span className="text-[11px] text-muted-foreground truncate">
                            {d.feature_focus}
                          </span>
                        )}
                        {d.status === "approved" && (
                          <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                        )}
                      </div>

                      <p className="font-semibold leading-snug">{d.subject_line}</p>
                      {d.preview_text && (
                        <p className="text-xs text-muted-foreground mt-1">{d.preview_text}</p>
                      )}

                      <pre className="mt-3 text-xs whitespace-pre-wrap font-sans text-muted-foreground/90 leading-relaxed max-h-56 overflow-y-auto">
                        {d.body_markdown}
                      </pre>

                      {d.cta_label && (
                        <p className="mt-3 text-xs">
                          <span className="text-primary font-semibold uppercase tracking-wider">
                            {d.cta_label}
                          </span>{" "}
                          <span className="text-muted-foreground">→ {d.cta_url}</span>
                        </p>
                      )}

                      {d.screenshot_hint && (
                        <div className="mt-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
                            <Camera className="h-3 w-3" /> Screenshot direction
                          </p>
                          <p className="text-xs text-muted-foreground/90">{d.screenshot_hint}</p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
                        <Button size="sm" variant="outline" onClick={() => void copyDraft(d)}>
                          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                        </Button>
                        <Button
                          size="sm"
                          variant={d.status === "approved" ? "secondary" : "default"}
                          onClick={() =>
                            void markStatus(d.id, d.status === "approved" ? "draft" : "approved")
                          }
                        >
                          {d.status === "approved" ? "Unapprove" : "Approve"}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default MarketingBrainPanel;
