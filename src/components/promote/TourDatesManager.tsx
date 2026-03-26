import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Plus, Calendar, Trash2, ExternalLink, Ticket, Loader2, Users, DollarSign, BarChart3, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

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
  }>;
  currency: string;
}

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
                    <div>
                      <span className="font-medium">{tc.name}</span>
                      {tc.free && <Badge variant="outline" className="ml-2 text-xs">Free</Badge>}
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

function AttendeeListDialog({ eventId }: { eventId: string }) {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || !eventId) return;
    setLoading(true);
    supabase.functions.invoke("eventbrite-api", {
      body: { action: "list_attendees", event_id: eventId },
    }).then(({ data, error }) => {
      if (!error && data?.success) {
        setAttendees(data.data.attendees || []);
      }
      setLoading(false);
    });
  }, [open, eventId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="View Attendees">
          <Users className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Attendees
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : attendees.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No attendees yet</p>
        ) : (
          <div className="space-y-2">
            {attendees.map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium text-sm">{a.profile?.name || a.profile?.first_name || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{a.profile?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.checked_in ? "default" : "outline"} className="text-xs">
                    {a.checked_in ? "Checked In" : a.status || "Attending"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function TourDatesManager() {
  const { user } = useAuth();
  const [dates, setDates] = useState<TourDate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [useEventbrite, setUseEventbrite] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(false);

  // Form state
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("US");
  const [dateTime, setDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState("100");
  const [vipPrice, setVipPrice] = useState("");
  const [vipQuantity, setVipQuantity] = useState("50");

  useEffect(() => { if (user) loadDates(); }, [user]);

  const loadDates = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("tour_dates")
      .select("*")
      .eq("artist_id", user.id)
      .order("date_time", { ascending: true });
    setDates((data as TourDate[]) || []);
  };

  const loadEventbriteOrg = async () => {
    if (orgId) return;
    setLoadingOrg(true);
    try {
      const { data, error } = await supabase.functions.invoke("eventbrite-api", {
        body: { action: "get_organizations" },
      });
      if (error) throw error;
      const orgs = data?.data?.organizations;
      if (orgs && orgs.length > 0) {
        setOrgId(orgs[0].id);
      } else {
        toast.error("No Eventbrite organization found");
      }
    } catch (err: any) {
      toast.error("Eventbrite connection failed: " + (err.message || "Unknown error"));
    } finally {
      setLoadingOrg(false);
    }
  };

  const handleEventbriteToggle = async (checked: boolean) => {
    setUseEventbrite(checked);
    if (checked) await loadEventbriteOrg();
  };

  const resetForm = () => {
    setVenue(""); setCity(""); setState(""); setDateTime(""); setEndDateTime("");
    setTicketUrl(""); setEventName(""); setEventDescription("");
    setTicketPrice(""); setTicketQuantity("100"); setVipPrice(""); setVipQuantity("50");
    setShowForm(false);
  };

  const handleAdd = async () => {
    if (!user || !city || !dateTime) {
      toast.error("City and date are required");
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
          name: eventName || `${venue || "Show"} — ${city}`,
          description: eventDescription,
          start_utc: startUtc,
          end_utc: endUtc,
          venue_name: venue || "TBA",
          city,
          state: state || null,
          country,
          ticket_name: "General Admission",
          ticket_price: ticketPrice ? parseFloat(ticketPrice) : 0,
          ticket_quantity: parseInt(ticketQuantity) || 100,
          publish: true,
        };

        if (vipPrice && parseFloat(vipPrice) > 0) {
          body.vip_ticket_price = parseFloat(vipPrice);
          body.vip_ticket_quantity = parseInt(vipQuantity) || 50;
          body.vip_ticket_name = "VIP";
        }

        const { data, error } = await supabase.functions.invoke("eventbrite-api", { body });
        if (error || !data?.success) throw new Error(data?.error || "Eventbrite creation failed");
        toast.success("Event created on Eventbrite & added to your tour dates!");
      } else {
        const { error } = await (supabase as any).from("tour_dates").insert({
          artist_id: user.id,
          venue: venue || "TBA",
          city,
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
            <CardDescription>Manage shows & sell tickets via Eventbrite</CardDescription>
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
                  <p className="text-xs text-muted-foreground">Creates a real event with ticketing</p>
                </div>
              </div>
              <Switch checked={useEventbrite} onCheckedChange={handleEventbriteToggle} disabled={loadingOrg} />
            </div>

            {loadingOrg && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Connecting to Eventbrite...
              </div>
            )}

            {useEventbrite && orgId && (
              <div className="space-y-3">
                <div>
                  <Label>Event Name</Label>
                  <Input value={eventName} onChange={(e) => setEventName(e.target.value)} className="mt-1" placeholder="My Concert Night" />
                </div>
                <div>
                  <Label>Event Description</Label>
                  <Textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} className="mt-1" placeholder="Tell fans what to expect..." rows={2} />
                </div>
              </div>
            )}

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
                    <SelectItem value="JP">Japan</SelectItem>
                    <SelectItem value="BR">Brazil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date & Time *</Label>
                <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className="mt-1" />
              </div>
              {useEventbrite ? (
                <div>
                  <Label>End Date & Time</Label>
                  <Input type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} className="mt-1" />
                </div>
              ) : (
                <div>
                  <Label>Ticket URL</Label>
                  <Input value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} className="mt-1" placeholder="https://..." />
                </div>
              )}
            </div>

            {useEventbrite && orgId && (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>GA Ticket Price ($)</Label>
                    <Input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} className="mt-1" placeholder="0 = free" min="0" step="0.01" />
                  </div>
                  <div>
                    <Label>GA Tickets Available</Label>
                    <Input type="number" value={ticketQuantity} onChange={(e) => setTicketQuantity(e.target.value)} className="mt-1" placeholder="100" min="1" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>VIP Ticket Price ($) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input type="number" value={vipPrice} onChange={(e) => setVipPrice(e.target.value)} className="mt-1" placeholder="Leave empty for no VIP" min="0" step="0.01" />
                  </div>
                  <div>
                    <Label>VIP Tickets Available</Label>
                    <Input type="number" value={vipQuantity} onChange={(e) => setVipQuantity(e.target.value)} className="mt-1" placeholder="50" min="1" />
                  </div>
                </div>
              </>
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

        {/* Upcoming */}
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
                  <TourDateRow key={d.id} date={d} onDelete={handleDelete} onCancel={handleCancel} />
                ))}
              </div>
            )}

            {pastDates.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-4">Past / Cancelled</h3>
                {pastDates.map((d) => (
                  <TourDateRow key={d.id} date={d} onDelete={handleDelete} onCancel={handleCancel} isPast />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TourDateRow({ date: d, onDelete, onCancel, isPast }: { 
  date: TourDate; 
  onDelete: (id: string) => void; 
  onCancel: (d: TourDate) => void;
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
      <div className="flex gap-1">
        {d.eventbrite_event_id && (
          <>
            <EventStatsDialog eventId={d.eventbrite_event_id} />
            <AttendeeListDialog eventId={d.eventbrite_event_id} />
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
