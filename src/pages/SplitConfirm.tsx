import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface SplitView {
  holder_name: string; rights_type: string; split_percentage: number; role: string | null; status: string;
  track_title: string; artist_name: string | null; others: { name: string; share: number; role: string | null }[] | null;
}

const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string, args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

/** /split/:token — a collaborator confirms or disputes their share. No account needed. */
export default function SplitConfirm() {
  const { token = "" } = useParams();
  const [split, setSplit] = useState<SplitView | null | undefined>(undefined);
  const [disputing, setDisputing] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    rpc("get_split_by_token", { p_token: token })
      .then(({ data }) => setSplit(((data as SplitView[]) ?? [])[0] ?? null))
      .catch(() => setSplit(null));
  }, [token]);

  const respond = async (confirm: boolean) => {
    setBusy(true);
    setError(null);
    const { data, error } = await rpc("respond_to_split", { p_token: token, p_confirm: confirm, p_note: confirm ? null : note });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setSplit((s) => (s ? { ...s, status: String(data) } : s));
  };

  let body: React.ReactNode;
  if (split === undefined) body = <Loader2 className="w-6 h-6 animate-spin mx-auto" aria-label="Loading" />;
  else if (!split) body = <><h1 className="text-xl font-semibold">This link is no longer valid</h1><p className="mt-2 text-muted-foreground">The split may have changed. Ask the artist to send a new confirmation.</p></>;
  else if (split.status === "confirmed") body = <><h1 className="text-xl font-semibold">Confirmed</h1><p className="mt-2 text-muted-foreground">Your {split.split_percentage}% {split.rights_type} share of “{split.track_title}” is confirmed. Thanks.</p></>;
  else if (split.status === "disputed") body = <><h1 className="text-xl font-semibold">Sent to the artist</h1><p className="mt-2 text-muted-foreground">They'll see your note and can send you a corrected split.</p></>;
  else body = (
    <>
      <h1 className="text-xl font-semibold">Confirm your split</h1>
      <p className="mt-3">
        {split.artist_name ?? "An artist"} listed you, <strong>{split.holder_name}</strong>, as {split.role ? `a ${split.role}` : "an owner"} on
        “{split.track_title}” with a <strong>{split.split_percentage}% {split.rights_type}</strong> share.
      </p>
      {split.others && split.others.length > 1 && (
        <div className="mt-5">
          <p className="text-sm font-medium">Everyone on this {split.rights_type} split</p>
          <ul className="mt-2 text-sm divide-y">
            {split.others.map((o, i) => (
              <li key={i} className="flex justify-between py-1.5"><span>{o.name}{o.role ? ` (${o.role})` : ""}</span><span>{o.share}%</span></li>
            ))}
          </ul>
        </div>
      )}
      {disputing ? (
        <div className="mt-6 grid gap-3">
          <label htmlFor="dispute" className="text-sm font-medium">What's wrong?</label>
          <Textarea id="dispute" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. I co-wrote the hook; my share should be 50%." />
          <div className="flex gap-2">
            <Button onClick={() => respond(false)} disabled={busy || !note.trim()}>{busy ? "Sending…" : "Send to the artist"}</Button>
            <Button variant="ghost" onClick={() => setDisputing(false)}>Back</Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => respond(true)} disabled={busy}>{busy ? "Confirming…" : "Confirm my share"}</Button>
          <Button variant="outline" onClick={() => setDisputing(true)}>Something's wrong</Button>
        </div>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    </>
  );

  return <main className="min-h-screen grid place-items-center p-4 bg-background"><Card className="w-full max-w-md p-8">{body}</Card></main>;
}
