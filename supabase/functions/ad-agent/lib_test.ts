import assert from "node:assert/strict";
import { dayOf, decrypt, encrypt, optimize, planCampaign, splitBudget, summarize, todaysBudgetCents, type Plan } from "../_shared/adAgentLib.ts";

Deno.test("30/60/90 plans add up to the budget", () => {
  for (const d of [30, 60, 90] as const) {
    const p = planCampaign(d, 150_000) as Plan;
    assert.equal(p.phases.reduce((s, x) => s + x.budgetCents, 0), 150_000);
    assert.equal(p.phases[2].endDay, d);
    assert.equal(p.phases[0].startDay, 1);
    assert.equal(p.phases[1].startDay, p.phases[0].endDay + 1);
  }
});

Deno.test("too-small budgets are refused with the minimum", () => {
  const r = planCampaign(30, 5_000);
  assert.ok("error" in r && /at least \$\d+/.test(r.error));
  assert.ok("error" in planCampaign(45 as 30, 100_000));
});

Deno.test("daily pacing never overspends", () => {
  const p = planCampaign(30, 30_000) as Plan;
  let spent = 0;
  for (let day = 1; day <= 30; day++) {
    const b = todaysBudgetCents(p, day, spent);
    assert.ok(b >= 0 && spent + b <= 30_000, `day ${day}`);
    spent += b;
  }
  assert.ok(spent > 29_000, `uses nearly all of the budget (${spent})`);
  assert.equal(todaysBudgetCents(p, 5, 30_000), 0, "stops when budget is gone");
  assert.equal(todaysBudgetCents(p, 31, 0), 0, "stops after the end date");
});

Deno.test("optimizer pauses clear losers but keeps one ad", () => {
  const s = (adId: string, impressions: number, clicks: number, spendCents: number) =>
    ({ adId, adSetId: "s", impressions, clicks, spendCents, active: true });
  const d = optimize([s("good", 5000, 100, 3000), s("ok", 5000, 80, 3000), s("bad", 5000, 10, 3000), s("new", 200, 0, 100)]);
  assert.deepEqual(d.map((x) => x.target), ["bad"]);
  assert.deepEqual(optimize([s("a", 5000, 1, 3000), s("b", 5000, 100, 3000)]).length, 1);
  assert.deepEqual(optimize([s("a", 5000, 1, 3000)]), [], "never pauses the only ad");
  assert.deepEqual(optimize([s("a", 500, 0, 300), s("b", 500, 50, 300)]), [], "waits for enough data");
});

Deno.test("budget split favors what gets clicks, with a floor", () => {
  const out = splitBudget(1000, [{ id: "a", clicks: 30 }, { id: "b", clicks: 10 }]);
  assert.equal(out.a + out.b, 1000);
  assert.ok(out.a > out.b && out.b >= 100);
  assert.deepEqual(splitBudget(150, [{ id: "a", clicks: 1 }, { id: "b", clicks: 0 }]), { a: 75, b: 75 });
});

Deno.test("day counting and summary", () => {
  assert.equal(dayOf("2026-10-01", new Date("2026-10-01T23:00:00Z")), 1);
  assert.equal(dayOf("2026-10-01", new Date("2026-10-30T01:00:00Z")), 30);
  const text = summarize({ day: 3, durationDays: 30, phase: null, spentTodayCents: 1234, spentTotalCents: 3000, budgetCents: 30000,
    impressions: 4200, clicks: 21, smartLinkVisits: 18, decisions: [{ kind: "pause_ad", target: "x", reason: "click rate 0.10% vs 1.00% typical" }] });
  assert.ok(text.includes("Day 3 of 30") && text.includes("$12.34 spent") && text.includes("Paused an ad"));
});

Deno.test("tokens round-trip through encryption", async () => {
  const k = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const c = await encrypt("EAAB-token", k);
  assert.notEqual(c, "EAAB-token");
  assert.equal(await decrypt(c, k), "EAAB-token");
});
