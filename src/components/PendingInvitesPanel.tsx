import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Clock } from "lucide-react";
import { describePermissions, respondToInvite, type InviteKind } from "@/lib/invites";

interface Invite {
  id: string;
  token: string;
  kind: InviteKind;
  inviter_name: string | null;
  permissions: string[] | Record<string, boolean>;
  message: string | null;
  expires_at: string;
}

/** Invites sent to the signed-in user's email, shown at the top of the Studio. */
export const PendingInvitesPanel = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;
    const { data, error } = await supabase
      .from("collaborator_invites")
      .select("id, token, kind, inviter_name, permissions, message, expires_at")
      .ilike("invited_email", user.email)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error loading invites:", error);
      return;
    }
    setInvites((data ?? []) as unknown as Invite[]);
  };

  useEffect(() => { load(); }, []);

  const respond = async (invite: Invite, accept: boolean) => {
    setProcessing(invite.id);
    try {
      const status = await respondToInvite(invite.token, accept);
      if (status === "accepted") toast.success(invite.kind === "roster" ? "You're on the roster." : "You've joined the team.");
      else if (status === "declined") toast.success("Invite declined.");
      else toast.message(`This invite is ${status}.`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't respond to the invite.");
    } finally {
      setProcessing(null);
    }
  };

  if (invites.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Invitations</h2>
        <Badge variant="default">{invites.length}</Badge>
      </div>
      <div className="grid gap-4">
        {invites.map((invite) => (
          <Card key={invite.id} className="p-6 border-primary/20 space-y-4">
            <div>
              <h3 className="font-semibold text-lg">
                {invite.kind === "roster"
                  ? `${invite.inviter_name ?? "A manager"} wants to add you to their roster`
                  : `${invite.inviter_name ?? "An artist"} invited you to their studio`}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4" /> Expires {new Date(invite.expires_at).toLocaleDateString()}
              </p>
            </div>
            {invite.message && <p className="text-sm italic text-muted-foreground">“{invite.message}”</p>}
            <div className="flex flex-wrap gap-2">
              {describePermissions(invite.kind, invite.permissions).map((p) => (
                <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => respond(invite, true)} disabled={processing === invite.id} className="flex-1">
                {processing === invite.id ? "Working…" : "Accept"}
              </Button>
              <Button variant="outline" onClick={() => respond(invite, false)} disabled={processing === invite.id} className="flex-1">
                Decline
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
