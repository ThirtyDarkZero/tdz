// The media buyer's rulebook: plan a 30/60/90-day campaign, pace the budget,
// and decide what to pause or scale each day. Pure functions, unit-tested.

export type Duration = 30 | 60 | 90;
export interface Phase { name: "test" | "scale" | "retarget"; label: string; startDay: number; endDay: number; budgetCents: number; adSets: number }
export interface Plan { durationDays: Duration; totalBudgetCents: number; phases: Phase[]; minDailyCents: number }

// Share of budget and length of each phase, by campaign length.
const SHAPE: Record<Duration, { test: [number, number]; scale: [number, number]; retarget: [number, number] }> = {
  30: { test: [7, 0.25], scale: [16, 0.55], retarget: [7, 0.20] },
  60: { test: [10, 0.20], scale: [35, 0.55], retarget: [15, 0.25] },
  90: { test: [14, 0.15], scale: [56, 0.60], retarget: [20, 0.25] },
};
export const MIN_ADSET_DAILY_CENTS = 100; // Meta's floor is about $1/day per ad set

export function planCampaign(durationDays: Duration, totalBudgetCents: number, audiences = 3): Plan | { error: string } {
  if (![30, 60, 90].includes(durationDays)) return { error: "Choose 30, 60 or 90 days." };
  const shape = SHAPE[durationDays];
  const testSets = Math.max(1, Math.min(3, audiences));
  // The test phase needs every audience funded at the platform minimum.
  const minTotal = Math.ceil((MIN_ADSET_DAILY_CENTS * testSets * shape.test[0]) / shape.test[1] / 100) * 100;
  if (totalBudgetCents < minTotal) {
    return { error: `For ${durationDays} days, the budget needs to be at least $${(minTotal / 100).toFixed(0)}.` };
  }
  let day = 1;
  let allocated = 0;
  const phases: Phase[] = (["test", "scale", "retarget"] as const).map((name, i) => {
    const [days, share] = shape[name];
    const budgetCents = i === 2 ? totalBudgetCents - allocated : Math.floor(totalBudgetCents * share);
    allocated += budgetCents;
    const p: Phase = {
      name,
      label: name === "test" ? "Test: find the best audience and creative"
        : name === "scale" ? "Scale: put the money behind what works"
        : "Retarget: reach people who already engaged",
      startDay: day, endDay: day + days - 1, budgetCents,
      adSets: name === "test" ? testSets : 1,
    };
    day += days;
    return p;
  });
  return { durationDays, totalBudgetCents, phases, minDailyCents: MIN_ADSET_DAILY_CENTS };
}

export function phaseOn(plan: Plan, day: number): Phase | null {
  return plan.phases.find((p) => day >= p.startDay && day <= p.endDay) ?? null;
}

/**
 * Today's budget: the phase's planned daily rate, but never more than what's
 * left divided by the days remaining (so the campaign can't overspend), and
 * zero once the budget is gone.
 */
export function todaysBudgetCents(plan: Plan, day: number, spentCents: number): number {
  const remaining = plan.totalBudgetCents - spentCents;
  if (remaining <= 0 || day > plan.durationDays) return 0;
  const phase = phaseOn(plan, day)!;
  const phaseDays = phase.endDay - phase.startDay + 1;
  const planned = Math.floor(phase.budgetCents / phaseDays);
  const daysLeft = plan.durationDays - day + 1;
  const evenly = Math.floor(remaining / daysLeft);
  // Allow catching up a little if earlier days underspent, capped at 1.5x plan.
  return Math.max(0, Math.min(remaining, Math.max(planned, Math.min(evenly, Math.floor(planned * 1.5)))));
}

export interface AdStat { adId: string; adSetId: string; impressions: number; clicks: number; spendCents: number; active: boolean }
export interface Decision { kind: "pause_ad" | "budget"; target: string; reason: string; value?: number }

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Daily optimization. Pauses ads that clearly underperform once they have
 * enough data (1,000+ impressions): click-through under half the median, or
 * cost per click over twice the median. Always leaves at least one ad running.
 */
export function optimize(stats: AdStat[], minImpressions = 1000): Decision[] {
  const live = stats.filter((s) => s.active);
  const mature = live.filter((s) => s.impressions >= minImpressions);
  if (mature.length < 2) return [];
  const ctr = (s: AdStat) => s.clicks / Math.max(1, s.impressions);
  const cpc = (s: AdStat) => (s.clicks ? s.spendCents / s.clicks : Infinity);
  const mCtr = median(mature.map(ctr));
  const mCpc = median(mature.filter((s) => s.clicks).map(cpc));
  const out: Decision[] = [];
  let running = live.length;
  // Worst first, so if we must keep one, we keep the best.
  for (const s of [...mature].sort((a, b) => ctr(a) - ctr(b))) {
    if (running <= 1) break;
    const lowCtr = ctr(s) < mCtr * 0.5;
    const highCpc = mCpc > 0 && cpc(s) > mCpc * 2;
    if (lowCtr || highCpc) {
      out.push({
        kind: "pause_ad", target: s.adId,
        reason: lowCtr ? `click rate ${(ctr(s) * 100).toFixed(2)}% vs ${(mCtr * 100).toFixed(2)}% typical`
          : `cost per click $${(cpc(s) / 100).toFixed(2)} vs $${(mCpc / 100).toFixed(2)} typical`,
      });
      running--;
    }
  }
  return out;
}

/** Split a daily budget across ad sets in proportion to clicks (min floor each). */
export function splitBudget(totalCents: number, adSets: { id: string; clicks: number }[], floor = MIN_ADSET_DAILY_CENTS): Record<string, number> {
  if (!adSets.length) return {};
  const n = adSets.length;
  if (totalCents <= floor * n) {
    const each = Math.floor(totalCents / n);
    return Object.fromEntries(adSets.map((a) => [a.id, each]));
  }
  const pool = totalCents - floor * n;
  const clicks = adSets.reduce((s, a) => s + a.clicks, 0);
  const out: Record<string, number> = {};
  let given = 0;
  adSets.forEach((a, i) => {
    const extra = i === n - 1 ? pool - given : Math.floor(clicks ? (pool * a.clicks) / clicks : pool / n);
    given += extra;
    out[a.id] = floor + extra;
  });
  return out;
}

export function dayOf(startDate: string, today: Date): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const t = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((t - start) / 86_400_000) + 1;
}

export function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** The daily report the artist reads. Plain words, no jargon. */
export function summarize(r: {
  day: number; durationDays: number; phase: Phase | null; spentTodayCents: number; spentTotalCents: number; budgetCents: number;
  impressions: number; clicks: number; smartLinkVisits: number; decisions: Decision[];
}): string {
  const lines = [
    `Day ${r.day} of ${r.durationDays}${r.phase ? ` (${r.phase.name} phase)` : ""}.`,
    `Yesterday: ${money(r.spentTodayCents)} spent, ${r.impressions.toLocaleString()} people reached, ${r.clicks.toLocaleString()} clicks` +
      (r.clicks ? ` (${money(Math.round(r.spentTodayCents / r.clicks))} each)` : "") + `, ${r.smartLinkVisits.toLocaleString()} smart link visits.`,
    `Total so far: ${money(r.spentTotalCents)} of ${money(r.budgetCents)}.`,
  ];
  if (r.decisions.length) {
    lines.push("What I changed:");
    for (const d of r.decisions) lines.push(d.kind === "pause_ad" ? `• Paused an ad: ${d.reason}.` : `• ${d.reason}.`);
  } else lines.push("No changes needed today.");
  return lines.join("\n");
}

// ── Token encryption (AES-GCM, key from ADS_TOKEN_KEY) ──────────────
async function key(secretB64: string) {
  const raw = Uint8Array.from(atob(secretB64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encrypt(plain: string, secretB64: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(secretB64), new TextEncoder().encode(plain)));
  const all = new Uint8Array(iv.length + ct.length);
  all.set(iv); all.set(ct, iv.length);
  return btoa(String.fromCharCode(...all));
}
export async function decrypt(cipherB64: string, secretB64: string): Promise<string> {
  const all = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: all.slice(0, 12) }, await key(secretB64), all.slice(12));
  return new TextDecoder().decode(pt);
}
