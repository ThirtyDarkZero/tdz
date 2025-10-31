import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Send, Sparkles, TrendingUp, DollarSign,
  Music, BarChart3, Loader2
} from "lucide-react";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
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
    role: "A&R Director",
    avatar: "🎵",
    color: "from-purple-500 to-pink-500",
    icon: Music,
    expertise: ["Talent Development", "Track Feedback", "Release Strategy"],
  },
  {
    id: "marketing_manager",
    name: "Jordan Chen",
    role: "Marketing Manager",
    avatar: "📱",
    color: "from-blue-500 to-cyan-500",
    icon: TrendingUp,
    expertise: ["Social Media", "Campaign Planning", "Playlist Pitching"],
  },
  {
    id: "distribution_manager",
    name: "Alex Thompson",
    role: "Distribution Manager",
    avatar: "🌍",
    color: "from-green-500 to-emerald-500",
    icon: BarChart3,
    expertise: ["Platform Strategy", "Metadata", "Release Scheduling"],
  },
  {
    id: "producer",
    name: "Sam Rivera",
    role: "Executive Producer",
    avatar: "🎚️",
    color: "from-orange-500 to-red-500",
    icon: Sparkles,
    expertise: ["Production", "Mixing", "Sound Design"],
  },
  {
    id: "business_manager",
    name: "Taylor Washington",
    role: "Business Manager",
    avatar: "💼",
    color: "from-yellow-500 to-amber-500",
    icon: DollarSign,
    expertise: ["Contracts", "Revenue", "Financial Planning"],
  },
];

export function LabelStaff() {
  const [selectedStaff, setSelectedStaff] = useState<string>(staffMembers[0].id);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentStaff = staffMembers.find((s) => s.id === selectedStaff)!;
  const currentMessages = conversations[selectedStaff] || [];

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

    setConversations((prev) => ({
      ...prev,
      [selectedStaff]: [...(prev[selectedStaff] || []), userMessage],
    }));

    setInputMessage("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/label-staff-chat`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

      // Create initial assistant message
      setConversations((prev) => ({
        ...prev,
        [selectedStaff]: [
          ...(prev[selectedStaff] || []),
          { role: "assistant", content: "", timestamp: Date.now() },
        ],
      }));

      let streamDone = false;
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
              // Update the last message
              setConversations((prev) => {
                const messages = [...(prev[selectedStaff] || [])];
                if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
                  messages[messages.length - 1] = {
                    ...messages[messages.length - 1],
                    content: assistantMessage,
                  };
                }
                return { ...prev, [selectedStaff]: messages };
              });
            }
          } catch (e) {
            // Incomplete JSON, put it back
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card h-[600px] flex flex-col">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-display font-bold">Label Staff</h2>
            <p className="text-sm text-muted-foreground">
              Chat with AI-powered industry professionals
            </p>
          </div>
        </div>

        {/* Staff Selector */}
        <Tabs value={selectedStaff} onValueChange={setSelectedStaff}>
          <TabsList className="grid w-full grid-cols-5 h-auto glass-card p-1">
            {staffMembers.map((staff) => (
              <TabsTrigger
                key={staff.id}
                value={staff.id}
                className="flex flex-col gap-1 py-2 data-[state=active]:bg-primary/20"
              >
                <span className="text-2xl">{staff.avatar}</span>
                <span className="text-xs font-medium hidden md:block">{staff.name.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Current Staff Info */}
      <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-background to-background/50">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${currentStaff.color} flex items-center justify-center text-2xl`}>
            {currentStaff.avatar}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{currentStaff.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{currentStaff.role}</p>
            <div className="flex flex-wrap gap-1">
              {currentStaff.expertise.map((exp, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {exp}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-6">
        {currentMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${currentStaff.color} flex items-center justify-center text-3xl`}>
              {currentStaff.avatar}
            </div>
            <h4 className="font-semibold mb-2">Start a conversation with {currentStaff.name}</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {currentStaff.name} specializes in {currentStaff.expertise.join(", ")}. 
              Ask for advice, feedback, or guidance on your music career.
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
                      ? "bg-primary text-primary-foreground"
                      : "glass-card"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="glass-card rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
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
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={`Message ${currentStaff.name}...`}
            disabled={isLoading}
            className="flex-1 bg-background/50"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
