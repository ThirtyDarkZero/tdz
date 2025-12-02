import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, DollarSign, Users, Music, Wallet, Building2,
  TrendingUp, CreditCard, Download, Play, CheckCircle, Clock,
  AlertTriangle, RefreshCw, Zap, Target, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FlowMetrics {
  fanSubscriptions: number;
  artistSubscriptions: number;
  downloadFees: number;
  totalRevenue: number;
  poolBalance: number;
  totalStreams: number;
  streamLiability: number;
  downloadPayouts: number;
  totalLiability: number;
  pendingPayouts: number;
  processingPayouts: number;
  completedPayouts: number;
  platformRevenue: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  coverageRatio: number;
}

export const PaymentFlowDashboard = () => {
  const [metrics, setMetrics] = useState<FlowMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      const [
        revenueResult,
        tracksResult,
        earningsResult,
        payoutsResult,
        downloadsResult
      ] = await Promise.all([
        supabase.from('platform_revenue').select('amount, revenue_type'),
        supabase.from('tracks').select('play_count'),
        supabase.from('artist_earnings').select('streaming_revenue, download_revenue, payout_status'),
        supabase.from('artist_payouts').select('amount, status'),
        supabase.from('download_purchases').select('artist_revenue, transaction_fee')
      ]);

      const revenue = revenueResult.data || [];
      const tracks = tracksResult.data || [];
      const payouts = payoutsResult.data || [];
      const downloads = downloadsResult.data || [];

      const fanSubs = revenue
        .filter(r => r.revenue_type === 'fan_subscription')
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const artistSubs = revenue
        .filter(r => r.revenue_type === 'artist_subscription')
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const downloadFees = revenue
        .filter(r => r.revenue_type === 'download_fee')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      const totalStreams = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
      const streamLiability = totalStreams * 1.00;
      const downloadPayouts = downloads.reduce((sum, d) => sum + (d.artist_revenue || 0), 0);

      const pendingPayouts = payouts
        .filter(p => p.status === 'pending' || p.status === 'pending_manual')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const processingPayouts = payouts
        .filter(p => p.status === 'processing')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const completedPayouts = payouts
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const totalRevenue = fanSubs + artistSubs + downloadFees;
      const totalLiability = streamLiability + downloadPayouts;
      const poolBalance = totalRevenue - completedPayouts;
      const coverageRatio = totalLiability > 0 ? (totalRevenue / totalLiability) * 100 : 100;

      let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (coverageRatio < 50) healthStatus = 'critical';
      else if (coverageRatio < 80) healthStatus = 'warning';

      setMetrics({
        fanSubscriptions: fanSubs,
        artistSubscriptions: artistSubs,
        downloadFees: downloadFees,
        totalRevenue,
        poolBalance,
        totalStreams,
        streamLiability,
        downloadPayouts,
        totalLiability,
        pendingPayouts,
        processingPayouts,
        completedPayouts,
        platformRevenue: downloadFees,
        healthStatus,
        coverageRatio,
      });
    } catch (error) {
      console.error('Error loading flow metrics:', error);
      toast.error('Failed to load payment flow data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-64 bg-muted/50 rounded-lg" />
      </Card>
    );
  }

  const healthColors = {
    healthy: 'text-green-500 bg-green-500/20 border-green-500/30',
    warning: 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30',
    critical: 'text-red-500 bg-red-500/20 border-red-500/30',
  };

  const healthGlow = {
    healthy: 'shadow-green-500/20',
    warning: 'shadow-yellow-500/20',
    critical: 'shadow-red-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Health Banner with glow */}
      <Card className={`p-5 border-2 ${healthColors[metrics.healthStatus]} shadow-xl ${healthGlow[metrics.healthStatus]} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              {metrics.healthStatus === 'healthy' ? (
                <CheckCircle className="w-10 h-10 text-green-500" />
              ) : metrics.healthStatus === 'warning' ? (
                <AlertTriangle className="w-10 h-10 text-yellow-500" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
              )}
              <div className={`absolute inset-0 w-10 h-10 ${
                metrics.healthStatus === 'healthy' ? 'bg-green-500' :
                metrics.healthStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              } blur-xl opacity-30 rounded-full`} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Revenue Pool Health</h3>
              <p className="text-sm opacity-80">
                Coverage: {metrics.coverageRatio.toFixed(1)}% of artist liability
              </p>
            </div>
          </div>
          <Badge className={`${healthColors[metrics.healthStatus]} text-lg px-4 py-1 font-bold`}>
            {metrics.healthStatus.toUpperCase()}
          </Badge>
        </div>
        <Progress 
          value={Math.min(metrics.coverageRatio, 100)} 
          className="mt-4 h-3 bg-background/30"
        />
      </Card>

      {/* Flow Visualization - Enhanced */}
      <div className="grid grid-cols-5 gap-3 items-stretch">
        {/* Revenue Sources */}
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent border-blue-500/30 relative overflow-hidden group hover:shadow-lg hover:shadow-blue-500/10 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <h4 className="font-bold text-sm">Revenue In</h4>
          </div>
          <div className="space-y-2 text-xs relative z-10">
            <div className="flex justify-between p-2 bg-background/30 rounded-lg">
              <span className="text-muted-foreground">Fan Subs</span>
              <span className="font-bold">${metrics.fanSubscriptions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-2 bg-background/30 rounded-lg">
              <span className="text-muted-foreground">Artist Subs</span>
              <span className="font-bold">${metrics.artistSubscriptions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-2 bg-background/30 rounded-lg">
              <span className="text-muted-foreground">Download Fees</span>
              <span className="font-bold">${metrics.downloadFees.toFixed(2)}</span>
            </div>
            <div className="border-t border-blue-500/30 pt-2 mt-2">
              <div className="flex justify-between font-bold text-blue-500">
                <span>Total</span>
                <span className="text-lg">${metrics.totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Arrow with pulse */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <ArrowRight className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 w-8 h-8 bg-primary blur-lg opacity-30 animate-pulse" />
          </div>
        </div>

        {/* Revenue Pool */}
        <Card className="p-4 bg-gradient-to-br from-green-500/10 via-emerald-600/5 to-transparent border-green-500/30 relative overflow-hidden group hover:shadow-lg hover:shadow-green-500/10 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Wallet className="w-5 h-5 text-green-500" />
            </div>
            <h4 className="font-bold text-sm">Revenue Pool</h4>
          </div>
          <div className="text-center py-4 relative z-10">
            <div className="relative inline-block">
              <p className="text-4xl font-black text-green-500">
                ${metrics.poolBalance.toLocaleString()}
              </p>
              <Sparkles className="w-5 h-5 text-green-400 absolute -top-1 -right-2 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Available Balance</p>
          </div>
          <div className="text-xs space-y-1 border-t border-green-500/30 pt-3 relative z-10">
            <div className="flex justify-between text-muted-foreground p-2 bg-yellow-500/10 rounded-lg">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Liability
              </span>
              <span className="text-yellow-500 font-bold">${metrics.totalLiability.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <ArrowRight className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 w-8 h-8 bg-primary blur-lg opacity-30 animate-pulse" />
          </div>
        </div>

        {/* Artist Payouts */}
        <Card className="p-4 bg-gradient-to-br from-purple-500/10 via-pink-600/5 to-transparent border-purple-500/30 relative overflow-hidden group hover:shadow-lg hover:shadow-purple-500/10 transition-all">
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <h4 className="font-bold text-sm">Artist Payouts</h4>
          </div>
          <div className="space-y-2 text-xs relative z-10">
            <div className="flex justify-between p-2 bg-background/30 rounded-lg">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                Streams
              </span>
              <span className="font-bold">${metrics.streamLiability.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-2 bg-background/30 rounded-lg">
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                Downloads
              </span>
              <span className="font-bold">${metrics.downloadPayouts.toFixed(2)}</span>
            </div>
            <div className="border-t border-purple-500/30 pt-2 space-y-1">
              <div className="flex justify-between text-yellow-500 p-1.5 bg-yellow-500/10 rounded">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
                <span className="font-bold">${metrics.pendingPayouts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-500 p-1.5 bg-green-500/10 rounded">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Paid
                </span>
                <span className="font-bold">${metrics.completedPayouts.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Metrics with enhanced cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20 hover:shadow-lg hover:shadow-green-500/10 transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-green-500/20 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-sm font-medium">Per Stream Rate</span>
          </div>
          <p className="text-3xl font-black text-green-500">$1.00</p>
          <p className="text-xs text-muted-foreground mt-1">Guaranteed payout</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm font-medium">ARPS</span>
          </div>
          <p className="text-3xl font-black">
            ${metrics.totalStreams > 0 
              ? (metrics.totalRevenue / metrics.totalStreams).toFixed(2) 
              : '0.00'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Avg revenue per stream</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10 transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-purple-500/20 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm font-medium">TDZ Revenue</span>
          </div>
          <p className="text-3xl font-black text-purple-500">
            ${metrics.platformRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">From transaction fees</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-orange-500/5 to-transparent border-orange-500/20 hover:shadow-lg hover:shadow-orange-500/10 transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-orange-500/20 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-sm font-medium">Break-Even</span>
          </div>
          <p className="text-3xl font-black">
            {Math.ceil(metrics.totalStreams / 12).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Subs needed @ $12/mo</p>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={loadMetrics} className="gap-2 hover:bg-primary/10">
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};