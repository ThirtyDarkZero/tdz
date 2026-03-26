import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare, Plus, Clock, CheckCircle2, AlertCircle, 
  Send, Loader2, Filter, Search, ArrowLeft, Music, Album
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Ticket {
  id: string;
  ticket_number: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  track_id?: string;
  album_id?: string;
  created_at: string;
  updated_at: string;
  resolution_notes?: string;
  resolved_at?: string;
}

interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  is_staff: boolean;
  content: string;
  created_at: string;
}

const CATEGORIES = [
  { value: "technical", label: "Technical Issue", icon: "🔧" },
  { value: "quality", label: "Quality Control", icon: "🎵" },
  { value: "distribution", label: "Distribution", icon: "🌍" },
  { value: "payment", label: "Payment & Royalties", icon: "💰" },
  { value: "account", label: "Account", icon: "👤" },
  { value: "metadata", label: "Metadata", icon: "📝" },
  { value: "other", label: "Other", icon: "❓" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-blue-500" },
  { value: "normal", label: "Normal", color: "text-green-500" },
  { value: "high", label: "High", color: "text-amber-500" },
  { value: "urgent", label: "Urgent", color: "text-red-500" },
];

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500",
  in_progress: "bg-amber-500",
  waiting_response: "bg-purple-500",
  resolved: "bg-green-500",
  closed: "bg-muted",
};

export const SupportTicketSystem = () => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newResponse, setNewResponse] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    category: "",
    priority: "normal",
    subject: "",
    description: "",
    track_id: "",
    album_id: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTickets();
    loadUserContent();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadResponses(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadResponses = async (ticketId: string) => {
    const { data, error } = await supabase
      .from("ticket_responses")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading responses:", error);
      return;
    }
    setResponses(data || []);
  };

  const loadUserContent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [tracksRes, albumsRes] = await Promise.all([
      supabase.from("tracks").select("id, title").eq("user_id", user.id),
      supabase.from("albums").select("id, title").eq("user_id", user.id)
    ]);

    setTracks(tracksRes.data || []);
    setAlbums(albumsRes.data || []);
  };

  const handleSubmitTicket = async () => {
    if (!newTicket.category || !newTicket.subject || !newTicket.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          ticket_number: "", // Auto-generated by trigger
          category: newTicket.category,
          priority: newTicket.priority,
          subject: newTicket.subject,
          description: newTicket.description,
          track_id: newTicket.track_id || null,
          album_id: newTicket.album_id || null,
          status: "open"
        });

      if (error) throw error;

      toast.success("Ticket submitted successfully!");
      setShowNewTicket(false);
      setNewTicket({
        category: "",
        priority: "normal",
        subject: "",
        description: "",
        track_id: "",
        album_id: ""
      });
      loadTickets();
    } catch (error: any) {
      console.error("Error submitting ticket:", error);
      toast.error(error.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResponse = async () => {
    if (!newResponse.trim() || !selectedTicket) return;

    setSendingResponse(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("ticket_responses")
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          is_staff: false,
          content: newResponse.trim()
        });

      if (error) throw error;

      setNewResponse("");
      loadResponses(selectedTicket.id);
      toast.success("Response sent");
    } catch (error: any) {
      console.error("Error sending response:", error);
      toast.error("Failed to send response");
    } finally {
      setSendingResponse(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'open' && (t.status === 'resolved' || t.status === 'closed')) return false;
    if (filter === 'resolved' && t.status !== 'resolved' && t.status !== 'closed') return false;
    if (searchQuery && !t.subject.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading support tickets...</p>
      </Card>
    );
  }

  // Ticket Detail View
  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Button>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline">{selectedTicket.ticket_number}</Badge>
                <Badge className={STATUS_COLORS[selectedTicket.status]}>
                  {selectedTicket.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className={PRIORITIES.find(p => p.value === selectedTicket.priority)?.color}>
                  {selectedTicket.priority}
                </Badge>
              </div>
              <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
              <p className="text-sm text-muted-foreground">
                {CATEGORIES.find(c => c.value === selectedTicket.category)?.icon}{" "}
                {CATEGORIES.find(c => c.value === selectedTicket.category)?.label} · 
                Created {format(new Date(selectedTicket.created_at), "PPp")}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="mb-4">
            <h4 className="font-medium mb-2">Original Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTicket.description}</p>
          </div>

          {selectedTicket.resolution_notes && (
            <Card className="p-4 bg-green-500/10 border-green-500/30 mb-4">
              <h4 className="font-medium text-green-500 mb-2">Resolution</h4>
              <p className="text-sm">{selectedTicket.resolution_notes}</p>
              {selectedTicket.resolved_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Resolved on {format(new Date(selectedTicket.resolved_at), "PPp")}
                </p>
              )}
            </Card>
          )}

          <Separator className="my-4" />

          {/* Conversation */}
          <div className="space-y-4">
            <h4 className="font-medium">Conversation</h4>
            <ScrollArea className="h-[300px]">
              {responses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No responses yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {responses.map(response => (
                    <div 
                      key={response.id}
                      className={`p-4 rounded-lg ${
                        response.is_staff 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={response.is_staff ? "default" : "secondary"}>
                          {response.is_staff ? "Support Team" : "You"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(response.created_at), "PPp")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{response.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your response..."
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSendResponse} disabled={sendingResponse || !newResponse.trim()}>
                  {sendingResponse ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">Support Center</h2>
            <p className="text-sm text-muted-foreground">Technical issues and quality control</p>
          </div>
        </div>

        <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={newTicket.category} onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Please provide detailed information about your issue..."
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Related Track
                  </Label>
                  <Select value={newTicket.track_id} onValueChange={(v) => setNewTicket({ ...newTicket, track_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {tracks.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Album className="w-4 h-4" />
                    Related Album
                  </Label>
                  <Select value={newTicket.album_id} onValueChange={(v) => setNewTicket({ ...newTicket, album_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {albums.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTicket(false)}>Cancel</Button>
              <Button onClick={handleSubmitTicket} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Submit Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Tickets</h3>
          <p className="text-muted-foreground mb-4">
            {tickets.length === 0 
              ? "You haven't submitted any support tickets yet"
              : "No tickets match your filters"}
          </p>
          <Button onClick={() => setShowNewTicket(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Submit Your First Ticket
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map(ticket => (
            <Card 
              key={ticket.id}
              className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">{ticket.ticket_number}</Badge>
                    <Badge className={`${STATUS_COLORS[ticket.status]} text-xs`}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${PRIORITIES.find(p => p.value === ticket.priority)?.color}`}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <h3 className="font-semibold truncate">{ticket.subject}</h3>
                  <p className="text-sm text-muted-foreground truncate">{ticket.description}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground flex-shrink-0">
                  <p>{CATEGORIES.find(c => c.value === ticket.category)?.icon}</p>
                  <p className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(ticket.created_at), "MMM d")}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
