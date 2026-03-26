import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  eventId: string;
}

export function QuestionsDialog({ eventId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [cannedQuestions, setCannedQuestions] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // New question form
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("text");
  const [qRequired, setQRequired] = useState(false);
  const [qRespondent, setQRespondent] = useState("attendee");
  const [choices, setChoices] = useState<string[]>([""]);

  useEffect(() => {
    if (!open || !eventId) return;
    setLoading(true);
    Promise.all([
      supabase.functions.invoke("eventbrite-api", {
        body: { action: "list_questions", event_id: eventId },
      }),
      supabase.functions.invoke("eventbrite-api", {
        body: { action: "list_canned_questions", event_id: eventId },
      }),
    ]).then(([customRes, cannedRes]) => {
      if (customRes.data?.success) setQuestions(customRes.data.data.questions || []);
      if (cannedRes.data?.success) setCannedQuestions(cannedRes.data.data.questions || []);
      setLoading(false);
    });
  }, [open, eventId]);

  const handleAddQuestion = async () => {
    if (!qText.trim()) { toast.error("Question text required"); return; }
    setSaving(true);
    try {
      const body: any = {
        action: "create_question",
        event_id: eventId,
        question_text: qText,
        type: qType,
        required: qRequired,
        respondent: qRespondent,
      };
      if (["radio", "checkbox", "dropdown"].includes(qType)) {
        body.choices = choices.filter(c => c.trim());
      }
      const { data, error } = await supabase.functions.invoke("eventbrite-api", { body });
      if (error || !data?.success) throw new Error(data?.error || "Failed to create question");
      toast.success("Question added");
      setShowAdd(false);
      setQText(""); setQType("text"); setQRequired(false); setChoices([""]);
      // Reload
      const { data: refreshed } = await supabase.functions.invoke("eventbrite-api", {
        body: { action: "list_questions", event_id: eventId },
      });
      if (refreshed?.success) setQuestions(refreshed.data.questions || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Checkout Questions">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" /> Checkout Questions
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Default questions */}
            {cannedQuestions.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Default Questions</h4>
                {cannedQuestions.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between p-2 rounded bg-muted/10 text-sm">
                    <span>{q.question?.text || q.id}</span>
                    <div className="flex gap-1">
                      {q.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                      <Badge className="text-xs">{q.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Custom questions */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Custom Questions</h4>
                <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-1 h-7 text-xs">
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
              {questions.length === 0 && !showAdd && (
                <p className="text-muted-foreground text-sm py-2 text-center">No custom questions</p>
              )}
              {questions.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between p-2 rounded bg-muted/10 text-sm">
                  <span>{q.question?.text || "Question"}</span>
                  <div className="flex gap-1">
                    {q.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                    <Badge className="text-xs">{q.type}</Badge>
                    <Badge variant="secondary" className="text-xs">{q.respondent}</Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Add question form */}
            {showAdd && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <div>
                  <Label>Question Text</Label>
                  <Input value={qText} onChange={(e) => setQText(e.target.value)} className="mt-1" placeholder="e.g. Do you have dietary restrictions?" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={qType} onValueChange={setQType}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="radio">Radio (single choice)</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="dropdown">Dropdown</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ask</Label>
                    <Select value={qRespondent} onValueChange={setQRespondent}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attendee">Each Attendee</SelectItem>
                        <SelectItem value="ticket_buyer">Ticket Buyer Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {["radio", "checkbox", "dropdown"].includes(qType) && (
                  <div className="space-y-2">
                    <Label>Choices</Label>
                    {choices.map((c, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={c} onChange={(e) => {
                          const updated = [...choices];
                          updated[i] = e.target.value;
                          setChoices(updated);
                        }} placeholder={`Choice ${i + 1}`} />
                        {choices.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => setChoices(choices.filter((_, j) => j !== i))}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setChoices([...choices, ""])} className="text-xs">
                      + Add Choice
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Required</Label>
                  <Switch checked={qRequired} onCheckedChange={setQRequired} />
                </div>

                <Button onClick={handleAddQuestion} disabled={saving} className="w-full gap-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? "Creating..." : "Create Question"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
