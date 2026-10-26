import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, Music, TrendingUp, DollarSign, Users, 
  Loader2, Send, BarChart3, Zap, Scale, Megaphone,
  Sparkles, ArrowLeft, MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

/* ── Department Definitions (Major Label Structure) ── */
const DEPARTMENTS = [
  {
    id: "ar",
    name: "A&R",
    fullName: "Artists & Repertoire",
    head: "Maya Rodriguez",
    title: "A&R Director",
    avatar: "⚛️",
    gradient: "linear-gradient(135deg, #8B5CF6, #A855F7)",
    icon: Music,
    expertise: ["Track Analysis", "Release Strategy", "Talent Development", "Genre Positioning"],
    systemContext: "You are Maya Rodriguez, Head of A&R at TDZ — a major label A&R director. Analyze tracks, plan releases, develop talent, and advise on genre positioning. Be specific about release timing, single selection, and album sequencing.",
  },
  {
    id: "marketing",
    name: "Marketing",
    fullName: "Marketing & Promo",
    head: "Jordan Chen",
    title: "CMO",
    avatar: "🔮",
    gradient: "linear-gradient(135deg, #06B6D4, #0EA5E9)",
    icon: Megaphone,
    expertise: ["Campaign Strategy", "Content Planning", "Playlist Pitching", "Social Strategy"],
    systemContext: "You are Jordan Chen, CMO at TDZ. Plan marketing campaigns, social media strategies, playlist pitching, content calendars, and viral strategies. Give specific actionable plans with timelines.",
  },
  {
    id: "finance",
    name: "Finance",
    fullName: "Finance & Revenue",
    head: "Victoria Sterling",
    title: "CFO",
    avatar: "💎",
    gradient: "linear-gradient(135deg, #22C55E, #10B981)",
    icon: DollarSign,
    expertise: ["Revenue Analysis", "Payout Optimization", "Pricing Strategy", "Financial Planning"],
    systemContext: "You are Victoria Sterling, CFO at TDZ. Analyze revenue streams, optimize pricing, plan financial strategy, manage payout projections. TDZ pays $1 per stream. Be data-driven with specific numbers.",
  },
  {
    id: "legal",
    name: "Legal",
    fullName: "Legal & Compliance",
    head: "Marcus Chen-Williams",
    title: "General Counsel",
    avatar: "⚖️",
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
    icon: Scale,
    expertise: ["Copyright", "Contracts", "Licensing", "DMCA Compliance"],
    systemContext: "You are Marcus Chen-Williams, General Counsel at TDZ. Advise on music licensing, copyright, artist contracts, DMCA compliance, AI music legal landscape, and platform terms. Note that guidance is informational, not legal advice.",
  },
  {
    id: "analytics",
    name: "Data",
    fullName: "Data & Intelligence",
    head: "Dr. Kai Nakamura",
    title: "Chief Data Officer",
    avatar: "📊",
    gradient: "linear-gradient(135deg, #EC4899, #F43F5E)",
    icon: BarChart3,
    expertise: ["Fan Demographics", "Trend Analysis", "Growth Forecasting", "Market Intelligence"],
    systemContext: "You are Dr. Kai Nakamura, Chief Data Officer at TDZ. Provide deep data analysis — fan demographics, streaming trends, market intelligence, growth forecasting, and competitive positioning. Use the artist's real metrics.",
  },
  {
    id: "production",
    name: "Production",
    fullName: "Production & Sound",
    head: "Sam Rivera",
    title: "Head of Production",
    avatar: "🎛️",
    gradient: "linear-gradient(135deg, #F97316, #EAB308)",
    icon: Sparkles,
    expertise: ["Sound Quality", "Mixing Feedback", "Master Analysis", "Production Trends"],
    systemContext: "You are Sam Rivera, Head of Production at TDZ. Analyze production quality, provide mixing and mastering feedback, identify production trends, suggest sonic improvements, and advise on audio engineering best practices.",
  },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

type DeptConversations = Record<string, Message[]>;

export function StudioAgentPanel() {
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [conversations, setConversations] = useState<DeptConversations>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dept = DEPARTMENTS.find(d => d.id === activeDept);
  const messages = activeDept ? (conversations[activeDept] || []) : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !activeDept || !dept) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setConversations(prev => ({ ...prev, [activeDept]: newMessages }));
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("agent-orchestrator", {
        body: { 
          messages: newMessages,
          context: `Department: ${dept.fullName}. Role: ${dept.head}, ${dept.title}. ${dept.systemContext}`
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setConversations(prev => ({
        ...prev,
        [activeDept]: [...newMessages, { role: "assistant" as const, content: data.response }],
      }));
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

  /* ── Department Grid (Home View) ── */
  if (!activeDept) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6347, #8B5CF6)" }}>
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em", fontSize: "2rem" }}>LABEL HQ</h1>
              <p style={{ fontFamily: "'Raleway', sans-serif" }} className="text-muted-foreground text-sm">Your AI-powered label team — every department at your service</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DEPARTMENTS.map(d => {
            const Icon = d.icon;
            const hasHistory = (conversations[d.id] || []).length > 0;
            return (
              <button
                key={d.id}
                onClick={() => setActiveDept(d.id)}
                className="group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: d.gradient }} />
                
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: d.gradient }}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {hasHistory && (
                    <div className="h-2 w-2 rounded-full" style={{ background: "#22C55E" }} />
                  )}
                </div>

                <h3 className="font-body text-sm font-bold mb-0.5" style={{ color: "var(--text-1)" }}>{d.fullName}</h3>
                <p className="font-body text-xs mb-3" style={{ color: "var(--text-3)" }}>
                  {d.head} · {d.title}
                </p>

                <div className="flex flex-wrap gap-1">
                  {d.expertise.slice(0, 2).map(e => (
                    <span key={e} className="px-2 py-0.5 rounded-full font-body" style={{
                      fontSize: 9, fontWeight: 600, background: "rgba(255,255,255,0.06)", color: "var(--text-4)",
                    }}>{e}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick-start prompts */}
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-body text-xs font-semibold mb-3" style={{ color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Quick Start</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { dept: "ar", prompt: "Should I release my next track as a single or hold it for an EP?" },
              { dept: "marketing", prompt: "Build me a 30-day pre-release campaign plan" },
              { dept: "finance", prompt: "Analyze my revenue and suggest how to 2x it" },
              { dept: "analytics", prompt: "Where are my fans and how do I reach more?" },
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => { setActiveDept(q.dept); setTimeout(() => sendMessage(q.prompt), 100); }}
                className="text-left px-3 py-2.5 rounded-lg transition-colors font-body text-xs"
                style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-2)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span style={{ color: "var(--text-4)" }}>{DEPARTMENTS.find(d => d.id === q.dept)?.name}:</span>{" "}
                {q.prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Department Chat View ── */
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => setActiveDept(null)} className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-2)", background: "rgba(255,255,255,0.04)" }}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center text-lg" style={{ background: dept.gradient }}>
          {dept.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-body text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>{dept.head}</h2>
          <p className="font-body text-xs truncate" style={{ color: "var(--text-3)" }}>{dept.title} · {dept.fullName}</p>
        </div>
        <div className="flex gap-1">
          {dept.expertise.slice(0, 3).map(e => (
            <span key={e} className="hidden md:inline px-2 py-0.5 rounded-full font-body" style={{
              fontSize: 9, fontWeight: 600, background: "rgba(255,255,255,0.06)", color: "var(--text-4)",
            }}>{e}</span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 scrollbar-hide pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ background: dept.gradient }}>
              {dept.avatar}
            </div>
            <h3 className="font-body text-base font-bold mb-1" style={{ color: "var(--text-1)" }}>
              {dept.head}
            </h3>
            <p className="font-body text-xs mb-6" style={{ color: "var(--text-3)", maxWidth: 320 }}>
              {dept.title} — Ask me anything about {dept.expertise.join(", ").toLowerCase()}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
              {dept.expertise.map(e => (
                <button
                  key={e}
                  onClick={() => sendMessage(`Help me with ${e.toLowerCase()} for my music career.`)}
                  className="px-3 py-2 rounded-lg font-body text-xs text-left transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-2)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <MessageSquare className="h-3 w-3 inline mr-1.5 opacity-50" />
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3"
              style={{
                background: msg.role === "user" ? dept.gradient : "rgba(255,255,255,0.05)",
                border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&_p]:text-sm [&_li]:text-sm [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm">
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
                <span className="text-sm" style={{ color: "var(--text-3)" }}>{dept.head} is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Message ${dept.head}...`}
          className="resize-none min-h-[48px] max-h-[120px] bg-background/50 border-border"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="h-12 w-12 rounded-xl flex-shrink-0"
          style={{ background: dept.gradient }}
        >
          <Send className="h-4 w-4 text-white" />
        </Button>
      </div>
    </div>
  );
}
