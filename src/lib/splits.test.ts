import { describe, expect, it } from "vitest";
import { evenShares, splitProblems, splitSheetCsv, total, type SplitRow } from "./splits";

const row = (name: string, pct: number, extra: Partial<SplitRow> = {}): SplitRow => ({
  rights_type: "publishing", holder_name: name, holder_email: "", role: "writer", split_percentage: pct,
  pro_affiliation: "", ipi_number: "", ...extra,
});

describe("splits", () => {
  it("even shares add to exactly 100", () => {
    expect(evenShares(3)).toEqual([33.33, 33.33, 33.34]);
    expect(evenShares(3).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 10);
    expect(evenShares(0)).toEqual([]);
  });
  it("flags shares that don't add to 100", () => {
    expect(splitProblems([row("A", 50), row("B", 40)])).toEqual(["Shares add up to 90% — 10% is unassigned."]);
    expect(splitProblems([row("A", 60), row("B", 50)])[0]).toMatch(/10% too much/);
    expect(splitProblems([row("A", 50), row("B", 50)])).toEqual([]);
  });
  it("flags missing names and bad emails", () => {
    expect(splitProblems([row("", 100)])).toContain("Every share needs a name.");
    expect(splitProblems([row("A", 100, { holder_email: "nope" })])).toContain("Check the email addresses.");
  });
  it("totals and CSV", () => {
    expect(total([row("A", 33.33), row("B", 66.67)])).toBe(100);
    expect(splitSheetCsv('He said "hi"', [row("A", 100)])).toContain('"He said ""hi"""');
  });
});
