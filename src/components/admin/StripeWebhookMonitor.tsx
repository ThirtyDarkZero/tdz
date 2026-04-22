import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Webhook, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle,
  Search, Eye, Copy, ExternalLink, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type WebhookEvent = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  status: "received" | "processed" | "failed" | "ignored";
  livemode: boolean;
  signature_valid: boolean;
  processing_ms: number | null;
  error_message: string | null;
  payload: any;
  received_at: string;
  processed_at: string | null;
};

const STATUS_STYLES: Record<string, { icon: any; cls: string; label: string }> = {
  processed: { icon: CheckCircle2, cls: "bg-green-500/15 text-green-400 border-green-500/30", label: "Processed" },
  failed:    { icon: XCircle,      cls: "bg-red-500/15 text-red-400 border-red-500/30",       label: "Failed" },
  received:  { icon: Clock,        cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", label: "In-flight" },
  ignored:   { icon: AlertTriangle,cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",    label: "Ignored" },
};

export const StripeWebhookMonitor = () => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WebhookEvent | null>(null);

  const load = async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from("stripe_webhook_events" as any)
      .select("*")
      .order("received_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error(`Failed to load webhook events: ${error.message}`);
    } else {
      setEvents((data as any) || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    // Live updates as new webhooks arrive
    const channel = supabase
      .channel("stripe_webhook_events_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stripe_webhook_events" },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventTypes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.event_type));
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !e.stripe_event_id.toLowerCase().includes(s) &&
          !e.event_type.toLowerCase().includes(s) &&
          !(e.error_message || "").toLowerCase().includes(s)
        ) return false;
      }
      return true;
    });
  }, [events, statusFilter, typeFilter, search]);

  const stats = useMemo(() => {
    const last24 = events.filter((e) => Date.now() - new Date(e.received_at).getTime() < 86_400_000);
    const failed24 = last24.filter((e) => e.status === "failed").length;
    const processed24 = last24.filter((e) => e.status === "processed").length;
    const successRate = last24.length ? Math.round((processed24 / last24.length) * 100) : 100;
    const lastEvent = events[0];
    return { total24: last24.length, failed24, processed24, successRate, lastEvent };
  }, [events]);

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copied");
  };

  return (
    <div className="space-y-4">
      {/* Header + Stats */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5 text-amber-500" />
                Stripe Webhook Monitor
              </CardTitle>
              <CardDescription>
                Live delivery log of every Stripe webhook hitting <code className="text-xs">/stripe-webhook</code>.
                Use to debug payouts, subscriptions and Connect account updates.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open("https://dashboard.stripe.com/webhooks", "_blank")}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Stripe Webhook Settings
              </Button>
              <Button size="sm" variant="outline" onClick={load} disabled={refreshing}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Last 24h" value={stats.total24.toString()} sub="events received" />
            <StatTile label="Processed" value={stats.processed24.toString()} sub="last 24h" tone="success" />
            <StatTile
              label="Failed"
              value={stats.failed24.toString()}
              sub="last 24h"
              tone={stats.failed24 > 0 ? "danger" : "muted"}
            />
            <StatTile
              label="Success rate"
              value={`${stats.successRate}%`}
              sub={stats.lastEvent ? `last: ${formatDistanceToNow(new Date(stats.lastEvent.received_at), { addSuffix: true })}` : "no events yet"}
              tone={stats.successRate >= 95 ? "success" : stats.successRate >= 80 ? "warn" : "danger"}
            />
          </div>

          {stats.failed24 > 0 && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5" />
              <div className="text-sm text-red-300">
                <strong>{stats.failed24} failed webhook{stats.failed24 === 1 ? "" : "s"}</strong> in the last 24h —
                payments or payouts may be out of sync. Click a failed row to see the payload + error.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by event id, type, or error…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="received">In-flight</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[240px]"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All event types</SelectItem>
                {eventTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Event list */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading webhook events…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No webhook events match your filters. Trigger a test event in Stripe Dashboard to see it appear here.
            </div>
          ) : (
            <ScrollArea className="h-[560px]">
              <div className="divide-y divide-border/50">
                {filtered.map((e) => {
                  const meta = STATUS_STYLES[e.status];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <Badge variant="outline" className={meta.cls}>
                            <Icon className="w-3 h-3 mr-1" />
                            {meta.label}
                          </Badge>
                          <div className="min-w-0">
                            <p className="font-mono text-sm text-foreground truncate">{e.event_type}</p>
                            <p className="font-mono text-xs text-muted-foreground truncate">{e.stripe_event_id}</p>
                            {e.error_message && (
                              <p className="text-xs text-red-400 mt-1 line-clamp-2">{e.error_message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                          {!e.livemode && <Badge variant="outline" className="text-[10px]">TEST</Badge>}
                          {e.processing_ms != null && <span>{e.processing_ms}ms</span>}
                          <span>{formatDistanceToNow(new Date(e.received_at), { addSuffix: true })}</span>
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Payload viewer */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-sm">
              {selected?.event_type}
              {selected && (
                <Badge variant="outline" className={STATUS_STYLES[selected.status].cls}>
                  {STATUS_STYLES[selected.status].label}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 font-mono text-xs">
              {selected?.stripe_event_id}
              {selected && (
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copy(selected.stripe_event_id)}>
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <Meta label="Mode" value={selected.livemode ? "LIVE" : "TEST"} />
                <Meta label="Signature" value={selected.signature_valid ? "Valid" : "INVALID"} tone={selected.signature_valid ? "ok" : "danger"} />
                <Meta label="Processing" value={selected.processing_ms != null ? `${selected.processing_ms} ms` : "—"} />
                <Meta label="Received" value={new Date(selected.received_at).toLocaleString()} />
              </div>

              {selected.error_message && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                  <strong className="block mb-1">Error</strong>
                  <code className="text-xs whitespace-pre-wrap break-all">{selected.error_message}</code>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">Payload</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copy(JSON.stringify(selected.payload, null, 2))}
                  >
                    <Copy className="w-3 h-3 mr-1.5" /> Copy JSON
                  </Button>
                </div>
                <ScrollArea className="h-[400px] rounded-lg border border-border/50 bg-background/50">
                  <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
                    {JSON.stringify(selected.payload, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function StatTile({ label, value, sub, tone = "muted" }: {
  label: string; value: string; sub?: string;
  tone?: "muted" | "success" | "warn" | "danger";
}) {
  const tones: Record<string, string> = {
    muted: "text-foreground",
    success: "text-green-400",
    warn: "text-amber-400",
    danger: "text-red-400",
  };
  return (
    <div className="p-3 rounded-lg bg-background/40 border border-border/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${tones[tone]}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Meta({ label, value, tone }: { label: string; value: string; tone?: "ok" | "danger" }) {
  return (
    <div className="p-2 rounded-md bg-background/40 border border-border/50">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${tone === "danger" ? "text-red-400" : tone === "ok" ? "text-green-400" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
