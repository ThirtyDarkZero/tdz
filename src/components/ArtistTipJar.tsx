import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Heart, DollarSign, Crown, Loader2, Star } from "lucide-react";

interface ArtistTipJarProps {
  artistId: string;
  artistName: string;
}

interface TopSupporter {
  tipper_id: string;
  total_amount: number;
  tip_count: number;
  display_name?: string;
}

const TIP_AMOUNTS = [2, 5, 10, 25, 50];

export function ArtistTipJar({ artistId, artistName }: ArtistTipJarProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [topSupporters, setTopSupporters] = useState<TopSupporter[]>([]);
  const [totalTips, setTotalTips] = useState(0);

  useEffect(() => {
    loadTopSupporters();
  }, [artistId]);

  const loadTopSupporters = async () => {
    try {
      const { data } = await supabase
        .from('artist_tips')
        .select('tipper_id, amount')
        .eq('artist_id', artistId)
        .eq('status', 'completed');

      if (data && data.length > 0) {
        // Aggregate by tipper
        const supporterMap = new Map<string, { total: number; count: number }>();
        let total = 0;
        data.forEach(tip => {
          const existing = supporterMap.get(tip.tipper_id) || { total: 0, count: 0 };
          existing.total += Number(tip.amount);
          existing.count += 1;
          supporterMap.set(tip.tipper_id, existing);
          total += Number(tip.amount);
        });

        setTotalTips(total);
        const sorted = Array.from(supporterMap.entries())
          .map(([tipper_id, { total: total_amount, count: tip_count }]) => ({
            tipper_id, total_amount, tip_count,
          }))
          .sort((a, b) => b.total_amount - a.total_amount)
          .slice(0, 5);

        // Get display names
        const tipperIds = sorted.map(s => s.tipper_id);
        const { data: profiles } = await supabase
          .from('listener_profiles')
          .select('user_id, display_name')
          .in('user_id', tipperIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
        setTopSupporters(sorted.map(s => ({
          ...s,
          display_name: profileMap.get(s.tipper_id) || 'Anonymous Fan',
        })));
      }
    } catch (err) {
      console.error('Failed to load supporters:', err);
    }
  };

  const handleTip = async () => {
    if (!user) {
      toast.error("Please sign in to tip artists");
      return;
    }

    const tipAmount = customAmount ? parseFloat(customAmount) : amount;
    if (isNaN(tipAmount) || tipAmount < 1 || tipAmount > 500) {
      toast.error("Tip must be between $1 and $500");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-tip-session', {
        body: { artistId, amount: tipAmount, message: message.trim() || null },
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data?.success) {
        toast.success(`Tip of $${tipAmount} sent to ${artistName}!`);
        setOpen(false);
        loadTopSupporters();
      } else {
        toast.error(data?.error || "Failed to process tip");
      }
    } catch (err) {
      console.error('Tip error:', err);
      toast.error("Failed to send tip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tip Button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary"
          >
            <Heart className="w-4 h-4 text-primary" />
            Tip Artist
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Tip {artistName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Preset Amounts */}
            <div className="grid grid-cols-5 gap-2">
              {TIP_AMOUNTS.map((a) => (
                <Button
                  key={a}
                  variant={amount === a && !customAmount ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setAmount(a); setCustomAmount(""); }}
                  className={amount === a && !customAmount ? "bg-primary" : ""}
                >
                  ${a}
                </Button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="pl-8"
                min={1}
                max={500}
              />
            </div>

            {/* Message */}
            <Textarea
              placeholder="Leave a message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={500}
            />

            <Button
              onClick={handleTip}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-glow shadow-glow"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Heart className="w-4 h-4 mr-2" />
              )}
              Send ${customAmount || amount} Tip
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Top Supporters */}
      {topSupporters.length > 0 && (
        <Card className="p-4 bg-card/50 border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-yellow-500" />
            <h4 className="text-sm font-semibold">Top Supporters</h4>
            {totalTips > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                ${totalTips.toFixed(0)} total
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            {topSupporters.map((supporter, i) => (
              <div key={supporter.tipper_id} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-center">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <Star className="w-3 h-3 text-primary/50" />}
                </span>
                <span className="flex-1 truncate text-muted-foreground">
                  {supporter.display_name}
                </span>
                <Badge variant="outline" className="text-xs">
                  ${supporter.total_amount.toFixed(0)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
