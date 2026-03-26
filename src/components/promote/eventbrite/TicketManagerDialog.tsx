import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Ticket, Loader2, Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  eventId: string;
}

export function TicketManagerDialog({ eventId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticketClasses, setTicketClasses] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // New ticket form
  const [name, setName] = useState("General Admission");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("100");
  const [isDonation, setIsDonation] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [salesStart, setSalesStart] = useState("");
  const [salesEnd, setSalesEnd] = useState("");
  const [minQty, setMinQty] = useState("1");
  const [maxQty, setMaxQty] = useState("10");
  const [description, setDescription] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("eventbrite-api", {
        body: { action: "list_ticket_classes", event_id: eventId },
      });
      if (data?.success) setTicketClasses(data.data.ticket_classes || []);
    } catch (err) {}
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (open) loadTickets();
  }, [open, loadTickets]);

  const handleAddTicket = async () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      const body: any = {
        action: "create_ticket_class",
        event_id: eventId,
        name,
        quantity_total: parseInt(qty) || 100,
        donation: isDonation,
        hidden: isHidden,
        minimum_quantity: parseInt(minQty) || 1,
        maximum_quantity: parseInt(maxQty) || 10,
      };
      if (price && parseFloat(price) > 0 && !isDonation) {
        body.price = parseFloat(price);
      }
      if (description) body.description = description;
      if (salesStart) body.sales_start = new Date(salesStart).toISOString().replace(".000Z", "Z");
      if (salesEnd) body.sales_end = new Date(salesEnd).toISOString().replace(".000Z", "Z");

      const { data, error } = await supabase.functions.invoke("eventbrite-api", { body });
      if (error || !data?.success) throw new Error(data?.error || "Failed");
      toast.success("Ticket class created");
      setShowAdd(false);
      setName("General Admission"); setPrice(""); setQty("100"); setIsDonation(false);
      setIsHidden(false); setSalesStart(""); setSalesEnd(""); setDescription("");
      loadTickets();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tcId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("eventbrite-api", {
        body: { action: "delete_ticket_class", event_id: eventId, ticket_class_id: tcId },
      });
      if (error || !data?.success) throw new Error(data?.error || "Failed");
      toast.success("Ticket class deleted");
      loadTickets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Manage Tickets">
          <Ticket className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" /> Ticket Classes
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {ticketClasses.map((tc: any) => (
              <div key={tc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20">
                <div>
                  <p className="font-medium text-sm">{tc.name}</p>
                  <div className="flex gap-1 mt-1">
                    {tc.free ? (
                      <Badge variant="outline" className="text-xs">Free</Badge>
                    ) : tc.donation ? (
                      <Badge variant="secondary" className="text-xs">Donation</Badge>
                    ) : (
                      <Badge className="text-xs">{tc.cost?.display || "Paid"}</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {tc.quantity_sold || 0}/{tc.quantity_total} sold
                    </Badge>
                    {tc.hidden && <Badge variant="destructive" className="text-xs">Hidden</Badge>}
                    {tc.on_sale_status && (
                      <Badge variant={tc.on_sale_status === "AVAILABLE" ? "default" : "outline"} className="text-xs">
                        {tc.on_sale_status}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(tc.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}

            <Button variant="outline" onClick={() => setShowAdd(!showAdd)} className="w-full gap-1">
              <Plus className="w-4 h-4" /> Add Ticket Class
            </Button>

            {showAdd && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Price ($) <span className="text-xs text-muted-foreground">(0=free)</span></Label>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1" min="0" step="0.01" disabled={isDonation} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Quantity</Label>
                    <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1" min="1" />
                  </div>
                  <div>
                    <Label>Min/Order</Label>
                    <Input type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} className="mt-1" min="1" />
                  </div>
                  <div>
                    <Label>Max/Order</Label>
                    <Input type="number" value={maxQty} onChange={(e) => setMaxQty(e.target.value)} className="mt-1" min="1" />
                  </div>
                </div>
                <div>
                  <Label>Description <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" placeholder="What's included..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Sales Start</Label>
                    <Input type="datetime-local" value={salesStart} onChange={(e) => setSalesStart(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Sales End</Label>
                    <Input type="datetime-local" value={salesEnd} onChange={(e) => setSalesEnd(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={isDonation} onCheckedChange={setIsDonation} />
                    <Label className="text-sm">Donation</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isHidden} onCheckedChange={setIsHidden} />
                    <Label className="text-sm">Hidden</Label>
                  </div>
                </div>
                <Button onClick={handleAddTicket} disabled={saving} className="w-full gap-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? "Creating..." : "Create Ticket Class"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
