// Best-effort per-IP rate limiter for public (no-login) endpoints.
// Counts live in the function instance's memory, so limits apply per warm
// instance rather than globally — enough to stop scripted loops from burning
// paid API quota (YouTube, AI gateway) without adding a database round trip.

const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    "unknown"
  );
}

/** Returns a 429 Response when the caller is over the limit, otherwise null. */
export function rateLimit(
  req: Request,
  scope: string,
  corsHeaders: Record<string, string>,
  limit = 30,
  windowMs = 60_000,
): Response | null {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }
  const key = `${scope}:${clientIp(req)}`;
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  b.count += 1;
  if (b.count <= limit) return null;
  const retryAfter = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
  return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
    status: 429,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retryAfter) },
  });
}
