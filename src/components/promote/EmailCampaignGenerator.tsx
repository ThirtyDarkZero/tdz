import { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Mail, Newspaper, Sparkles, Copy, Users, Filter, Download,
  Eye, Send, Wand2, RefreshCw, Target, Globe, Tag, Clock,
  FileText, ChevronRight, Loader2, CheckCircle2, Zap, BarChart3,
  Palette, Type, Image, Link, AlertCircle, Megaphone, Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { useArtistNarrativeContext, serializeNarrativeContext } from "@/hooks/useArtistNarrativeContext";

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  source: string | null;
  subscribed: boolean | null;
  tags: string[] | null;
}

interface Campaign {
  subject: string;
  preheader: string;
  htmlBody: string;
  plainBody: string;
  tone: string;
  cta: string;
  recipients: Contact[];
  segmentName: string;
}

type CampaignType = "fan" | "press" | "announcement" | "tour" | "release" | "newsletter";
type ToneType = "warm" | "hype" | "professional" | "intimate" | "urgent" | "storytelling";

const CAMPAIGN_TYPES: { value: CampaignType; label: string; icon: any; desc: string }[] = [
  { value: "fan", label: "Fan Update", icon: Heart, desc: "Personal message to your core fans" },
  { value: "release", label: "New Release", icon: Megaphone, desc: "Announce new music or content" },
  { value: "tour", label: "Tour / Shows", icon: Globe, desc: "Promote upcoming live events" },
  { value: "announcement", label: "Announcement", icon: Zap, desc: "Big news or milestone" },
  { value: "newsletter", label: "Newsletter", icon: FileText, desc: "Regular fan digest" },
  { value: "press", label: "Press Release", icon: Newspaper, desc: "Professional media pitch" },
];

const TONES: { value: ToneType; label: string; emoji: string }[] = [
  { value: "warm", label: "Warm & Personal", emoji: "💛" },
  { value: "hype", label: "High Energy", emoji: "🔥" },
  { value: "professional", label: "Professional", emoji: "🎯" },
  { value: "intimate", label: "Intimate", emoji: "🌙" },
  { value: "urgent", label: "Urgent / FOMO", emoji: "⚡" },
  { value: "storytelling", label: "Storytelling", emoji: "📖" },
];

export function EmailCampaignGenerator() {
  const { user } = useAuth();
  const narrativeCtx = useArtistNarrativeContext();
  const [step, setStep] = useState<"setup" | "audience" | "compose" | "preview">("setup");
  const [campaignType, setCampaignType] = useState<CampaignType>("fan");
  const [tone, setTone] = useState<ToneType>("warm");
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [context, setContext] = useState("");
  const [ctaText, setCTAText] = useState("");
  const [ctaUrl, setCTAUrl] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [generatedPlain, setGeneratedPlain] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingSubject, setGeneratingSubject] = useState(false);

  // Audience state
  const [segmentMode, setSegmentMode] = useState<"all" | "tag" | "city" | "source" | "custom">("all");
  const [selectedTag, setSelectedTag] = useState("__all__");
  const [selectedCity, setSelectedCity] = useState("__all__");
  const [selectedSource, setSelectedSource] = useState("__all__");
  const [excludeUnsubscribed, setExcludeUnsubscribed] = useState(true);
  const [manualExcludes, setManualExcludes] = useState<Set<string>>(new Set());

  // Personalization
  const [usePersonalization, setUsePersonalization] = useState(true);
  const [includeUnsubLink, setIncludeUnsubLink] = useState(true);

  // Fetch contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ["artist-contacts-campaign", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("artist_contacts")
        .select("id, email, first_name, last_name, city, source, subscribed, tags")
        .eq("artist_id", user.id)
        .order("imported_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Contact[];
    },
    enabled: !!user,
  });

  // Derived data
  const allTags = useMemo(() => Array.from(new Set(contacts.flatMap((c) => c.tags || []))), [contacts]);
  const allCities = useMemo(() => Array.from(new Set(contacts.map((c) => c.city).filter(Boolean) as string[])).sort(), [contacts]);
  const allSources = useMemo(() => Array.from(new Set(contacts.map((c) => c.source).filter(Boolean) as string[])), [contacts]);

  // Audience filtering
  const audience = useMemo(() => {
    let result = [...contacts];
    if (excludeUnsubscribed) result = result.filter((c) => c.subscribed !== false);
    switch (segmentMode) {
      case "tag":
        if (selectedTag !== "__all__") result = result.filter((c) => (c.tags || []).includes(selectedTag));
        break;
      case "city":
        if (selectedCity !== "__all__") result = result.filter((c) => c.city === selectedCity);
        break;
      case "source":
        if (selectedSource !== "__all__") result = result.filter((c) => c.source === selectedSource);
        break;
    }
    result = result.filter((c) => !manualExcludes.has(c.id));
    return result;
  }, [contacts, excludeUnsubscribed, segmentMode, selectedTag, selectedCity, selectedSource, manualExcludes]);

  const segmentLabel = useMemo(() => {
    if (segmentMode === "all") return "All Contacts";
    if (segmentMode === "tag" && selectedTag !== "__all__") return `Tag: ${selectedTag}`;
    if (segmentMode === "city" && selectedCity !== "__all__") return `City: ${selectedCity}`;
    if (segmentMode === "source" && selectedSource !== "__all__") return `Source: ${selectedSource}`;
    return "Custom Segment";
  }, [segmentMode, selectedTag, selectedCity, selectedSource]);

  // AI Generate Subject Line
  const generateSubject = async () => {
    if (!context.trim()) { toast.error("Add some context first"); return; }
    setGeneratingSubject(true);
    try {
      const serialized = serializeNarrativeContext(narrativeCtx);
      const { data, error } = await supabase.functions.invoke("campaign-brain", {
        body: {
          action: "generate-content",
          narrative_context: serialized,
          content_type: "caption",
          release_phase: narrativeCtx.releaseCycle.phase,
          extra_context: `Generate 1 email subject line for a ${campaignType} campaign with ${tone} tone. Context: ${context}. Return ONLY the subject line text, nothing else.`,
        },
      });
      if (error) throw error;
      const line = (typeof data?.result === "string" ? data.result : "").trim().replace(/^["']|["']$/g, "");
      setSubject(line);
      toast.success("Subject line generated from your story");
    } catch { toast.error("Failed to generate subject"); }
    finally { setGeneratingSubject(false); }
  };

  // AI Generate Full Email — uses full narrative context via campaign-brain
  const generateEmail = async () => {
    if (!context.trim()) { toast.error("Provide campaign details"); return; }
    setGenerating(true);
    setGeneratedHtml("");
    setGeneratedPlain("");

    const typeInfo = CAMPAIGN_TYPES.find((t) => t.value === campaignType);
    const toneInfo = TONES.find((t) => t.value === tone);
    const serialized = serializeNarrativeContext(narrativeCtx);

    const systemPrompt = `You are an elite music marketing copywriter. You have the artist's FULL story, metrics, and release cycle status.

CAMPAIGN TYPE: ${typeInfo?.label} — ${typeInfo?.desc}
TONE: ${toneInfo?.emoji} ${toneInfo?.label}
AUDIENCE SIZE: ${audience.length} contacts
SEGMENT: ${segmentLabel}

═══ ARTIST CONTEXT ═══
${serialized}

RULES:
- Write compelling, emotionally resonant copy that drives action
- Use the artist's authentic voice from their brand_voice and story
- Reference their actual releases, metrics, and tour dates when relevant
- ${usePersonalization ? "Use {{first_name}} placeholder for personalization (fallback to 'friend')" : "Do not use personalization placeholders"}
- ${ctaText ? `Include a clear CTA button with text "${ctaText}"${ctaUrl ? ` linking to ${ctaUrl}` : ""}` : "Include a compelling call-to-action"}
- Keep paragraphs short (2-3 sentences max)
- Format as clean HTML email with inline styles using a dark theme (background: #1a1a2e, text: #e0e0e0, accent: hsl(127, 100%, 60%))
- Include a preheader text suggestion
- Make it mobile-responsive
- ${includeUnsubLink ? "Include an unsubscribe link placeholder at the bottom: {{unsubscribe_link}}" : ""}

OUTPUT FORMAT:
Return a JSON object with exactly these fields:
{
  "subject": "suggested subject line if none provided",
  "preheader": "preheader text (50-100 chars)",
  "html": "full HTML email body with inline styles",
  "plain": "plain text version of the email"
}`;

    try {
      const res = await supabase.functions.invoke("campaign-brain", {
        body: {
          action: "email-campaign",
          narrative_context: serialized,
          release_phase: narrativeCtx.releaseCycle.phase,
          extra_context: `Campaign type: ${campaignType}\nTone: ${tone}\nSubject: ${subject || "(generate one)"}\nDetails: ${context}\n${ctaText ? `CTA: ${ctaText}` : ""}`,
        },
      });
      if (res.error) throw res.error;
      const raw = (typeof res.data?.result === "string" ? res.data.result : JSON.stringify(res.data?.result)).trim();

      // Try to parse JSON
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (!subject && parsed.subject) setSubject(parsed.subject);
          if (!preheader && parsed.preheader) setPreheader(parsed.preheader);
          setGeneratedHtml(parsed.html || "");
          setGeneratedPlain(parsed.plain || raw);
        } else {
          setGeneratedPlain(raw);
          setGeneratedHtml(`<div style="font-family: Arial, sans-serif; color: #e0e0e0; background: #1a1a2e; padding: 32px;">${raw.replace(/\n/g, "<br/>")}</div>`);
        }
      } catch {
        setGeneratedPlain(raw);
        setGeneratedHtml(`<div style="font-family: Arial, sans-serif; color: #e0e0e0; background: #1a1a2e; padding: 32px;">${raw.replace(/\n/g, "<br/>")}</div>`);
      }
      setStep("preview");
      toast.success("Campaign email generated with your full story context!");
    } catch {
      toast.error("Failed to generate email");
    } finally {
      setGenerating(false);
    }
  };

  // Export functions
  const exportMailchimpCSV = () => {
    const rows = audience.map((c) => [
      c.email,
      c.first_name || "",
      c.last_name || "",
      c.city || "",
      (c.tags || []).join(";"),
    ]);
    const csv = ["Email Address,First Name,Last Name,City,Tags", ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    downloadFile(csv, `mailchimp-import-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv");
    toast.success("Mailchimp CSV exported");
  };

  const exportSendGridCSV = () => {
    const rows = audience.map((c) => [
      c.email,
      c.first_name || "",
      c.last_name || "",
      c.city || "",
    ]);
    const csv = ["email,first_name,last_name,city", ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    downloadFile(csv, `sendgrid-import-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv");
    toast.success("SendGrid CSV exported");
  };

  const exportMailgunCSV = () => {
    const rows = audience.map((c) => [
      `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email.split("@")[0],
      c.email,
    ]);
    const csv = ["name,address", ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    downloadFile(csv, `mailgun-import-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv");
    toast.success("Mailgun CSV exported");
  };

  const exportHTML = () => {
    downloadFile(generatedHtml, `campaign-${format(new Date(), "yyyy-MM-dd")}.html`, "text/html");
    toast.success("HTML template exported");
  };

  const exportPlainText = () => {
    downloadFile(generatedPlain || generatedHtml.replace(/<[^>]+>/g, ""), `campaign-${format(new Date(), "yyyy-MM-dd")}.txt`, "text/plain");
    toast.success("Plain text exported");
  };

  const copyHtml = () => {
    navigator.clipboard.writeText(generatedHtml);
    toast.success("HTML copied to clipboard");
  };

  const copyPlain = () => {
    navigator.clipboard.writeText(generatedPlain || generatedHtml.replace(/<[^>]+>/g, ""));
    toast.success("Plain text copied to clipboard");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const steps = [
    { key: "setup", label: "Campaign", icon: Palette },
    { key: "audience", label: "Audience", icon: Users },
    { key: "compose", label: "Compose", icon: Wand2 },
    { key: "preview", label: "Preview & Export", icon: Send },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Campaign Studio
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Draft personalized campaigns, segment your audience, and export for any email service
          </p>
        </div>
        <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
          <Users className="w-3 h-3" />
          {contacts.length} contacts
        </Badge>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                step === s.key
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground/40" />}
          </div>
        ))}
      </div>

      {/* Step: Setup */}
      {step === "setup" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Campaign Type Selection */}
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Campaign Type
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {CAMPAIGN_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setCampaignType(t.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    campaignType === t.value
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                      : "border-border/20 bg-muted/10 hover:border-border/40"
                  }`}
                >
                  <t.icon className={`w-5 h-5 mb-2 ${campaignType === t.value ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Tone Selection */}
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Type className="w-5 h-5 text-primary" />
                Voice & Tone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      tone === t.value
                        ? "border-primary bg-primary/5"
                        : "border-border/20 bg-muted/10 hover:border-border/40"
                    }`}
                  >
                    <span className="text-lg">{t.emoji}</span>
                    <p className="text-sm font-medium mt-1">{t.label}</p>
                  </button>
                ))}
              </div>

              <Separator className="bg-border/20" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Personalization ({"{{first_name}}"})
                  </Label>
                  <Switch checked={usePersonalization} onCheckedChange={setUsePersonalization} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Link className="w-4 h-4 text-muted-foreground" />
                    Include unsubscribe link
                  </Label>
                  <Switch checked={includeUnsubLink} onCheckedChange={setIncludeUnsubLink} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 flex justify-end">
            <Button onClick={() => setStep("audience")} className="gap-2">
              Next: Select Audience <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Audience */}
      {step === "audience" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-card/50 border-border/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  Segment Audience
                </CardTitle>
                <CardDescription>Choose who receives this campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={segmentMode} onValueChange={(v) => setSegmentMode(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contacts</SelectItem>
                    <SelectItem value="tag">By Tag</SelectItem>
                    <SelectItem value="city">By City</SelectItem>
                    <SelectItem value="source">By Source</SelectItem>
                  </SelectContent>
                </Select>

                {segmentMode === "tag" && (
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger><SelectValue placeholder="Select tag" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Tags</SelectItem>
                      {allTags.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                {segmentMode === "city" && (
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Cities</SelectItem>
                      {allCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                {segmentMode === "source" && (
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Sources</SelectItem>
                      {allSources.map((s) => <SelectItem key={s} value={s}>{s === "csv_import" ? "CSV Import" : s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Label className="text-sm">Exclude unsubscribed</Label>
                  <Switch checked={excludeUnsubscribed} onCheckedChange={setExcludeUnsubscribed} />
                </div>

                <Separator className="bg-border/20" />

                {/* Audience Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total pool</span>
                    <span className="font-medium">{contacts.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Filtered</span>
                    <span className="font-medium text-primary">{audience.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Excluded</span>
                    <span className="font-medium">{manualExcludes.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Segment</span>
                    <Badge variant="secondary" className="text-[10px]">{segmentLabel}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-card/50 border-border/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Recipients ({audience.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    {audience.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-muted-foreground">No contacts match this segment. Adjust your filters or import contacts.</p>
                      </div>
                    ) : (
                      audience.map((c) => (
                        <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/10 transition-colors">
                          <Checkbox
                            checked={!manualExcludes.has(c.id)}
                            onCheckedChange={(checked) => {
                              setManualExcludes((prev) => {
                                const next = new Set(prev);
                                if (checked) next.delete(c.id);
                                else next.add(c.id);
                                return next;
                              });
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {c.first_name || c.last_name
                                ? `${c.first_name || ""} ${c.last_name || ""}`.trim()
                                : c.email.split("@")[0]}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          </div>
                          {c.city && (
                            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">{c.city}</Badge>
                          )}
                          {(c.tags || []).slice(0, 1).map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px] hidden md:inline-flex">{t}</Badge>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep("setup")} className="gap-2">Back</Button>
              <Button onClick={() => setStep("compose")} disabled={audience.length === 0} className="gap-2">
                Next: Compose <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Compose */}
      {step === "compose" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Campaign Details
              </CardTitle>
              <CardDescription>
                Provide details and let AI craft your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Subject Line</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter or generate with AI..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={generateSubject}
                    disabled={generatingSubject}
                    title="AI Generate Subject"
                  >
                    {generatingSubject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm">Preheader Text</Label>
                <Input
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="Preview text shown in inbox..."
                  className="mt-1"
                  maxLength={150}
                />
                <p className="text-[11px] text-muted-foreground mt-1">{preheader.length}/150 characters</p>
              </div>

              <div>
                <Label className="text-sm">Campaign Context & Details</Label>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={6}
                  className="mt-1"
                  placeholder={
                    campaignType === "release"
                      ? "Describe the release: song/album name, genre, inspiration, streaming links, release date..."
                      : campaignType === "tour"
                      ? "List tour dates, cities, venues, ticket links, special guests..."
                      : campaignType === "press"
                      ? "Artist name, achievements, key stats, quotes, release details, press kit link..."
                      : "What do you want to tell your fans? Include links, dates, special offers..."
                  }
                />
              </div>

              <Separator className="bg-border/20" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">CTA Button Text</Label>
                  <Input
                    value={ctaText}
                    onChange={(e) => setCTAText(e.target.value)}
                    placeholder="Listen Now"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">CTA Link URL</Label>
                  <Input
                    value={ctaUrl}
                    onChange={(e) => setCTAUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
              </div>

              <Button onClick={generateEmail} disabled={generating || !context.trim()} className="w-full gap-2" size="lg">
                {generating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Crafting Campaign...</>
                ) : (
                  <><Wand2 className="w-5 h-5" /> Generate with AI</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Summary sidebar */}
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Campaign Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { label: "Type", value: CAMPAIGN_TYPES.find((t) => t.value === campaignType)?.label || "" },
                  { label: "Tone", value: `${TONES.find((t) => t.value === tone)?.emoji} ${TONES.find((t) => t.value === tone)?.label}` },
                  { label: "Segment", value: segmentLabel },
                  { label: "Recipients", value: `${audience.length} contacts` },
                  { label: "Personalization", value: usePersonalization ? "Enabled" : "Disabled" },
                  { label: "Subject", value: subject || "(will be generated)" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-border/10">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-medium text-right max-w-[60%] truncate">{row.value}</span>
                  </div>
                ))}
              </div>

              <Separator className="bg-border/20" />

              <div className="bg-muted/10 rounded-xl p-4 border border-border/20">
                <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Audience Breakdown</p>
                <div className="space-y-1">
                  {Object.entries(
                    audience.reduce((acc: Record<string, number>, c) => {
                      const city = c.city || "Unknown";
                      acc[city] = (acc[city] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([city, count]) => (
                      <div key={city} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{city}</span>
                        <span className="font-medium">{count as number}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setStep("audience")}>Back</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Preview & Export */}
      {step === "preview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="bg-card/50 border-border/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Email Preview
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={generateEmail} disabled={generating} className="gap-1">
                      <RefreshCw className={`w-3 h-3 ${generating ? "animate-spin" : ""}`} />
                      Regenerate
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyHtml} className="gap-1">
                      <Copy className="w-3 h-3" /> Copy HTML
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="visual">
                  <TabsList className="bg-muted/30 mb-4">
                    <TabsTrigger value="visual" className="gap-1 text-xs"><Eye className="w-3 h-3" /> Visual</TabsTrigger>
                    <TabsTrigger value="html" className="gap-1 text-xs"><FileText className="w-3 h-3" /> HTML</TabsTrigger>
                    <TabsTrigger value="plain" className="gap-1 text-xs"><Type className="w-3 h-3" /> Plain Text</TabsTrigger>
                  </TabsList>
                  <TabsContent value="visual">
                    <div className="rounded-xl border border-border/30 overflow-hidden bg-background">
                      {subject && (
                        <div className="px-4 py-3 border-b border-border/20 bg-muted/10">
                          <p className="text-xs text-muted-foreground mb-0.5">Subject</p>
                          <p className="text-sm font-semibold">{subject}</p>
                          {preheader && <p className="text-xs text-muted-foreground mt-1">{preheader}</p>}
                        </div>
                      )}
                      <div
                        className="p-4 max-h-[500px] overflow-y-auto"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(generatedHtml, {
                            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
                            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
                          }),
                        }}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="html">
                    <ScrollArea className="h-[500px]">
                      <pre className="text-xs p-4 bg-muted/10 rounded-xl border border-border/20 whitespace-pre-wrap font-mono">
                        {generatedHtml}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="plain">
                    <ScrollArea className="h-[500px]">
                      <pre className="text-sm p-4 bg-muted/10 rounded-xl border border-border/20 whitespace-pre-wrap">
                        {generatedPlain || generatedHtml.replace(/<[^>]+>/g, "")}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Export Sidebar */}
          <div className="space-y-4">
            <Card className="bg-card/50 border-border/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Export Campaign
                </CardTitle>
                <CardDescription>
                  Export your audience list and email template for your preferred service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Audience Lists</p>

                <Button variant="outline" onClick={exportMailchimpCSV} className="w-full justify-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Mailchimp CSV</p>
                    <p className="text-[11px] text-muted-foreground">{audience.length} contacts</p>
                  </div>
                </Button>

                <Button variant="outline" onClick={exportSendGridCSV} className="w-full justify-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Send className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">SendGrid CSV</p>
                    <p className="text-[11px] text-muted-foreground">{audience.length} contacts</p>
                  </div>
                </Button>

                <Button variant="outline" onClick={exportMailgunCSV} className="w-full justify-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Mailgun CSV</p>
                    <p className="text-[11px] text-muted-foreground">{audience.length} contacts</p>
                  </div>
                </Button>

                <Separator className="bg-border/20" />

                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Email Template</p>

                <Button variant="outline" onClick={exportHTML} className="w-full justify-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">HTML Template</p>
                    <p className="text-[11px] text-muted-foreground">Paste into any email service</p>
                  </div>
                </Button>

                <Button variant="outline" onClick={exportPlainText} className="w-full justify-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                    <Type className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Plain Text</p>
                    <p className="text-[11px] text-muted-foreground">Fallback / accessibility version</p>
                  </div>
                </Button>

                <Button variant="outline" onClick={copyPlain} className="w-full justify-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Copy All to Clipboard</p>
                    <p className="text-[11px] text-muted-foreground">Quick paste anywhere</p>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/30 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Ready to send</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Import the audience CSV into your email service, paste the HTML template, and send!
                  </p>
                </div>
              </div>
            </Card>

            <Button variant="outline" onClick={() => setStep("compose")} className="w-full gap-2">
              ← Back to Compose
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
