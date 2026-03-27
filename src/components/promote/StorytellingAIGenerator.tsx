import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Check, RotateCcw, Loader2, BookOpen, Zap, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useArtistNarrativeContext, serializeNarrativeContext } from "@/hooks/useArtistNarrativeContext";

const OUTPUT_TYPES = [
  { id: "caption", label: "📱 Caption", desc: "Instagram / TikTok" },
  { id: "tweet", label: "🐦 Tweet", desc: "X / Twitter thread" },
  { id: "bio", label: "🎤 Bio", desc: "Artist biography" },
  { id: "press-release", label: "📰 Press", desc: "Press release" },
  { id: "email", label: "📧 Email", desc: "Fan newsletter" },
  { id: "announcement", label: "📢 Drop", desc: "Release announcement" },
  { id: "release-plan", label: "🗓️ Release Plan", desc: "Full cycle campaign" },
  { id: "smart-link-copy", label: "🔗 Smart Link", desc: "Link page copy" },
  { id: "tour-promo", label: "🎪 Tour Promo", desc: "Show promotion" },
];

interface ReleasePlan {
  release_title: string;
  campaign_theme: string;
  pre_release: { week: string; actions: string[]; content_pieces: string[]; email_subject?: string }[];
  release_week: { day: string; actions: string[]; content_pieces: string[] }[];
  post_release: { week: string; actions: string[]; content_pieces: string[] }[];
  key_milestones: string[];
}

export function StorytellingAIGenerator() {
  const [extraContext, setExtraContext] = useState("");
  const [selectedOutput, setSelectedOutput] = useState("caption");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [releasePlan, setReleasePlan] = useState<ReleasePlan | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState<Record<string, boolean>>({});

  const ctx = useArtistNarrativeContext();
  const narrativeComplete = ctx.identity.origin_story || ctx.identity.artist_mission || ctx.identity.brand_voice;

  const handleGenerate = async () => {
    if (!narrativeComplete) {
      toast.error("Fill out 'Your Story' first so AI knows your voice");
      return;
    }
    setGenerating(true);
    setGeneratedContent(null);
    setReleasePlan(null);

    const serialized = serializeNarrativeContext(ctx);

    try {
      if (selectedOutput === "release-plan") {
        // Use campaign-brain for release plans
        const { data, error } = await supabase.functions.invoke("campaign-brain", {
          body: {
            action: "release-cycle-plan",
            narrative_context: serialized,
            release_phase: ctx.releaseCycle.phase,
            extra_context: extraContext.trim(),
          },
        });
        if (error) throw error;
        if (data?.result && typeof data.result === "object") {
          setReleasePlan(data.result);
        } else {
          setGeneratedContent(typeof data?.result === "string" ? data.result : JSON.stringify(data?.result, null, 2));
        }
      } else {
        // Use campaign-brain for all content types
        const { data, error } = await supabase.functions.invoke("campaign-brain", {
          body: {
            action: "generate-content",
            narrative_context: serialized,
            content_type: selectedOutput,
            release_phase: ctx.releaseCycle.phase,
            extra_context: extraContext.trim(),
          },
        });
        if (error) throw error;
        const result = data?.result;
        setGeneratedContent(typeof result === "string" ? result : JSON.stringify(result, null, 2));
      }
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    const text = releasePlan ? JSON.stringify(releasePlan, null, 2) : generatedContent;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  const togglePlanSection = (key: string) => {
    setShowPlanDetails(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Story Status */}
      <Card className={`p-4 border ${narrativeComplete ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
        <div className="flex items-center gap-3">
          <BookOpen className={`w-5 h-5 ${narrativeComplete ? "text-primary" : "text-destructive"}`} />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {narrativeComplete ? "Story + Activity Loaded" : "Your Story is empty"}
            </p>
            <p className="text-xs text-muted-foreground">
              {narrativeComplete
                ? `AI knows your voice, ${ctx.activity.total_tracks} tracks, ${ctx.activity.total_albums} releases, and your ${ctx.releaseCycle.phase.replace("-", " ")} status`
                : "Go to 'Your Story' tab and fill it out first"}
            </p>
          </div>
          {ctx.loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {ctx.releaseCycle.phase !== "no-release" && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Zap className="w-3 h-3" />
              {ctx.releaseCycle.phase.replace("-", " ")}
            </Badge>
          )}
        </div>
      </Card>

      {/* Step 1: Pick what to create */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">1</span>
          What do you need?
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {OUTPUT_TYPES.map((type) => (
            <button
              key={type.id}
              className={`text-left p-3 rounded-xl border transition-all ${
                selectedOutput === type.id
                  ? "border-primary bg-primary/10 text-foreground shadow-sm"
                  : "border-border/30 bg-muted/20 text-muted-foreground hover:bg-muted/40"
              }`}
              onClick={() => {
                setSelectedOutput(type.id);
                setGeneratedContent(null);
                setReleasePlan(null);
              }}
            >
              <span className="text-lg block">{type.label}</span>
              <span className="text-xs text-muted-foreground">{type.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Extra context */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">2</span>
          Any extra context? <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </h3>
        <Textarea
          rows={3}
          placeholder={selectedOutput === "release-plan"
            ? "e.g. 'My new EP drops March 15th, 5 tracks, called Midnight Sessions'"
            : "e.g. 'I just dropped a new single called Midnight Run'"}
          value={extraContext}
          onChange={(e) => setExtraContext(e.target.value)}
          className="bg-background/50 border-border/50 resize-y text-base"
        />
        <p className="text-xs text-muted-foreground">
          AI already knows your story, metrics, releases, and tour dates. Add specific details here.
        </p>
      </div>

      {/* Step 3: Generate */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">3</span>
          Generate it
        </h3>
        <Button onClick={handleGenerate} disabled={generating || !narrativeComplete} size="lg" className="w-full gap-2">
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {generating ? "Writing..." : `Generate ${OUTPUT_TYPES.find(t => t.id === selectedOutput)?.desc || "content"} ✨`}
        </Button>
      </div>

      {/* Loading skeleton */}
      {generating && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 rounded bg-muted/30 animate-pulse" style={{ width: i === 4 ? "40%" : i === 3 ? "70%" : "100%" }} />
          ))}
        </div>
      )}

      {/* Release Plan Result */}
      {releasePlan && (
        <Card className="p-5 bg-card/50 border-primary/20 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-primary font-semibold">✦ AI Release Cycle Plan</span>
              <h3 className="text-lg font-bold mt-1">{releasePlan.release_title}</h3>
              <p className="text-sm text-muted-foreground italic">{releasePlan.campaign_theme}</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {/* Key Milestones */}
          <div className="flex flex-wrap gap-2">
            {releasePlan.key_milestones.map((m, i) => (
              <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
            ))}
          </div>

          {/* Pre-Release */}
          <div>
            <button onClick={() => togglePlanSection("pre")} className="flex items-center gap-2 w-full text-left">
              <Calendar className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-sm">Pre-Release ({releasePlan.pre_release.length} weeks)</span>
              {showPlanDetails["pre"] ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>
            {showPlanDetails["pre"] && (
              <div className="mt-3 space-y-3 pl-6 border-l-2 border-yellow-500/20">
                {releasePlan.pre_release.map((w, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-xs font-bold text-yellow-500">{w.week}</p>
                    {w.actions.map((a, j) => <p key={j} className="text-xs text-muted-foreground">• {a}</p>)}
                    {w.content_pieces.map((c, j) => <p key={j} className="text-xs text-foreground/80">📝 {c}</p>)}
                    {w.email_subject && <p className="text-xs text-primary">📧 Email: {w.email_subject}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Release Week */}
          <div>
            <button onClick={() => togglePlanSection("release")} className="flex items-center gap-2 w-full text-left">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Release Week ({releasePlan.release_week.length} days)</span>
              {showPlanDetails["release"] ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>
            {showPlanDetails["release"] && (
              <div className="mt-3 space-y-3 pl-6 border-l-2 border-primary/20">
                {releasePlan.release_week.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-xs font-bold text-primary">{d.day}</p>
                    {d.actions.map((a, j) => <p key={j} className="text-xs text-muted-foreground">• {a}</p>)}
                    {d.content_pieces.map((c, j) => <p key={j} className="text-xs text-foreground/80">📝 {c}</p>)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Post-Release */}
          <div>
            <button onClick={() => togglePlanSection("post")} className="flex items-center gap-2 w-full text-left">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-sm">Post-Release ({releasePlan.post_release.length} weeks)</span>
              {showPlanDetails["post"] ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>
            {showPlanDetails["post"] && (
              <div className="mt-3 space-y-3 pl-6 border-l-2 border-blue-500/20">
                {releasePlan.post_release.map((w, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-xs font-bold text-blue-500">{w.week}</p>
                    {w.actions.map((a, j) => <p key={j} className="text-xs text-muted-foreground">• {a}</p>)}
                    {w.content_pieces.map((c, j) => <p key={j} className="text-xs text-foreground/80">📝 {c}</p>)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button size="sm" variant="outline" onClick={handleGenerate} className="gap-2 w-full">
            <RotateCcw className="w-4 h-4" /> Regenerate Plan
          </Button>
        </Card>
      )}

      {/* Text Result */}
      {generatedContent && !releasePlan && (
        <Card className="p-5 bg-card/50 border-primary/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary font-semibold">✦ AI Generated — {OUTPUT_TYPES.find(t => t.id === selectedOutput)?.desc}</span>
            <span className="text-xs text-muted-foreground">{generatedContent.length} chars</span>
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{generatedContent}</p>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 gap-2" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerate} className="gap-2">
              <RotateCcw className="w-4 h-4" /> Redo
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
