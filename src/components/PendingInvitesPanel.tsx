import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, CheckCircle, XCircle, Clock, Music, Shield, Upload, Trash2, TrendingUp, Album } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Invite {
  id: string;
  artist_id: string;
  invited_email: string;
  status: string;
  permissions: string[];
  message: string | null;
  expires_at: string;
  created_at: string;
}

const PERMISSION_ICONS: Record<string, any> = {
  view_tracks: Music,
  edit_tracks: Shield,
  upload_tracks: Upload,
  delete_tracks: Trash2,
  view_analytics: TrendingUp,
  manage_albums: Album,
};

export const PendingInvitesPanel = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadInvites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("collaborator_invites")
        .select("*")
        .eq("invited_email", user.email?.toLowerCase() || "")
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInvites((data || []) as Invite[]);
    } catch (error: any) {
      console.error("Error loading invites:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("invite_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "collaborator_invites",
        },
        () => {
          loadInvites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAccept = async (invite: Invite) => {
    setProcessing(invite.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create collaborator relationship
      const { error: collabError } = await supabase
        .from("artist_collaborators")
        .insert({
          artist_id: invite.artist_id,
          collaborator_id: user.id,
          permissions: invite.permissions,
          invite_id: invite.id,
        });

      if (collabError) throw collabError;

      // Update invite status
      const { error: updateError } = await supabase
        .from("collaborator_invites")
        .update({ status: "accepted" })
        .eq("id", invite.id);

      if (updateError) throw updateError;

      toast.success("Invitation accepted! You now have access to the artist's studio.");
      loadInvites();
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      toast.error(error.message || "Failed to accept invitation");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (inviteId: string) => {
    setProcessing(inviteId);
    try {
      const { error } = await supabase
        .from("collaborator_invites")
        .update({ status: "rejected" })
        .eq("id", inviteId);

      if (error) throw error;

      toast.success("Invitation declined");
      loadInvites();
    } catch (error: any) {
      console.error("Error rejecting invite:", error);
      toast.error("Failed to decline invitation");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return null;
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Collaboration Invitations</h2>
        <Badge variant="default">{invites.length}</Badge>
      </div>

      <div className="grid gap-4">
        {invites.map((invite) => (
          <Card key={invite.id} className="p-6 border-primary/20">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Collaboration Invitation</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {invite.message && (
                <Alert>
                  <AlertDescription>{invite.message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">You'll have access to:</p>
                <div className="flex flex-wrap gap-2">
                  {invite.permissions.map((perm) => {
                    const Icon = PERMISSION_ICONS[perm] || Shield;
                    return (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        <Icon className="w-3 h-3 mr-1" />
                        {perm.replace(/_/g, " ")}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleAccept(invite)}
                  disabled={processing === invite.id}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {processing === invite.id ? "Accepting..." : "Accept"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReject(invite.id)}
                  disabled={processing === invite.id}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
