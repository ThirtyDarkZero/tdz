import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckoutPlan } from "@/lib/subscription-checkout";

const PLAN_DETAILS: Record<CheckoutPlan, { name: string; price: number; redirect: string }> = {
  starter: { name: "Starter", price: 9.99, redirect: "/studio" },
  pro: { name: "Pro", price: 19.99, redirect: "/studio" },
  enterprise: { name: "Enterprise", price: 49.99, redirect: "/studio" },
  fan: { name: "Fan", price: 12, redirect: "/discover" },
};

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  
  const plan = searchParams.get("plan") as CheckoutPlan | null;
  const planInfo = plan ? PLAN_DETAILS[plan] : null;

  useEffect(() => {
    const activateSubscription = async () => {
      if (!user || !plan || !planInfo) {
        setStatus("error");
        return;
      }

      try {
        // Calculate subscription dates
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);

        // Update or create subscription record
        const { error: subError } = await supabase
          .from("user_subscriptions")
          .upsert({
            user_id: user.id,
            plan: plan,
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: endDate.toISOString(),
            updated_at: now.toISOString(),
          }, {
            onConflict: "user_id",
          });

        if (subError) throw subError;

        // Record revenue for the platform
        const revenueType = plan === "fan" ? "fan_subscription" : "artist_subscription";
        await supabase.from("platform_revenue").insert({
          amount: planInfo.price,
          revenue_type: revenueType,
          description: `${planInfo.name} subscription - Square checkout`,
          period_date: now.toISOString().split("T")[0],
        });

        setStatus("success");
        toast.success(`Welcome to ${planInfo.name}!`);

        // Redirect after short delay
        setTimeout(() => {
          navigate(planInfo.redirect);
        }, 2000);
      } catch (error) {
        console.error("Subscription activation error:", error);
        setStatus("error");
        toast.error("Failed to activate subscription. Please contact support.");
      }
    };

    activateSubscription();
  }, [user, plan, planInfo, navigate]);

  if (!plan || !planInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Invalid subscription plan</p>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass-card-premium p-8 rounded-2xl max-w-md w-full mx-4 text-center space-y-6">
        {status === "processing" && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            <h1 className="text-2xl font-bold">Activating Your Subscription</h1>
            <p className="text-muted-foreground">
              Please wait while we set up your {planInfo.name} plan...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">Welcome to {planInfo.name}!</h1>
            <p className="text-muted-foreground">
              Your subscription is now active. Redirecting you...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold">Something Went Wrong</h1>
            <p className="text-muted-foreground">
              We couldn't activate your subscription. If you were charged, please contact support.
            </p>
            <Button onClick={() => navigate("/")}>Return Home</Button>
          </>
        )}
      </div>
    </div>
  );
}
