import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Calendar, Trash2, ExternalLink } from "lucide-react";
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
  status: string;
}

export function TourDatesManager() {
  const { user } = useAuth();
  const [dates, setDates] = useState<TourDate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("US");
  const [dateTime, setDateTime] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) loadDates(); }, [user]);

  const loadDates = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tour_dates")
      .select("*")
      .eq("artist_id", user.id)
      .order("date_time", { ascending: true });
    setDates((data as TourDate[]) || []);
  };

  const handleAdd = async () => {
    if (!user || !venue || !city || !dateTime) { toast.error("Venue, city, and date are required"); return; }
    setSaving(true);
    const { error } = await supabase.from("tour_dates").insert({
      artist_id: user.id,
      venue, city,
      state: state || null,
      country,
      date_time: new Date(dateTime).toISOString(),
      ticket_url: ticketUrl || null,
      status: "confirmed",
    } as any);
    if (error) toast.error("Failed to add date");
    else {
      toast.success("Tour date added");
      setShowForm(false);
      setVenue(""); setCity(""); setState(""); setDateTime(""); setTicketUrl("");
      loadDates();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("tour_dates").delete().eq("id", id);
    toast.success("Tour date removed");
    loadDates();
  };

  return (
    <Card style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <MapPin className="w-5 h-5" /> Tour Dates
            </CardTitle>
            <CardDescription>Manage your upcoming shows</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
            <Plus className="w-3 h-3" /> Add Date
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 rounded-xl bg-muted/20 border border-border/20 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Venue</Label><Input value={venue} onChange={(e) => setVenue(e.target.value)} className="mt-1" placeholder="The Roxy" /></div>
              <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" placeholder="Los Angeles" /></div>
              <div><Label>State</Label><Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1" placeholder="CA" /></div>
              <div><Label>Country</Label>
                <Select value={country} onValueChange={setCountry}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem><SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem><SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date & Time</Label><Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className="mt-1" /></div>
              <div><Label>Ticket URL</Label><Input value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} className="mt-1" placeholder="https://..." /></div>
            </div>
            <Button onClick={handleAdd} disabled={saving}>{saving ? "Saving..." : "Add Tour Date"}</Button>
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
