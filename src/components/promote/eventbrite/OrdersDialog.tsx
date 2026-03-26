import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Loader2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  eventId: string;
}

export function OrdersDialog({ eventId }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all_not_deleted");

  useEffect(() => {
    if (!open || !eventId) return;
    setLoading(true);
    supabase.functions.invoke("eventbrite-api", {
      body: { action: "list_orders", event_id: eventId, status: statusFilter },
    }).then(({ data, error }) => {
      if (!error && data?.success) {
        setOrders(data.data.orders || []);
      } else {
        toast.error(data?.error || "Failed to load orders");
      }
      setLoading(false);
    });
  }, [open, eventId, statusFilter]);

  const totalGross = orders.reduce((sum, o) => sum + (o.costs?.gross?.value || 0), 0) / 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="View Orders">
          <ShoppingCart className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" /> Orders
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_not_deleted">All Active</SelectItem>
              <SelectItem value="active">With Attendees</SelectItem>
              <SelectItem value="inactive">No Attendees</SelectItem>
              <SelectItem value="both">All (inc. deleted)</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm font-medium">
            <DollarSign className="w-4 h-4 text-primary" />
            Total: ${totalGross.toFixed(2)}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No orders found</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{o.name || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{o.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {o.created && format(new Date(o.created), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <Badge variant={o.status === "placed" ? "default" : "outline"} className="text-xs">
                    {o.status}
                  </Badge>
                  <span className="text-sm font-mono">
                    {o.costs?.gross?.display || "$0.00"}
                  </span>
                  {o.attendees && (
                    <span className="text-xs text-muted-foreground">
                      {o.attendees.length} ticket{o.attendees.length !== 1 ? "s" : ""}
                    </span>
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
