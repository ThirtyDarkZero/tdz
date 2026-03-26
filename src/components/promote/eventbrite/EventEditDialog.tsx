import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  eventId: string;
  onUpdated?: () => void;
}

export function EventEditDialog({ eventId, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [listed, setListed] = useState(true);
  const [showRemaining, setShowRemaining] = useState(false);
  const [inviteOnly, setInviteOnly] = useState(false);
  const [password, setPassword] = useState("");

  const loadEvent = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("eventbrite-api", {
        body: { action: "get_event", event_id: eventId },
      });
      if (error || !data?.success) throw new Error(data?.error || "Failed to load");
      const e = data.data;
      setName(e.name?.text || e.name?.html || "");
      setSummary(e.summary || "");
      setDescription(e.description?.text || e.description?.html || "");
      setCapacity(e.capacity?.toString() || "");
      setListed(e.listed ?? true);
      setShowRemaining(e.show_remaining ?? false);
      setInviteOnly(e.invite_only ?? false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (open) loadEvent();
  }, [open, loadEvent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: any = {
        action: "update_event",
        event_id: eventId,
        name,
        listed,
        show_remaining: showRemaining,
        invite_only: inviteOnly,
      };
      if (summary) body.summary = summary;
      if (description) body.description = description;
      if (capacity) body.capacity = parseInt(capacity);
      if (password) body.password = password;

      const { data, error } = await supabase.functions.invoke("eventbrite-api", { body });
      if (error || !data?.success) throw new Error(data?.error || "Update failed");
      toast.success("Event updated");
      setOpen(false);
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Edit Event">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" /> Edit Event
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Event Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Summary <span className="text-xs text-muted-foreground">(max 140 chars)</span></Label>
              <Input value={summary} onChange={(e) => setSummary(e.target.value.slice(0, 140))} className="mt-1" placeholder="Brief event summary" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Capacity</Label>
                <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1" min="1" />
              </div>
              <div>
                <Label>Password <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" placeholder="Leave empty for no password" />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>Publicly listed</Label>
                <Switch checked={listed} onCheckedChange={setListed} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Show remaining tickets</Label>
                <Switch checked={showRemaining} onCheckedChange={setShowRemaining} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Invite only</Label>
                <Switch checked={inviteOnly} onCheckedChange={setInviteOnly} />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
