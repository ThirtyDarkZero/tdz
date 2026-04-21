import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LifeBuoy, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Ticket = {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
};

const STATUS_OPTIONS = ["open", "in_progress", "waiting_user", "resolved", "closed"];
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  high: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  urgent: "bg-red-500/20 text-red-500 border-red-500/30",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  in_progress: "bg-violet-500/20 text-violet-500 border-violet-500/30",
  waiting_user: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  resolved: "bg-green-500/20 text-green-500 border-green-500/30",
  closed: "bg-muted text-muted-foreground",
};

export function SupportTicketsAdmin() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);
    const { data, error } = await query;
    if (error) {
      toast.error("Failed to load tickets", { description: error.message });
      setTickets([]);
    } else {
      setTickets((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  const selected = tickets.find((t) => t.id === selectedId) || null;

  useEffect(() => {
    setNotes(selected?.resolution_notes || "");
  }, [selectedId, selected?.resolution_notes]);

  const updateTicket = async (patch: Partial<Ticket>) => {
    if (!selected) return;
    setSaving(true);
    const update: any = { ...patch };
    if (patch.status === "resolved" || patch.status === "closed") {
      update.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("support_tickets")
      .update(update)
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update ticket", { description: error.message });
      return;
    }
    toast.success("Ticket updated");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 bg-amber-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LifeBuoy className="w-6 h-6 text-amber-500" />
            <div>
              <h2 className="text-xl font-bold">Support Tickets</h2>
              <p className="text-xs text-muted-foreground">All user support requests</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="px-6 py-4 flex flex-wrap gap-3 border-b border-border/30">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto text-sm text-muted-foreground self-center">
            {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] min-h-[500px]">
          {/* List */}
          <ScrollArea className="h-[600px] border-r border-border/30">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground text-sm">No tickets found</div>
            ) : (
              <div className="divide-y divide-border/30">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors ${
                      selectedId === t.id ? "bg-muted/40" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{t.ticket_number}</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[t.priority] || ""}`}>
                          {t.priority}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[t.status] || ""}`}>
                          {t.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm font-medium line-clamp-1">{t.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.category} · {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Detail */}
          <div className="p-6">
            {!selected ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select a ticket to view details
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold">{selected.subject}</h3>
                    <span className="text-xs font-mono text-muted-foreground">{selected.ticket_number}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={PRIORITY_COLORS[selected.priority] || ""}>
                      {selected.priority}
                    </Badge>
                    <Badge variant="outline" className={STATUS_COLORS[selected.status] || ""}>
                      {selected.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline">{selected.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Opened {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}
                    {" · user "}<span className="font-mono">{selected.user_id.slice(0, 8)}</span>
                  </p>
                </div>

                <div className="rounded-lg border border-border/30 bg-background/40 p-4">
                  <p className="text-sm whitespace-pre-wrap">{selected.description}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Resolution notes
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes or resolution summary…"
                    rows={4}
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Select
                    value={selected.status}
                    onValueChange={(v) => updateTicket({ status: v, resolution_notes: notes })}
                  >
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => updateTicket({ resolution_notes: notes })}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save notes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportTicketsAdmin;
