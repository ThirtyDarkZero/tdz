import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Valid subscription plans
export type CheckoutPlan = "starter" | "pro" | "enterprise" | "fan";

const VALID_PLANS: CheckoutPlan[] = ["starter", "pro", "enterprise", "fan"];

export function getAppBaseUrl(): string {
  // Always use production URL for Square redirects
  if (window.location.origin.includes('localhost') || window.location.origin.includes('preview')) {
    return 'https://tdz.lovable.app';
  }
  return window.location.origin;
}

export async function openSquareCheckout(plan: CheckoutPlan): Promise<void> {
  const loadingToast = toast.loading("Preparing checkout...");
  
  try {
    const redirectUrl = `${getAppBaseUrl()}/subscription-success?plan=${plan}`;
    
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { plan, redirectUrl },
    });

    toast.dismiss(loadingToast);

    if (error) {
      console.error('Checkout error:', error);
      toast.error("Failed to start checkout", { 
        description: error.message || "Please try again later" 
      });
      return;
    }

    if (!data?.checkoutUrl) {
      console.error('No checkout URL returned:', data);
      toast.error("Payment system error", { 
        description: data?.error || "Could not create checkout session" 
      });
      return;
    }

    // Redirect to Square checkout
    window.location.href = data.checkoutUrl;
    
  } catch (err) {
    toast.dismiss(loadingToast);
    console.error('Checkout exception:', err);
    toast.error("Checkout failed", { 
      description: "Please try again or contact support" 
    });
  }
}

export function isCheckoutPlan(plan: string): plan is CheckoutPlan {
  return VALID_PLANS.includes(plan as CheckoutPlan);
}
