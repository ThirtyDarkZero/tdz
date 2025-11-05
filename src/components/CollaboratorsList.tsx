import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, UserMinus, Mail, Clock, CheckCircle, XCircle, Music, Shield, Upload, Trash2, TrendingUp, Album } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Collaborator {
  id: string;
  collaborator_id: string;
  permissions: string[];
  created_at: string;
  collaborator_email?: string;
  collaborator_name?: string;
}

interface Invite {
  id: string;
  invited_email: string;
  status: string;
  permissions: string[];
  created_at: string;
  expires_at: string;
}

const PERMISSION_ICONS: Record<string, any> = {
  view_tracks: Music,
  edit_tracks: Shield,
  upload_tracks: Upload,
  delete_tracks: Trash2,
  view_analytics: TrendingUp,
  manage_albums: Album,
};

export const CollaboratorsList = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load collaborators
      const { data: collabData, error: collabError } = await supabase
        .from("artist_collaborators")
        .select("*")
        .eq("artist_id", user.id);

      if (collabError) throw collabError;

      // Load invites
      const { data: inviteData, error: inviteError } = await supabase
        .from("collaborator_invites")
        .select("*")
        .eq("artist_id", user.id)
        .order("created_at", { ascending: false });

      if (inviteError) throw inviteError;

      setCollaborators((collabData || []) as Collaborator[]);
      setInvites((inviteData || []) as Invite[]);
    } catch (error: any) {
      console.error("Error loading collaborators:", error);
      toast.error("Failed to load collaborators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const removeCollaborator = async (collabId: string) => {
    try {
      const { error } = await supabase
        .from("artist_collaborators")
        .delete()
        .eq("id", collabId);

      if (error) throw error;

      toast.success("Collaborator removed");
      loadData();
    } catch (error: any) {
      console.error("Error removing collaborator:", error);
      toast.error("Failed to remove collaborator");
    }
  };

  const cancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("collaborator_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;

      toast.success("Invitation cancelled");
      loadData();
    } catch (error: any) {
      console.error("Error cancelling invite:", error);
      toast.error("Failed to cancel invitation");
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-muted-foreground">Loading collaborators...</div>;
  }

  const pendingInvites = invites.filter(i => i.status === 'pending');
  const acceptedInvites = invites.filter(i => i.status === 'accepted');

  return (
    <div className="space-y-6">
      {/* Active Collaborators */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Active Collaborators</h3>
          <Badge variant="secondary">{collaborators.length}</Badge>
        </div>

        {collaborators.length === 0 ? (
          <Alert>
            <AlertDescription>
              No active collaborators yet. Send an invitation to start collaborating!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-3">
            {collaborators.map((collab) => (
              <Card key={collab.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar>
                      <AvatarFallback>
                        {collab.collaborator_email?.[0]?.toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{collab.collaborator_email || "Collaborator"}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {collab.permissions.map((perm) => {
                          const Icon = PERMISSION_ICONS[perm] || Shield;
                          return (
                            <Badge key={perm} variant="outline" className="text-xs">
                              <Icon className="w-3 h-3 mr-1" />
                              {perm.replace(/_/g, " ")}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCollaborator(collab.id)}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Pending Invitations</h3>
            <Badge variant="secondary">{pendingInvites.length}</Badge>
          </div>

          <div className="grid gap-3">
            {pendingInvites.map((invite) => (
              <Card key={invite.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{invite.invited_email}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {invite.permissions.map((perm) => {
                          const Icon = PERMISSION_ICONS[perm] || Shield;
                          return (
                            <Badge key={perm} variant="outline" className="text-xs">
                              <Icon className="w-3 h-3 mr-1" />
                              {perm.replace(/_/g, " ")}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancelInvite(invite.id)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent History */}
      {acceptedInvites.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {acceptedInvites.slice(0, 3).map((invite) => (
              <div key={invite.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{invite.invited_email} accepted invitation</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
