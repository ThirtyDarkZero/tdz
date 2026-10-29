// What a browser is allowed to see when a request fails.
// Messages written for users (sign-in, validation, limits) pass through;
// anything else (database, Stripe, AI provider, stack details) is replaced
// with a generic message. The full error should still be logged server-side.

const SAFE = [
  /^unauthori[sz]ed\b/i,
  /^forbidden\b/i,
  /^not authenticated\b/i,
  /^(please )?sign in\b/i,
  /^invalid\b/i,
  /^missing\b/i,
  /\brequired\b/i,
  /\bnot found\b/i,
  /\brate limit/i,
  /^too many requests/i,
  /\b(insufficient|out of) credits\b/i,
  /^payment required/i,
  /\bmust be\b/i,
  /^(file|upload) too large/i,
];

const UNSAFE = /(sql|relation |column |violates|duplicate key|syntax error|stack|at \w+ \(|https?:\/\/|sk_(live|test)|Bearer |JWT|supabase|postgres|stripe\.com)/i;

export function publicError(e: unknown, fallback = "Something went wrong. Please try again."): string {
  const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  if (!msg || msg.length > 160 || UNSAFE.test(msg)) return fallback;
  return SAFE.some((r) => r.test(msg)) ? msg : fallback;
}
