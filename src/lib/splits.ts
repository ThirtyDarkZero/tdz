export type RightsType = "publishing" | "master";

export interface SplitRow {
  id?: string;
  rights_type: RightsType;
  holder_name: string;
  holder_email: string;
  role: string;
  split_percentage: number;
  pro_affiliation: string;
  ipi_number: string;
  status?: "draft" | "sent" | "confirmed" | "disputed";
  dispute_note?: string | null;
}

/** Sum of shares, rounded to cents of a percent. */
export function total(rows: SplitRow[]): number {
  return Math.round(rows.reduce((s, r) => s + (Number(r.split_percentage) || 0), 0) * 100) / 100;
}

/** Equal shares that add to exactly 100 (the last person absorbs rounding). */
export function evenShares(n: number): number[] {
  if (n <= 0) return [];
  const each = Math.floor((100 / n) * 100) / 100;
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? Math.round((100 - each * (n - 1)) * 100) / 100 : each));
}

/** Problems that block saving or sending, in plain words. */
export function splitProblems(rows: SplitRow[]): string[] {
  const out: string[] = [];
  if (rows.some((r) => !r.holder_name.trim())) out.push("Every share needs a name.");
  if (rows.some((r) => !(r.split_percentage > 0 && r.split_percentage <= 100))) out.push("Shares must be between 0 and 100%.");
  if (rows.some((r) => r.holder_email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(r.holder_email.trim()))) out.push("Check the email addresses.");
  const t = total(rows);
  if (rows.length && t !== 100) out.push(t > 100 ? `Shares add up to ${t}% — that's ${Math.round((t - 100) * 100) / 100}% too much.` : `Shares add up to ${t}% — ${Math.round((100 - t) * 100) / 100}% is unassigned.`);
  return out;
}

/** CSV split sheet for PROs, publishers and co-writers. */
export function splitSheetCsv(trackTitle: string, rows: SplitRow[]): string {
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Song", "Type", "Name", "Role", "Share %", "PRO", "IPI", "Email", "Status"];
  const body = rows.map((r) => [trackTitle, r.rights_type, r.holder_name, r.role, r.split_percentage, r.pro_affiliation, r.ipi_number, r.holder_email, r.status ?? "draft"]);
  return [head, ...body].map((line) => line.map(esc).join(",")).join("\n");
}
