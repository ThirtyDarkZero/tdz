import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  Loader2
} from "lucide-react";

interface PayoutDetails {
  square_merchant_id: string | null;
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

  const loadPayoutDetails = async () => {
    if (!user) return;

    try {
      // Use the secure view that excludes sensitive tokens
      const { data, error } = await supabase
        .from('artist_payout_info' as any)
        .select('*')
        .eq('artist_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading payout details:', error);
      }
      
      if (data) {
        const details = data as any;
        setPayoutDetails({
          square_merchant_id: details.square_merchant_id,
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
      // Get actual play counts from tracks (single source of truth)
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('play_count')
        .eq('user_id', user.id);

      if (tracksError) {
        console.error('Error loading tracks:', tracksError);
        return;
      }

      // Calculate total streams from actual track data
      const actualStreams = tracksData?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
      const actualEarnings = actualStreams * 1.00; // $1 per stream

      // Get paid amount from earnings table
      const { data: earningsData, error: earningsError } = await supabase
        .from('artist_earnings')
        .select('*')
        .eq('artist_id', user.id);

      if (earningsError) {
        console.error('Error loading earnings:', earningsError);
      }

      const paid = earningsData
        ?.filter(e => e.payout_status === 'paid')
        .reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0;

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Pending = actual earnings minus already paid
      const pending = Math.max(0, actualEarnings - paid);

      setEarnings({
        totalPending: pending,
        totalPaid: paid,
        totalStreams: actualStreams,
        nextPayoutDate: nextMonth.toISOString(),
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleConnectSquare = async () => {
    if (!user || !session) return;

    setConnectLoading(true);

    try {
      // Use the published app URL for the callback
      const appOrigin = window.location.origin.includes('localhost') 
        ? 'https://tdz.lovable.app' 
        : window.location.origin;
      const redirectUri = `${appOrigin}/square-callback`;
      
      console.log('Requesting Square OAuth with redirect URI:', redirectUri);
      
      const response = await supabase.functions.invoke('square-oauth-url', {
        body: { redirectUri },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data.success && data.authUrl) {
        // Redirect to Square OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to get authorization URL');
      }
    } catch (error: any) {
      console.error('Connect error:', error);
      toast.error(error.message || "Failed to connect to Square");
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
        toast.success(`Payout of $${data.payout.amount.toFixed(2)} initiated!`);
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
  const isConnected = !!payoutDetails?.square_merchant_id;
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
              Minimum payout: ${MINIMUM_PAYOUT}
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
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Streams</p>
                <p className="text-3xl font-bold text-purple-500">
                  {earnings.totalStreams.toLocaleString()}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-purple-500/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              $1.00 per stream
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Square Connection */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Payout Account
              </CardTitle>
              <CardDescription>
                Connect your Square account to receive royalty payments
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
                  <p className="font-medium">{payoutDetails?.account_holder_name || 'Square Account'}</p>
                  <p className="text-sm text-muted-foreground">
                    Merchant ID: {payoutDetails?.square_merchant_id?.slice(0, 8)}...
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
                  Connect your Square account to receive royalty payments directly to your bank. 
                  Square handles secure payment processing for millions of businesses.
                </p>
                
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>✓ Secure OAuth connection</li>
                  <li>✓ Direct bank deposits</li>
                  <li>✓ Real-time payment tracking</li>
                  <li>✓ Automatic monthly payouts</li>
                </ul>
              </div>

              <Button 
                onClick={handleConnectSquare}
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
                    Connect Square Account
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Don't have a Square account?{" "}
                <a 
                  href="https://squareup.com/signup" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Sign up free
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Info */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">How TDZ Automated Royalty Payouts Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• You earn <strong className="text-foreground">$1.00 per stream</strong> on TDZ</p>
          <p>• Minimum payout threshold is <strong className="text-foreground">$50</strong></p>
          <p>• <strong className="text-foreground">Automated payouts</strong> run on the <strong className="text-foreground">1st of every month</strong></p>
          <p>• All artists with $50+ pending are paid automatically</p>
          <p>• Request manual payouts anytime if you can't wait</p>
          <p>• Payouts are processed within 3-5 business days</p>
          <p>• 100% of download sales go directly to you (minus transaction fees)</p>
        </CardContent>
      </Card>
    </div>
  );
};
