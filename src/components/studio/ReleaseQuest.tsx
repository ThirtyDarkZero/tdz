import { useCallback, useEffect, useRef, useState } from "react";
import { MultiTrackUploader, type ReleaseQuestStage } from "@/components/MultiTrackUploader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Rocket, Music, Sparkles, Star, Trophy, Upload, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const heading = { fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.05em" } as const;
const body = { fontFamily: "'Raleway', sans-serif" } as const;

const STAGES: { id: ReleaseQuestStage; label: string; icon: typeof Music; xp: number; brief: string }[] = [
  { id: "files", label: "Load The Weapons", icon: Music, xp: 250, brief: "Drop your audio files into the chamber." },
  { id: "details", label: "Forge The Identity", icon: Sparkles, xp: 500, brief: "Title, artwork, genre — give the release its face." },
  { id: "uploading", label: "Launch Sequence", icon: Upload, xp: 750, brief: "Transmitting to the TDZ network." },
  { id: "done", label: "Released", icon: Trophy, xp: 1500, brief: "It's live. Participants can find you now." },
];

export function ReleaseQuest({
  onSuccess,
  targetUserId,
  targetArtistName,
}: {
  onSuccess?: () => void;
  targetUserId?: string;
  targetArtistName?: string;
}) {
  const [stage, setStage] = useState<ReleaseQuestStage>("files");
  const [xp, setXp] = useState(0);
  const [flash, setFlash] = useState(false);
  const awarded = useRef<Set<ReleaseQuestStage>>(new Set());

  const stageIndex = STAGES.findIndex((s) => s.id === stage);
  const pct = Math.round(((stageIndex + 1) / STAGES.length) * 100);

  const award = useCallback((s: ReleaseQuestStage) => {
    if (awarded.current.has(s)) return;
    awarded.current.add(s);
    const meta = STAGES.find((x) => x.id === s);
    if (!meta) return;
    setXp((v) => v + meta.xp);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 900);
  }, []);

  useEffect(() => {
    if (stage !== "files") award(STAGES[Math.max(0, stageIndex - 1)].id);
  }, [stage, stageIndex, award]);

  const handleStage = useCallback((s: ReleaseQuestStage) => setStage(s), []);

  const handleSuccess = () => {
    award("uploading");
    award("done");
    setStage("done");
  };

  if (stage === "done") {
    return (
      <div className="relative overflow-hidden rounded-xl border border-primary/40 bg-background/60 p-10 text-center backdrop-blur-2xl animate-scale-in">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle at 50% 0%, hsl(var(--primary)) 0%, transparent 65%)" }}
        />
        <div className="relative">
          <Trophy className="mx-auto mb-4 h-10 w-10 text-primary animate-scale-in" />
          <h2 style={heading} className="text-6xl leading-none">Release Complete</h2>
          <p style={body} className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Your music is live on TDZ. Every intentional play from here pays $1 straight to you.
          </p>

          <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2">
            <Star className="h-4 w-4 text-primary" fill="currentColor" />
            <span style={heading} className="text-3xl leading-none">+{xp.toLocaleString()} XP EARNED</span>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              style={body}
              onClick={() => {
                awarded.current = new Set();
                setXp(0);
                setStage("files");
              }}
            >
              <Rocket className="mr-2 h-4 w-4" /> Release another
            </Button>
            <Button style={body} onClick={() => onSuccess?.()}>
              Back to Studio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Quest HUD */}
      <div className="relative overflow-hidden rounded-xl border border-border/40 bg-background/50 p-5 backdrop-blur-2xl">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p style={body} className="text-[10px] uppercase tracking-[0.3em] text-primary">Quest</p>
            <h2 style={heading} className="text-5xl leading-none">Release Your Music</h2>
            <p style={body} className="mt-1 text-xs text-muted-foreground">
              {STAGES[Math.max(0, stageIndex)].brief}
            </p>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 transition-transform",
              flash && "scale-110",
            )}
          >
            <Star className={cn("h-4 w-4 text-primary", flash && "animate-spin")} fill="currentColor" />
            <span style={heading} className="text-2xl leading-none">{xp.toLocaleString()} XP</span>
          </div>
        </div>

        <Progress value={pct} className="relative mt-4 h-2" />

        {/* Stage map */}
        <div className="relative mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {STAGES.map((s, i) => {
            const active = i === stageIndex;
            const complete = i < stageIndex;
            return (
              <div
                key={s.id}
                className={cn(
                  "rounded-lg border p-3 transition-all",
                  active && "border-primary/60 bg-primary/10 shadow-[0_0_24px_-8px_hsl(var(--primary))]",
                  complete && "border-primary/30 bg-primary/5",
                  !active && !complete && "border-border/40 bg-muted/10 opacity-60",
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  {complete ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <s.icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "text-muted-foreground")} />
                  )}
                  <span style={body} className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Stage {i + 1}
                  </span>
                </div>
                <p style={heading} className="text-2xl leading-none">{s.label}</p>
                <p style={body} className="mt-0.5 flex items-center gap-1 text-[10px] text-primary/80">
                  <Zap className="h-2.5 w-2.5" /> +{s.xp} XP
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission panel */}
      <div className="rounded-xl border border-border/40 bg-background/40 p-4 backdrop-blur-2xl animate-fade-in">
        <MultiTrackUploader
          onSuccess={handleSuccess}
          onStage={handleStage}
          targetUserId={targetUserId}
          targetArtistName={targetArtistName}
        />
      </div>
    </div>
  );
}
