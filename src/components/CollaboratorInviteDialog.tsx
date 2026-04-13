import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Shield, Music, Upload, Trash2, TrendingUp, Album } from "lucide-react";

interface CollaboratorInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSent?: () => void;
}

const PERMISSIONS = [
  { id: "view_tracks", label: "View Tracks", icon: Music, description: "Can view all tracks" },
  { id: "edit_tracks", label: "Edit Tracks", icon: Shield, description: "Can edit track metadata" },
  { id: "upload_tracks", label: "Upload Tracks", icon: Upload, description: "Can upload new tracks" },
  { id: "delete_tracks", label: "Delete Tracks", icon: Trash2, description: "Can delete tracks" },
  { id: "view_analytics", label: "View Analytics", icon: TrendingUp, description: "Can view analytics" },
  { id: "manage_albums", label: "Manage Albums", icon: Album, description: "Can create/edit albums" },
];

export const CollaboratorInviteDialog = ({ open, onOpenChange, onInviteSent }: CollaboratorInviteDialogProps) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["view_tracks"]);
  const [loading, setLoading] = useState(false);

  const togglePermission = (permId: string) => {
    setPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  const handleSendInvite = async () => {
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || permissions.length === 0) {
      toast.error("Email and at least one permission are required");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session expired. Please sign in again.");

      const { error } = await supabase
        .from("collaborator_invites")
        .insert({
          artist_id: user.id,
          invited_email: normalizedEmail,
          permissions: permissions,
          message: message || null,
        });

      if (error) throw error;

      toast.success(`Invitation sent to ${normalizedEmail}`);
      setEmail("");
      setMessage("");
      setPermissions(["view_tracks"]);
      onOpenChange(false);
      onInviteSent?.();
    } catch (error: any) {
      console.error("Error sending invite:", error);
      const message = error?.message?.toLowerCase?.() || "";
      if (message.includes("invalid login credentials") || message.includes("jwt") || message.includes("not authenticated")) {
        toast.error("Your session expired. Please sign in again and retry.");
      } else {
        toast.error(error.message || "Failed to send invitation");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite Collaborator
          </DialogTitle>
          <DialogDescription>
            Send an invitation to collaborate on your music. Invites expire in 7 days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="collaborator@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Hey! I'd love to collaborate with you..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Permissions</Label>
            <div className="grid gap-3">
              {PERMISSIONS.map((perm) => {
                const Icon = perm.icon;
                return (
                  <div
                    key={perm.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <Checkbox
                      id={perm.id}
                      checked={permissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <div className="flex-1 space-y-1">
                      <label
                        htmlFor={perm.id}
                        className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                      >
                        <Icon className="w-4 h-4" />
                        {perm.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSendInvite} disabled={loading || !email || permissions.length === 0}>
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
