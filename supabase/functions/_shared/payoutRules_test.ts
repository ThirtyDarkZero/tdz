import assert from "node:assert/strict";
import {
  claimPendingEarnings,
  isConnectReady,
  lifetimePaidStreams,
  markPaid,
  MIN_PAID_STREAMS,
  PAYOUT_THRESHOLD_USD,
  payoutIdempotencyKey,
  releaseClaim,
} from "./payoutRules.ts";

// Minimal in-memory stand-in for the Supabase query builder, enough for the
// artist_earnings queries payoutRules makes.
type Row = { id: string; artist_id: string; total_earnings: number; total_streams: number; payout_status: string };
function fakeDb(rows: Row[]) {
  return {
    rows,
    from(_table: string) {
      const filters: Array<(r: Row) => boolean> = [];
      let patch: Partial<Row> | null = null;
      const q = {
        update(p: Partial<Row>) { patch = p; return q; },
        select(_cols: string) { return q; },
        eq(col: keyof Row, v: unknown) { filters.push((r) => r[col] === v); return q; },
        in(col: keyof Row, vs: unknown[]) {
          filters.push((r) => vs.includes(r[col]));
          return q;
        },
        then(resolve: (v: unknown) => void) {
          const hit = rows.filter((r) => filters.every((f) => f(r)));
          const snapshot = hit.map((r) => ({ ...r, ...(patch ?? {}) }));
          if (patch) for (const r of hit) Object.assign(r, patch);
          resolve({ data: snapshot, error: null });
        },
      };
      return q;
    },
  };
}

const A = "artist-a";

Deno.test("rule constants match the published payout policy", () => {
  assert.equal(PAYOUT_THRESHOLD_USD, 50);
  assert.equal(MIN_PAID_STREAMS, 50);
});

Deno.test("isConnectReady: transfer-only artist accounts are ready without charges_enabled", () => {
  const acct = { details_submitted: true, payouts_enabled: true, charges_enabled: false, capabilities: { transfers: "active" } };
  assert.equal(isConnectReady(acct), true);
});

Deno.test("isConnectReady: not ready until onboarding, payouts and transfers are all on", () => {
  const base = { details_submitted: true, payouts_enabled: true, capabilities: { transfers: "active" } };
  assert.equal(isConnectReady({ ...base, details_submitted: false }), false);
  assert.equal(isConnectReady({ ...base, payouts_enabled: false }), false);
  assert.equal(isConnectReady({ ...base, capabilities: { transfers: "pending" } }), false);
  assert.equal(isConnectReady({ ...base, deleted: true }), false);
  assert.equal(isConnectReady(null), false);
});

Deno.test("payoutIdempotencyKey stays under Stripe's 255-char limit and ignores id order", async () => {
  const ids = Array.from({ length: 500 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
  const k1 = await payoutIdempotencyKey("auto_payout", A, 5000, ids);
  const k2 = await payoutIdempotencyKey("auto_payout", A, 5000, [...ids].reverse());
  assert.ok(k1.length < 255, `key length ${k1.length}`);
  assert.equal(k1, k2);
  assert.notEqual(k1, await payoutIdempotencyKey("auto_payout", A, 5001, ids), "amount must change the key");
});

Deno.test("claimPendingEarnings claims only this artist's pending rows and totals them", async () => {
  const db = fakeDb([
    { id: "1", artist_id: A, total_earnings: 30, total_streams: 30, payout_status: "pending" },
    { id: "2", artist_id: A, total_earnings: 25.5, total_streams: 25, payout_status: "pending" },
    { id: "3", artist_id: A, total_earnings: 99, total_streams: 99, payout_status: "paid" },
    { id: "4", artist_id: "other", total_earnings: 70, total_streams: 70, payout_status: "pending" },
  ]);
  const claim = await claimPendingEarnings(db, A);
  assert.deepEqual(claim.ids.sort(), ["1", "2"]);
  assert.equal(claim.total, 55.5);
  assert.equal(db.rows.find((r) => r.id === "1")!.payout_status, "processing");
  assert.equal(db.rows.find((r) => r.id === "4")!.payout_status, "pending", "other artists untouched");

  const second = await claimPendingEarnings(db, A);
  assert.equal(second.ids.length, 0, "a second concurrent claim gets nothing");
});

Deno.test("markPaid and releaseClaim only move rows that are processing", async () => {
  const db = fakeDb([
    { id: "1", artist_id: A, total_earnings: 60, total_streams: 60, payout_status: "processing" },
    { id: "2", artist_id: A, total_earnings: 5, total_streams: 5, payout_status: "pending" },
  ]);
  await markPaid(db, ["1", "2"]);
  assert.equal(db.rows[0].payout_status, "paid");
  assert.equal(db.rows[1].payout_status, "pending", "pending rows are never marked paid");

  db.rows[0].payout_status = "processing";
  await releaseClaim(db, ["1"]);
  assert.equal(db.rows[0].payout_status, "pending");
});

Deno.test("lifetimePaidStreams sums streams across all of an artist's earnings rows", async () => {
  const db = fakeDb([
    { id: "1", artist_id: A, total_earnings: 30, total_streams: 30, payout_status: "paid" },
    { id: "2", artist_id: A, total_earnings: 22, total_streams: 22, payout_status: "pending" },
    { id: "3", artist_id: "other", total_earnings: 9, total_streams: 9, payout_status: "pending" },
  ]);
  assert.equal(await lifetimePaidStreams(db, A), 52);
});
