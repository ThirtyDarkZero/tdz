// Resend → TDZ delivery events (delivered, opened, clicked, bounced, complained).
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { verifyResendSignature } from "../fan-email/lib.ts";

const TRACKED = new Set(["email.delivered", "email.opened", "email.clicked", "email.bounced", "email.complained"]);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (!secret) return new Response("Not configured", { status: 503 });
  const raw = await req.text();
  const ok = await verifyResendSignature(secret, {
    id: req.headers.get("svix-id"), timestamp: req.headers.get("svix-timestamp"), signature: req.headers.get("svix-signature"),
  }, raw);
  if (!ok) return new Response("Invalid signature", { status: 401 });

  const event = JSON.parse(raw);
  const id = event?.data?.email_id;
  if (TRACKED.has(event?.type) && typeof id === "string") {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await db.rpc("record_fan_email_event", { p_provider_id: id, p_type: event.type });
    if (error) {
      console.error("record_fan_email_event failed", error);
      return new Response("Retry", { status: 500 }); // Resend retries
    }
  }
  return new Response("ok");
});
