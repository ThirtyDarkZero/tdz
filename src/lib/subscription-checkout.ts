// Square hosted checkout URLs for subscription plans
export const SQUARE_CHECKOUT_URLS = {
  starter: "https://checkout.square.site/merchant/MLV6RRYQWCN3T/checkout/U5DGPKX4JCLCOB4D5NJMUA2E",
  pro: "https://checkout.square.site/merchant/MLV6RRYQWCN3T/checkout/NOY5QGNAQP3L3A3NAEZXXVRE",
  enterprise: "https://checkout.square.site/merchant/MLV6RRYQWCN3T/checkout/34AKT2GSTNO3BQIZIAOELSON",
  fan: "https://checkout.square.site/merchant/MLV6RRYQWCN3T/checkout/BU5Z6ATDAPDQMGMQCJEK5I3U",
} as const;

export type CheckoutPlan = keyof typeof SQUARE_CHECKOUT_URLS;

export function getAppBaseUrl(): string {
  // Always use production URL for Square redirects
  if (window.location.origin.includes('localhost') || window.location.origin.includes('preview')) {
    return 'https://tdz.lovable.app';
  }
  return window.location.origin;
}

export function openSquareCheckout(plan: CheckoutPlan) {
  const baseUrl = SQUARE_CHECKOUT_URLS[plan];
  const redirectUrl = `${getAppBaseUrl()}/subscription-success?plan=${plan}`;
  
  // Square checkout supports redirect_url parameter
  const checkoutUrl = `${baseUrl}?redirect_url=${encodeURIComponent(redirectUrl)}`;
  
  // Open in same window for better redirect experience
  window.location.href = checkoutUrl;
}

export function isCheckoutPlan(plan: string): plan is CheckoutPlan {
  return plan in SQUARE_CHECKOUT_URLS;
}
