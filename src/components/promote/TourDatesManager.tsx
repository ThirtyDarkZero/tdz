import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  MapPin, Plus, Calendar, Trash2, ExternalLink, Ticket, Loader2,
  Users, DollarSign, BarChart3, Copy, Globe, Eye, ShoppingCart,
  Pencil, HelpCircle, Percent, Tag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

import { EventEditDialog } from "./eventbrite/EventEditDialog";
import { OrdersDialog } from "./eventbrite/OrdersDialog";
import { QuestionsDialog } from "./eventbrite/QuestionsDialog";
import { DiscountDialog } from "./eventbrite/DiscountDialog";
import { TicketManagerDialog } from "./eventbrite/TicketManagerDialog";
import { VenueDialog } from "./eventbrite/VenueDialog";

interface TourDate {
  id: string;
  venue: string;
  city: string;
  state: string | null;
  country: string;
  date_time: string;
  ticket_url: string | null;
  eventbrite_event_id: string | null;
  status: string;
}

interface EventStats {
  total_sold: number;
  total_revenue: number;
  total_attendees: number;
  ticket_breakdown: Array<{
    name: string;
    sold: number;
    total: number;
    price: number;
    revenue: number;
    free: boolean;
    donation?: boolean;
    on_sale_status?: string;
  }>;
  currency: string;
}

// ── Event Stats Dialog ──
function EventStatsDialog({ eventId }: { eventId: string }) {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const loadStats = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("eventbrite-api", {
        body: { action: "sales_report", event_id: eventId },
      });
      if (error || !data?.success) throw new Error(data?.error || "Failed to load stats");
      setStats(data.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (open) loadStats();
  }, [open, loadStats]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="View Sales">
          <BarChart3 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Event Sales
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{stats.total_attendees}</p>
                <p className="text-xs text-muted-foreground">Attendees</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-accent/10">
                <Ticket className="w-5 h-5 mx-auto mb-1 text-accent-foreground" />
                <p className="text-2xl font-bold">{stats.total_sold}</p>
                <p className="text-xs text-muted-foreground">Tickets Sold</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/10">
                <DollarSign className="w-5 h-5 mx-auto mb-1 text-secondary-foreground" />
                <p className="text-2xl font-bold">${stats.total_revenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
            {stats.ticket_breakdown.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Ticket Breakdown</h4>
                {stats.ticket_breakdown.map((tc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{tc.name}</span>
                      {tc.free && <Badge variant="outline" className="text-xs">Free</Badge>}
                      {tc.donation && <Badge variant="secondary" className="text-xs">Donation</Badge>}
                      {tc.on_sale_status && (
                        <Badge variant={tc.on_sale_status === "AVAILABLE" ? "default" : "outline"} className="text-xs">
                          {tc.on_sale_status}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono">{tc.sold}/{tc.total}</span>
                      {!tc.free && <span className="text-muted-foreground ml-2">${tc.revenue.toFixed(2)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No data available</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Attendee List Dialog ──
function AttendeeListDialog({ eventId }: { eventId: string }) {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!open || !eventId) return;
    setLoading(true);
    supabase.functions.invoke("eventbrite-api", {
      body: { action: "list_attendees", event_id: eventId, ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}) },
    }).then(({ data, error }) => {
      if (!error && data?.success) {
        setAttendees(data.data.attendees || []);
      }
      setLoading(false);
    });
  }, [open, eventId, statusFilter]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="View Attendees">
          <Users className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Attendees ({attendees.length})
          </DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="attending">Checked In</SelectItem>
              <SelectItem value="not_attending">Not Checked In</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : attendees.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No attendees found</p>
        ) : (
          <div className="space-y-2">
            {attendees.map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium text-sm">{a.profile?.name || a.profile?.first_name || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{a.profile?.email}</p>
                  {a.ticket_class_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">Ticket: {a.ticket_class_name}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={a.checked_in ? "default" : a.cancelled ? "destructive" : "outline"} className="text-xs">
                    {a.checked_in ? "Checked In" : a.cancelled ? "Cancelled" : a.refunded ? "Refunded" : a.status || "Attending"}
                  </Badge>
                  {a.costs?.gross?.display && a.costs.gross.value > 0 && (
                    <span className="text-xs font-mono">{a.costs.gross.display}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main TourDatesManager ──
export function TourDatesManager() {
  const { user } = useAuth();
  const [dates, setDates] = useState<TourDate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [useEventbrite, setUseEventbrite] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [ebConnectionError, setEbConnectionError] = useState<string | null>(null);
  const [ebConnected, setEbConnected] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);

  // Form state
  const [venue, setVenue] = useState("");
  const [venueId, setVenueId] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("US");
  const [dateTime, setDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventSummary, setEventSummary] = useState("");
  const [isOnlineEvent, setIsOnlineEvent] = useState(false);
  const [isInviteOnly, setIsInviteOnly] = useState(false);
  const [showRemaining, setShowRemaining] = useState(false);
  const [eventPassword, setEventPassword] = useState("");
  const [eventCapacity, setEventCapacity] = useState("");
  const [currency, setCurrency] = useState("USD");

  // Ticket classes
  const [ticketClasses, setTicketClasses] = useState<Array<{
    name: string; price: string; quantity: string; donation: boolean; hidden: boolean;
    salesStart: string; salesEnd: string;
  }>>([{ name: "General Admission", price: "", quantity: "100", donation: false, hidden: false, salesStart: "", salesEnd: "" }]);

  // Check if user already has Eventbrite connected
  useEffect(() => {
    if (user) {
      loadDates();
      checkEventbriteConnection();
    }
  }, [user]);

  const checkEventbriteConnection = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("artist_eventbrite_tokens")
      .select("organization_id, organization_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.organization_id) {
      setOrgId(data.organization_id);
      setEbConnected(true);
    }
  };

  const loadDates = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("tour_dates")
      .select("*")
      .eq("artist_id", user.id)
      .order("date_time", { ascending: true });
    setDates((data as TourDate[]) || []);
  };

  const connectEventbrite = async () => {
    setConnectingOAuth(true);
    try {
      const { data, error } = await supabase.functions.invoke("eventbrite-oauth-url", {
        body: { redirectUri: window.location.origin + "/eventbrite-callback" },
      });
      if (error || !data?.authUrl) throw new Error(data?.error || "Failed to start Eventbrite connection");
      window.location.href = data.authUrl;
    } catch (err: any) {
      toast.error(err.message || "Failed to connect Eventbrite");
      setConnectingOAuth(false);
    }
  };

  const disconnectEventbrite = async () => {
    if (!user) return;
    await (supabase as any)
      .from("artist_eventbrite_tokens")
      .delete()
      .eq("user_id", user.id);
    setOrgId(null);
    setEbConnected(false);
    setUseEventbrite(false);
    toast.success("Eventbrite disconnected");
  };

  const loadEventbriteOrg = async () => {
    if (orgId) return;
    setLoadingOrg(true);
    setEbConnectionError(null);
    try {
      const { data, error } = await supabase.functions.invoke("eventbrite-api", {
        body: { action: "get_organizations" },
      });
      if (error) throw error;
      if (data?.error?.includes("EVENTBRITE_NOT_CONNECTED")) {
        setEbConnectionError("not_connected");
        return;
      }
      if (data?.error) throw new Error(data.error);
      const orgs = data?.data?.organizations;
      if (orgs && orgs.length > 0) {
        setOrgId(orgs[0].id);
        setEbConnected(true);
      } else {
        setEbConnectionError("no_org");
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("EVENTBRITE_NOT_CONNECTED") || msg.includes("not configured")) {
        setEbConnectionError("not_connected");
      } else {
        setEbConnectionError(msg || "Connection failed");
      }
    } finally {
      setLoadingOrg(false);
    }
  };

  const handleEventbriteToggle = async (checked: boolean) => {
    setUseEventbrite(checked);
    if (checked) {
      if (ebConnected && orgId) return; // Already connected
      await loadEventbriteOrg();
    }
  };

  const resetForm = () => {
    setVenue(""); setVenueId(null); setCity(""); setState(""); setDateTime(""); setEndDateTime("");
    setTicketUrl(""); setEventName(""); setEventDescription(""); setEventSummary("");
    setIsOnlineEvent(false); setIsInviteOnly(false); setShowRemaining(false);
    setEventPassword(""); setEventCapacity(""); setCurrency("USD");
    setTicketClasses([{ name: "General Admission", price: "", quantity: "100", donation: false, hidden: false, salesStart: "", salesEnd: "" }]);
    setShowForm(false);
  };

  const addTicketClass = () => {
    setTicketClasses([...ticketClasses, { name: "", price: "", quantity: "50", donation: false, hidden: false, salesStart: "", salesEnd: "" }]);
  };

  const updateTicketClass = (idx: number, field: string, value: any) => {
    const updated = [...ticketClasses];
    (updated[idx] as any)[field] = value;
    setTicketClasses(updated);
  };

  const removeTicketClass = (idx: number) => {
    if (ticketClasses.length <= 1) return;
    setTicketClasses(ticketClasses.filter((_, i) => i !== idx));
  };

  const handleAdd = async () => {
    if (!user || !dateTime) {
      toast.error("Date/time is required");
      return;
    }
    if (!isOnlineEvent && !city) {
      toast.error("City is required for in-person events");
      return;
    }

    setSaving(true);
    try {
      if (useEventbrite && orgId) {
        const startUtc = new Date(dateTime).toISOString().replace(".000Z", "Z");
        const endUtc = endDateTime
          ? new Date(endDateTime).toISOString().replace(".000Z", "Z")
          : new Date(new Date(dateTime).getTime() + 3 * 60 * 60 * 1000).toISOString().replace(".000Z", "Z");

        const body: any = {
          action: "create_event",
          organization_id: orgId,
          name: eventName || `${venue || "Show"} — ${city || "Online"}`,
          description: eventDescription,
          summary: eventSummary || undefined,
          start_utc: startUtc,
          end_utc: endUtc,
          venue_name: venue || "TBA",
          city: city || (isOnlineEvent ? "Online" : "TBA"),
          state: state || null,
          country,
          currency,
          online_event: isOnlineEvent,
          invite_only: isInviteOnly,
          show_remaining: showRemaining,
          listed: true,
          publish: true,
          capacity: eventCapacity ? parseInt(eventCapacity) : undefined,
        };

        if (venueId) body.venue_id = venueId;
        if (eventPassword) body.password = eventPassword;

        // Build ticket classes array
        const tcs = ticketClasses.filter(tc => tc.name.trim()).map(tc => ({
          name: tc.name,
          price: tc.price ? parseFloat(tc.price) : 0,
          quantity_total: parseInt(tc.quantity) || 100,
          donation: tc.donation,
          hidden: tc.hidden,
          free: !tc.price || parseFloat(tc.price) === 0,
          sales_start: tc.salesStart ? new Date(tc.salesStart).toISOString().replace(".000Z", "Z") : undefined,
          sales_end: tc.salesEnd ? new Date(tc.salesEnd).toISOString().replace(".000Z", "Z") : undefined,
        }));
        if (tcs.length > 0) body.ticket_classes = tcs;

        const { data, error } = await supabase.functions.invoke("eventbrite-api", { body });
        if (error || !data?.success) throw new Error(data?.error || "Eventbrite creation failed");
        toast.success("Event created on Eventbrite & added to your tour dates!");
      } else {
        const { error } = await (supabase as any).from("tour_dates").insert({
          artist_id: user.id,
          venue: venue || "TBA",
          city: city || "TBA",
          state: state || null,
          country,
          date_time: new Date(dateTime).toISOString(),
          ticket_url: ticketUrl || null,
          status: "confirmed",
        } as any);
        if (error) throw error;
        toast.success("Tour date added");
      }

      resetForm();
      loadDates();
    } catch (err: any) {
      toast.error(err.message || "Failed to add date");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (d: TourDate) => {
    if (d.eventbrite_event_id) {
      try {
        const { data, error } = await supabase.functions.invoke("eventbrite-api", {
          body: { action: "cancel_event", event_id: d.eventbrite_event_id },
        });
        if (error || !data?.success) throw new Error(data?.error || "Cancel failed");
        toast.success("Event cancelled on Eventbrite");
      } catch (err: any) {
        toast.error(err.message);
        return;
      }
    }
    await (supabase as any).from("tour_dates").update({ status: "cancelled" }).eq("id", d.id);
    loadDates();
  };

  const handleCopyEvent = async (eventId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("eventbrite-api", {
        body: { action: "copy_event", event_id: eventId },
      });
      if (error || !data?.success) throw new Error(data?.error || "Copy failed");
      toast.success("Event duplicated! Edit it on Eventbrite to update details.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from("tour_dates").delete().eq("id", id);
    toast.success("Tour date removed");
    loadDates();
  };

  const upcomingDates = dates.filter(d => new Date(d.date_time) >= new Date() && d.status !== "cancelled");
  const pastDates = dates.filter(d => new Date(d.date_time) < new Date() || d.status === "cancelled");

  return (
    <Card className="bg-card/50 border-border/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Tour Dates
            </CardTitle>
            <CardDescription>Create events, sell tickets, manage attendees & orders via Eventbrite</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
            <Plus className="w-3 h-3" /> Add Date
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 rounded-xl bg-muted/20 border border-border/20 space-y-4">
            {/* Eventbrite toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Sell tickets via Eventbrite</p>
                  <p className="text-xs text-muted-foreground">Creates a live event with full ticketing</p>
                </div>
              </div>
              <Switch checked={useEventbrite} onCheckedChange={handleEventbriteToggle} disabled={loadingOrg} />
            </div>

            {loadingOrg && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Connecting to Eventbrite...
              </div>
            )}

            {useEventbrite && ebConnectionError && !loadingOrg && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  <p className="font-medium text-sm">
                    {ebConnectionError === "not_connected"
                      ? "Connect your Eventbrite account"
                      : ebConnectionError === "no_org"
                      ? "No Eventbrite organization found"
                      : "Eventbrite connection failed"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ebConnectionError === "not_connected"
                    ? "Sign in with your Eventbrite account to create events, sell tickets, and manage attendees directly from your studio."
                    : ebConnectionError === "no_org"
                    ? "Your Eventbrite account is connected but no organization was found. Make sure your Eventbrite account has an active organization."
                    : `Error: ${ebConnectionError}`}
                </p>
                <div className="flex gap-2">
                  {ebConnectionError === "not_connected" && (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={connectEventbrite}
                      disabled={connectingOAuth}
                    >
                      {connectingOAuth ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                      Sign in with Eventbrite
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      setEbConnectionError(null);
                      loadEventbriteOrg();
                    }}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {useEventbrite && orgId && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Event Details</TabsTrigger>
                  <TabsTrigger value="tickets">Tickets</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* TAB: Event Details */}
                <TabsContent value="details" className="space-y-3 mt-3">
                  <div>
                    <Label>Event Name</Label>
                    <Input value={eventName} onChange={(e) => setEventName(e.target.value)} className="mt-1" placeholder="My Concert Night" />
                  </div>
                  <div>
                    <Label>Summary <span className="text-xs text-muted-foreground">(max 140 chars, shows in search)</span></Label>
                    <Input value={eventSummary} onChange={(e) => setEventSummary(e.target.value.slice(0, 140))} className="mt-1" placeholder="A brief event summary..." />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} className="mt-1" placeholder="Tell fans what to expect..." rows={3} />
                  </div>

                  {/* Online event toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/10">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <Label className="text-sm">Online / Virtual Event</Label>
                    </div>
                    <Switch checked={isOnlineEvent} onCheckedChange={setIsOnlineEvent} />
                  </div>

                  {!isOnlineEvent && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Label>Venue</Label>
                          <Input value={venue} onChange={(e) => setVenue(e.target.value)} className="mt-1" placeholder="The Roxy" />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label>City *</Label>
                            <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" placeholder="Los Angeles" />
                          </div>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Label>State</Label>
                          <Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1" placeholder="CA" />
                        </div>
                        <div>
                          <Label>Country</Label>
                          <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="GB">United Kingdom</SelectItem>
                              <SelectItem value="AU">Australia</SelectItem>
                              <SelectItem value="DE">Germany</SelectItem>
                              <SelectItem value="FR">France</SelectItem>
                              <SelectItem value="JP">Japan</SelectItem>
                              <SelectItem value="BR">Brazil</SelectItem>
                              <SelectItem value="MX">Mexico</SelectItem>
                              <SelectItem value="NL">Netherlands</SelectItem>
                              <SelectItem value="ES">Spain</SelectItem>
                              <SelectItem value="IT">Italy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* Venue selector */}
                      <VenueDialog orgId={orgId} onVenueSelect={(vId, vName) => {
                        setVenueId(vId);
                        setVenue(vName);
                      }} />
                    </>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Start Date & Time *</Label>
                      <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>End Date & Time</Label>
                      <Input type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB: Tickets */}
                <TabsContent value="tickets" className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Ticket Classes</Label>
                    <div className="flex gap-2">
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                          <SelectItem value="JPY">JPY</SelectItem>
                          <SelectItem value="BRL">BRL</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={addTicketClass} className="gap-1 h-8 text-xs">
                        <Plus className="w-3 h-3" /> Add Tier
                      </Button>
                    </div>
                  </div>

                  {ticketClasses.map((tc, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/10 border border-border/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Tier {idx + 1}</span>
                        {ticketClasses.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeTicketClass(idx)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Name</Label>
                          <Input value={tc.name} onChange={(e) => updateTicketClass(idx, "name", e.target.value)} className="mt-0.5 h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Price ($) <span className="text-muted-foreground">(0=free)</span></Label>
                          <Input type="number" value={tc.price} onChange={(e) => updateTicketClass(idx, "price", e.target.value)} className="mt-0.5 h-8 text-sm" min="0" step="0.01" disabled={tc.donation} />
                        </div>
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input type="number" value={tc.quantity} onChange={(e) => updateTicketClass(idx, "quantity", e.target.value)} className="mt-0.5 h-8 text-sm" min="1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Sales Start</Label>
                          <Input type="datetime-local" value={tc.salesStart} onChange={(e) => updateTicketClass(idx, "salesStart", e.target.value)} className="mt-0.5 h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Sales End</Label>
                          <Input type="datetime-local" value={tc.salesEnd} onChange={(e) => updateTicketClass(idx, "salesEnd", e.target.value)} className="mt-0.5 h-8 text-sm" />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <Switch checked={tc.donation} onCheckedChange={(v) => updateTicketClass(idx, "donation", v)} />
                          <Label className="text-xs">Donation</Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Switch checked={tc.hidden} onCheckedChange={(v) => updateTicketClass(idx, "hidden", v)} />
                          <Label className="text-xs">Hidden</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                {/* TAB: Settings */}
                <TabsContent value="settings" className="space-y-3 mt-3">
                  <div>
                    <Label>Capacity <span className="text-xs text-muted-foreground">(max total tickets)</span></Label>
                    <Input type="number" value={eventCapacity} onChange={(e) => setEventCapacity(e.target.value)} className="mt-1" min="1" placeholder="Leave empty for no limit" />
                  </div>
                  <div>
                    <Label>Event Password <span className="text-xs text-muted-foreground">(optional)</span></Label>
                    <Input value={eventPassword} onChange={(e) => setEventPassword(e.target.value)} className="mt-1" placeholder="Require password to view" />
                  </div>
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Show remaining tickets</Label>
                      <Switch checked={showRemaining} onCheckedChange={setShowRemaining} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Invite only</Label>
                      <Switch checked={isInviteOnly} onCheckedChange={setIsInviteOnly} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* Non-Eventbrite fields */}
            {!useEventbrite && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Venue</Label>
                  <Input value={venue} onChange={(e) => setVenue(e.target.value)} className="mt-1" placeholder="The Roxy" />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" placeholder="Los Angeles" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1" placeholder="CA" />
                </div>
                <div>
                  <Label>Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date & Time *</Label>
                  <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Ticket URL</Label>
                  <Input value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} className="mt-1" placeholder="https://..." />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={saving} className="gap-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? "Creating..." : useEventbrite ? "Create Event & Sell Tickets" : "Add Tour Date"}
              </Button>
              <Button variant="ghost" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Tour Date List */}
        {upcomingDates.length === 0 && pastDates.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No tour dates added yet</p>
          </div>
        ) : (
          <>
            {upcomingDates.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upcoming</h3>
                {upcomingDates.map((d) => (
                  <TourDateRow key={d.id} date={d} orgId={orgId} onDelete={handleDelete} onCancel={handleCancel} onCopy={handleCopyEvent} onRefresh={loadDates} />
                ))}
              </div>
            )}
            {pastDates.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-4">Past / Cancelled</h3>
                {pastDates.map((d) => (
                  <TourDateRow key={d.id} date={d} orgId={orgId} onDelete={handleDelete} onCancel={handleCancel} onCopy={handleCopyEvent} onRefresh={loadDates} isPast />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Tour Date Row ──
function TourDateRow({ date: d, orgId, onDelete, onCancel, onCopy, onRefresh, isPast }: {
  date: TourDate;
  orgId: string | null;
  onDelete: (id: string) => void;
  onCancel: (d: TourDate) => void;
  onCopy: (eventId: string) => void;
  onRefresh: () => void;
  isPast?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border/20 hover:bg-muted/20 transition-all ${isPast ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-4">
        <div className="text-center w-14">
          <p className="text-lg font-bold">{format(new Date(d.date_time), "dd")}</p>
          <p className="text-xs text-muted-foreground uppercase">{format(new Date(d.date_time), "MMM")}</p>
        </div>
        <div>
          <p className="font-semibold">{d.venue}</p>
          <p className="text-sm text-muted-foreground">{d.city}{d.state ? `, ${d.state}` : ""} · {d.country}</p>
          <div className="flex items-center gap-2 mt-1">
            {d.eventbrite_event_id && (
              <Badge variant="outline" className="text-xs gap-1">
                <Ticket className="w-3 h-3" /> Eventbrite
              </Badge>
            )}
            {d.status === "cancelled" && (
              <Badge variant="destructive" className="text-xs">Cancelled</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-0.5 flex-wrap justify-end">
        {d.eventbrite_event_id && (
          <>
            <EventStatsDialog eventId={d.eventbrite_event_id} />
            <AttendeeListDialog eventId={d.eventbrite_event_id} />
            <OrdersDialog eventId={d.eventbrite_event_id} />
            <TicketManagerDialog eventId={d.eventbrite_event_id} />
            <EventEditDialog eventId={d.eventbrite_event_id} onUpdated={onRefresh} />
            <QuestionsDialog eventId={d.eventbrite_event_id} />
            {orgId && <DiscountDialog eventId={d.eventbrite_event_id} orgId={orgId} />}
            <Button variant="ghost" size="icon" onClick={() => onCopy(d.eventbrite_event_id!)} title="Duplicate Event">
              <Copy className="w-4 h-4" />
            </Button>
          </>
        )}
        {d.ticket_url && (
          <Button variant="ghost" size="icon" onClick={() => window.open(d.ticket_url!, "_blank")}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
        {!isPast && d.status !== "cancelled" && d.eventbrite_event_id && (
          <Button variant="ghost" size="icon" onClick={() => onCancel(d)} title="Cancel Event">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        )}
        {(!d.eventbrite_event_id || d.status === "cancelled") && (
          <Button variant="ghost" size="icon" onClick={() => onDelete(d.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}
