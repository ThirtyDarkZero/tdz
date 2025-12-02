import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send, Loader2, DollarSign, Scale, Sparkles, TrendingUp, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
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
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentAgent = execAgents.find(a => a.id === selectedAgent)!;
  const currentMessages = conversations[selectedAgent] || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setConversations(prev => ({
      ...prev,
      [selectedAgent]: [...(prev[selectedAgent] || []), userMessage],
    }));
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
      
      const allMessages = [...(conversations[selectedAgent] || []), userMessage];
      
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

      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      const updateAssistantMessage = (content: string) => {
        setConversations(prev => {
          const agentMessages = prev[selectedAgent] || [];
          const lastMessage = agentMessages[agentMessages.length - 1];
          
          if (lastMessage?.role === "assistant") {
            return {
              ...prev,
              [selectedAgent]: [
                ...agentMessages.slice(0, -1),
                { ...lastMessage, content },
              ],
            };
          }
          
          return {
            ...prev,
            [selectedAgent]: [
              ...agentMessages,
              { role: "assistant", content, timestamp: Date.now() },
            ],
          };
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

  return (
    <Card className="h-full flex flex-col bg-card/50 backdrop-blur border-border/50">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Executive Advisory</h3>
          <Badge variant="outline" className="text-xs">CEO Only</Badge>
        </div>
        
        <Tabs value={selectedAgent} onValueChange={setSelectedAgent}>
          <TabsList className="grid w-full grid-cols-2">
            {execAgents.map(agent => (
              <TabsTrigger key={agent.id} value={agent.id} className="text-xs">
                <span className="mr-1">{agent.avatar}</span>
                {agent.role.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Agent Info */}
      <div className={`p-3 bg-gradient-to-r ${currentAgent.color} text-white`}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">{currentAgent.avatar}</div>
          <div>
            <h4 className="font-semibold">{currentAgent.name}</h4>
            <p className="text-xs opacity-90">{currentAgent.role}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {currentAgent.expertise.slice(0, 3).map(exp => (
            <Badge key={exp} variant="secondary" className="text-[10px] bg-white/20 text-white border-0">
              {exp}
            </Badge>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {currentMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <currentAgent.icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Start a conversation with {currentAgent.name}</p>
            <p className="text-xs mt-1">Your {currentAgent.role} is ready to advise.</p>
            
            {/* Quick prompts */}
            <div className="mt-4 space-y-2">
              {currentAgent.id === "cfo" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setInputMessage("What's our current financial health and burn rate?")}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Financial Health Report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
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
                    className="w-full text-xs"
                    onClick={() => setInputMessage("What are our biggest legal risks right now?")}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Risk Assessment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
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
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                      <span>{currentAgent.avatar}</span>
                      <span>{currentAgent.name}</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && currentMessages[currentMessages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
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

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask ${currentAgent.name.split(' ')[0]}...`}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
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
