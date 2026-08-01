import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, MailX, CheckCircle2, AlertTriangle } from "lucide-react";
import { Seo } from "@/components/Seo";

type State = "loading" | "valid" | "already" | "invalid" | "done" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_KEY } }
        );
        const json = await res.json();
        if (!res.ok) setState("invalid");
        else if (json.valid) setState("valid");
        else setState("already");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    setSubmitting(false);
    if (error) setState("error");
    else if (data?.success) setState("done");
    else setState("already");
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Seo title="Unsubscribe | Thirty Dark Zero" description="Manage your Thirty Dark Zero email preferences." path="/unsubscribe" />
      <Card className="w-full max-w-md p-8 text-center space-y-5 bg-card/70 backdrop-blur-xl border-border/60">
        {state === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Checking your link...</p>
          </>
        )}

        {state === "valid" && (
          <>
            <MailX className="w-10 h-10 mx-auto text-primary" />
            <h1 className="text-3xl tracking-wide">UNSUBSCRIBE</h1>
            <p className="text-muted-foreground">
              Stop receiving emails from Thirty Dark Zero at this address?
            </p>
            <Button className="w-full" onClick={confirm} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm unsubscribe"}
            </Button>
          </>
        )}

        {state === "done" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
            <h1 className="text-3xl tracking-wide">YOU'RE UNSUBSCRIBED</h1>
            <p className="text-muted-foreground">You won't receive further emails from us.</p>
          </>
        )}

        {state === "already" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
            <h1 className="text-3xl tracking-wide">ALREADY UNSUBSCRIBED</h1>
            <p className="text-muted-foreground">This address is already opted out.</p>
          </>
        )}

        {(state === "invalid" || state === "error") && (
          <>
            <AlertTriangle className="w-10 h-10 mx-auto text-destructive" />
            <h1 className="text-3xl tracking-wide">LINK NOT VALID</h1>
            <p className="text-muted-foreground">
              This unsubscribe link is invalid or has expired.
            </p>
          </>
        )}
      </Card>
    </main>
  );
}
