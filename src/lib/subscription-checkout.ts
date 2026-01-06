// Square hosted checkout URLs for subscription plans
export const SQUARE_CHECKOUT_URLS = {
  starter: "https://checkout.square.site/merchant/MLV6RRYQWCN3T/checkout/U5DGPKX4JCLCOB4D5NJMUA2E",
  pro: "https://checkout.square.site/merchant/MLV6RRYQWCN3T/checkout/NOY5QGNAQP3L3A3NAEZXXVRE",
  enterprise: "https://checkout.square.site/merchant/MLV6RRYQWCN3T/checkout/34AKT2GSTNO3BQIZIAOELSON",
  fan: "https://checkout.square.site/merchant/MLV6RRYQWCN3T/checkout/BU5Z6ATDAPDQMGMQCJEK5I3U",
} as const;

export type CheckoutPlan = keyof typeof SQUARE_CHECKOUT_URLS;

export function openSquareCheckout(plan: CheckoutPlan) {
  const url = SQUARE_CHECKOUT_URLS[plan];
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function isCheckoutPlan(plan: string): plan is CheckoutPlan {
  return plan in SQUARE_CHECKOUT_URLS;
}
