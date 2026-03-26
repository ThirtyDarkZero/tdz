import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Check, RotateCcw, Loader2 } from "lucide-react";
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

export function StorytellingAIGenerator() {
  const [aboutMe, setAboutMe] = useState("");
  const [selectedOutput, setSelectedOutput] = useState("caption");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!aboutMe.trim() || aboutMe.trim().length < 10) {
      toast.error("Tell us a little about yourself first (at least a sentence)");
      return;
    }
    setGenerating(true);
    setGeneratedContent(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-music-features", {
        body: {
          type: "smart-link-copy",
          data: {
            title: selectedOutput,
            artist_name: "Artist",
            genre: "",
            brand_voice: "",
            artist_mission: aboutMe,
          },
        },
      });
      if (error) throw error;
      const result = data?.result;
      setGeneratedContent(
        typeof result === "string"
          ? result
          : `${result?.headline || ""}\n\n${result?.subheadline || ""}\n\n${result?.social_caption || ""}`
      );
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

  return (
    <div className="space-y-6">
      {/* Step 1: Tell us about you */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">1</span>
          Tell us about you & your music
        </h3>
        <Textarea
          rows={4}
          placeholder="Example: I'm a 22-year-old R&B artist from Atlanta. My music blends lo-fi beats with soulful vocals. I want fans to feel like they're sitting on a rooftop at sunset."
          value={aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          className="bg-background/50 border-border/50 resize-y text-base"
        />
        <p className="text-xs text-muted-foreground">
          The more you share, the better the AI writes for you. Genre, vibe, who your fans are — anything helps.
        </p>
      </div>

      {/* Step 2: Pick what to create */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">2</span>
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
              onClick={() => setSelectedOutput(type.id)}
            >
              <span className="text-lg block">{type.label}</span>
              <span className="text-xs text-muted-foreground">{type.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Generate */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">3</span>
          Generate it
        </h3>
        <Button onClick={handleGenerate} disabled={generating} size="lg" className="w-full gap-2">
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {generating ? "Writing..." : "Generate with AI ✨"}
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
            <span className="text-xs text-primary font-semibold">✦ AI Generated</span>
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
