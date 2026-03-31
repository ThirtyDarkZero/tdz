import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, Sparkles, TrendingUp, Users, DollarSign, Music, 
  Target, Loader2, Send, BarChart3, Zap, MapPin 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const QUICK_ACTIONS = [
  { id: "analytics", label: "My Analytics", icon: BarChart3, prompt: "Show me my current analytics — streams, revenue, top tracks, and growth trends." },
  { id: "release", label: "Release Strategy", icon: Music, prompt: "I'm planning a new release. Help me build a strategy with timeline, marketing, and content plan." },
  { id: "revenue", label: "Optimize Revenue", icon: DollarSign, prompt: "Analyze my current revenue streams and give me specific strategies to increase my earnings." },
  { id: "fans", label: "Fan Insights", icon: Users, prompt: "Deep dive into my fan engagement — who are my super fans, where are my listeners, and how can I grow?" },
  { id: "momentum", label: "Boost Momentum", icon: Zap, prompt: "What's my current momentum score and what specific actions should I take this week to boost it?" },
  { id: "marketing", label: "Marketing Content", icon: Target, prompt: "Generate marketing content for me — captions, email drafts, and promo ideas based on my brand." },
  { id: "tour", label: "Tour Planning", icon: MapPin, prompt: "Based on my fan geography, where should I play shows? Give me venue recommendations and routing." },
  { id: "growth", label: "Growth Audit", icon: TrendingUp, prompt: "Perform a full growth audit of my career — strengths, weaknesses, and a 30-day action plan." },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function StudioAgentPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("agent-orchestrator", {
        body: { messages: newMessages },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (err: any) {
      const msg = err.message || "Agent failed";
      if (msg.includes("Rate limited") || msg.includes("429")) {
        toast.error("Rate limited — please wait a moment.");
      } else if (msg.includes("credits") || msg.includes("402")) {
        toast.error("AI credits exhausted.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6347, #8B5CF6)" }}>
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em", fontSize: "2rem" }}>AI Studio Agent</h1>
            <p style={{ fontFamily: "'Raleway', sans-serif" }} className="text-muted-foreground text-sm">Your AI-powered music strategist with real-time data access</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => sendMessage(action.prompt)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <action.icon className="h-5 w-5" style={{ color: "#FF6347" }} />
              <span className="font-body text-xs font-semibold" style={{ color: "var(--text-2)" }}>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3"
              style={{
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #FF6347, #E55337)"
                  : "rgba(255,255,255,0.05)",
                border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-white">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#FF6347" }} />
                <span className="text-sm" style={{ color: "var(--text-3)" }}>Analyzing your data...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask your AI agent anything about your music career..."
          className="resize-none min-h-[48px] max-h-[120px] bg-background/50 border-border"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="h-12 w-12 rounded-xl flex-shrink-0"
          style={{ background: "#FF6347" }}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
