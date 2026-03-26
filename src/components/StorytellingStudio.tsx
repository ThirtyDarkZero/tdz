import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FIELDS = [
  { key: "origin_story", label: "Your Origin Story", emoji: "🌱", placeholder: "How did you start making music? What got you into it?", weight: 20 },
  { key: "artist_mission", label: "Your Mission", emoji: "🎯", placeholder: "What do you want your music to do for people?", weight: 20 },
  { key: "emotional_core", label: "The Feeling", emoji: "💫", placeholder: "What emotion should fans feel when they hear your music?", weight: 20 },
  { key: "target_audience", label: "Your Fans", emoji: "👥", placeholder: "Describe your ideal listener — age, vibe, what they're into", weight: 20 },
  { key: "brand_voice", label: "Your Vibe in 3 Words", emoji: "🎨", placeholder: "e.g. raw, spiritual, confident", weight: 20 },
];

export const StorytellingStudio = () => {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [narrativeId, setNarrativeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadNarrative(); }, []);

  const loadNarrative = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("artist_narrative")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setNarrativeId(data.id);
        setFields({
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
      setLoading(false);
    }
  };

  const strength = FIELDS.reduce((sum, f) => {
    const val = fields[f.key] || "";
    return sum + (val.trim().length >= 10 ? f.weight : val.trim().length > 0 ? f.weight / 2 : 0);
  }, 0);

  const save = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const payload = { user_id: user.id, ...fields, narrative_strength: Math.round(strength) };
      if (narrativeId) {
        await supabase.from("artist_narrative").update(payload).eq("id", narrativeId);
      } else {
        await supabase.from("artist_narrative").insert(payload);
      }
      toast.success("Saved!");
      loadNarrative();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center bg-card/50">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Loading your story...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-display font-bold">Your Story</h2>
            <p className="text-sm text-muted-foreground">Fill these out so AI can write content that sounds like YOU</p>
          </div>
        </div>
        <Badge className="bg-primary/20 text-primary px-3 py-1 text-base">{Math.round(strength)}%</Badge>
      </div>

      <Progress value={strength} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {strength < 50 ? "Keep going — the more you share, the better AI content gets." :
         strength < 100 ? "Almost there! Fill in the remaining fields for best results." :
         "🔥 Your story is complete! AI will nail your voice."}
      </p>

      <div className="space-y-4">
        {FIELDS.map((f) => (
          <Card key={f.key} className="bg-card/30 border-border/30">
            <CardContent className="pt-4 pb-4 space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <span className="text-lg">{f.emoji}</span> {f.label}
              </label>
              <Textarea
                rows={3}
                placeholder={f.placeholder}
                value={fields[f.key] || ""}
                onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="bg-background/50 border-border/40 resize-y"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={save} disabled={saving} size="lg" className="w-full gap-2">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? "Saving..." : "Save My Story"}
      </Button>
    </div>
  );
};
