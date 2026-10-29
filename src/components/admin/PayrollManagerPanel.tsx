import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Run = { id: string; created_at: string; status: string; summary: string | null; findings: any; auto_fixes: any; totals: any };

export function PayrollManagerPanel() {
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("payroll_runs").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
    setRun(data as Run | null);
  };
  useEffect(() => { load(); }, []);

  const runNow = async () => {
    setBusy(true);
    const { error } = await supabase.functions.invoke("payroll-manager", { body: {} });
    setBusy(false);
    if (error) toast.error("Payroll audit failed to run");
    await load();
  };

  const findings: any[] = Array.isArray(run?.findings) ? run!.findings : [];
  const fixes: any[] = Array.isArray(run?.auto_fixes) ? run!.auto_fixes : [];
  const t = run?.totals ?? {};
  const variant = run?.status === "healthy" ? "default" : run?.status === "critical" ? "destructive" : "secondary";

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Payroll Manager</CardTitle>
        <Button size="sm" variant="outline" onClick={runNow} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Run audit
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!run ? <p className="text-muted-foreground">No audits yet.</p> : <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={variant as any}>{run.status.toUpperCase()}</Badge>
            <span className="text-muted-foreground">{new Date(run.created_at).toLocaleString()}</span>
          </div>
          <p>{run.summary}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[["Owed", t.owed_usd], ["Due now (≥$50)", t.due_now_usd], ["Stripe available", t.stripe_available_usd], ["Stripe pending", t.stripe_pending_usd]].map(([l, v]) => (
              <div key={l as string} className="rounded-lg border border-border p-2">
                <div className="text-xs text-muted-foreground">{l}</div>
                <div className="font-semibold">{v == null ? "—" : `$${Number(v).toFixed(2)}`}</div>
              </div>
            ))}
          </div>
          {fixes.length > 0 && <p className="text-muted-foreground">Auto-fixed: {fixes.map((f) => `${f.action} (${f.count})`).join(", ")}</p>}
          <ul className="space-y-1">
            {findings.map((f, i) => (
              <li key={i} className="flex gap-2"><Badge variant={f.severity === "critical" ? "destructive" : "secondary"}>{f.severity}</Badge><span>{f.message}</span></li>
            ))}
          </ul>
        </>}
      </CardContent>
    </Card>
  );
}
