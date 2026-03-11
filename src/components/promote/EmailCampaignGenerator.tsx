import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Newspaper, Sparkles, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function EmailCampaignGenerator() {
  const [mode, setMode] = useState<"fan" | "press">("fan");
  const [subject, setSubject] = useState("");
  const [context, setContext] = useState("");
  const [generated, setGenerated] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!context.trim()) { toast.error("Provide some context for the email"); return; }
    setGenerating(true);
    setGenerated("");

    try {
      const systemPrompt = mode === "fan"
        ? "You are a music marketing copywriter. Write a compelling fan engagement email for an independent artist. Keep it personal, warm, and include a clear call-to-action. Format in HTML with inline styles."
        : "You are a music PR specialist. Write a professional press release email for an independent artist. Include key details, quotes, and a professional sign-off. Format in HTML with inline styles.";

      const res = await supabase.functions.invoke("exec-agent-chat", {
        body: {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Subject: ${subject || "New Release"}\nContext: ${context}` },
          ],
        },
      });

      if (res.error) throw res.error;
      setGenerated(res.data?.response || res.data?.content || "Failed to generate. Try again.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate email");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generated);
    toast.success("Copied to clipboard");
  };

  return (
    <Card style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sparkles className="w-5 h-5" /> AI Email Campaign Generator
        </CardTitle>
        <CardDescription>Generate professional emails with AI</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "fan" | "press")}>
          <TabsList className="bg-muted/30">
            <TabsTrigger value="fan" className="gap-1"><Mail className="w-3 h-3" /> Fan Email</TabsTrigger>
            <TabsTrigger value="press" className="gap-1"><Newspaper className="w-3 h-3" /> Press Release</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          <div>
            <Label>Subject Line</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={mode === "fan" ? "🎵 New Music Just Dropped!" : "FOR IMMEDIATE RELEASE: [Artist] Announces..."} className="mt-1" />
          </div>
          <div>
            <Label>Context & Details</Label>
            <Textarea value={context} onChange={(e) => setContext(e.target.value)} rows={4} className="mt-1"
              placeholder={mode === "fan" ? "Tell us about the release, upcoming shows, or message to fans..." : "Artist name, release details, key achievements, streaming links..."} />
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            <Sparkles className="w-4 h-4" /> {generating ? "Generating..." : "Generate Email"}
          </Button>
        </div>

        {generated && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Generated Email</Label>
              <Button variant="ghost" size="sm" onClick={copyToClipboard} className="gap-1">
                <Copy className="w-3 h-3" /> Copy
              </Button>
            </div>
            <div className="p-4 rounded-xl bg-muted/20 border border-border/30 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto" style={{ color: "rgba(255,255,255,0.85)" }}>
              {generated}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
