import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface StreamPolicy {
  max_streams_per_listener_day: number;
  max_streams_per_hour: number;
  min_seconds_between_streams: number;
  max_paid_repeats_per_track_day: number | null;
  flag_min_streams: number;
  flag_listener_share: number;
  flag_artist_share: number;
}

const FIELDS: Array<{ key: keyof StreamPolicy; label: string; hint: string; percent?: boolean; optional?: boolean }> = [
  { key: "max_streams_per_listener_day", label: "Streams per listener per day", hint: "Plays beyond this are blocked." },
  { key: "max_streams_per_hour", label: "Streams per listener per hour", hint: "Plays beyond this are blocked." },
  { key: "min_seconds_between_streams", label: "Seconds between counted streams", hint: "A stream needs 30s of listening." },
  { key: "max_paid_repeats_per_track_day", label: "Paid replays of one track per day", hint: "Blank = unlimited. Extra replays still count as plays but earn nothing.", optional: true },
  { key: "flag_min_streams", label: "Flag only above (paid plays / 24h)", hint: "Minimum volume before patterns are flagged." },
  { key: "flag_listener_share", label: "Flag listener when one artist gets", hint: "Share of that listener's paid plays.", percent: true },
  { key: "flag_artist_share", label: "Flag artist when one listener is", hint: "Share of that artist's paid plays.", percent: true },
];

// CEO controls for stream fraud limits (public.stream_policy, single row).
export function StreamPolicySettings() {
  const [policy, setPolicy] = useState<StreamPolicy | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("stream_policy" as never)
      .select("*")
      .maybeSingle()
      .then(({ data }) => {
        const p = data as unknown as StreamPolicy | null;
        setPolicy(p);
        if (p) {
          setDraft(Object.fromEntries(FIELDS.map((f) => {
            const v = p[f.key];
            return [f.key, v === null ? "" : f.percent ? String(Math.round(Number(v) * 100)) : String(v)];
          })));
        }
      });
  }, []);

  const save = async () => {
    const update: Record<string, number | null> = {};
    for (const f of FIELDS) {
      const raw = (draft[f.key] ?? "").trim();
      if (raw === "" && f.optional) { update[f.key] = null; continue; }
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || (f.percent && n > 100)) {
        toast.error(`Check "${f.label}"`);
        return;
      }
      update[f.key] = f.percent ? n / 100 : Math.round(n);
    }
    setSaving(true);
    const { error } = await supabase
      .from("stream_policy" as never)
      .update({ ...update, updated_at: new Date().toISOString() } as never)
      .eq("id" as never, true as never);
    setSaving(false);
    if (error) toast.error(`Could not save: ${error.message}`);
    else toast.success("Stream limits saved");
  };

  if (!policy) return null;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle>Stream fraud limits</CardTitle>
        <CardDescription>Applied to every stream immediately after saving.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label htmlFor={f.key}>
                {f.label}
                {f.percent ? " (%)" : ""}
              </Label>
              <Input
                id={f.key}
                inputMode="numeric"
                value={draft[f.key] ?? ""}
                placeholder={f.optional ? "Unlimited" : undefined}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            </div>
          ))}
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save limits"}</Button>
      </CardContent>
    </Card>
  );
}
