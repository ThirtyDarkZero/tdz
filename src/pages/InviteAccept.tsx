import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { describePermissions, getInvite, respondToInvite, type InvitePreview } from "@/lib/invites";
import { toast } from "sonner";

/** /invite/:token — the link in a team or roster invite email. */
export default function InviteAccept() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { user, authState } = useAuthContext();
  const [invite, setInvite] = useState<InvitePreview | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInvite(token).then(setInvite).catch(() => setInvite(null));
  }, [token]);

  const here = `/invite/${token}`;
  const signedInAs = user?.email?.toLowerCase();
  const wrongAccount = invite && signedInAs && signedInAs !== invite.invited_email.toLowerCase();

  const respond = async (accept: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const status = await respondToInvite(token, accept);
      if (status === "accepted") {
        toast.success(invite?.kind === "roster" ? "You're on the roster." : "You've joined the team.");
        navigate("/studio");
      } else if (status === "declined") {
        toast.success("Invite declined.");
        setInvite((i) => (i ? { ...i, status } : i));
      } else {
        setInvite((i) => (i ? { ...i, status } : i));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  let body: React.ReactNode;
  if (invite === undefined || authState === "loading") {
    body = <Loader2 className="w-6 h-6 animate-spin mx-auto" aria-label="Loading invite" />;
  } else if (!invite) {
    body = (
      <>
        <h1 className="text-2xl font-semibold">This invite link isn't valid</h1>
        <p className="text-muted-foreground mt-2">Ask the person who invited you to send a new one.</p>
      </>
    );
  } else if (invite.status !== "pending") {
    const msg: Record<string, string> = {
      accepted: "This invite has already been accepted.",
      declined: "This invite was declined.",
      expired: "This invite has expired. Ask for a new one.",
      revoked: "This invite was withdrawn.",
    };
    body = (
      <>
        <h1 className="text-2xl font-semibold">{msg[invite.status] ?? "This invite is closed."}</h1>
        <Button asChild className="mt-6"><Link to="/studio">Go to Studio</Link></Button>
      </>
    );
  } else {
    const what = describePermissions(invite.kind, invite.permissions);
    body = (
      <>
        <h1 className="text-2xl font-semibold">
          {invite.kind === "roster"
            ? `${invite.inviter_name} wants to add you to their roster`
            : `${invite.inviter_name} invited you to their studio`}
        </h1>
        {invite.message && <p className="mt-4 italic text-muted-foreground">“{invite.message}”</p>}
        <p className="mt-6 text-sm font-medium">You'll be able to:</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-5">
          {what.map((w) => <li key={w}>{w}</li>)}
        </ul>
        {invite.kind === "roster" && (
          <p className="mt-4 text-sm text-muted-foreground">You keep ownership of your music and your $1 per play.</p>
        )}

        {!user ? (
          <div className="mt-8 grid gap-3">
            <p className="text-sm">This invite is for <strong>{invite.invited_email}</strong>.</p>
            <Button asChild><Link to={`/auth?mode=signup&email=${encodeURIComponent(invite.invited_email)}&next=${encodeURIComponent(here)}`}>Create an account to accept</Link></Button>
            <Button asChild variant="outline"><Link to={`/auth?email=${encodeURIComponent(invite.invited_email)}&next=${encodeURIComponent(here)}`}>I already have an account</Link></Button>
          </div>
        ) : wrongAccount ? (
          <div className="mt-8 grid gap-3">
            <p className="text-sm">
              You're signed in as <strong>{user.email}</strong>, but this invite is for <strong>{invite.invited_email}</strong>.
            </p>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate(`/auth?email=${encodeURIComponent(invite.invited_email)}&next=${encodeURIComponent(here)}`);
              }}
            >
              Sign in as {invite.invited_email}
            </Button>
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => respond(true)} disabled={busy}>
              {busy ? "Accepting…" : "Accept invite"}
            </Button>
            <Button variant="outline" onClick={() => respond(false)} disabled={busy}>Decline</Button>
          </div>
        )}
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <p className="mt-6 text-xs text-muted-foreground">Expires {new Date(invite.expires_at).toLocaleDateString()}.</p>
      </>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center p-4 bg-background">
      <Card className="w-full max-w-md p-8">{body}</Card>
    </main>
  );
}
