import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Percent, Loader2, Plus, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  eventId: string;
  orgId: string;
}

export function DiscountDialog({ eventId, orgId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("");
  const [quantity, setQuantity] = useState("0");

  useEffect(() => {
    if (!open || !orgId) return;
    setLoading(true);
    supabase.functions.invoke("eventbrite-api", {
      body: { action: "list_discounts", organization_id: orgId, event_id: eventId },
    }).then(({ data }) => {
      if (data?.success) setDiscounts(data.data.discounts || []);
      setLoading(false);
    });
  }, [open, orgId, eventId]);

  const handleCreate = async () => {
    if (!code.trim() || !value) { toast.error("Code and value required"); return; }
    setSaving(true);
    try {
      const body: any = {
        action: "create_discount",
        organization_id: orgId,
        code: code.toUpperCase(),
        event_id: eventId,
        quantity_available: parseInt(quantity) || 0,
      };
      if (discountType === "percent") {
        body.percent_off = parseFloat(value);
      } else {
        body.amount_off = `USD,${Math.round(parseFloat(value) * 100)}`;
      }
      const { data, error } = await supabase.functions.invoke("eventbrite-api", { body });
      if (error || !data?.success) throw new Error(data?.error || "Failed");
      toast.success("Discount created");
      setCode(""); setValue(""); setQuantity("0");
      // Reload
      const { data: refreshed } = await supabase.functions.invoke("eventbrite-api", {
        body: { action: "list_discounts", organization_id: orgId, event_id: eventId },
      });
      if (refreshed?.success) setDiscounts(refreshed.data.discounts || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Promo Codes">
          <Percent className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" /> Promo Codes
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {discounts.length > 0 && (
              <div className="space-y-2">
                {discounts.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="font-mono">{d.code}</Badge>
                      <span className="text-muted-foreground">
                        {d.percent_off ? `${d.percent_off}% off` : d.amount_off ? `$${(d.amount_off.value || 0) / 100} off` : ""}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {d.quantity_available > 0 ? `${d.quantity_sold || 0}/${d.quantity_available} used` : "Unlimited"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <h4 className="text-sm font-semibold">Create Promo Code</h4>
              <div>
                <Label>Code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="mt-1 font-mono" placeholder="EARLYBIRD" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent Off</SelectItem>
                      <SelectItem value="amount">Dollar Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{discountType === "percent" ? "Percent" : "Amount ($)"}</Label>
                  <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="mt-1" placeholder={discountType === "percent" ? "20" : "10"} min="0" />
                </div>
              </div>
              <div>
                <Label>Quantity Available <span className="text-xs text-muted-foreground">(0 = unlimited)</span></Label>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1" min="0" />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full gap-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? "Creating..." : "Create Discount"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
