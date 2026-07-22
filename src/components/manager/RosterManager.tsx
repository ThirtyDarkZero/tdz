import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useActingArtist } from "@/contexts/ActingArtistContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Trash2, ExternalLink, Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RosterRow {
  id: string;
  artist_id: string;
  commission_rate: number | null;
  artist_name?: string;
  profile_image?: string | null;
}

export function RosterManager() {
  const { user } = useAuthContext();
  const { setActingArtist, refresh: refreshActing } = useActingArtist();
  const navigate = useNavigate();
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("manager_artists")
      .select("id, artist_id, commission_rate")
      .eq("manager_id", user.id);

    if (error) {
      toast.error("Failed to load roster", { description: error.message });
      setLoading(false);
      return;
    }

    const rows = data || [];
    const artistIds = rows.map((r) => r.artist_id);
    let profiles: any[] = [];
    if (artistIds.length > 0) {
      const { data: p } = await supabase
        .from("artist_profiles")
        .select("user_id, artist_name, profile_image_path")
        .in("user_id", artistIds);
      profiles = p || [];
    }

    setRoster(
      rows.map((r) => {
        const p = profiles.find((x) => x.user_id === r.artist_id);
        return {
          ...r,
          artist_name: p?.artist_name || "Unnamed artist",
          profile_image: p?.profile_image_path,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleInvite = async () => {
    if (!user || !inviteEmail.trim()) return;
    setInviting(true);
    const { error } = await supabase.from("collaborator_invites").insert({
      artist_id: user.id,
      invited_email: inviteEmail.trim().toLowerCase(),
      status: "pending",
      permissions: { manager: true, upload: true, analytics: true },
    } as any);
    setInviting(false);
    if (error) {
      toast.error("Invite failed", { description: error.message });
      return;
    }
    toast.success("Invite sent");
    setInviteEmail("");
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("manager_artists").delete().eq("id", id);
    if (error) {
      toast.error("Remove failed", { description: error.message });
      return;
    }
    toast.success("Artist removed from roster");
    load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 glass-card">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Invite an artist</h3>
        </div>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="artist@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send invite"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          They'll accept and appear in your roster below. You can then release music and view analytics on their behalf.
        </p>
      </Card>

      <Card className="p-5 glass-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Your roster</h3>
          <Badge variant="outline">{roster.length} artist{roster.length === 1 ? "" : "s"}</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : roster.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No artists yet. Invite one above to start managing your roster.
          </p>
        ) : (
          <div className="space-y-2">
            {roster.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                  {r.artist_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.artist_name}</div>
                  {r.commission_rate != null && (
                    <div className="text-xs text-muted-foreground">
                      Commission: {(Number(r.commission_rate) * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    await refreshActing();
                    setActingArtist(r.artist_id);
                    toast.success(`Studio switched — releasing as ${r.artist_name}`);
                    navigate(`/studio?as=${r.artist_id}`);
                  }}
                >
                  <Upload className="w-3 h-3 mr-1" /> Release as
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/artist/${r.artist_id}`)}
                >
                  <ExternalLink className="w-3 h-3 mr-1" /> View
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleRemove(r.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
