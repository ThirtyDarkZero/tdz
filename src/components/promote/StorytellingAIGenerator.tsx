import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Check, RotateCcw, Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OUTPUT_TYPES = [
  { id: "caption", label: "📱 Caption", desc: "Instagram / TikTok" },
  { id: "tweet", label: "🐦 Tweet", desc: "X / Twitter thread" },
  { id: "bio", label: "🎤 Bio", desc: "Artist biography" },
  { id: "press-release", label: "📰 Press", desc: "Press release" },
  { id: "email", label: "📧 Email", desc: "Fan newsletter" },
  { id: "announcement", label: "📢 Drop", desc: "Release announcement" },
];

interface NarrativeData {
  origin_story: string;
  artist_mission: string;
  emotional_core: string;
  target_audience: string;
  brand_voice: string;
}

export function StorytellingAIGenerator() {
  const [extraContext, setExtraContext] = useState("");
  const [selectedOutput, setSelectedOutput] = useState("caption");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [narrative, setNarrative] = useState<NarrativeData | null>(null);
  const [loadingNarrative, setLoadingNarrative] = useState(true);

  useEffect(() => {
    loadNarrative();
  }, []);

  const loadNarrative = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("artist_narrative")
        .select("origin_story, artist_mission, emotional_core, target_audience, brand_voice")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setNarrative({
          origin_story: data.origin_story || "",
          artist_mission: data.artist_mission || "",
          emotional_core: data.emotional_core || "",
          target_audience: data.target_audience || "",
          brand_voice: data.brand_voice || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNarrative(false);
    }
  };

  const narrativeComplete = narrative && Object.values(narrative).some(v => v.trim().length > 0);

  const handleGenerate = async () => {
    if (!narrativeComplete) {
      toast.error("Fill out 'Your Story' first so AI knows your voice");
      return;
    }
    setGenerating(true);
    setGeneratedContent(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-music-features", {
        body: {
          type: "storytelling-content",
          data: {
            content_type: selectedOutput,
            origin_story: narrative?.origin_story || "",
            artist_mission: narrative?.artist_mission || "",
            emotional_core: narrative?.emotional_core || "",
            target_audience: narrative?.target_audience || "",
            brand_voice: narrative?.brand_voice || "",
            extra_context: extraContext.trim(),
          },
        },
      });
      if (error) throw error;
      const result = data?.result;
      setGeneratedContent(typeof result === "string" ? result : JSON.stringify(result, null, 2));
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  const filledFields = narrative ? Object.values(narrative).filter(v => v.trim().length > 0).length : 0;

  return (
    <div className="space-y-6">
      {/* Story Status */}
      <Card className={`p-4 border ${narrativeComplete ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
        <div className="flex items-center gap-3">
          <BookOpen className={`w-5 h-5 ${narrativeComplete ? "text-primary" : "text-destructive"}`} />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {narrativeComplete ? `Your Story is loaded (${filledFields}/5 fields)` : "Your Story is empty"}
            </p>
            <p className="text-xs text-muted-foreground">
              {narrativeComplete
                ? "AI will use your saved story to write content that sounds like YOU"
                : "Go to 'Your Story' tab and fill it out first — AI needs your voice to write for you"}
            </p>
          </div>
          {loadingNarrative && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
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
              }}
            >
              <span className="text-lg block">{type.label}</span>
              <span className="text-xs text-muted-foreground">{type.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Extra context (optional) */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">2</span>
          Any extra context? <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </h3>
        <Textarea
          rows={3}
          placeholder="e.g. 'I just dropped a new single called Midnight Run' or 'I'm performing at SXSW next month'"
          value={extraContext}
          onChange={(e) => setExtraContext(e.target.value)}
          className="bg-background/50 border-border/50 resize-y text-base"
        />
        <p className="text-xs text-muted-foreground">
          Add specific details about what you're promoting. Your saved story handles the rest.
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded bg-muted/30 animate-pulse" style={{ width: i === 3 ? "60%" : "100%" }} />
          ))}
        </div>
      )}

      {/* Result */}
      {generatedContent && (
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
