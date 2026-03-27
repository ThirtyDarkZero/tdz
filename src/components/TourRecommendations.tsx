import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, Users, TrendingUp, Star, Ticket, Loader2, Plus, Sparkles, Save, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useArtistNarrativeContext, serializeNarrativeContext } from "@/hooks/useArtistNarrativeContext";

export const TourRecommendations = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingRec, setBookingRec] = useState<any | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [aiStrategy, setAiStrategy] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [savingStrategy, setSavingStrategy] = useState(false);

  const ctx = useArtistNarrativeContext();

  const [eventName, setEventName] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [ticketPrice, setTicketPrice] = useState("0");
  const [ticketQty, setTicketQty] = useState("100");

  useEffect(() => { loadRecommendations(); }, []);

  const loadRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("tour_recommendations").select("*").eq("user_id", user.id).order("match_score", { ascending: false });
      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally { setLoading(false); }
  };

  const ensureOrg = async () => {
    if (orgId) return orgId;
    try {
      const { data, error } = await supabase.functions.invoke("eventbrite-api", { body: { action: "get_organizations" } });
      if (error) throw error;
      const orgs = data?.data?.organizations;
      if (orgs?.[0]?.id) { setOrgId(orgs[0].id); return orgs[0].id; }
    } catch {}
    return null;
  };

  const openBooking = async (rec: any) => {
    setBookingRec(rec);
    setEventName(`Live at ${rec.venues?.[0] || rec.city}`);
    setEventDesc(`Don't miss this show in ${rec.city}!`);
    setTicketPrice("0"); setTicketQty("100"); setDateTime(""); setEndDateTime("");
    await ensureOrg();
  };

  const handleCreateEvent = async () => {
    if (!dateTime) { toast.error("Pick a date"); return; }
    const org = orgId || await ensureOrg();
    if (!org) { toast.error("Eventbrite not connected. Set your EVENTBRITE_API_TOKEN in settings."); return; }
    setCreating(true);
    try {
      const startUtc = new Date(dateTime).toISOString().replace(".000Z", "Z");
      const endUtc = endDateTime
        ? new Date(endDateTime).toISOString().replace(".000Z", "Z")
        : new Date(new Date(dateTime).getTime() + 3 * 60 * 60 * 1000).toISOString().replace(".000Z", "Z");
      const { data, error } = await supabase.functions.invoke("eventbrite-api", {
        body: { action: "create_event", organization_id: org, name: eventName, description: eventDesc, start_utc: startUtc, end_utc: endUtc, venue_name: bookingRec?.venues?.[0] || "TBA", city: bookingRec?.city || "", ticket_name: "General Admission", ticket_price: parseFloat(ticketPrice) || 0, ticket_quantity: parseInt(ticketQty) || 100, publish: true },
      });
      if (error || !data?.success) throw new Error(data?.error || "Failed");
      toast.success("Event created on Eventbrite! Tickets are live.");
      setBookingRec(null);
    } catch (err: any) { toast.error(err.message); }
    finally { setCreating(false); }
  };

  const saveStrategy = async (content: string) => {
    setSavingStrategy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await (supabase as any).from("saved_strategies").insert({
        user_id: user.id, strategy_type: "Tour Strategy",
        title: `Tour Strategy - ${new Date().toLocaleDateString()}`,
        content, metadata: { recommendations_count: recommendations.length }
      });
      if (error) throw error;
      toast.success("Tour strategy saved!");
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingStrategy(false); }
  };

  const exportStrategy = (content: string) => {
    const blob = new Blob([`# Tour Strategy Report\nGenerated: ${new Date().toLocaleString()}\nRecommendations: ${recommendations.length}\n\n---\n\n${content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `tour-strategy-${new Date().toISOString().split("T")[0]}.md`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Tour strategy exported!");
  };

  const generateAIStrategy = async () => {
    setAiLoading(true); setAiStrategy(null);
    try {
      const serialized = serializeNarrativeContext(ctx);
      const recsData = recommendations.length > 0
        ? `\nEXISTING RECOMMENDATIONS:\n${recommendations.map(r => `- ${r.city}: ${r.match_score}% match, ${r.audience_size} audience, best month: ${r.best_month}, venues: ${(r.venues || []).join(", ")}`).join("\n")}`
        : "\nNo existing tour recommendations yet.";
      const { data, error } = await supabase.functions.invoke("campaign-brain", {
        body: {
          action: "generate-content", narrative_context: serialized,
          content_type: "tour-promo", release_phase: ctx.releaseCycle.phase,
          extra_context: `Create a comprehensive tour strategy:\n${recsData}\n\nProvide 5-6 paragraphs covering: readiness assessment, market prioritization, timing vs release cycle, revenue strategy, promotion plan, routing.`,
        },
      });
      if (error) throw error;
      setAiStrategy(typeof data?.result === "string" ? data.result : JSON.stringify(data?.result));
    } catch (err: any) { toast.error(err.message || "Failed to generate strategy"); }
    finally { setAiLoading(false); }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center bg-card/50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p style={{ fontFamily: "'Raleway', sans-serif" }} className="text-muted-foreground">Loading recommendations...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="w-6 h-6" style={{ color: "#00CFFF" }} />
        <div>
          <h2 style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em", fontSize: "1.75rem" }}>
            Tour Intelligence
          </h2>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: "0.8rem" }} className="text-muted-foreground">
            AI-powered tour strategy — powered by your story, metrics, and fan demographics
          </p>
        </div>
        <Badge variant="outline" className="ml-auto gap-1 text-xs border-primary/30 text-primary">
          <Sparkles className="w-3 h-3" /> AI Powered
        </Badge>
      </div>

      {/* AI Tour Strategy */}
      <Card className="bg-card/50 border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
            <Sparkles className="w-5 h-5 text-primary" /> AI Tour Strategist
          </CardTitle>
          <CardDescription style={{ fontFamily: "'Raleway', sans-serif" }}>
            Get a booking-agent-level tour strategy based on your full artist context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={generateAIStrategy} disabled={aiLoading} className="w-full gap-2">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {aiLoading ? "Building tour strategy..." : "Generate AI Tour Strategy"}
          </Button>
          {aiLoading && <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-4 rounded bg-muted/30 animate-pulse" style={{ width: `${100 - i * 10}%` }} />)}</div>}
          {aiStrategy && (
            <Card className="p-5 bg-card/80 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary" style={{ fontFamily: "'Raleway', sans-serif" }}>AI Tour Strategy Report</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => saveStrategy(aiStrategy)} disabled={savingStrategy}>
                    <Save className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => exportStrategy(aiStrategy)}>
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90" style={{ fontFamily: "'Raleway', sans-serif" }}>{aiStrategy}</div>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Venue Recommendations */}
      {recommendations.length === 0 ? (
        <Card className="p-12 text-center bg-card/50">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>No Venue Recommendations Yet</h3>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>
            Recommendations are generated from your listener data. Promote your music to unlock personalized venue suggestions!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((rec, idx) => (
            <Card key={idx} className="p-6 bg-card/50 border-border/30 hover:border-primary/60 transition-all group cursor-pointer">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2 group-hover:text-primary transition-colors" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
                        <MapPin className="w-5 h-5 text-primary" /> {rec.city}
                        <Badge className="bg-primary/20 text-primary border-primary/30"><Star className="w-3 h-3 mr-1" /> {rec.match_score}% Match</Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "'Raleway', sans-serif" }}>{rec.reason}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-accent/10"><Users className="w-4 h-4 text-primary" /><span className="font-medium" style={{ fontFamily: "'Raleway', sans-serif" }}>{rec.audience_size}</span></div>
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-accent/10"><Calendar className="w-4 h-4 text-primary" /><span className="font-medium" style={{ fontFamily: "'Raleway', sans-serif" }}>{rec.best_month}</span></div>
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-accent/10"><MapPin className="w-4 h-4 text-primary" /><span className="font-medium" style={{ fontFamily: "'Raleway', sans-serif" }}>{(rec.venues || []).length} venues</span></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(rec.venues || []).map((venue: string, vidx: number) => (
                      <Badge key={vidx} variant="outline" className="text-xs" style={{ fontFamily: "'Raleway', sans-serif" }}>{venue}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => openBooking(rec)} className="gap-2"><Ticket className="w-4 h-4" /> Book & Sell Tickets</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={!!bookingRec} onOpenChange={(o) => !o && setBookingRec(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
              <Ticket className="w-5 h-5 text-primary" /> Create Eventbrite Event — {bookingRec?.city}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label style={{ fontFamily: "'Raleway', sans-serif" }}>Event Name</Label><Input value={eventName} onChange={(e) => setEventName(e.target.value)} className="mt-1" /></div>
            <div><Label style={{ fontFamily: "'Raleway', sans-serif" }}>Description</Label><Textarea value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} className="mt-1" rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label style={{ fontFamily: "'Raleway', sans-serif" }}>Start *</Label><Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className="mt-1" /></div>
              <div><Label style={{ fontFamily: "'Raleway', sans-serif" }}>End</Label><Input type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label style={{ fontFamily: "'Raleway', sans-serif" }}>Ticket Price ($)</Label><Input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} className="mt-1" min="0" step="0.01" placeholder="0 = free" /></div>
              <div><Label style={{ fontFamily: "'Raleway', sans-serif" }}>Tickets Available</Label><Input type="number" value={ticketQty} onChange={(e) => setTicketQty(e.target.value)} className="mt-1" min="1" /></div>
            </div>
            {!orgId && <p className="text-sm text-destructive" style={{ fontFamily: "'Raleway', sans-serif" }}>⚠ Eventbrite not connected. Make sure your EVENTBRITE_API_TOKEN is set in backend secrets.</p>}
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
