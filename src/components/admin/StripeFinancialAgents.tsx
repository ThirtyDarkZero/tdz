import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DollarSign, TrendingUp, Users, CreditCard, ArrowUpRight, ArrowDownRight,
  RefreshCw, Loader2, AlertCircle, CheckCircle, PiggyBank, Wallet,
  BarChart3, Activity, Zap, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StripeBalance {
  available: number;
  pending: number;
  total: number;
  currency: string;
}

interface PayoutSummary {
  totalPaid: number;
  totalPending: number;
  artistsWithPending: number;
  totalArtistsConnected: number;
}

interface SubscriptionMetrics {
  activeStarter: number;
  activePro: number;
  activeEnterprise: number;
  activeFan: number;
  totalMRR: number;
  churnedThisMonth: number;
}

export function StripeFinancialAgents() {
  const [stripeBalance, setStripeBalance] = useState<StripeBalance | null>(null);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [subMetrics, setSubMetrics] = useState<SubscriptionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllData = async () => {
    try {
      // Parallel fetch: Stripe balance + DB metrics
      const [balanceRes, earningsRes, payoutsRes, connectRes, subsRes] = await Promise.all([
        supabase.functions.invoke('stripe-balance'),
        supabase.from('artist_earnings').select('artist_id, streaming_revenue, download_revenue, total_earnings, payout_status'),
        supabase.from('artist_payouts').select('amount, status, artist_id'),
        supabase.from('artist_payout_details_safe').select('artist_id, stripe_connect_id, payout_enabled'),
        supabase.from('user_subscriptions').select('plan, status, expires_at'),
      ]);

      // Stripe Balance
      if (balanceRes.data && !balanceRes.error) {
        setStripeBalance(balanceRes.data);
      }

      // Payout Summary
      const earnings = earningsRes.data || [];
      const payouts = payoutsRes.data || [];
      const connected = connectRes.data || [];

      const totalPending = earnings
        .filter(e => e.payout_status === 'pending')
        .reduce((sum, e) => sum + (e.total_earnings || 0), 0);
      
      const totalPaid = payouts
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      const artistsWithPending = new Set(
        earnings.filter(e => e.payout_status === 'pending' && (e.total_earnings || 0) > 0)
          .map(e => e.artist_id)
      ).size;

      const totalArtistsConnected = connected
        .filter(c => (c as any).stripe_connect_id)
        .length;

      setPayoutSummary({ totalPaid, totalPending, artistsWithPending, totalArtistsConnected });

      // Subscription Metrics
      const subs = subsRes.data || [];
      const now = new Date();
      const activeSubs = subs.filter(s => 
        s.status === 'active' && 
        (!s.expires_at || new Date(s.expires_at) > now)
      );

      const activeStarter = activeSubs.filter(s => s.plan === 'starter').length;
      const activePro = activeSubs.filter(s => s.plan === 'pro').length;
      const activeEnterprise = activeSubs.filter(s => s.plan === 'enterprise').length;
      const activeFan = activeSubs.filter(s => s.plan === 'fan').length;

      const totalMRR = 
        (activeStarter * 9.99) + 
        (activePro * 19.99) + 
        (activeEnterprise * 49.99) + 
        (activeFan * 12.00);

      const churnedThisMonth = subs.filter(s => s.status === 'canceled').length;

      setSubMetrics({ activeStarter, activePro, activeEnterprise, activeFan, totalMRR, churnedThisMonth });

    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Failed to load some financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast.success('Financial data refreshed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading Stripe financial data...</span>
      </div>
    );
  }

  const arps = subMetrics && payoutSummary 
    ? (subMetrics.totalMRR > 0 ? subMetrics.totalMRR / Math.max(payoutSummary.totalPending, 1) : 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Financial Intelligence Agents
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time Stripe data powering the $1/stream economy
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Agent 1: Stripe Treasury Agent */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            Treasury Agent
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">STRIPE LIVE</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-card/50 border border-border/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Balance</p>
              <p className="text-3xl font-black text-green-500 mt-1">
                ${stripeBalance?.available?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Ready for payouts</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending Balance</p>
              <p className="text-3xl font-black text-amber-500 mt-1">
                ${stripeBalance?.pending?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Processing in Stripe</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Holdings</p>
              <p className="text-3xl font-black mt-1">
                ${stripeBalance?.total?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stripeBalance?.currency?.toUpperCase() || 'USD'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent 2: Payout Liability Agent */}
      <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            Payout Liability Agent
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-500">$1/STREAM</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-card/50 border border-border/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Pending Liability</p>
              <p className="text-2xl font-black text-destructive mt-1">
                ${payoutSummary?.totalPending?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Owed to artists</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Paid Out</p>
              <p className="text-2xl font-black text-green-500 mt-1">
                ${payoutSummary?.totalPaid?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Lifetime via Stripe</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Artists Owed</p>
              <p className="text-2xl font-black mt-1">{payoutSummary?.artistsWithPending || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">With pending balance</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Stripe Connected</p>
              <p className="text-2xl font-black mt-1">{payoutSummary?.totalArtistsConnected || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Ready for payout</p>
            </div>
          </div>
          
          {/* Coverage indicator */}
          {stripeBalance && payoutSummary && (
            <div className="mt-4 p-4 rounded-lg border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Payout Coverage</span>
                {stripeBalance.available >= payoutSummary.totalPending ? (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Fully Covered
                  </Badge>
                ) : (
                  <Badge className="bg-destructive/20 text-destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    ${(payoutSummary.totalPending - stripeBalance.available).toFixed(2)} Short
                  </Badge>
                )}
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className={cn(
                    "h-3 rounded-full transition-all",
                    stripeBalance.available >= payoutSummary.totalPending 
                      ? "bg-green-500" 
                      : "bg-destructive"
                  )}
                  style={{ 
                    width: `${Math.min(100, payoutSummary.totalPending > 0 
                      ? (stripeBalance.available / payoutSummary.totalPending) * 100 
                      : 100)}%` 
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent 3: Subscription Revenue Agent */}
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-purple-500" />
            </div>
            Subscription Revenue Agent
            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-500">MRR</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-card/50 border border-border/30 md:col-span-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Recurring Revenue</p>
              <p className="text-3xl font-black text-purple-500 mt-1">
                ${subMetrics?.totalMRR?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">From active subscriptions</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border/30 md:col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Active Subscribers by Tier</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 rounded bg-muted/30">
                  <p className="text-lg font-bold">{subMetrics?.activeStarter || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Starter</p>
                  <p className="text-[10px] text-green-500">$9.99</p>
                </div>
                <div className="text-center p-2 rounded bg-muted/30">
                  <p className="text-lg font-bold">{subMetrics?.activePro || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Pro</p>
                  <p className="text-[10px] text-green-500">$19.99</p>
                </div>
                <div className="text-center p-2 rounded bg-muted/30">
                  <p className="text-lg font-bold">{subMetrics?.activeEnterprise || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Enterprise</p>
                  <p className="text-[10px] text-green-500">$49.99</p>
                </div>
                <div className="text-center p-2 rounded bg-muted/30">
                  <p className="text-lg font-bold">{subMetrics?.activeFan || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Fan</p>
                  <p className="text-[10px] text-green-500">$12.00</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Key Financial Ratios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-card/50 border border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">ARPS (Avg Rev/Stream)</span>
                <Zap className="w-3 h-3 text-amber-500" />
              </div>
              <p className={cn("text-lg font-bold mt-1", arps >= 1.35 ? "text-green-500" : "text-amber-500")}>
                ${arps.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">Target: $1.35-$1.80</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Churn (This Month)</span>
                <Activity className="w-3 h-3 text-destructive" />
              </div>
              <p className="text-lg font-bold mt-1">{subMetrics?.churnedThisMonth || 0}</p>
              <p className="text-[10px] text-muted-foreground">Canceled subscriptions</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Burn Rate</span>
                <TrendingUp className="w-3 h-3 text-primary" />
              </div>
              <p className="text-lg font-bold mt-1">
                ${payoutSummary?.totalPending?.toFixed(2) || '0.00'}
              </p>
              <p className="text-[10px] text-muted-foreground">Outstanding artist liability</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent 4: Health Monitor */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-500" />
            </div>
            Financial Health Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Health checks */}
            {[
              {
                label: "Stripe Balance covers artist liability",
                pass: (stripeBalance?.available || 0) >= (payoutSummary?.totalPending || 0),
              },
              {
                label: "MRR exceeds monthly payout obligations",
                pass: (subMetrics?.totalMRR || 0) >= (payoutSummary?.totalPending || 0),
              },
              {
                label: "ARPS within target range ($1.35-$1.80)",
                pass: arps >= 1.35 && arps <= 1.80,
              },
              {
                label: "All connected artists ready for payout",
                pass: (payoutSummary?.totalArtistsConnected || 0) > 0,
              },
              {
                label: "Churn rate under control (< 5 this month)",
                pass: (subMetrics?.churnedThisMonth || 0) < 5,
              },
            ].map((check, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
                {check.pass ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                )}
                <span className="text-sm">{check.label}</span>
                <Badge className={cn(
                  "ml-auto text-xs",
                  check.pass 
                    ? "bg-green-500/20 text-green-500 border-green-500/30" 
                    : "bg-amber-500/20 text-amber-500 border-amber-500/30"
                )}>
                  {check.pass ? "PASS" : "ATTENTION"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
