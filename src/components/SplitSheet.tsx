import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Loader2, Plus, Send, Trash2, Copy } from "lucide-react";
import { evenShares, splitProblems, splitSheetCsv, total, type RightsType, type SplitRow } from "@/lib/splits";

const STATUS: Record<string, { label: string; variant: "secondary" | "outline" | "default" | "destructive" }> = {
  draft: { label: "Not sent", variant: "outline" },
  sent: { label: "Waiting", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "default" },
  disputed: { label: "Disputed", variant: "destructive" },
};

const TYPES: { id: RightsType; label: string; hint: string }[] = [
  { id: "publishing", label: "Publishing (the song)", hint: "Writers and composers. Used by PROs and publishers." },
  { id: "master", label: "Master (the recording)", hint: "Who owns the recording: artist, producer, label." },
];

const blank = (type: RightsType): SplitRow => ({
  rights_type: type, holder_name: "", holder_email: "", role: type === "publishing" ? "writer" : "artist",
  split_percentage: 0, pro_affiliation: "", ipi_number: "",
});

/** One track's split sheet: who owns what, adding to 100%, confirmed by each person. */
export function SplitSheet({ trackId, trackTitle, albumId }: { trackId: string; trackTitle: string; albumId?: string | null }) {
  const [rows, setRows] = useState<SplitRow[]>([]);
  const [initialIds, setInitialIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("track_rights_splits").select("*").eq("track_id", trackId).order("created_at");
    const list = ((data ?? []) as unknown as (SplitRow & { id: string; rights_type: string })[])
      .filter((r) => r.rights_type === "publishing" || r.rights_type === "master")
      .map((r) => ({
        id: r.id, rights_type: r.rights_type as RightsType, holder_name: r.holder_name ?? "", holder_email: r.holder_email ?? "",
        role: r.role ?? "", split_percentage: Number(r.split_percentage), pro_affiliation: r.pro_affiliation ?? "",
        ipi_number: r.ipi_number ?? "", status: r.status ?? "draft", dispute_note: r.dispute_note,
      }));
    setRows(list);
    setInitialIds(list.map((r) => r.id!));
    setDirty(false);
    setLoading(false);
  }, [trackId]);

  useEffect(() => { load(); }, [load]);

  const update = (i: number, patch: Partial<SplitRow>) => { setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r))); setDirty(true); };
  const remove = (i: number) => { setRows((rs) => rs.filter((_, j) => j !== i)); setDirty(true); };
  const add = (type: RightsType) => { setRows((rs) => [...rs, blank(type)]); setDirty(true); };
  const even = (type: RightsType) => {
    const idx = rows.map((r, i) => (r.rights_type === type ? i : -1)).filter((i) => i >= 0);
    const shares = evenShares(idx.length);
    setRows((rs) => rs.map((r, i) => (idx.includes(i) ? { ...r, split_percentage: shares[idx.indexOf(i)] } : r)));
    setDirty(true);
  };

  const problems = TYPES.flatMap((t) => {
    const group = rows.filter((r) => r.rights_type === t.id);
    return group.length ? splitProblems(group).map((p) => `${t.id === "publishing" ? "Publishing" : "Master"}: ${p}`) : [];
  });

  const save = async (): Promise<boolean> => {
    if (problems.length) { toast.error(problems[0]); return false; }
    setSaving(true);
    try {
      const keep = rows.filter((r) => r.id).map((r) => r.id!);
      const gone = initialIds.filter((id) => !keep.includes(id));
      if (gone.length) {
        const { error } = await supabase.from("track_rights_splits").delete().in("id", gone);
        if (error) throw error;
      }
      for (const r of rows) {
        const fields = {
          rights_type: r.rights_type, holder_name: r.holder_name.trim(), holder_email: r.holder_email.trim().toLowerCase() || null,
          role: r.role.trim() || null, split_percentage: r.split_percentage,
          pro_affiliation: r.pro_affiliation.trim() || null, ipi_number: r.ipi_number.trim() || null,
        };
        const { error } = r.id
          ? await supabase.from("track_rights_splits").update(fields as never).eq("id", r.id)
          : await supabase.from("track_rights_splits").insert({ ...fields, track_id: trackId } as never);
        if (error) throw error;
      }
      toast.success("Splits saved");
      await load();
      return true;
    } catch (e) {
      toast.error(`Couldn't save splits: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const send = async () => {
    if (dirty && !(await save())) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-split-invites", { body: { track_id: trackId } });
    setSending(false);
    if (error) {
      const ctx = (error as { context?: Response }).context;
      const body = ctx && typeof ctx.json === "function" ? await ctx.json().catch(() => null) : null;
      toast.error(body?.error ?? "Couldn't send confirmations.");
      return;
    }
    const r = data as { sent: number; skipped_no_email: number; failed: number };
    toast.success(`Sent ${r.sent} confirmation${r.sent === 1 ? "" : "s"}` +
      (r.skipped_no_email ? `. ${r.skipped_no_email} without an email — add one to ask them.` : "") +
      (r.failed ? `. ${r.failed} failed; try again.` : ""));
    load();
  };

  const applyToRelease = async () => {
    if (!albumId) return;
    if (dirty && !(await save())) return;
    const { data: siblings } = await supabase.from("tracks").select("id").eq("album_id", albumId).neq("id", trackId);
    const ids = (siblings ?? []).map((t) => t.id);
    if (!ids.length) { toast.message("No other tracks on this release."); return; }
    if (!window.confirm(`Replace the splits on ${ids.length} other track${ids.length === 1 ? "" : "s"} with these?`)) return;
    const { error } = await supabase.rpc("copy_splits" as never, { p_from: trackId, p_to: ids } as never);
    if (error) toast.error(`Couldn't copy: ${error.message}`);
    else toast.success(`Copied to ${ids.length} track${ids.length === 1 ? "" : "s"}. Send confirmations from each track.`);
  };

  const download = () => {
    const blob = new Blob([splitSheetCsv(trackTitle, rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${trackTitle.replace(/[^\w-]+/g, "_")}_split_sheet.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading) return <div className="py-10 grid place-items-center"><Loader2 className="w-5 h-5 animate-spin" aria-label="Loading splits" /></div>;

  return (
    <div className="space-y-6">
      {TYPES.map((t) => {
        const group = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.rights_type === t.id);
        const sum = total(group.map((g) => g.r));
        return (
          <section key={t.id} aria-labelledby={`split-${t.id}`} className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 id={`split-${t.id}`} className="font-semibold">{t.label}</h3>
                <p className="text-xs text-muted-foreground">{t.hint}</p>
              </div>
              {group.length > 0 && (
                <span className={`text-sm font-medium ${sum === 100 ? "text-green-500" : "text-amber-500"}`}>{sum}% of 100%</span>
              )}
            </div>

            {group.map(({ r, i }) => (
              <div key={r.id ?? `new-${i}`} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1.4fr_1.4fr_0.9fr_0.7fr_auto]">
                <Input aria-label="Name" placeholder="Name" value={r.holder_name} onChange={(e) => update(i, { holder_name: e.target.value })} />
                <Input aria-label="Email" type="email" placeholder="Email (to confirm)" value={r.holder_email} onChange={(e) => update(i, { holder_email: e.target.value })} />
                <Input aria-label="Role" placeholder="Role" value={r.role} onChange={(e) => update(i, { role: e.target.value })} />
                <div className="flex items-center gap-1">
                  <Input aria-label="Share percent" inputMode="decimal" value={r.split_percentage || ""} onChange={(e) => update(i, { split_percentage: Number(e.target.value) || 0 })} />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  {r.status && <Badge variant={STATUS[r.status].variant}>{STATUS[r.status].label}</Badge>}
                  <Button variant="ghost" size="icon" aria-label={`Remove ${r.holder_name || "share"}`} onClick={() => remove(i)}><Trash2 className="w-4 h-4" /></Button>
                </div>
                {t.id === "publishing" && (
                  <div className="grid grid-cols-2 gap-2 sm:col-span-5">
                    <Input aria-label="PRO" placeholder="PRO (BMI, ASCAP…)" value={r.pro_affiliation} onChange={(e) => update(i, { pro_affiliation: e.target.value })} />
                    <Input aria-label="IPI number" placeholder="IPI number" value={r.ipi_number} onChange={(e) => update(i, { ipi_number: e.target.value })} />
                  </div>
                )}
                {r.status === "disputed" && r.dispute_note && (
                  <p className="text-sm text-destructive sm:col-span-5">They said: “{r.dispute_note}”</p>
                )}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => add(t.id)} className="gap-1"><Plus className="w-3.5 h-3.5" />Add person</Button>
              {group.length > 1 && <Button variant="ghost" size="sm" onClick={() => even(t.id)}>Split evenly</Button>}
            </div>
          </section>
        );
      })}

      {problems.length > 0 && rows.length > 0 && (
        <ul role="alert" className="text-sm text-amber-500 list-disc pl-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
      )}

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button onClick={save} disabled={saving || !dirty}>{saving ? "Saving…" : "Save splits"}</Button>
        <Button variant="outline" onClick={send} disabled={sending || rows.length === 0 || problems.length > 0} className="gap-1">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Send for confirmation
        </Button>
        {albumId && <Button variant="ghost" onClick={applyToRelease} className="gap-1"><Copy className="w-4 h-4" />Use for whole release</Button>}
        <Button variant="ghost" onClick={download} disabled={!rows.length} className="gap-1"><Download className="w-4 h-4" />Split sheet (CSV)</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Changing a confirmed share sends it back for confirmation. Each person confirms from their email; no account needed.
      </p>
    </div>
  );
}
