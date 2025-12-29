import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Lock, Shield, Check, Zap, Music, Users, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";

const PLAN_DETAILS: Record<string, { 
  name: string; 
  price: string; 
  amount: number;
  features: string[];
  icon: typeof Zap;
  color: string;
}> = {
  starter: { 
    name: "Starter", 
    price: "$9.99/month", 
    amount: 999,
    features: ["3 track uploads", "1 album", "Basic analytics", "Email support"],
    icon: Zap,
    color: "text-blue-400"
  },
  pro: { 
    name: "Pro", 
    price: "$19.99/month", 
    amount: 1999,
    features: ["50 track uploads", "10 albums", "Advanced analytics", "Priority support", "Smart links", "Fan engagement tools"],
    icon: Music,
    color: "text-violet-400"
  },
  enterprise: { 
    name: "Enterprise", 
    price: "$49.99/month", 
    amount: 4999,
    features: ["Unlimited uploads", "Unlimited albums", "Full analytics suite", "Artist management", "Priority payouts", "White-glove support"],
    icon: Crown,
    color: "text-amber-400"
  },
  fan: { 
    name: "Fan", 
    price: "$12/month", 
    amount: 1200,
    features: ["Unlimited streaming", "Offline downloads", "HD audio quality", "No ads", "Support artists directly"],
    icon: Users,
    color: "text-green-400"
  },
};

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") as string;
  const { user, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [squareLoaded, setSquareLoaded] = useState(false);
  const [squareError, setSquareError] = useState<string | null>(null);
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

    // Load Square Web Payments SDK - use production in production environment
    const isProduction = window.location.hostname !== 'localhost';
    const scriptUrl = isProduction 
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js";
    
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => setSquareLoaded(true);
    script.onerror = () => setSquareError("Failed to load payment system");
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [planDetails, navigate]);

  useEffect(() => {
    if (!squareLoaded || card) return;

    const initializeSquare = async () => {
      try {
        // These are publishable keys, safe to use on frontend
        // For production, you'd fetch these from a config endpoint
        const appId = "sandbox-sq0idb-_lhZ6x2qK3ixELPD9wjsaQ"; // Replace with actual production app ID
        const locationId = "LNYJ1DGJX7V6A"; // Replace with actual production location ID

        // @ts-ignore - Square is loaded via script
        const payments = window.Square?.payments(appId, locationId);
        if (!payments) {
          setSquareError("Payment system not available");
          return;
        }

        const cardInstance = await payments.card();
        await cardInstance.attach("#card-container");
        setCard(cardInstance);
      } catch (error: any) {
        console.error("Error initializing Square:", error);
        setSquareError(error.message || "Failed to initialize payment form");
      }
    };

    initializeSquare();
  }, [squareLoaded, card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!card || !user) {
      toast.error("Payment system not ready. Please refresh and try again.");
      return;
    }

    setProcessing(true);

    try {
      // Tokenize the card
      const result = await card.tokenize();
      
      if (result.status !== "OK") {
        toast.error(result.errors?.[0]?.message || "Card validation failed. Please check your card details.");
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
        toast.error(error.message || "Payment failed. Please try again.");
        setProcessing(false);
        return;
      }

      toast.success(`Welcome to TDZ ${planDetails.name}!`);
      
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

  const IconComponent = planDetails.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

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
          <Badge variant="outline" className="gap-2 border-green-500/50 text-green-500">
            <Lock className="w-3 h-3" />
            Secure Checkout
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="glass-card border-border/50 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r from-primary to-secondary`} />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-muted ${planDetails.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{planDetails.name} Plan</CardTitle>
                    <CardDescription>Monthly subscription</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  {planDetails.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total due today</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {planDetails.price.replace("/month", "")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed monthly. Cancel anytime.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2 text-xs">
                <Shield className="w-4 h-4 text-green-500" />
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Lock className="w-4 h-4 text-green-500" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <CardTitle>Payment Details</CardTitle>
              </div>
              <CardDescription>
                All transactions are encrypted and secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Square Card Element */}
                <div className="space-y-2">
                  <Label>Card Information</Label>
                  <div 
                    id="card-container" 
                    className="min-h-[120px] p-4 rounded-lg border border-border bg-background/50"
                  >
                    {!squareLoaded && !squareError && (
                      <div className="flex items-center justify-center h-full">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span>Loading secure payment form...</span>
                        </div>
                      </div>
                    )}
                    {squareError && (
                      <div className="flex items-center justify-center h-full text-destructive text-sm">
                        {squareError}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 hover:shadow-glow font-semibold text-lg"
                  size="lg"
                  disabled={processing || !card}
                >
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <img 
                    src="https://cdn.brandfolder.io/6L6M1HK4/as/sxqw0q-dx6e68-7fqr8o/Square_Logotype_White.svg" 
                    alt="Square" 
                    className="h-4 opacity-60 invert"
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Terms */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          By subscribing, you agree to our{" "}
          <Button variant="link" className="p-0 h-auto text-primary" onClick={() => navigate("/terms")}>
            Terms of Service
          </Button>{" "}
          and{" "}
          <Button variant="link" className="p-0 h-auto text-primary" onClick={() => navigate("/privacy")}>
            Privacy Policy
          </Button>
          . You can cancel your subscription anytime from your settings.
        </p>
      </main>
    </div>
  );
}
