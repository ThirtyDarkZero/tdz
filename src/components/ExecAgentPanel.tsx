import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send, Loader2, DollarSign, Scale, Sparkles, TrendingUp, AlertTriangle,
  Save, Trash2, Plus, History, FileText, Mail, Download, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type Conversation = {
  id: string;
  agent_type: string;
  title: string;
  created_at: string;
  messages: Message[];
};

type ExecAgent = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  icon: any;
  expertise: string[];
};

const execAgents: ExecAgent[] = [
  {
    id: "cfo",
    name: "Victoria Sterling",
    role: "Chief Financial Officer",
    avatar: "💰",
    color: "from-emerald-500 to-teal-500",
    icon: DollarSign,
    expertise: ["Revenue Pool", "Burn Rate", "ARPS", "Investor Relations", "Financial Projections"],
  },
  {
    id: "legal_counsel",
    name: "Marcus Chen-Williams",
    role: "General Counsel",
    avatar: "⚖️",
    color: "from-indigo-500 to-purple-500",
    icon: Scale,
    expertise: ["Contracts", "IP Rights", "Compliance", "Risk Assessment", "AI Music Law"],
  },
];

export const ExecAgentPanel = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>(execAgents[0].id);
  const [conversations, setConversations] = useState<Record<string, Conversation[]>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentAgent = execAgents.find(a => a.id === selectedAgent)!;

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages]);

  useEffect(() => {
    // Reset current messages when switching agents
    setCurrentMessages([]);
    setActiveConversationId(null);
  }, [selectedAgent]);

  const loadConversations = async () => {
    try {
      const { data: convData, error: convError } = await supabase
        .from('exec_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      const convsByAgent: Record<string, Conversation[]> = {};
      
      for (const conv of convData || []) {
        const { data: msgData } = await supabase
          .from('exec_messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('timestamp', { ascending: true });

        const conversation: Conversation = {
          id: conv.id,
          agent_type: conv.agent_type,
          title: conv.title,
          created_at: conv.created_at,
          messages: (msgData || []).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp
          }))
        };

        if (!convsByAgent[conv.agent_type]) {
          convsByAgent[conv.agent_type] = [];
        }
        convsByAgent[conv.agent_type].push(conversation);
      }

      setConversations(convsByAgent);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const startNewConversation = async () => {
    setCurrentMessages([]);
    setActiveConversationId(null);
    setShowHistory(false);
  };

  const loadConversation = (conv: Conversation) => {
    setCurrentMessages(conv.messages);
    setActiveConversationId(conv.id);
    setShowHistory(false);
  };

  const saveConversation = async () => {
    if (currentMessages.length === 0) {
      toast.error("No messages to save");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const title = currentMessages[0]?.content.slice(0, 50) + "..." || "New Conversation";

      if (activeConversationId) {
        // Update existing
        for (const msg of currentMessages) {
          const { data: existing } = await supabase
            .from('exec_messages')
            .select('id')
            .eq('conversation_id', activeConversationId)
            .eq('timestamp', msg.timestamp)
            .single();

          if (!existing) {
            await supabase.from('exec_messages').insert({
              conversation_id: activeConversationId,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp
            });
          }
        }
        toast.success("Conversation updated");
      } else {
        // Create new
        const { data: newConv, error: convError } = await supabase
          .from('exec_conversations')
          .insert({
            user_id: user.id,
            agent_type: selectedAgent,
            title
          })
          .select()
          .single();

        if (convError) throw convError;

        for (const msg of currentMessages) {
          await supabase.from('exec_messages').insert({
            conversation_id: newConv.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          });
        }

        setActiveConversationId(newConv.id);
        toast.success("Conversation saved");
      }

      loadConversations();
    } catch (error) {
      console.error('Save error:', error);
      toast.error("Failed to save conversation");
    }
  };

  const deleteConversation = async (convId: string) => {
    try {
      await supabase.from('exec_conversations').delete().eq('id', convId);
      if (activeConversationId === convId) {
        setCurrentMessages([]);
        setActiveConversationId(null);
      }
      loadConversations();
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const exportToPDF = () => {
    if (currentMessages.length === 0) {
      toast.error("No messages to export");
      return;
    }

    const content = currentMessages.map(m => 
      `[${m.role.toUpperCase()}] ${new Date(m.timestamp).toLocaleString()}\n${m.content}\n\n`
    ).join('---\n\n');

    const blob = new Blob([
      `TDZ Executive Advisory Report\n`,
      `Agent: ${currentAgent.name} (${currentAgent.role})\n`,
      `Date: ${new Date().toLocaleString()}\n`,
      `${'='.repeat(50)}\n\n`,
      content
    ], { type: 'text/plain' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TDZ-${currentAgent.id}-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  const sendEmail = async () => {
    if (currentMessages.length === 0) {
      toast.error("No messages to send");
      return;
    }
    toast.info("Email report feature - configure RESEND_API_KEY in secrets to enable");
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setCurrentMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to chat with executive agents");
        setIsLoading(false);
        return;
      }

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exec-agent-chat`;
      
      const allMessages = [...currentMessages, userMessage];
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          agentType: selectedAgent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          toast.error("Access denied. Executive agents are CEO-only.");
        } else if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else {
          toast.error(errorData.error || "Failed to get response");
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      const updateAssistantMessage = (content: string) => {
        setCurrentMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          
          if (lastMessage?.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content },
            ];
          }
          
          return [
            ...prev,
            { role: "assistant", content, timestamp: Date.now() },
          ];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              updateAssistantMessage(assistantMessage);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const agentConversations = conversations[selectedAgent] || [];

  return (
    <Card className="h-[600px] flex flex-col bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-primary/20 shadow-2xl shadow-primary/10">
      {/* Header with glow effect */}
      <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <div className="absolute inset-0 w-5 h-5 bg-primary/30 blur-md rounded-full" />
            </div>
            <h3 className="font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Executive Advisory
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              className="hover:bg-primary/10"
            >
              <History className="w-4 h-4" />
            </Button>
            <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5">
              CEO Only
            </Badge>
          </div>
        </div>
        
        <Tabs value={selectedAgent} onValueChange={setSelectedAgent}>
          <TabsList className="grid w-full grid-cols-2 bg-background/50">
            {execAgents.map(agent => (
              <TabsTrigger key={agent.id} value={agent.id} className="text-xs data-[state=active]:bg-primary/20">
                <span className="mr-1">{agent.avatar}</span>
                {agent.role.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Agent Info with animated gradient */}
      <div className={`p-3 bg-gradient-to-r ${currentAgent.color} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="text-4xl drop-shadow-lg">{currentAgent.avatar}</div>
          <div>
            <h4 className="font-bold text-lg">{currentAgent.name}</h4>
            <p className="text-xs opacity-90">{currentAgent.role}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2 relative z-10">
          {currentAgent.expertise.slice(0, 3).map(exp => (
            <Badge key={exp} variant="secondary" className="text-[10px] bg-white/20 text-white border-0 backdrop-blur">
              {exp}
            </Badge>
          ))}
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="absolute right-0 top-0 w-64 h-full bg-card/95 backdrop-blur-xl z-50 border-l border-border/50 shadow-xl">
          <div className="p-3 border-b border-border/50 flex items-center justify-between">
            <span className="font-medium text-sm">Chat History</span>
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
              <span className="text-lg">×</span>
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-60px)] p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full mb-2 gap-2"
              onClick={startNewConversation}
            >
              <Plus className="w-3 h-3" />
              New Chat
            </Button>
            {agentConversations.map(conv => (
              <div
                key={conv.id}
                className={`p-2 rounded-lg mb-1 cursor-pointer transition-all ${
                  activeConversationId === conv.id 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => loadConversation(conv)}
              >
                <p className="text-xs font-medium truncate">{conv.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(conv.created_at).toLocaleDateString()}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 absolute right-2 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {currentMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="relative inline-block">
              <currentAgent.icon className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <div className="absolute inset-0 w-16 h-16 mx-auto bg-primary/10 blur-2xl rounded-full" />
            </div>
            <p className="text-sm">Start a conversation with {currentAgent.name}</p>
            <p className="text-xs mt-1 opacity-70">Your {currentAgent.role} is ready to advise.</p>
            
            <div className="mt-6 space-y-2">
              {currentAgent.id === "cfo" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs hover:bg-primary/10 hover:border-primary/30"
                    onClick={() => setInputMessage("What's our current financial health and burn rate?")}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Financial Health Report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs hover:bg-primary/10 hover:border-primary/30"
                    onClick={() => setInputMessage("How are we tracking against the $1/stream payout sustainability?")}
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    Payout Sustainability
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs hover:bg-primary/10 hover:border-primary/30"
                    onClick={() => setInputMessage("What are our biggest legal risks right now?")}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Risk Assessment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs hover:bg-primary/10 hover:border-primary/30"
                    onClick={() => setInputMessage("What's the legal landscape for AI-generated music we distribute?")}
                  >
                    <Scale className="w-3 h-3 mr-1" />
                    AI Music Legal Status
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {currentMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-muted/80 backdrop-blur border border-border/50"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <span className="text-lg">{currentAgent.avatar}</span>
                      <span className="font-medium">{currentAgent.name}</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && currentMessages[currentMessages.length - 1]?.role === "user" && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-muted/80 backdrop-blur rounded-2xl p-4 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <div className="absolute inset-0 w-5 h-5 bg-primary/30 blur-md rounded-full" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {currentAgent.name} is analyzing...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Action Bar */}
      {currentMessages.length > 0 && (
        <div className="px-4 py-2 border-t border-border/30 flex gap-2 bg-muted/30">
          <Button variant="ghost" size="sm" onClick={saveConversation} className="gap-1 text-xs">
            <Save className="w-3 h-3" />
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={exportToPDF} className="gap-1 text-xs">
            <Download className="w-3 h-3" />
            Export
          </Button>
          <Button variant="ghost" size="sm" onClick={sendEmail} className="gap-1 text-xs">
            <Mail className="w-3 h-3" />
            Email
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border/30 bg-gradient-to-r from-background/50 to-muted/30">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask ${currentAgent.name.split(' ')[0]}...`}
            disabled={isLoading}
            className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};