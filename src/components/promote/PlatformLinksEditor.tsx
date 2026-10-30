import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { PLATFORMS, cleanUrl } from "@/lib/smartLinks";

export type PlatformLink = { name: string; url: string };

export const DEFAULT_PLATFORMS: PlatformLink[] = [
  { name: "Spotify", url: "" },
  { name: "Apple Music", url: "" },
  { name: "YouTube", url: "" },
];

/** Filled rows as { name: url }. Returns an error message instead when a link isn't a web address. */
export function platformMap(rows: PlatformLink[]): Record<string, string> | string {
  const out: Record<string, string> = {};
  for (const p of rows) {
    if (!p.url.trim()) continue;
    const url = cleanUrl(p.url);
    if (!url || !p.name.trim()) return `Check the ${p.name || "platform"} link — it must be a web address.`;
    out[p.name.trim()] = url;
  }
  return out;
}

/** Rows of "service + link". The service name suggests the common stores but accepts anything. */
export function PlatformLinksEditor({ value, onChange, idPrefix }: { value: PlatformLink[]; onChange: (v: PlatformLink[]) => void; idPrefix: string }) {
  const set = (i: number, patch: Partial<PlatformLink>) => onChange(value.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <div className="space-y-2">
      <Label>Streaming links</Label>
      {value.map((p, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] sm:grid-cols-[9rem_minmax(0,1fr)_auto] items-center gap-2">
          <Input list={`${idPrefix}-platforms`} aria-label="Service" value={p.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="Service" />
          <Input aria-label={`${p.name || "Service"} link`} inputMode="url" value={p.url} onChange={(e) => set(i, { url: e.target.value })} placeholder="https://…" />
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${p.name || "link"}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <datalist id={`${idPrefix}-platforms`}>{PLATFORMS.map((p) => <option key={p} value={p} />)}</datalist>
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...value, { name: "", url: "" }])} className="gap-1">
        <Plus className="w-3.5 h-3.5" /> Add a service
      </Button>
    </div>
  );
}
