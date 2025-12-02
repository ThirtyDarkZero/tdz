import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, DollarSign, Users, Music, Wallet, Building2,
  TrendingUp, CreditCard, Download, Play, CheckCircle, Clock,
  AlertTriangle, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FlowMetrics {
  // Revenue In
  fanSubscriptions: number;
  artistSubscriptions: number;
  downloadFees: number;
  totalRevenue: number;
  
  // Revenue Pool
  poolBalance: number;
  
  // Artist Liability
  totalStreams: number;
  streamLiability: number; // $1 × streams
  downloadPayouts: number;
  totalLiability: number;
  
  // Payout Status
  pendingPayouts: number;
  processingPayouts: number;
  completedPayouts: number;
  
  // Platform Take
  platformRevenue: number;
  
  // Health
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
      
      // Fetch all revenue data
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
      const earnings = earningsResult.data || [];
      const payouts = payoutsResult.data || [];
      const downloads = downloadsResult.data || [];

      // Calculate revenue sources
      const fanSubs = revenue
        .filter(r => r.revenue_type === 'fan_subscription')
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const artistSubs = revenue
        .filter(r => r.revenue_type === 'artist_subscription')
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const downloadFees = revenue
        .filter(r => r.revenue_type === 'download_fee')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      // Calculate streams and liability
      const totalStreams = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
      const streamLiability = totalStreams * 1.00; // $1 per stream
      const downloadPayouts = downloads.reduce((sum, d) => sum + (d.artist_revenue || 0), 0);

      // Calculate payout status
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

      // Determine health status
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
        platformRevenue: downloadFees, // Platform keeps download fees
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
    healthy: 'text-green-500 bg-green-500/20',
    warning: 'text-yellow-500 bg-yellow-500/20',
    critical: 'text-red-500 bg-red-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Health Banner */}
      <Card className={`p-4 border-2 ${
        metrics.healthStatus === 'healthy' ? 'border-green-500/30' :
        metrics.healthStatus === 'warning' ? 'border-yellow-500/30' :
        'border-red-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {metrics.healthStatus === 'healthy' ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : metrics.healthStatus === 'warning' ? (
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-500" />
            )}
            <div>
              <h3 className="font-semibold">Revenue Pool Health</h3>
              <p className="text-sm text-muted-foreground">
                Coverage: {metrics.coverageRatio.toFixed(1)}% of liability
              </p>
            </div>
          </div>
          <Badge className={healthColors[metrics.healthStatus]}>
            {metrics.healthStatus.toUpperCase()}
          </Badge>
        </div>
        <Progress 
          value={Math.min(metrics.coverageRatio, 100)} 
          className="mt-3 h-2"
        />
      </Card>

      {/* Flow Visualization */}
      <div className="grid grid-cols-5 gap-4 items-center">
        {/* Step 1: Revenue Sources */}
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-blue-500" />
            <h4 className="font-semibold text-sm">Revenue In</h4>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fan Subs</span>
              <span className="font-medium">${metrics.fanSubscriptions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Artist Subs</span>
              <span className="font-medium">${metrics.artistSubscriptions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Download Fees</span>
              <span className="font-medium">${metrics.downloadFees.toFixed(2)}</span>
            </div>
            <div className="border-t border-border/50 pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-blue-500">${metrics.totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <ArrowRight className="w-6 h-6 text-muted-foreground mx-auto" />

        {/* Step 2: Revenue Pool */}
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold text-sm">Revenue Pool</h4>
          </div>
          <div className="text-center py-2">
            <p className="text-3xl font-bold text-green-500">
              ${metrics.poolBalance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Available Balance</p>
          </div>
          <div className="text-xs space-y-1 mt-2 border-t border-border/50 pt-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Liability</span>
              <span className="text-yellow-500">${metrics.totalLiability.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <ArrowRight className="w-6 h-6 text-muted-foreground mx-auto" />

        {/* Step 3: Artist Payouts */}
        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-purple-500" />
            <h4 className="font-semibold text-sm">Artist Payouts</h4>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                Streams ({metrics.totalStreams.toLocaleString()})
              </span>
              <span className="font-medium">${metrics.streamLiability.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                Downloads
              </span>
              <span className="font-medium">${metrics.downloadPayouts.toFixed(2)}</span>
            </div>
            <div className="border-t border-border/50 pt-2 space-y-1">
              <div className="flex justify-between text-yellow-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
                <span>${metrics.pendingPayouts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-500">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Paid
                </span>
                <span>${metrics.completedPayouts.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Per Stream Rate</span>
          </div>
          <p className="text-2xl font-bold text-green-500">$1.00</p>
          <p className="text-xs text-muted-foreground">Guaranteed payout</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">ARPS</span>
          </div>
          <p className="text-2xl font-bold">
            ${metrics.totalStreams > 0 
              ? (metrics.totalRevenue / metrics.totalStreams).toFixed(2) 
              : '0.00'}
          </p>
          <p className="text-xs text-muted-foreground">Avg revenue per stream</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium">TDZ Revenue</span>
          </div>
          <p className="text-2xl font-bold text-purple-500">
            ${metrics.platformRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">From transaction fees</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Break-Even</span>
          </div>
          <p className="text-2xl font-bold">
            {Math.ceil(metrics.totalStreams / 12).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Subs needed @ $12/mo</p>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={loadMetrics} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};
