// Shared helpers for safe Stripe calls: idempotency keys + retries with backoff.
// Use `withStripeRetry` for any Stripe mutation to guarantee at-most-once effect
// even if the Edge Function is retried by the client or times out mid-flight.

export function makeIdempotencyKey(scope: string, ...parts: (string | number | undefined | null)[]): string {
  // Deterministic key so retries with the same inputs collapse into one Stripe operation.
  const safe = parts.filter((p) => p !== undefined && p !== null && p !== "").join(":");
  return `tdz:${scope}:${safe}`;
}

interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  label?: string;
}

// Retry only on transient failures. Stripe marks these on the error object.
function isRetryable(err: any): boolean {
  if (!err) return false;
  const type = err.type || err.rawType;
  if (type === "StripeConnectionError" || type === "StripeAPIError") return true;
  const status = err.statusCode;
  if (typeof status === "number" && (status === 409 || status === 429 || status >= 500)) return true;
  // Network-level fetch failures inside Deno
  const msg = String(err.message || "");
  if (/fetch failed|network|ECONN|ETIMEDOUT|timeout/i.test(msg)) return true;
  return false;
}

export async function withStripeRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  const base = opts.baseDelayMs ?? 300;
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (attempt === retries || !isRetryable(err)) break;
      const delay = base * Math.pow(2, attempt) + Math.floor(Math.random() * 100);
      console.warn(`[stripeRetry] ${opts.label ?? "call"} attempt ${attempt + 1} failed (${err?.type || err?.statusCode || "?"}); retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
