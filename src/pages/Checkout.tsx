import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { openStripeCheckout, isCheckoutPlan } from "@/lib/subscription-checkout";
import tdzLogo from "@/assets/tdz-logo.png";

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan") || "";
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const validPlan = isCheckoutPlan(planParam);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/auth?plan=${planParam}`, { replace: true });
      return;
    }
    if (!validPlan) {
      setError("Invalid plan selected. Please choose a plan from the pricing page.");
      return;
    }
    // Auto-start checkout
    setStarting(true);
    openStripeCheckout(planParam as any).catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to start checkout");
      setStarting(false);
    });
  }, [authLoading, user, validPlan, planParam, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/pricing")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <img src={tdzLogo} alt="TDZ" className="h-8 w-auto" style={{ mixBlendMode: 'screen' }} />
            </button>
          </div>
          <Badge variant="outline" className="gap-2 border-green-500/50 text-green-500">
            <Lock className="w-3 h-3" />
            Secure Stripe Checkout
          </Badge>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-16">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl">Stripe Checkout</CardTitle>
            <CardDescription>
              {validPlan ? `Preparing your ${planParam} plan…` : "Plan selection required"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-3 flex-1">
                  <p className="text-sm">{error}</p>
                  <div className="flex gap-2">
                    {validPlan && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setError(null);
                          setStarting(true);
                          openStripeCheckout(planParam as any).catch((e) => {
                            setError(e instanceof Error ? e.message : "Failed");
                            setStarting(false);
                          });
                        }}
                      >
                        Try again
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => navigate("/pricing")}>
                      Back to pricing
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{starting ? "Redirecting to Stripe…" : "Loading…"}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
