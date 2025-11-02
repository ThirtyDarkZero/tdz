import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, TrendingUp, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const QuantumAdvisor = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "🚀 **Quantum Advisor Activated**\n\nI'm your AI-powered music industry strategist. I analyze your data in real-time to help you sell more records and maximize revenue.\n\nAsk me anything about:\n• Release strategies & timing\n• Marketing & promotion tactics\n• Revenue optimization\n• Fan engagement & growth\n• Industry trends & opportunities\n\nWhat would you like to optimize today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use Quantum Advisor");
        return;
      }

      const { data, error } = await supabase.functions.invoke('quantum-advisor', {
        body: { message: userMessage },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }]);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to get advice. Please try again.");
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try asking again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "How can I increase my streams?",
    "When should I release my next single?",
    "How do I grow my email list?",
    "What's the best pricing strategy?",
    "How can I engage my super fans?"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-glow animate-pulse">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="absolute -inset-1 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50 -z-10" />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Quantum Advisor
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            AI-Powered Revenue Intelligence
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card p-4 border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Quick Insights</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(question);
                setTimeout(() => sendMessage(), 100);
              }}
              className="text-xs hover:border-primary hover:text-primary transition-all"
              disabled={loading}
            >
              {question}
            </Button>
          ))}
        </div>
      </Card>

      {/* Chat */}
      <Card className="glass-card border-primary/30 overflow-hidden">
        <ScrollArea className="h-[500px] p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 animate-fade-in ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-primary to-purple-500 shadow-glow'
                    : 'bg-muted'
                }`}>
                  {msg.role === 'assistant' ? (
                    <Sparkles className="w-4 h-4 text-white" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-primary" />
                  )}
                </div>
                <div className={`flex-1 space-y-2 ${
                  msg.role === 'user' ? 'text-right' : ''
                }`}>
                  <div className={`inline-block p-4 rounded-2xl max-w-[85%] ${
                    msg.role === 'assistant'
                      ? 'bg-accent/50 border border-primary/20'
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="bg-accent/50 border border-primary/20 p-4 rounded-2xl">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border/50 bg-accent/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for revenue strategies, release timing, marketing advice..."
              disabled={loading}
              className="flex-1 bg-background border-primary/30 focus:border-primary"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-primary to-purple-500 hover:shadow-glow transition-all"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
