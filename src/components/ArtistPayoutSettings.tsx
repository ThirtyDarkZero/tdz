import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendTutorialEmail } from "@/lib/emails";
import { useAuth } from "@/hooks/useAuth";
import { 
  DollarSign, 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Wallet,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  CreditCard
} from "lucide-react";

interface PayoutDetails {
  stripe_connect_id: string | null;
  account_holder_name: string | null;
  payout_enabled: boolean;
  last_payout_date: string | null;
}

interface EarningsSummary {
  totalPending: number;
  totalPaid: number;
  totalStreams: number;
  nextPayoutDate: string | null;
}

export const ArtistPayoutSettings = () => {
  const { user, session } = useAuth();
  const [payoutDetails, setPayoutDetails] = useState<PayoutDetails | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary>({
    totalPending: 0,
    totalPaid: 0,
    totalStreams: 0,
    nextPayoutDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadPayoutDetails();
      loadEarnings();
    }
  }, [user]);

  // Handle return from Stripe Connect onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payoutStatus = params.get('payout');
    if (payoutStatus === 'success') {
      toast.success("Stripe Connect setup complete! Verifying account...");
      // Webhook account.updated will flip payout_enabled; refresh shortly.
      setTimeout(() => loadPayoutDetails(), 2000);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (payoutStatus === 'refresh') {
      toast.info("Stripe onboarding incomplete — please finish setup");
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadPayoutDetails = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('artist_payout_details_safe' as any)
        .select('*')
        .eq('artist_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading payout details:', error);
      }
      
      if (data) {
        const details = data as any;
        setPayoutDetails({
          stripe_connect_id: details.stripe_connect_id,
          account_holder_name: details.account_holder_name,
          payout_enabled: details.payout_enabled,
          last_payout_date: details.last_payout_date,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEarnings = async () => {
    if (!user) return;

    try {
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('play_count')
        .eq('user_id', user.id);

      if (tracksError) {
        console.error('Error loading tracks:', tracksError);
        return;
      }

      // Note: play_count includes all plays, but earnings only come from paid subscriber plays
      // So we use the earnings table as the source of truth for revenue
      const { data: earningsData, error: earningsError } = await supabase
        .from('artist_earnings')
        .select('*')
        .eq('artist_id', user.id);

      if (earningsError) {
        console.error('Error loading earnings:', earningsError);
      }

      const totalStreams = tracksData?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
      
      const paid = earningsData
        ?.filter(e => e.payout_status === 'paid')
        .reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0;

      const pending = earningsData
        ?.filter(e => e.payout_status === 'pending')
        .reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0;

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      setEarnings({
        totalPending: pending,
        totalPaid: paid,
        totalStreams: totalStreams,
        nextPayoutDate: nextMonth.toISOString(),
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleConnectStripe = async () => {
    if (!user || !session) return;

    setConnectLoading(true);

    try {
      const response = await supabase.functions.invoke('setup-artist-payout', {});

      const data = response.data;

      // Transport-level failure only (function now always returns 200 + body).
      if (response.error && !data) {
        throw new Error(response.error.message || 'Could not reach the payout service');
      }

      if (data?.success && data?.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else {
        console.error('Stripe connect failed:', data);
        throw new Error(data?.error || 'Failed to get onboarding URL');
      }
    } catch (error: any) {
      console.error('Connect error:', error);
      toast.error(error.message || "Failed to connect to Stripe");
      setConnectLoading(false);
    }

  };

  const handleRequestPayout = async () => {
    if (!user || !session) return;

    if (earnings.totalPending < 50) {
      toast.error("Minimum payout is $50. Keep streaming!");
      return;
    }

    setPayoutLoading(true);

    try {
      const response = await supabase.functions.invoke('process-artist-payout', {
        body: { artistId: user.id },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data.success) {
        toast.success(`Payout of $${data.amount?.toFixed(2)} initiated via Stripe!`);
        loadEarnings();
      } else {
        throw new Error(data.error || "Payout failed");
      }
    } catch (error: any) {
      console.error('Payout error:', error);
      toast.error(error.message || "Failed to process payout");
    } finally {
      setPayoutLoading(false);
    }
  };

  // Once the payout account is live, send the "how payouts work" tutorial (once per artist).
  // NOTE: must stay above the early return below — hooks cannot run conditionally.
  useEffect(() => {
    if (!user?.email) return;
    if (!payoutDetails?.stripe_connect_id || !payoutDetails?.payout_enabled) return;
    void sendTutorialEmail({
      templateName: "tutorial-payouts",
      userId: user.id,
      recipientEmail: user.email,
      templateData: { name: payoutDetails?.account_holder_name || undefined },
    });
  }, [user?.id, user?.email, payoutDetails?.stripe_connect_id, payoutDetails?.payout_enabled, payoutDetails?.account_holder_name]);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-5 w-5 animate-spin mr-2" />
            <span>Loading payout settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const MINIMUM_PAYOUT = 50;
  const isConnected = !!payoutDetails?.stripe_connect_id;
  const canRequestPayout = isConnected && payoutDetails?.payout_enabled && earnings.totalPending >= MINIMUM_PAYOUT;

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Balance</p>
                <p className="text-3xl font-bold text-green-500">
                  ${earnings.totalPending.toFixed(2)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-green-500/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Minimum payout: ${MINIMUM_PAYOUT} • Only paid subscriber streams earn revenue
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid Out</p>
                <p className="text-3xl font-bold text-blue-500">
                  ${earnings.totalPaid.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Lifetime earnings via Stripe
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Plays</p>
                <p className="text-3xl font-bold text-purple-500">
                  {earnings.totalStreams.toLocaleString()}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-purple-500/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              $1.00 per paid subscriber stream
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Connect */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe Connect Payouts
              </CardTitle>
              <CardDescription>
                Connect your Stripe account to receive royalty payments via direct deposit
              </CardDescription>
            </div>
            {isConnected ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{payoutDetails?.account_holder_name || 'Stripe Connect Account'}</p>
                  <p className="text-sm text-muted-foreground">
                    Account: {payoutDetails?.stripe_connect_id?.slice(0, 12)}...
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Request Payout</p>
                  <p className="text-sm text-muted-foreground">
                    {canRequestPayout 
                      ? `$${earnings.totalPending.toFixed(2)} available for withdrawal`
                      : `Need $${(MINIMUM_PAYOUT - earnings.totalPending).toFixed(2)} more to reach minimum`
                    }
                  </p>
                </div>
                <Button 
                  onClick={handleRequestPayout}
                  disabled={!canRequestPayout || payoutLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {payoutLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Request Payout
                    </>
                  )}
                </Button>
              </div>

              {earnings.nextPayoutDate && (
                <p className="text-xs text-muted-foreground">
                  Next automatic payout: {new Date(earnings.nextPayoutDate).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Stripe account to receive royalty payments directly to your bank. 
                  Stripe handles secure payment processing for millions of creators worldwide.
                </p>
                
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>✓ Secure Stripe Connect onboarding</li>
                  <li>✓ Direct bank deposits</li>
                  <li>✓ Real-time payment tracking</li>
                  <li>✓ Automatic monthly payouts</li>
                  <li>✓ Tax form generation (1099-K)</li>
                </ul>
              </div>

              <Button 
                onClick={handleConnectStripe}
                disabled={connectLoading}
                className="w-full"
              >
                {connectLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect Stripe Account
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Info */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">How TDZ Royalty Payouts Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• You earn <strong className="text-foreground">$1.00 per stream</strong> from paid subscribers on TDZ</p>
          <p>• Only streams past the <strong className="text-foreground">30-second preview</strong> by <strong className="text-foreground">paid subscribers</strong> generate earnings</p>
          <p>• Free/anonymous plays count as plays but do not generate revenue</p>
          <p>• Minimum payout threshold is <strong className="text-foreground">$50</strong></p>
          <p>• <strong className="text-foreground">Automated payouts</strong> run on the <strong className="text-foreground">1st of every month</strong> via Stripe</p>
          <p>• All artists with $50+ pending are paid automatically</p>
          <p>• Payouts are processed within 2-3 business days</p>
          <p>• 100% of download sales go directly to you (minus Stripe processing fees)</p>
        </CardContent>
      </Card>
    </div>
  );
};
