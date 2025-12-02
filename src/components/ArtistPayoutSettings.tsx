import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ArrowUpRight
} from "lucide-react";

interface PayoutDetails {
  square_customer_id: string | null;
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
  const [setupLoading, setSetupLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState("");

  useEffect(() => {
    if (user) {
      loadPayoutDetails();
      loadEarnings();
    }
  }, [user]);

  const loadPayoutDetails = async () => {
    if (!user) return;

    try {
      // Use raw query since types aren't generated yet
      const { data, error } = await supabase
        .from('artist_payout_details' as any)
        .select('*')
        .eq('artist_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading payout details:', error);
      }
      
      if (data) {
        const details = data as any;
        setPayoutDetails({
          square_customer_id: details.square_customer_id,
          account_holder_name: details.account_holder_name,
          payout_enabled: details.payout_enabled,
          last_payout_date: details.last_payout_date,
        });
        if (details.account_holder_name) {
          setAccountHolderName(details.account_holder_name);
        }
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
      const { data: earningsData, error } = await supabase
        .from('artist_earnings')
        .select('*')
        .eq('artist_id', user.id);

      if (error) {
        console.error('Error loading earnings:', error);
        return;
      }

      const pending = earningsData
        ?.filter(e => e.payout_status === 'pending')
        .reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0;
      
      const paid = earningsData
        ?.filter(e => e.payout_status === 'paid')
        .reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0;

      const streams = earningsData
        ?.reduce((sum, e) => sum + (e.total_streams || 0), 0) || 0;

      // Next payout is the 1st of next month
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      setEarnings({
        totalPending: pending,
        totalPaid: paid,
        totalStreams: streams,
        nextPayoutDate: nextMonth.toISOString(),
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSetupPayout = async () => {
    if (!user || !session || !accountHolderName.trim()) {
      toast.error("Please enter your account holder name");
      return;
    }

    setSetupLoading(true);

    try {
      // For now, we'll create a placeholder setup
      // In production, this would integrate with Square's Web Payments SDK
      const response = await supabase.functions.invoke('setup-artist-payout', {
        body: {
          bankAccountToken: `placeholder_${Date.now()}`,
          accountHolderName: accountHolderName.trim(),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success("Payout account setup initiated");
      loadPayoutDetails();
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(error.message || "Failed to setup payout account");
    } finally {
      setSetupLoading(false);
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
        body: {
          artistId: user.id,
        },
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
  const canRequestPayout = payoutDetails?.payout_enabled && earnings.totalPending >= MINIMUM_PAYOUT;

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

      {/* Payout Account Setup */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Payout Account
              </CardTitle>
              <CardDescription>
                Set up your bank account to receive royalty payments
              </CardDescription>
            </div>
            {payoutDetails?.payout_enabled ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                <AlertCircle className="h-3 w-3 mr-1" />
                Setup Required
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {payoutDetails?.payout_enabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{payoutDetails.account_holder_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Connected via Square
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
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
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
                  Connect your bank account to receive royalty payments. We use Square for secure, fast payouts.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="accountHolder">Account Holder Name</Label>
                    <Input
                      id="accountHolder"
                      placeholder="Enter your full legal name"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSetupPayout}
                disabled={setupLoading || !accountHolderName.trim()}
                className="w-full"
              >
                {setupLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Setup Payout Account
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
          <CardTitle className="text-sm">How TDZ Payouts Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• You earn <strong className="text-foreground">$1.00 per stream</strong> on TDZ</p>
          <p>• Minimum payout threshold is <strong className="text-foreground">$50</strong></p>
          <p>• Request payouts anytime or receive automatic monthly payments</p>
          <p>• Payouts are processed within 3-5 business days via Square</p>
          <p>• 100% of download sales go directly to you (minus transaction fees)</p>
        </CardContent>
      </Card>
    </div>
  );
};
