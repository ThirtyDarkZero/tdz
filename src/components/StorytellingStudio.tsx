import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Save, Loader2, Radio, TrendingUp, Disc3, Calendar, Users, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useArtistNarrativeContext } from "@/hooks/useArtistNarrativeContext";

const FIELDS = [
  { key: "origin_story", label: "Your Origin Story", emoji: "🌱", placeholder: "How did you start making music? What got you into it?", weight: 20 },
  { key: "artist_mission", label: "Your Mission", emoji: "🎯", placeholder: "What do you want your music to do for people?", weight: 20 },
  { key: "emotional_core", label: "The Feeling", emoji: "💫", placeholder: "What emotion should fans feel when they hear your music?", weight: 20 },
  { key: "target_audience", label: "Your Fans", emoji: "👥", placeholder: "Describe your ideal listener — age, vibe, what they're into", weight: 20 },
  { key: "brand_voice", label: "Your Vibe in 3 Words", emoji: "🎨", placeholder: "e.g. raw, spiritual, confident", weight: 20 },
];

const PHASE_CONFIG = {
  "no-release": { label: "Building", color: "text-muted-foreground", bg: "bg-muted/20", icon: Radio, desc: "Focus on storytelling & growing your audience" },
  "pre-release": { label: "Pre-Release", color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Calendar, desc: "Building anticipation for your upcoming drop" },
  "release-week": { label: "Release Week", color: "text-primary", bg: "bg-primary/10", icon: Zap, desc: "MAXIMIZE momentum — everything points to the release" },
  "post-release": { label: "Post-Release", color: "text-blue-500", bg: "bg-blue-500/10", icon: TrendingUp, desc: "Sustain engagement & celebrate milestones" },
};

export const StorytellingStudio = () => {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [narrativeId, setNarrativeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const ctx = useArtistNarrativeContext();

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
      toast.success("Story saved — AI across the platform will now use your voice!");
      loadNarrative();
      ctx.refresh();
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

  const phase = ctx.releaseCycle;
  const phaseInfo = PHASE_CONFIG[phase.phase];
  const PhaseIcon = phaseInfo.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-display font-bold">Your Story</h2>
            <p className="text-sm text-muted-foreground">This powers ALL AI across the platform — emails, bios, smart links, campaigns</p>
          </div>
        </div>
        <Badge className="bg-primary/20 text-primary px-3 py-1 text-base">{Math.round(strength)}%</Badge>
      </div>

      <Progress value={strength} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {strength < 50 ? "Keep going — the more you share, the better AI content gets." :
         strength < 100 ? "Almost there! Fill in the remaining fields for best results." :
         "🔥 Your story is complete! AI will nail your voice everywhere."}
      </p>

      {/* Live Activity Dashboard */}
      {!ctx.loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Release Cycle Phase */}
          <Card className={`${phaseInfo.bg} border-border/20 col-span-2`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${phaseInfo.bg} flex items-center justify-center`}>
                  <PhaseIcon className={`w-5 h-5 ${phaseInfo.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${phaseInfo.color}`}>{phaseInfo.label}</span>
                    {phase.release && (
                      <Badge variant="outline" className="text-[10px] border-border/30">
                        {phase.release.title}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{phaseInfo.desc}</p>
                  {phase.daysUntilRelease && (
                    <p className="text-xs font-semibold text-yellow-500 mt-0.5">
                      ⏳ {phase.daysUntilRelease} days until release
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-border/20">
            <CardContent className="pt-4 pb-4 text-center">
              <Disc3 className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold">{ctx.activity.total_tracks}</p>
              <p className="text-[10px] text-muted-foreground">Tracks</p>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-border/20">
            <CardContent className="pt-4 pb-4 text-center">
              <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold">{ctx.activity.monthly_listeners.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Monthly Listeners</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming & Recent Releases */}
      {(ctx.activity.upcoming_releases.length > 0 || ctx.activity.recent_releases.length > 0) && (
        <Card className="bg-card/30 border-border/20">
          <CardContent className="pt-4 pb-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Knows About</p>
            {ctx.activity.upcoming_releases.map(r => (
              <div key={r.id} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="font-medium">{r.title}</span>
                <Badge variant="outline" className="text-[10px]">{r.release_type || "single"}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">Drops {r.scheduled_release_date}</span>
              </div>
            ))}
            {ctx.activity.recent_releases.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-medium">{r.title}</span>
                <Badge variant="outline" className="text-[10px]">{r.release_type || "single"}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">{(r.play_count || 0).toLocaleString()} plays</span>
              </div>
            ))}
            {ctx.activity.tour_dates.length > 0 && (
              <div className="flex items-center gap-2 text-sm pt-1 border-t border-border/20">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{ctx.activity.tour_dates.length} upcoming show(s)</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      <p className="text-xs text-center text-muted-foreground">
        ✦ Your story feeds into: Email Campaigns • Smart Links • Artist Bio • Tour Promos • Release Plans
      </p>
    </div>
  );
};
