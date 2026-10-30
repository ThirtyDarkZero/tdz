import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActingArtist } from "@/contexts/ActingArtistContext";
import { toast } from "sonner";
import { bodyToHtml, rate } from "@/lib/fanEmail";

interface Campaign {
  id: string; subject: string; preview_text: string | null; body_html: string; audience_tags: string[];
  status: string; scheduled_at: string | null; sent_at: string | null; error: string | null;
  recipients: number; delivered: number; opened: number; clicked: number; bounced: number; complained: number; unsubscribed: number;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tables not in generated types yet
const db = supabase as any;

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("fan-email", { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const b = ctx && typeof ctx.json === "function" ? await ctx.json().catch(() => null) : null;
    throw new Error(b?.error ?? error.message);
  }
  return data;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", scheduled: "Scheduled", sending: "Sending", sent: "Sent", failed: "Failed", canceled: "Canceled",
};

/** Email the artist's whole fan list and see who opened, clicked and unsubscribed. */
export function FanEmail() {
  const { effectiveUserId } = useActingArtist();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [editing, setEditing] = useState<Partial<Campaign> | null>(null);
  const [body, setBody] = useState("");
  const [button, setButton] = useState({ label: "", url: "" });
  const [audienceTag, setAudienceTag] = useState("");
  const [audience, setAudience] = useState<number | null>(null);
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!effectiveUserId) return;
    const [{ data: cs }, { data: contacts }] = await Promise.all([
      db.from("email_campaigns").select("*").eq("artist_id", effectiveUserId).order("created_at", { ascending: false }).limit(50),
      db.from("artist_contacts").select("tags").eq("artist_id", effectiveUserId).limit(5000),
    ]);
    setCampaigns(cs ?? []);
    setTags([...new Set(((contacts ?? []) as { tags: string[] | null }[]).flatMap((c) => c.tags ?? []))].sort());
  }, [effectiveUserId]);

  useEffect(() => { load(); }, [load]);

  // Live progress while a campaign is sending.
  useEffect(() => {
    if (!campaigns.some((c) => c.status === "sending")) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [campaigns, load]);

  useEffect(() => {
    if (!effectiveUserId || !editing) return;
    supabase.rpc("fan_audience_count" as never, { p_artist: effectiveUserId, p_tags: audienceTag ? [audienceTag] : [] } as never)
      .then(({ data }) => setAudience(typeof data === "number" ? data : null));
  }, [effectiveUserId, editing, audienceTag]);

  const startNew = async () => {
    const { data: link } = await supabase.from("smart_links").select("short_code, title").eq("user_id", effectiveUserId!).order("created_at", { ascending: false }).limit(1).maybeSingle();
    setEditing({ subject: "", preview_text: "" });
    setBody("Hey {{first_name|there}},\n\n");
    setButton(link ? { label: `Listen to ${link.title}`, url: `${window.location.origin}/link/${link.short_code}` } : { label: "", url: "" });
    setAudienceTag("");
    setWhen("");
  };

  const html = useMemo(() => bodyToHtml(body, button.label && button.url ? button : null), [body, button]);

  const saveDraft = async (extra: Record<string, unknown> = {}): Promise<string | null> => {
    if (!editing?.subject?.trim()) { toast.error("Add a subject line."); return null; }
    if (!body.trim()) { toast.error("Write the email first."); return null; }
    const row = {
      artist_id: effectiveUserId, subject: editing.subject.trim(), preview_text: editing.preview_text?.trim() || null,
      body_html: html, audience_tags: audienceTag ? [audienceTag] : [], status: "draft", ...extra,
    };
    const res = editing.id
      ? await db.from("email_campaigns").update(row).eq("id", editing.id).select("id").single()
      : await db.from("email_campaigns").insert(row).select("id").single();
    if (res.error) { toast.error(res.error.message); return null; }
    setEditing((e) => ({ ...e, id: res.data.id }));
    return res.data.id as string;
  };

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    try { await fn(); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); load(); }
  };

  const test = () => run("test", async () => {
    const id = await saveDraft();
    if (!id) return;
    const r = await invoke({ action: "test", campaign_id: id });
    toast.success(`Test sent to ${r.to}`);
  });

  const sendNow = () => run("send", async () => {
    if (!window.confirm(`Send "${editing?.subject}" to ${audience ?? "all"} fans now?`)) return;
    const id = await saveDraft();
    if (!id) return;
    const r = await invoke({ action: "send", campaign_id: id });
    toast.success(r.status === "sent" ? `Sent to ${r.recipients} fans` : `Sending to ${r.recipients} fans…`);
    setEditing(null);
  });

  const schedule = () => run("schedule", async () => {
    if (!when) { toast.error("Pick a date and time."); return; }
    const id = await saveDraft({ status: "scheduled", scheduled_at: new Date(when).toISOString() });
    if (!id) return;
    toast.success(`Scheduled for ${format(new Date(when), "PPP p")}`);
    setEditing(null);
  });

  const cancel = (c: Campaign) => run("cancel", async () => {
    const { error } = await db.from("email_campaigns").update({ status: "draft", scheduled_at: null }).eq("id", c.id);
    if (error) throw error;
    toast.success("Moved back to drafts");
  });

  const open = (c: Campaign) => {
    setEditing(c);
    const m = c.body_html.match(/data-tdz-body="([^"]*)"/);
    setBody(m ? decodeURIComponent(m[1]) : c.body_html.replace(/<[^>]+>/g, "\n").replace(/\n{2,}/g, "\n\n").trim());
    const b = c.body_html.match(/data-tdz-button="([^"]*)" href="([^"]*)"/);
    setButton(b ? { label: decodeURIComponent(b[1]), url: b[2] } : { label: "", url: "" });
    setAudienceTag(c.audience_tags?.[0] ?? "");
    setWhen(c.scheduled_at ? format(new Date(c.scheduled_at), "yyyy-MM-dd'T'HH:mm") : "");
  };

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-6 grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="fe-subject">Subject</Label>
              <Input id="fe-subject" value={editing.subject ?? ""} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} className="mt-1" placeholder="My new single is out" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fe-preview">Preview text (shown after the subject in inboxes)</Label>
              <Input id="fe-preview" value={editing.preview_text ?? ""} onChange={(e) => setEditing({ ...editing, preview_text: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="fe-body">Message</Label>
            <Textarea id="fe-body" value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Blank lines start a new paragraph. {"{{first_name|there}}"} becomes each fan's first name.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="fe-btn">Button text</Label><Input id="fe-btn" value={button.label} onChange={(e) => setButton({ ...button, label: e.target.value })} className="mt-1" placeholder="Listen now" /></div>
            <div><Label htmlFor="fe-url">Button link</Label><Input id="fe-url" value={button.url} onChange={(e) => setButton({ ...button, url: e.target.value })} className="mt-1" placeholder="https://…" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fe-aud">Send to</Label>
              <select id="fe-aud" value={audienceTag} onChange={(e) => setAudienceTag(e.target.value)} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">All subscribed fans</option>
                {tags.map((t) => <option key={t} value={t}>Fans tagged “{t}”</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">{audience === null ? "Counting…" : `${audience.toLocaleString()} fan${audience === 1 ? "" : "s"}`}</p>
            </div>
            <div>
              <Label htmlFor="fe-when">Schedule (optional)</Label>
              <Input id="fe-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="mt-1" />
            </div>
          </div>
          <details className="rounded-md border p-3">
            <summary className="cursor-pointer text-sm font-medium">Preview</summary>
            <div className="mt-3 rounded bg-white text-black p-5 text-sm" dangerouslySetInnerHTML={{ __html: html }} />
          </details>
          <div className="flex flex-wrap gap-2">
            <Button onClick={sendNow} disabled={!!busy || !audience} className="gap-1">{busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Send now</Button>
            <Button variant="outline" onClick={schedule} disabled={!!busy || !when}>{busy === "schedule" ? "Scheduling…" : "Schedule"}</Button>
            <Button variant="outline" onClick={test} disabled={!!busy}>{busy === "test" ? "Sending…" : "Send me a test"}</Button>
            <Button variant="ghost" onClick={() => run("save", async () => { if (await saveDraft()) toast.success("Draft saved"); })} disabled={!!busy}>Save draft</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Close</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Emails go from your name, with replies to your inbox. Every email has an unsubscribe link.</p>
        <Button onClick={startNew} className="gap-1 shrink-0"><Plus className="w-4 h-4" />New email</Button>
      </div>
      {campaigns.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          <Mail className="w-6 h-6 mx-auto mb-2" />No emails yet. Fans join your list from pre-save pages, the Fan Hub and CSV imports.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{c.subject}</p>
                    <Badge variant={c.status === "failed" ? "destructive" : c.status === "sent" ? "default" : "secondary"}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.status === "scheduled" && c.scheduled_at ? `Sends ${format(new Date(c.scheduled_at), "PPP p")}`
                      : c.sent_at ? `Sent ${format(new Date(c.sent_at), "PPP p")}` : `Created ${format(new Date(c.created_at), "PPP")}`}
                    {c.error ? ` — ${c.error}` : ""}
                  </p>
                </div>
                {c.recipients > 0 ? (
                  <dl className="grid grid-cols-4 gap-4 text-center text-sm">
                    <div><dt className="text-xs text-muted-foreground">Sent to</dt><dd className="font-semibold">{c.recipients.toLocaleString()}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Opened</dt><dd className="font-semibold">{rate(c.opened, c.delivered || c.recipients)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Clicked</dt><dd className="font-semibold">{rate(c.clicked, c.delivered || c.recipients)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Unsubscribed</dt><dd className="font-semibold">{c.unsubscribed}</dd></div>
                  </dl>
                ) : (
                  <div className="flex gap-2">
                    {c.status === "scheduled" && <Button variant="ghost" size="sm" onClick={() => cancel(c)}>Unschedule</Button>}
                    {["draft", "failed"].includes(c.status) && <Button variant="outline" size="sm" onClick={() => open(c)}>Edit</Button>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
