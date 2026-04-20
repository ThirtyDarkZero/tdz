import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Valid subscription plans
export type CheckoutPlan = "starter" | "pro" | "enterprise" | "fan";

const VALID_PLANS: CheckoutPlan[] = ["starter", "pro", "enterprise", "fan"];

export async function openStripeCheckout(plan: CheckoutPlan): Promise<void> {
  const loadingToast = toast.loading("Preparing checkout...");
  
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      toast.dismiss(loadingToast);
      window.location.href = `/auth?plan=${plan}`;
      return;
    }

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { plan },
    });

    toast.dismiss(loadingToast);

    if (error) {
      console.error('Checkout error:', error);
      toast.error("Failed to start checkout", { 
        description: error.message || "Please try again later" 
      });
      return;
    }

    if (!data?.url) {
      console.error('No checkout URL returned:', data);
      toast.error("Payment system error", { 
        description: data?.error || "Could not create checkout session" 
      });
      return;
    }

    // Redirect to Stripe checkout
    window.location.href = data.url;
    
  } catch (err) {
    toast.dismiss(loadingToast);
    console.error('Checkout exception:', err);
    toast.error("Checkout failed", { 
      description: "Please try again or contact support" 
    });
  }
}

/** @deprecated Use openStripeCheckout instead */
export const openSquareCheckout = openStripeCheckout;

export function isCheckoutPlan(plan: string): plan is CheckoutPlan {
  return VALID_PLANS.includes(plan as CheckoutPlan);
}
