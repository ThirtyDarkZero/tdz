import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Ticket, Plus } from "lucide-react";
import { toast } from "sonner";

export const MerchAndTickets = () => {
  const [items] = useState([
    { id: 1, type: "merch", name: "Tour T-Shirt", price: 35, image: null },
    { id: 2, type: "ticket", name: "VIP Meet & Greet", price: 150, image: null },
  ]);

  const handleAddMerch = () => {
    toast.info("Stripe integration required for merch sales. Coming soon!");
  };

  const handleAddTicket = () => {
    toast.info("Stripe integration required for ticket sales. Coming soon!");
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
                  <Badge>Coming Soon</Badge>
                </div>
              ))}
            </div>
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
                  <Badge>Coming Soon</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
