import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Loader2 } from "lucide-react";
import { releaseFields, type ReleaseMode } from "@/lib/releasePlan";

interface Track { id: string; title: string; artist_name: string }

interface TrackEditDialogProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Form = {
  title: string; artist_name: string; genre: string; explicit: boolean; language: string;
  download_price: string; isrc: string; upc: string; label: string;
  copyright_owner: string; copyright_year: string; p_line: string; c_line: string;
};

const EMPTY: Form = {
  title: "", artist_name: "", genre: "", explicit: false, language: "English", download_price: "",
  isrc: "", upc: "", label: "", copyright_owner: "", copyright_year: "", p_line: "", c_line: "",
};

const ISRC = /^[A-Z]{2}-?[A-Z0-9]{3}-?\d{2}-?\d{5}$/i;
const UPC = /^\d{12,13}$/;

/** Problems with the form, keyed by field. Empty object means it can be saved. */
export function validateTrackForm(f: Form, mode: ReleaseMode, date: string): Partial<Record<keyof Form | "date", string>> {
  const e: Partial<Record<keyof Form | "date", string>> = {};
  if (!f.title.trim()) e.title = "Add a title.";
  if (!f.artist_name.trim()) e.artist_name = "Add the artist name.";
  if (f.isrc && !ISRC.test(f.isrc.trim())) e.isrc = "ISRCs look like US-ABC-26-00001 (12 letters and numbers).";
  if (f.upc && !UPC.test(f.upc.trim())) e.upc = "UPCs are 12 or 13 digits.";
  if (f.download_price && !(Number(f.download_price) >= 0.5 && Number(f.download_price) <= 100)) {
    e.download_price = "Use a price from $0.50 to $100, or leave it blank for no downloads.";
  }
  if (f.copyright_year && !/^(19|20)\d{2}$/.test(f.copyright_year)) e.copyright_year = "Use a 4-digit year.";
  if (mode === "scheduled" && !date) e.date = "Pick a release date.";
  return e;
}

/** Edit a track's details in one place. Writes the same fields the uploader saves. */
export const TrackEditDialog = ({ track, open, onOpenChange, onSuccess }: TrackEditDialogProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState<Form>(EMPTY);
  const [mode, setMode] = useState<ReleaseMode>("draft");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!track || !open) return;
    setLoading(true);
    setTouched(false);
    supabase.from("tracks").select("*").eq("id", track.id).maybeSingle().then(({ data: t }) => {
      setLoading(false);
      if (!t) return;
      setForm({
        title: t.title ?? "", artist_name: t.artist_name ?? "", genre: t.genre ?? "",
        explicit: !!t.explicit, language: t.language ?? "English",
        download_price: t.download_price ? String(t.download_price) : "",
        isrc: t.isrc ?? "", upc: t.upc ?? "", label: t.label ?? "",
        copyright_owner: t.copyright_owner ?? "", copyright_year: t.copyright_year ? String(t.copyright_year) : "",
        p_line: t.p_line ?? "", c_line: t.c_line ?? "",
      });
      const scheduled = !t.is_published && (t.scheduled_release_date || t.release_date);
      setMode(t.is_published ? "now" : scheduled ? "scheduled" : "draft");
      setDate((t.scheduled_release_date || t.release_date || "") as string);
      setShowCodes(!!(t.isrc || t.upc || t.p_line || t.c_line));
    });
  }, [track, open]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const errors = validateTrackForm(form, mode, date);
  const show = (k: keyof typeof errors) => (touched && errors[k] ? <p className="text-xs text-destructive mt-1">{errors[k]}</p> : null);

  const save = async () => {
    setTouched(true);
    if (!track || Object.keys(errors).length) {
      if (errors.isrc || errors.upc || errors.copyright_year) setShowCodes(true);
      return;
    }
    setSaving(true);
    const release = releaseFields(mode, date ? new Date(`${date}T12:00:00`) : null);
    const price = form.download_price ? Number(form.download_price) : null;
    const { error } = await supabase.from("tracks").update({
      title: form.title.trim().slice(0, 200),
      artist_name: form.artist_name.trim().slice(0, 100),
      genre: form.genre.trim() || null,
      explicit: form.explicit,
      language: form.language.trim() || null,
      download_price: price,
      isrc: form.isrc.trim().toUpperCase().replace(/-/g, "") || null,
      upc: form.upc.trim() || null,
      label: form.label.trim() || null,
      copyright_owner: form.copyright_owner.trim() || null,
      copyright_year: form.copyright_year ? Number(form.copyright_year) : null,
      p_line: form.p_line.trim() || null,
      c_line: form.c_line.trim() || null,
      ...release,
    } as never).eq("id", track.id);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save the track", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: release.is_published ? "Saved — the track is live" : release.release_date ? "Saved — release scheduled" : "Saved as a draft" });
    onSuccess();
    onOpenChange(false);
  };

  if (!track) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit track</DialogTitle>
          <DialogDescription>
            Lyrics are under Music &gt; Lyrics. Writers and splits are under Music &gt; Rights &amp; Territories.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 grid place-items-center"><Loader2 className="w-5 h-5 animate-spin" aria-label="Loading" /></div>
        ) : (
          <form className="grid gap-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="te-title">Title</Label>
                <Input id="te-title" value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-1" />
                {show("title")}
              </div>
              <div>
                <Label htmlFor="te-artist">Artist</Label>
                <Input id="te-artist" value={form.artist_name} onChange={(e) => set("artist_name", e.target.value)} className="mt-1" />
                {show("artist_name")}
              </div>
              <div>
                <Label htmlFor="te-genre">Genre</Label>
                <Input id="te-genre" value={form.genre} onChange={(e) => set("genre", e.target.value)} className="mt-1" placeholder="Hip-Hop" />
              </div>
              <div>
                <Label htmlFor="te-lang">Language</Label>
                <Input id="te-lang" value={form.language} onChange={(e) => set("language", e.target.value)} className="mt-1" />
              </div>
            </div>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Explicit lyrics</span>
              <Switch checked={form.explicit} onCheckedChange={(v) => set("explicit", v)} aria-label="Explicit lyrics" />
            </label>

            <fieldset className="grid gap-3">
              <legend className="text-sm font-medium mb-2">Release</legend>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as ReleaseMode)} className="grid grid-cols-3 gap-2">
                {([["now", "Live"], ["scheduled", "Scheduled"], ["draft", "Draft"]] as const).map(([v, l]) => (
                  <Label key={v} htmlFor={`te-mode-${v}`} className={`flex items-center gap-2 rounded-md border p-2.5 cursor-pointer font-normal ${mode === v ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem id={`te-mode-${v}`} value={v} />{l}
                  </Label>
                ))}
              </RadioGroup>
              {mode === "scheduled" && (
                <div>
                  <Label htmlFor="te-date">Release date</Label>
                  <Input id="te-date" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className="mt-1" />
                  {show("date")}
                </div>
              )}
              <div>
                <Label htmlFor="te-price">Download price (USD, optional)</Label>
                <Input id="te-price" inputMode="decimal" value={form.download_price} onChange={(e) => set("download_price", e.target.value)} className="mt-1" placeholder="1.29" />
                {show("download_price")}
                <p className="text-xs text-muted-foreground mt-1">You keep 100% of download sales. Leave blank to stream only.</p>
              </div>
            </fieldset>

            <Collapsible open={showCodes} onOpenChange={setShowCodes}>
              <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium py-1">
                Codes and copyright
                <ChevronDown className={`w-4 h-4 transition-transform ${showCodes ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="grid gap-4 sm:grid-cols-2 pt-3">
                <div><Label htmlFor="te-isrc">ISRC</Label><Input id="te-isrc" value={form.isrc} onChange={(e) => set("isrc", e.target.value)} className="mt-1" placeholder="USABC2600001" />{show("isrc")}</div>
                <div><Label htmlFor="te-upc">UPC</Label><Input id="te-upc" inputMode="numeric" value={form.upc} onChange={(e) => set("upc", e.target.value)} className="mt-1" />{show("upc")}</div>
                <div><Label htmlFor="te-owner">Copyright owner</Label><Input id="te-owner" value={form.copyright_owner} onChange={(e) => set("copyright_owner", e.target.value)} className="mt-1" /></div>
                <div><Label htmlFor="te-year">Copyright year</Label><Input id="te-year" inputMode="numeric" value={form.copyright_year} onChange={(e) => set("copyright_year", e.target.value)} className="mt-1" />{show("copyright_year")}</div>
                <div><Label htmlFor="te-pline">℗ line (recording)</Label><Input id="te-pline" value={form.p_line} onChange={(e) => set("p_line", e.target.value)} className="mt-1" /></div>
                <div><Label htmlFor="te-cline">© line (song)</Label><Input id="te-cline" value={form.c_line} onChange={(e) => set("c_line", e.target.value)} className="mt-1" /></div>
                <div className="sm:col-span-2"><Label htmlFor="te-label">Label</Label><Input id="te-label" value={form.label} onChange={(e) => set("label", e.target.value)} className="mt-1" /></div>
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
