// Shared artist payout rules — one source of truth for the auto sweep,
// manual withdrawals and the Stripe webhook.
import type Stripe from "https://esm.sh/stripe@18.5.0";

export const PAYOUT_THRESHOLD_USD = 50;
export const MIN_PAID_STREAMS = 50;

// An artist account can receive money when Stripe has finished onboarding and
// the transfers capability is active. charges_enabled is NOT required: artists
// only receive transfers, they never take card payments themselves.
export function isConnectReady(acct: Stripe.Account | any): boolean {
  return !!(
    acct &&
    !acct.deleted &&
    acct.details_submitted &&
    acct.payouts_enabled &&
    acct.capabilities?.transfers === "active"
  );
}

// Re-reads the account from Stripe and stores the truth, so a missed or
// misconfigured webhook can never leave an artist stuck as "not ready".
export async function syncConnectStatus(
  supabase: any,
  stripe: Stripe,
  artistId: string,
  connectId: string,
): Promise<boolean> {
  const acct = await stripe.accounts.retrieve(connectId);
  const ready = isConnectReady(acct);
  await supabase
    .from("artist_payout_details")
    .update({ payout_enabled: ready, updated_at: new Date().toISOString() })
    .eq("artist_id", artistId);
  return ready;
}

// Lifetime streams that earned money (paid-subscriber streams).
export async function lifetimePaidStreams(supabase: any, artistId: string): Promise<number> {
  const { data, error } = await supabase
    .from("artist_earnings")
    .select("total_streams")
    .eq("artist_id", artistId);
  if (error) throw error;
  return (data ?? []).reduce((s: number, r: any) => s + (Number(r.total_streams) || 0), 0);
}

// Stripe idempotency keys max out at 255 chars; hash the earnings id list so
// artists with many earnings rows don't get every transfer rejected.
export async function payoutIdempotencyKey(
  scope: string,
  artistId: string,
  amountCents: number,
  earningsIds: string[],
): Promise<string> {
  const raw = earningsIds.slice().sort().join(",");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `tdz:${scope}:${artistId}:${amountCents}:${hex.slice(0, 32)}`;
}

// Atomically moves pending rows to "processing" so streams credited during a
// payout can't be marked paid without being transferred. Returns only the rows
// this caller actually claimed.
export async function claimPendingEarnings(
  supabase: any,
  artistId: string,
  ids?: string[],
): Promise<{ ids: string[]; total: number }> {
  let q = supabase
    .from("artist_earnings")
    .update({ payout_status: "processing", updated_at: new Date().toISOString() })
    .eq("artist_id", artistId)
    .eq("payout_status", "pending");
  if (ids?.length) q = q.in("id", ids);
  const { data, error } = await q.select("id, total_earnings");
  if (error) throw error;
  const rows = data ?? [];
  return {
    ids: rows.map((r: any) => r.id),
    total: Math.round(rows.reduce((s: number, r: any) => s + (Number(r.total_earnings) || 0), 0) * 100) / 100,
  };
}

export async function releaseClaim(supabase: any, ids: string[], status: "pending" | "failed" = "pending") {
  if (!ids.length) return;
  await supabase
    .from("artist_earnings")
    .update({ payout_status: status, updated_at: new Date().toISOString() })
    .in("id", ids)
    .eq("payout_status", "processing");
}

export async function markPaid(supabase: any, ids: string[]) {
  if (!ids.length) return;
  await supabase
    .from("artist_earnings")
    .update({ payout_status: "paid", payout_date: new Date().toISOString() })
    .in("id", ids)
    .eq("payout_status", "processing");
}
