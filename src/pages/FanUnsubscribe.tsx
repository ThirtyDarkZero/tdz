import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

/** /fan-unsubscribe?t=<token> — a fan leaves one artist's email list. */
export default function FanUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("t") ?? "";
  const [state, setState] = useState<{ done: boolean; artist?: string; error?: string }>({ done: false });

  useEffect(() => {
    if (!/^[0-9a-f-]{36}$/i.test(token)) { setState({ done: true, error: "This unsubscribe link isn't complete. Use the link from the email." }); return; }
    supabase.rpc("fan_unsubscribe" as never, { p_token: token } as never).then(({ data, error }) =>
      setState(error ? { done: true, error: error.message } : { done: true, artist: String(data) }));
  }, [token]);

  return (
    <main className="min-h-screen grid place-items-center p-4 bg-background">
      <Card className="w-full max-w-md p-8 text-center">
        {!state.done ? <Loader2 className="w-6 h-6 animate-spin mx-auto" aria-label="Unsubscribing" />
          : state.error ? <><h1 className="text-xl font-semibold">Couldn't unsubscribe</h1><p className="mt-2 text-muted-foreground">{state.error}</p></>
          : <><h1 className="text-xl font-semibold">You're unsubscribed</h1><p className="mt-2 text-muted-foreground">You won't get more emails from {state.artist} through TDZ.</p></>}
      </Card>
    </main>
  );
}
