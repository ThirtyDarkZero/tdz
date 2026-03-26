import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, Users, TrendingUp, Star, Ticket, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TourRecommendations = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingRec, setBookingRec] = useState<any | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Booking form
  const [eventName, setEventName] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [ticketPrice, setTicketPrice] = useState("0");
  const [ticketQty, setTicketQty] = useState("100");

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("tour_recommendations")
        .select("*")
        .eq("user_id", user.id)
        .order("match_score", { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const ensureOrg = async () => {
    if (orgId) return orgId;
    try {
      const { data, error } = await supabase.functions.invoke("eventbrite-api", {
        body: { action: "get_organizations" },
      });
      if (error) throw error;
      const orgs = data?.data?.organizations;
      if (orgs?.[0]?.id) {
        setOrgId(orgs[0].id);
        return orgs[0].id;
      }
    } catch {}
    return null;
  };

  const openBooking = async (rec: any) => {
    setBookingRec(rec);
    setEventName(`Live at ${rec.venues?.[0] || rec.city}`);
    setEventDesc(`Don't miss this show in ${rec.city}!`);
    setTicketPrice("0");
    setTicketQty("100");
    setDateTime("");
    setEndDateTime("");
    await ensureOrg();
  };

  const handleCreateEvent = async () => {
    if (!dateTime) { toast.error("Pick a date"); return; }
    const org = orgId || await ensureOrg();
    if (!org) { toast.error("Eventbrite not connected"); return; }

    setCreating(true);
    try {
      const startUtc = new Date(dateTime).toISOString().replace(".000Z", "Z");
      const endUtc = endDateTime
        ? new Date(endDateTime).toISOString().replace(".000Z", "Z")
        : new Date(new Date(dateTime).getTime() + 3 * 60 * 60 * 1000).toISOString().replace(".000Z", "Z");

      const { data, error } = await supabase.functions.invoke("eventbrite-api", {
        body: {
          action: "create_event",
          organization_id: org,
          name: eventName,
          description: eventDesc,
          start_utc: startUtc,
          end_utc: endUtc,
          venue_name: bookingRec?.venues?.[0] || "TBA",
          city: bookingRec?.city || "",
          ticket_name: "General Admission",
          ticket_price: parseFloat(ticketPrice) || 0,
          ticket_quantity: parseInt(ticketQty) || 100,
          publish: true,
        },
      });

      if (error || !data?.success) throw new Error(data?.error || "Failed");
      toast.success("Event created on Eventbrite! Tickets are live.");
      setBookingRec(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading recommendations...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Tour Recommendations</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered venue suggestions — book directly via Eventbrite
          </p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tour recommendations are generated based on your listener data. Upload and promote your music to get personalized venue suggestions!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((rec, idx) => (
          <Card 
            key={idx} 
            className="glass-card p-6 hover:border-primary/60 hover:scale-102 transition-all group cursor-pointer animate-fade-in"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                      <MapPin className="w-5 h-5 text-primary group-hover:scale-125 transition-transform" />
                      {rec.city}
                      <Badge className="bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-primary/30">
                        <Star className="w-3 h-3 mr-1" />
                        {rec.match_score}% Match
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-accent/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{rec.audience_size}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-accent/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{rec.best_month}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-accent/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{(rec.venues || []).length} venues</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(rec.venues || []).map((venue: string, vidx: number) => (
                    <Badge key={vidx} variant="outline" className="text-xs">
                      {venue}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => openBooking(rec)}
                  className="bg-gradient-to-r from-primary to-secondary shadow-lg gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  Book & Sell Tickets
                </Button>
                <Button variant="outline" size="sm" className="group-hover:border-primary group-hover:text-primary transition-colors">
                  View Details
                </Button>
              </div>
            </div>
          </Card>
          ))}
        </div>
      )}

      <Card className="glass-card p-6 bg-accent/10 border-accent/20">
        <div className="flex gap-3">
          <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold mb-2">Pro Tip</h4>
            <p className="text-sm text-muted-foreground">
              Plan your tour 3-4 months in advance for better venue availability. 
              Click "Book & Sell Tickets" to create an Eventbrite event instantly.
            </p>
          </div>
        </div>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={!!bookingRec} onOpenChange={(o) => !o && setBookingRec(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Create Eventbrite Event — {bookingRec?.city}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Event Name</Label>
              <Input value={eventName} onChange={(e) => setEventName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date & Time *</Label>
                <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>End Date & Time</Label>
                <Input type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ticket Price ($)</Label>
                <Input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} className="mt-1" min="0" step="0.01" placeholder="0 = free" />
              </div>
              <div>
                <Label>Tickets Available</Label>
                <Input type="number" value={ticketQty} onChange={(e) => setTicketQty(e.target.value)} className="mt-1" min="1" />
              </div>
            </div>
            {!orgId && (
              <p className="text-sm text-destructive">⚠ Eventbrite not connected. Make sure your API token is set.</p>
            )}
            <Button onClick={handleCreateEvent} disabled={creating || !orgId} className="w-full gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? "Creating..." : "Create Event & Sell Tickets"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
