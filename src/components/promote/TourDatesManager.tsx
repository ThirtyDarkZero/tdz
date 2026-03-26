import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Calendar, Trash2, ExternalLink, Ticket, Loader2 } from "lucide-react";
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
    setTicketPrice(""); setTicketQuantity("100");
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
        // Create via Eventbrite
        const startUtc = new Date(dateTime).toISOString().replace(".000Z", "Z");
        const endUtc = endDateTime
          ? new Date(endDateTime).toISOString().replace(".000Z", "Z")
          : new Date(new Date(dateTime).getTime() + 3 * 60 * 60 * 1000).toISOString().replace(".000Z", "Z");

        const { data, error } = await supabase.functions.invoke("eventbrite-api", {
          body: {
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
          },
        });

        if (error || !data?.success) throw new Error(data?.error || "Eventbrite creation failed");
        toast.success("Event created on Eventbrite & added to your tour dates!");
      } else {
        // Manual add
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

  const handleDelete = async (id: string) => {
    await (supabase as any).from("tour_dates").delete().eq("id", id);
    toast.success("Tour date removed");
    loadDates();
  };

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
              <Switch
                checked={useEventbrite}
                onCheckedChange={handleEventbriteToggle}
                disabled={loadingOrg}
              />
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
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
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
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Ticket Price ($)</Label>
                  <Input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} className="mt-1" placeholder="0 = free" min="0" step="0.01" />
                </div>
                <div>
                  <Label>Total Tickets</Label>
                  <Input type="number" value={ticketQuantity} onChange={(e) => setTicketQuantity(e.target.value)} className="mt-1" placeholder="100" min="1" />
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

        {dates.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No tour dates added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dates.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border/20 hover:bg-muted/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="text-center w-14">
                    <p className="text-lg font-bold">{format(new Date(d.date_time), "dd")}</p>
                    <p className="text-xs text-muted-foreground uppercase">{format(new Date(d.date_time), "MMM")}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{d.venue}</p>
                    <p className="text-sm text-muted-foreground">{d.city}{d.state ? `, ${d.state}` : ""} · {d.country}</p>
                    {d.eventbrite_event_id && (
                      <Badge variant="outline" className="text-xs mt-1 gap-1">
                        <Ticket className="w-3 h-3" /> Eventbrite
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {d.ticket_url && (
                    <Button variant="ghost" size="icon" onClick={() => window.open(d.ticket_url!, "_blank")}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
