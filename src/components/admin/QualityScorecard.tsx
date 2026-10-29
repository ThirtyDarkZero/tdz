import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface CtqRow {
  ctq: string;
  opportunities: number;
  defects: number;
  dpmo: number;
  sigma: number;
  top_failure: string | null;
}

const CTQ_LABELS: Record<string, string> = {
  stream_validation: "Stream fraud check ran",
  stream_credit: "Paid stream credited",
  payout: "Eligible artist paid",
  checkout_start: "Checkout opened",
  upload: "Track upload completed",
  stripe_webhook: "Stripe event processed",
};

const PERIODS = [7, 30, 90];

interface ActiveAlert {
  alert_key: string;
  severity: string;
  message: string;
  first_seen: string;
}

function sigmaTone(sigma: number) {
  if (sigma >= 6) return "bg-green-500/15 text-green-500 border-green-500/30";
  if (sigma >= 4) return "bg-blue-500/15 text-blue-500 border-blue-500/30";
  if (sigma >= 3) return "bg-yellow-500/15 text-yellow-600 border-yellow-500/30";
  return "bg-red-500/15 text-red-500 border-red-500/30";
}

// Six Sigma scorecard: real pass/fail outcomes per critical operation.
export function QualityScorecard() {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<CtqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc(
      "get_quality_scorecard" as never,
      { p_days: days } as never,
    );
    if (rpcError) setError(rpcError.message);
    else setRows((data as unknown as CtqRow[]) ?? []);
    const { data: open } = await supabase
      .from("quality_alerts" as never)
      .select("alert_key, severity, message, first_seen")
      .is("resolved_at", null)
      .order("severity", { ascending: true });
    setAlerts((open as unknown as ActiveAlert[]) ?? []);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = rows.reduce(
    (t, r) => ({ n: t.n + Number(r.opportunities), d: t.d + Number(r.defects) }),
    { n: 0, d: 0 },
  );
  const overallDpmo = totals.n ? Math.round((totals.d / totals.n) * 1_000_000) : 0;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Quality scorecard</CardTitle>
          <CardDescription>
            Defects per million real operations. Six Sigma = 3.4 DPMO.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <Button key={p} size="sm" variant={p === days ? "default" : "outline"} onClick={() => setDays(p)}>
              {p}d
            </Button>
          ))}
          <Button size="icon" variant="ghost" onClick={load} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div
                key={a.alert_key}
                className={`rounded-md border px-3 py-2 text-sm ${
                  a.severity === "critical"
                    ? "border-red-500/40 bg-red-500/10 text-red-500"
                    : "border-yellow-500/40 bg-yellow-500/10 text-yellow-600"
                }`}
              >
                {a.message}
                <span className="ml-2 text-xs opacity-70">
                  since {new Date(a.first_seen).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-destructive">Could not load scorecard: {error}</p>}
        {!error && !loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No outcomes recorded yet. Data appears as streams, payouts, checkouts and uploads happen.
          </p>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/50">
                  <th className="py-2 pr-4 font-medium">Operation</th>
                  <th className="py-2 pr-4 font-medium text-right">Runs</th>
                  <th className="py-2 pr-4 font-medium text-right">Defects</th>
                  <th className="py-2 pr-4 font-medium text-right">DPMO</th>
                  <th className="py-2 pr-4 font-medium">Sigma</th>
                  <th className="py-2 font-medium">Top failure</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.ctq} className="border-b border-border/30">
                    <td className="py-2 pr-4">{CTQ_LABELS[r.ctq] ?? r.ctq}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{Number(r.opportunities).toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{Number(r.defects).toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{Number(r.dpmo).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline" className={sigmaTone(Number(r.sigma))}>
                        {Number(r.sigma).toFixed(2)}σ
                      </Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">{r.top_failure ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-medium">
                  <td className="py-2 pr-4">All operations</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{totals.n.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{totals.d.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{overallDpmo.toLocaleString()}</td>
                  <td className="py-2 pr-4" colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
