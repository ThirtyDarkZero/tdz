import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Records one pass/fail row per critical-to-quality (CTQ) operation.
// The quality scorecard (get_quality_scorecard) turns these into defects per
// million and a sigma level. Recording is best-effort: it never throws and
// never slows the user's request when the runtime supports waitUntil.

export type Ctq =
  | "stream_validation"   // fraud check ran for a logged-in stream
  | "stream_credit"       // paid stream credited to the artist
  | "payout"              // eligible artist paid (auto sweep or manual)
  | "checkout_start"      // Stripe checkout session created
  | "upload"              // track upload session / chunk stored
  | "stripe_match"        // Stripe charge/transfer matches an internal record
  | "ledger_match";       // artist ledger balance equals unpaid earnings

export interface Outcome {
  ctq: Ctq;
  ok: boolean;
  reason?: string;
  subjectId?: string;
  artistId?: string | null;
  detail?: Record<string, unknown>;
}

// deno-lint-ignore no-explicit-any
let admin: any = null;
function adminClient() {
  if (!admin) {
    admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
  }
  return admin;
}

export function recordOutcome(o: Outcome): Promise<void> {
  const write = (async () => {
    try {
      const { error } = await adminClient().from("outcome_events").insert({
        ctq: o.ctq,
        ok: o.ok,
        reason: o.reason ? o.reason.slice(0, 120) : null,
        subject_id: o.subjectId ?? null,
        artist_id: o.artistId ?? null,
        detail: o.detail ?? null,
      });
      if (error) console.warn(`[outcomes] ${o.ctq} not recorded:`, error.message);
    } catch (e) {
      console.warn(`[outcomes] ${o.ctq} not recorded:`, (e as Error)?.message ?? e);
    }
  })();

  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) {
    rt.waitUntil(write);
    return Promise.resolve();
  }
  return write;
}
