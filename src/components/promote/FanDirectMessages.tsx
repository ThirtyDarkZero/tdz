import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  userId: string;
  displayName: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export function FanDirectMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    // Get all messages involving this user
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!data) return;

    const convoMap = new Map<string, Conversation>();
    data.forEach((msg: Message) => {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convoMap.has(otherId)) {
        convoMap.set(otherId, {
          userId: otherId,
          displayName: otherId.substring(0, 8),
          lastMessage: msg.content,
          lastAt: msg.created_at,
          unread: !msg.is_read && msg.receiver_id === user.id ? 1 : 0,
        });
      } else if (!msg.is_read && msg.receiver_id === user.id) {
        const c = convoMap.get(otherId)!;
        c.unread++;
      }
    });

    setConversations(Array.from(convoMap.values()));
  }, [user]);

  const loadMessages = useCallback(async (otherId: string, markRead = true) => {
    if (!user) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages(data || []);

    if (markRead) {
      await supabase.from("direct_messages").update({ is_read: true } as any)
        .eq("sender_id", otherId).eq("receiver_id", user.id).eq("is_read", false);
    }

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [user]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    if (activeConvo) loadMessages(activeConvo);
  }, [activeConvo, loadMessages]);

  useEffect(() => {
    if (!user) return;

    const intervalId = window.setInterval(() => {
      void loadConversations();
      if (activeConvo) {
        void loadMessages(activeConvo, false);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [user, activeConvo, loadConversations, loadMessages]);

  const handleSend = async () => {
    if (!user || !activeConvo || !input.trim()) return;
    setSending(true);
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: user.id,
      receiver_id: activeConvo,
      content: input.trim(),
    });
    if (error) toast.error("Failed to send");
    else setInput("");
    setSending(false);
  };

  return (
    <Card style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MessageCircle className="w-5 h-5" /> Fan Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-[240px_1fr] gap-4" style={{ height: 400 }}>
          {/* Conversation list */}
          <div className="border-r border-border/20 pr-4 overflow-y-auto space-y-1">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
            ) : conversations.map((c) => (
              <button
                key={c.userId}
                onClick={() => setActiveConvo(c.userId)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={{
                  background: activeConvo === c.userId ? "rgba(0,207,255,0.08)" : "transparent",
                  border: activeConvo === c.userId ? "1px solid rgba(0,207,255,0.15)" : "1px solid transparent",
                }}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-primary/10">{c.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex flex-col">
            {!activeConvo ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Select a conversation</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[70%] px-3 py-2 rounded-2xl text-sm"
                        style={{
                          background: msg.sender_id === user?.id ? "rgba(0,207,255,0.15)" : "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.9)",
                        }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="flex gap-2 pt-3 border-t border-border/20">
                  <Input value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..." className="flex-1" />
                  <Button size="icon" onClick={handleSend} disabled={sending || !input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
