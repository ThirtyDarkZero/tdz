// Side-effect import: automatic failover for AI calls.
// The AI features call Lovable's AI gateway (OpenAI-compatible, models named
// like "google/gemini-2.5-flash"). OpenRouter accepts the same request body and
// model names, so when the gateway is unavailable, out of credits, rate-limited
// or not configured, the same request is retried there.
//
// Enable by setting the OPENROUTER_API_KEY secret. Without it, behaviour is
// unchanged. To run without Lovable entirely, set LOVABLE_API_KEY=none too.
//
// Usage: `import "../_shared/aiFallback.ts";` near the top of a function.

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const FALLBACK = "https://openrouter.ai/api/v1/chat/completions";
// Statuses where another provider can succeed: auth/config, credits, rate limit, outage.
const RETRYABLE = new Set([401, 402, 403, 408, 429, 500, 502, 503, 504]);

const g = globalThis as typeof globalThis & { __tdzAiFallback?: boolean };

function urlOf(input: RequestInfo | URL): string {
  return typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
}

if (!g.__tdzAiFallback) {
  const inner = globalThis.fetch.bind(globalThis);

  const toFallback = (init: RequestInit | undefined, reason: string) => {
    const key = Deno.env.get("OPENROUTER_API_KEY");
    if (!key) return null;
    console.warn(`[aiFallback] Lovable AI gateway ${reason}; retrying via OpenRouter`);
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${key}`);
    headers.set("HTTP-Referer", "https://thirtydarkzero.com");
    headers.set("X-Title", "TDZ");
    return inner(FALLBACK, { ...init, headers });
  };

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!urlOf(input).startsWith(GATEWAY) || (init?.body !== undefined && typeof init.body !== "string")) {
      return inner(input, init);
    }
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey || lovableKey === "none") {
      const fb = toFallback(init, "not configured");
      if (fb) return fb;
    }
    try {
      const res = await inner(input, init);
      if (RETRYABLE.has(res.status)) {
        const fb = toFallback(init, `returned ${res.status}`);
        if (fb) {
          res.body?.cancel().catch(() => {});
          return fb;
        }
      }
      return res;
    } catch (e) {
      const fb = toFallback(init, `failed (${(e as Error)?.name ?? "error"})`);
      if (fb) return fb;
      throw e;
    }
  }) as typeof fetch;

  g.__tdzAiFallback = true;
}

export {};
