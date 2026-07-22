import { supabase } from "@/integrations/supabase/client";

const STORE_BASE_URL = "https://thirtydarkzerorecords.com/store";

export type StoreClickSource =
  | "landing_nav_pill"
  | "landing_footer"
  | "discovery_bottom_nav";

export interface StoreRedirectOptions {
  campaign?: string;
  content?: string;
  term?: string;
}

/**
 * Builds the store URL with UTM parameters so we can measure clicks
 * originating from TDZ in the destination store's analytics.
 */
export function buildStoreUrl(
  source: StoreClickSource,
  opts: StoreRedirectOptions = {},
): string {
  const url = new URL(STORE_BASE_URL);
  url.searchParams.set("utm_source", "tdz");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", opts.campaign ?? "store_redirect");
  url.searchParams.set("utm_content", opts.content ?? source);
  if (opts.term) url.searchParams.set("utm_term", opts.term);
  return url.toString();
}

/** Fire-and-forget event push to any analytics providers loaded on the page. */
function pushProviderEvent(name: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
    posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
  };
  try {
    w.dataLayer?.push({ event: name, ...payload });
    w.gtag?.("event", name, payload);
    w.plausible?.(name, { props: payload });
    w.posthog?.capture(name, payload);
  } catch {
    /* never let analytics break UX */
  }
}

/**
 * Records a store redirect click in the backend (fire-and-forget), pushes an
 * event to any client analytics providers, and returns the destination URL
 * with UTM parameters attached.
 */
export function trackStoreRedirect(
  source: StoreClickSource,
  opts: StoreRedirectOptions = {},
): string {
  const destination = buildStoreUrl(source, opts);
  const payload = {
    source,
    destination,
    campaign: opts.campaign ?? "store_redirect",
    content: opts.content ?? source,
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    path: typeof window !== "undefined" ? window.location.pathname : null,
  };

  pushProviderEvent("store_redirect_click", payload);

  // Insert into backend for our own reporting (non-blocking).
  void (async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("store_click_events").insert({
        source,
        destination,
        campaign: payload.campaign,
        content: payload.content,
        path: payload.path,
        referrer: payload.referrer,
        user_id: userData.user?.id ?? null,
      });
    } catch {
      /* swallow */
    }
  })();

  return destination;
}

/** Convenience helper: track + open the store in a new tab. */
export function openStore(
  source: StoreClickSource,
  opts: StoreRedirectOptions = {},
): void {
  const url = trackStoreRedirect(source, opts);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
