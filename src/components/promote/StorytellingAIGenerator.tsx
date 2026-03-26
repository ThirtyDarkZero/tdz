import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Copy, Check, RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";

const OUTPUT_TYPES = [
  { id: "caption", label: "📱 Instagram Caption" },
  { id: "tweet", label: "🐦 Tweet Thread" },
  { id: "bio", label: "🎤 Artist Bio" },
  { id: "press-release", label: "📰 Press Release" },
  { id: "email", label: "📧 Fan Email" },
  { id: "storyline", label: "📖 Artist Storyline" },
  { id: "message", label: "💬 Fan Message" },
  { id: "announcement", label: "📢 Release Announcement" },
];

export function StorytellingAIGenerator() {
  const { user } = useAuth();
  const [narrative, setNarrative] = usePersistedState("storytelling_narrative", {
    originStory: "",
    artistMission: "",
    targetAudience: "",
    emotionalCore: "",
    uniqueValueProp: "",
    brandVoice: "",
    keyPhrases: "",
  });
  const [selectedOutput, setSelectedOutput] = useState("caption");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const hasNarrative = Object.values(narrative).some((v) => v?.trim());
    if (!hasNarrative) {
      toast.error("Fill in at least one narrative field first");
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
            genre: narrative.emotionalCore,
            brand_voice: narrative.brandVoice,
            artist_mission: narrative.artistMission,
          },
        },
      });
      if (error) throw error;
      const result = data?.result;
      setGeneratedContent(
        typeof result === "string" ? result : `${result?.headline || ""}\n\n${result?.subheadline || ""}\n\n${result?.social_caption || ""}`
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

  const FIELDS = [
    { key: "originStory", label: "Your Origin Story", placeholder: "Where did you come from?", rows: 3 },
    { key: "artistMission", label: "Your Mission", placeholder: "What do you want your music to achieve?", rows: 2 },
    { key: "targetAudience", label: "Your Audience", placeholder: "Who are your fans?", rows: 2 },
    { key: "emotionalCore", label: "Emotional Core", placeholder: "What emotion does your music create?", rows: 2 },
    { key: "uniqueValueProp", label: "What Makes You Different", placeholder: "What do you offer that no other artist does?", rows: 2 },
    { key: "brandVoice", label: "Your Voice & Tone", placeholder: "e.g., raw, polished, spiritual, vulnerable", rows: 2 },
    { key: "keyPhrases", label: "Key Phrases & Words", placeholder: "Words that define your brand", rows: 2 },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* LEFT: Narrative Inputs */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Your Narrative</h2>
          <p className="text-sm text-muted-foreground mt-1">This powers your AI-generated content.</p>
        </div>
        {FIELDS.map((field) => (
          <div key={field.key}>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">{field.label}</Label>
            <Textarea
              rows={field.rows}
              placeholder={field.placeholder}
              value={(narrative as any)[field.key]}
              onChange={(e) => setNarrative((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
              className="mt-1 bg-background/50 border-border/50 resize-y"
            />
          </div>
        ))}
      </div>

      {/* RIGHT: AI Generator */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">AI Content Generator</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose what to generate, then copy and use.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {OUTPUT_TYPES.map((type) => (
            <button
              key={type.id}
              className={`text-left text-sm p-3 rounded-lg border transition-all ${
                selectedOutput === type.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/30 bg-muted/20 text-muted-foreground hover:bg-muted/40"
              }`}
              onClick={() => setSelectedOutput(type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>

        <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? "Generating..." : "Generate with AI"}
        </Button>

        {generating && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-4 rounded bg-muted/30 animate-pulse"
                style={{ width: i === 4 ? "60%" : "100%" }}
              />
            ))}
          </div>
        )}

        {generatedContent && (
          <Card className="p-4 bg-card/50 border-border/30 space-y-3">
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
                <RotateCcw className="w-4 h-4" /> Regenerate
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
