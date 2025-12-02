import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Lock, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";

const PLAN_DETAILS: Record<string, { name: string; price: string; amount: number }> = {
  starter: { name: "Starter", price: "$9.99/month", amount: 999 },
  pro: { name: "Pro", price: "$19.99/month", amount: 1999 },
  enterprise: { name: "Enterprise", price: "$49.99/month", amount: 4999 },
  fan: { name: "Fan", price: "$12/month", amount: 1200 },
};

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") as string;
  const { user, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [squareLoaded, setSquareLoaded] = useState(false);
  const [card, setCard] = useState<any>(null);

  const planDetails = PLAN_DETAILS[plan];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?plan=${plan}`);
    }
  }, [user, authLoading, navigate, plan]);

  useEffect(() => {
    if (!planDetails) {
      toast.error("Invalid plan selected");
      navigate("/pricing");
      return;
    }

    // Load Square Web Payments SDK
    const script = document.createElement("script");
    script.src = "https://sandbox.web.squarecdn.com/v1/square.js";
    script.async = true;
    script.onload = () => setSquareLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [planDetails, navigate]);

  useEffect(() => {
    if (!squareLoaded || card) return;

    const initializeSquare = async () => {
      try {
        const appId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
        const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

        if (!appId || !locationId) {
          console.error("Square credentials not configured");
          return;
        }

        // @ts-ignore - Square is loaded via script
        const payments = window.Square?.payments(appId, locationId);
        if (!payments) {
          console.error("Square payments not available");
          return;
        }

        const cardInstance = await payments.card();
        await cardInstance.attach("#card-container");
        setCard(cardInstance);
      } catch (error) {
        console.error("Error initializing Square:", error);
      }
    };

    initializeSquare();
  }, [squareLoaded, card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!card || !user) {
      toast.error("Payment system not ready");
      return;
    }

    setProcessing(true);

    try {
      // Tokenize the card
      const result = await card.tokenize();
      
      if (result.status !== "OK") {
        toast.error(result.errors?.[0]?.message || "Card validation failed");
        setProcessing(false);
        return;
      }

      // Call our edge function to process the payment
      const { data, error } = await supabase.functions.invoke("create-square-subscription", {
        body: {
          plan,
          sourceId: result.token,
        },
      });

      if (error) {
        console.error("Subscription error:", error);
        toast.error(error.message || "Failed to process subscription");
        setProcessing(false);
        return;
      }

      toast.success(`Successfully subscribed to ${planDetails.name}!`);
      
      // Redirect based on plan type
      if (plan === "fan") {
        navigate("/discover");
      } else {
        navigate("/studio");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  if (!planDetails) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="grid gap-8">
          {/* Order Summary */}
          <Card className="glass-card-premium">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-lg">{planDetails.name} Plan</h3>
                  <p className="text-sm text-muted-foreground">Monthly subscription</p>
                </div>
                <span className="text-2xl font-bold glow-text">{planDetails.price}</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="font-semibold">Total due today</span>
                <span className="text-xl font-bold">{planDetails.price.replace("/month", "")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="glass-card-premium">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <CardTitle>Payment Details</CardTitle>
              </div>
              <CardDescription>
                Your payment is secured with Square
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Square Card Element */}
                <div className="space-y-2">
                  <Label>Card Information</Label>
                  <div 
                    id="card-container" 
                    className="min-h-[100px] p-4 rounded-lg border border-border bg-background/50"
                  >
                    {!squareLoaded && (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Loading payment form...
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full shadow-glow"
                  size="lg"
                  disabled={processing || !card}
                >
                  {processing ? (
                    "Processing..."
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Payments secured by Square</span>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Terms */}
          <p className="text-center text-sm text-muted-foreground">
            By subscribing, you agree to our{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/terms")}>
              Terms of Service
            </Button>{" "}
            and{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/privacy")}>
              Privacy Policy
            </Button>
            . You can cancel anytime.
          </p>
        </div>
      </main>
    </div>
  );
}
