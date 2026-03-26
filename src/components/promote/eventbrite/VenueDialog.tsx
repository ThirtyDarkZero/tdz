import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Loader2, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  orgId: string;
  onVenueSelect?: (venueId: string, venueName: string) => void;
}

export function VenueDialog({ orgId, onVenueSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    if (!open || !orgId) return;
    setLoading(true);
    supabase.functions.invoke("eventbrite-api", {
      body: { action: "list_venues", organization_id: orgId },
    }).then(({ data }) => {
      if (data?.success) setVenues(data.data.venues || []);
      setLoading(false);
    });
  }, [open, orgId]);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Venue name required"); return; }
    setSaving(true);
    try {
      const body: any = {
        action: "create_venue",
        organization_id: orgId,
        name,
        address_1: address,
        city,
        region,
        postal_code: postalCode,
        country,
      };
      if (capacity) body.capacity = parseInt(capacity);
      const { data, error } = await supabase.functions.invoke("eventbrite-api", { body });
      if (error || !data?.success) throw new Error(data?.error || "Failed");
      toast.success("Venue created");
      setShowAdd(false);
      setName(""); setAddress(""); setCity(""); setRegion(""); setPostalCode("");
      // Reload
      const { data: refreshed } = await supabase.functions.invoke("eventbrite-api", {
        body: { action: "list_venues", organization_id: orgId },
      });
      if (refreshed?.success) setVenues(refreshed.data.venues || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <MapPin className="w-3 h-3" /> Select Venue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Venues
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {venues.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => {
                  onVenueSelect?.(v.id, v.name);
                  setOpen(false);
                  toast.success(`Selected: ${v.name}`);
                }}>
                <div>
                  <p className="font-medium text-sm">{v.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.address?.city || ""}{v.address?.region ? `, ${v.address.region}` : ""}
                  </p>
                </div>
                {v.capacity && <Badge variant="outline" className="text-xs">Cap: {v.capacity}</Badge>}
              </div>
            ))}

            <Button variant="outline" onClick={() => setShowAdd(!showAdd)} className="w-full gap-1">
              <Plus className="w-4 h-4" /> Create New Venue
            </Button>

            {showAdd && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <div>
                  <Label>Venue Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Madison Square Garden" />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>State/Region</Label>
                    <Input value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Postal Code</Label>
                    <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Capacity</Label>
                    <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={saving} className="w-full gap-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? "Creating..." : "Create Venue"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
