import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Ticket, Plus } from "lucide-react";
import { toast } from "sonner";

export const MerchAndTickets = () => {
  const [items] = useState<any[]>([]);

  const handleAddMerch = () => {
    toast.info("Merch Store", {
      description: "Connect your Stripe account to start selling merchandise directly to fans!"
    });
  };

  const handleAddTicket = () => {
    toast.info("Event Ticketing", {
      description: "Connect your Stripe account to sell tickets and manage event attendance!"
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card-premium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <CardTitle>Merchandise</CardTitle>
              </div>
              <Button onClick={handleAddMerch}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
            <CardDescription>Sell your merch directly to fans</CardDescription>
          </CardHeader>
          <CardContent>
            {items.filter(i => i.type === "merch").length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  No merchandise yet. Start selling your merch directly to fans!
                </p>
                <Button onClick={handleAddMerch} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.filter(i => i.type === "merch").map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="text-2xl font-bold text-primary">${item.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card-premium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                <CardTitle>Concert Tickets</CardTitle>
              </div>
              <Button onClick={handleAddTicket}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>
            <CardDescription>Sell tickets to your shows</CardDescription>
          </CardHeader>
          <CardContent>
            {items.filter(i => i.type === "ticket").length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  No events yet. Start selling tickets to your shows!
                </p>
                <Button onClick={handleAddTicket} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.filter(i => i.type === "ticket").map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                        <Ticket className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="text-2xl font-bold text-primary">${item.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
