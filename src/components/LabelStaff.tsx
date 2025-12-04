import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Send, Sparkles, TrendingUp, DollarSign,
  Music, BarChart3, Loader2, History, Plus, Atom, Zap
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type Conversation = {
  id: string;
  staff_member_id: string;
  title: string;
  updated_at: string;
};

type StaffMember = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  icon: any;
  expertise: string[];
};

const staffMembers: StaffMember[] = [
  {
    id: "ar_director",
    name: "Maya Rodriguez",
    role: "Quantum A&R Director",
    avatar: "⚛️",
    color: "from-violet-500 via-purple-500 to-fuchsia-500",
    icon: Music,
    expertise: ["AI Talent Analysis", "Predictive Track Feedback", "Quantum Release Strategy"],
  },
  {
    id: "marketing_manager",
    name: "Jordan Chen",
    role: "Quantum Marketing Strategist",
    avatar: "🔮",
    color: "from-cyan-500 via-blue-500 to-indigo-500",
    icon: TrendingUp,
    expertise: ["Neural Campaign Planning", "Algorithmic Playlist Pitching", "Viral Prediction"],
  },
  {
    id: "distribution_manager",
    name: "Alex Thompson",
    role: "Quantum Distribution Architect",
    avatar: "🌐",
    color: "from-emerald-500 via-green-500 to-teal-500",
    icon: BarChart3,
    expertise: ["Multi-Platform Optimization", "AI Metadata", "Predictive Scheduling"],
  },
  {
    id: "producer",
    name: "Sam Rivera",
    role: "Quantum Sound Engineer",
    avatar: "🎛️",
    color: "from-orange-500 via-amber-500 to-yellow-500",
    icon: Sparkles,
    expertise: ["AI Production Analysis", "Neural Mixing", "Quantum Sound Design"],
  },
  {
    id: "business_manager",
    name: "Taylor Washington",
    role: "Quantum Revenue Strategist",
    avatar: "💎",
    color: "from-rose-500 via-pink-500 to-red-500",
    icon: DollarSign,
    expertise: ["AI Contract Analysis", "Revenue Prediction", "Quantum Financial Planning"],
  },
];

export const LabelStaff = () => {
  const [selectedStaff, setSelectedStaff] = useState<string>(staffMembers[0].id);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedConversations, setSavedConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentStaff = staffMembers.find((s) => s.id === selectedStaff)!;
  const currentMessages = conversations[selectedStaff] || [];

  useEffect(() => {
    loadSavedConversations();
  }, [selectedStaff]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages]);

  const loadSavedConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("label_staff_conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("staff_member_id", selectedStaff)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setSavedConversations(data || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("label_staff_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("timestamp", { ascending: true });

      if (error) throw error;

      const messages = data.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      setConversations((prev) => ({
        ...prev,
        [selectedStaff]: messages,
      }));
      setCurrentConversationId(conversationId);
      toast.success("Conversation loaded");
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

  const startNewConversation = () => {
    setConversations((prev) => ({
      ...prev,
      [selectedStaff]: [],
    }));
    setCurrentConversationId(null);
    toast.success("New conversation started");
  };

  const saveMessage = async (conversationId: string, message: Message) => {
    try {
      const { error } = await supabase
        .from("label_staff_messages")
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const createOrGetConversation = async (firstUserMessage: string): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      if (currentConversationId) return currentConversationId;

      const title = firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? "..." : "");

      const { data, error } = await supabase
        .from("label_staff_conversations")
        .insert({
          user_id: user.id,
          staff_member_id: selectedStaff,
          title,
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentConversationId(data.id);
      await loadSavedConversations();
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setConversations((prev) => ({
      ...prev,
      [selectedStaff]: [...(prev[selectedStaff] || []), userMessage],
    }));

    setInputMessage("");
    setIsLoading(true);

    try {
      const conversationId = await createOrGetConversation(userMessage.content);
      await saveMessage(conversationId, userMessage);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to chat with quantum advisors");
        setIsLoading(false);
        return;
      }

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/label-staff-chat`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...(conversations[selectedStaff] || []), userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          staffMember: selectedStaff,
        }),
      });

      if (response.status === 429) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
        setIsLoading(false);
        return;
      }

      if (response.status === 402) {
        toast.error("AI quota exceeded. Please contact support.");
        setIsLoading(false);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      setConversations((prev) => ({
        ...prev,
        [selectedStaff]: [
          ...(prev[selectedStaff] || []),
          { role: "assistant", content: "", timestamp: Date.now() },
        ],
      }));

      let streamDone = false;
      let assistantMessageObj: Message | null = null;
      
      while (!streamDone) {
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
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setConversations((prev) => {
                const messages = [...(prev[selectedStaff] || [])];
                if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
                  messages[messages.length - 1] = {
                    ...messages[messages.length - 1],
                    content: assistantMessage,
                  };
                  assistantMessageObj = messages[messages.length - 1];
                }
                return { ...prev, [selectedStaff]: messages };
              });
            }
          } catch (e) {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantMessageObj && conversationId) {
        await saveMessage(conversationId, assistantMessageObj);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card h-[600px] flex flex-col overflow-hidden">
      <div className="p-6 border-b border-border/50 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-glow animate-pulse">
              <Atom className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl blur-xl opacity-30 -z-10" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Quantum Label Staff
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="w-3 h-3 text-primary animate-pulse" />
              AI-Powered Industry Intelligence
            </p>
          </div>
        </div>

        <Tabs value={selectedStaff} onValueChange={setSelectedStaff}>
          <TabsList className="grid w-full grid-cols-5 h-auto glass-card p-1">
            {staffMembers.map((staff) => (
              <TabsTrigger
                key={staff.id}
                value={staff.id}
                className="flex flex-col gap-1 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-secondary/20"
              >
                <span className="text-2xl">{staff.avatar}</span>
                <span className="text-xs font-medium hidden md:block">{staff.name.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-background to-background/50">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${currentStaff.color} flex items-center justify-center text-2xl shadow-lg`}>
            {currentStaff.avatar}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2">
              {currentStaff.name}
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary">
                <Atom className="w-2.5 h-2.5 mr-1" />
                QUANTUM
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground mb-2">{currentStaff.role}</p>
            <div className="flex flex-wrap gap-1">
              {currentStaff.expertise.map((exp, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs bg-primary/10">
                  {exp}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-6">
        {currentMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${currentStaff.color} flex items-center justify-center text-3xl shadow-glow`}>
              {currentStaff.avatar}
            </div>
            <h4 className="font-semibold mb-2">Start a quantum session with {currentStaff.name}</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {currentStaff.name} harnesses quantum intelligence for {currentStaff.expertise.join(", ")}. 
              Get data-driven insights to optimize your music career.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                      : "glass-card border-primary/20"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="glass-card rounded-2xl px-4 py-3 border-primary/20">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border/50 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-fuchsia-500/5">
        <div className="flex gap-2 mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-primary/30">
                <History className="w-4 h-4" />
                Sessions ({savedConversations.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuItem onClick={startNewConversation}>
                <Plus className="w-4 h-4 mr-2" />
                New Quantum Session
              </DropdownMenuItem>
              {savedConversations.length > 0 && <DropdownMenuSeparator />}
              {savedConversations.map((conv) => (
                <DropdownMenuItem
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className="flex flex-col items-start"
                >
                  <span className="font-medium truncate w-full">{conv.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(conv.updated_at).toLocaleDateString()} {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={`Ask ${currentStaff.name} for quantum insights...`}
            disabled={isLoading}
            className="flex-1 bg-background/50 border-primary/30 focus:border-primary"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:shadow-glow"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};