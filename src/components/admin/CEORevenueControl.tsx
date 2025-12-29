import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, PiggyBank, ArrowUpRight, ArrowDownRight, 
  Wallet, CreditCard, Users, TrendingUp, AlertCircle,
  CheckCircle, Clock, Loader2, Send, Plus, History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Artist {
  id: string;
  artist_name: string;
  user_id: string;
  total_earnings: number;
  pending_payout: number;
  total_streams: number;
}

interface PayoutHistory {
  id: string;
  artist_id: string;
  amount: number;
  status: string;
  created_at: string;
  artist_name?: string;
}

export function CEORevenueControl() {
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [revenuePool, setRevenuePool] = useState({
    total: 0,
    artistLiability: 0,
    available: 0,
    fanSubscriptions: 0,
    artistSubscriptions: 0,
    downloadFees: 0,
  });
  
  // Add funds state
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [addFundsLoading, setAddFundsLoading] = useState(false);
  
  // Payout state
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load revenue data
      const { data: revenue } = await supabase
        .from("platform_revenue")
        .select("amount, revenue_type");
      
      const fanSubs = revenue?.filter(r => r.revenue_type === "fan_subscription").reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const artistSubs = revenue?.filter(r => r.revenue_type === "artist_subscription").reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const downloads = revenue?.filter(r => r.revenue_type === "download_fee").reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const ceoFunds = revenue?.filter(r => r.revenue_type === "ceo_injection").reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const totalRevenue = fanSubs + artistSubs + downloads + ceoFunds;

      // Load artist earnings
      const { data: earnings } = await supabase
        .from("artist_earnings")
        .select("artist_id, total_earnings, streaming_revenue, download_revenue, payout_status, total_streams");

      const { data: profiles } = await supabase
        .from("artist_profiles")
        .select("user_id, artist_name");

      // Calculate liability
      const { data: tracks } = await supabase
        .from("tracks")
        .select("play_count");
      
      const totalStreams = tracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
      const artistLiability = totalStreams * 1.00;

      // Aggregate artist data
      const artistMap = new Map<string, Artist>();
      earnings?.forEach(e => {
        const profile = profiles?.find(p => p.user_id === e.artist_id);
        const existing = artistMap.get(e.artist_id);
        const earned = e.total_earnings || (e.streaming_revenue || 0) + (e.download_revenue || 0);
        const pending = e.payout_status === 'pending' ? earned : 0;
        
        if (existing) {
          existing.total_earnings += earned;
          existing.pending_payout += pending;
          existing.total_streams += e.total_streams || 0;
        } else {
          artistMap.set(e.artist_id, {
            id: e.artist_id,
            user_id: e.artist_id,
            artist_name: profile?.artist_name || 'Unknown Artist',
            total_earnings: earned,
            pending_payout: pending,
            total_streams: e.total_streams || 0,
          });
        }
      });

      // Load payout history
      const { data: payouts } = await supabase
        .from("artist_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      const payoutsWithNames = payouts?.map(p => ({
        ...p,
        artist_name: profiles?.find(pr => pr.user_id === p.artist_id)?.artist_name || 'Unknown',
      })) || [];

      setArtists(Array.from(artistMap.values()).sort((a, b) => b.pending_payout - a.pending_payout));
      setPayoutHistory(payoutsWithNames);
      setRevenuePool({
        total: totalRevenue,
        artistLiability,
        available: totalRevenue - artistLiability,
        fanSubscriptions: fanSubs,
        artistSubscriptions: artistSubs,
        downloadFees: downloads,
      });
    } catch (error) {
      console.error("Error loading revenue data:", error);
      toast.error("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setAddFundsLoading(true);
    try {
      const { error } = await supabase
        .from("platform_revenue")
        .insert({
          amount,
          revenue_type: "ceo_injection",
          description: `CEO fund injection - $${amount.toFixed(2)}`,
        });

      if (error) throw error;

      toast.success(`$${amount.toFixed(2)} added to revenue pool`);
      setAddFundsOpen(false);
      setAddFundsAmount("");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add funds");
    } finally {
      setAddFundsLoading(false);
    }
  };

  const handlePayout = async () => {
    if (!selectedArtist) return;
    
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > selectedArtist.pending_payout) {
      toast.error("Amount exceeds pending balance");
      return;
    }

    setPayoutLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("process-artist-payout", {
        body: { artistId: selectedArtist.user_id, amount },
      });

      if (response.error) throw response.error;

      toast.success(`Payout of $${amount.toFixed(2)} initiated for ${selectedArtist.artist_name}`);
      setPayoutOpen(false);
      setSelectedArtist(null);
      setPayoutAmount("");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to process payout");
    } finally {
      setPayoutLoading(false);
    }
  };

  const initiatePayoutForArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    setPayoutAmount(artist.pending_payout.toFixed(2));
    setPayoutOpen(true);
  };

  if (loading) {
    return (
      <Card className="glass-card p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading revenue data...</p>
      </Card>
    );
  }

  const totalPendingPayouts = artists.reduce((sum, a) => sum + a.pending_payout, 0);

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-green-500" />
              Revenue Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">${revenuePool.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Total collected revenue</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-destructive/30 bg-gradient-to-br from-destructive/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-destructive" />
              Artist Liability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">${revenuePool.artistLiability.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">$1 per stream owed</p>
          </CardContent>
        </Card>

        <Card className={`glass-card ${revenuePool.available >= 0 ? 'border-primary/30' : 'border-yellow-500/30'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${revenuePool.available >= 0 ? 'text-primary' : 'text-yellow-500'}`}>
              ${Math.abs(revenuePool.available).toLocaleString()}
              {revenuePool.available < 0 && <span className="text-sm ml-1">deficit</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-1">After artist payouts</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-secondary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-secondary" />
              Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-secondary">${totalPendingPayouts.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{artists.filter(a => a.pending_payout > 0).length} artists waiting</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600">
              <Plus className="w-4 h-4" />
              Add Funds to Pool
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Funds to Revenue Pool</DialogTitle>
              <DialogDescription>
                Inject funds directly into the revenue pool via Square payment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="1000.00"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                    className="pl-8"
                    min="1"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-sm">
                <p className="font-medium mb-2">Current Pool Status:</p>
                <div className="space-y-1 text-muted-foreground">
                  <p>Balance: ${revenuePool.total.toLocaleString()}</p>
                  <p>Liability: ${revenuePool.artistLiability.toLocaleString()}</p>
                  <p className={revenuePool.available >= 0 ? 'text-green-500' : 'text-destructive'}>
                    {revenuePool.available >= 0 ? 'Surplus' : 'Deficit'}: ${Math.abs(revenuePool.available).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddFundsOpen(false)}>Cancel</Button>
              <Button onClick={handleAddFunds} disabled={addFundsLoading} className="gap-2">
                {addFundsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Add Funds
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Artist Payout</DialogTitle>
              <DialogDescription>
                {selectedArtist ? `Pay ${selectedArtist.artist_name}` : 'Select an artist to pay'}
              </DialogDescription>
            </DialogHeader>
            {selectedArtist && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium">{selectedArtist.artist_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Pending: ${selectedArtist.pending_payout.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Payout Amount (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="pl-8"
                      min="50"
                      max={selectedArtist.pending_payout}
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum payout: $50</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayoutOpen(false)}>Cancel</Button>
              <Button 
                onClick={handlePayout} 
                disabled={payoutLoading || !selectedArtist}
                className="gap-2 bg-gradient-to-r from-primary to-secondary"
              >
                {payoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Process Payout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Artists Pending Payout */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Artists Pending Payout
            </CardTitle>
            <CardDescription>Click to initiate payout</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {artists.filter(a => a.pending_payout > 0).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending payouts</p>
                ) : (
                  artists.filter(a => a.pending_payout > 0).map((artist) => (
                    <div
                      key={artist.id}
                      className="p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => initiatePayoutForArtist(artist)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{artist.artist_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {artist.total_streams.toLocaleString()} streams
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-500">
                            ${artist.pending_payout.toFixed(2)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Payout History
            </CardTitle>
            <CardDescription>Recent payouts processed</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {payoutHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payout history</p>
                ) : (
                  payoutHistory.map((payout) => (
                    <div
                      key={payout.id}
                      className="p-4 rounded-lg border border-border/50 bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{payout.artist_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payout.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${payout.amount.toFixed(2)}</p>
                          <Badge 
                            variant="outline" 
                            className={
                              payout.status === 'completed' ? 'text-green-500 border-green-500/30' :
                              payout.status === 'processing' ? 'text-yellow-500 border-yellow-500/30' :
                              payout.status === 'failed' ? 'text-destructive border-destructive/30' :
                              ''
                            }
                          >
                            {payout.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {payout.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                            {payout.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {payout.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Revenue Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-sm text-muted-foreground">Fan Subscriptions</p>
              <p className="text-2xl font-bold">${revenuePool.fanSubscriptions.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30">
              <p className="text-sm text-muted-foreground">Artist Subscriptions</p>
              <p className="text-2xl font-bold">${revenuePool.artistSubscriptions.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
              <p className="text-sm text-muted-foreground">Download Fees</p>
              <p className="text-2xl font-bold">${revenuePool.downloadFees.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
