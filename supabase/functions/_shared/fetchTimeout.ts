// Side-effect import: gives every outbound fetch() in this function a default
// timeout, so a hung third-party API (AI gateway, YouTube, Spotify, Stripe…)
// fails fast with a clear error instead of holding the request until the
// platform kills it. Calls that pass their own `signal` are left alone.
//
// Usage: add `import "../_shared/fetchTimeout.ts";` as the first import.

const DEFAULT_TIMEOUT_MS = Number(Deno.env.get("FETCH_TIMEOUT_MS") ?? 90_000);

const g = globalThis as typeof globalThis & { __tdzFetchPatched?: boolean };

if (!g.__tdzFetchPatched) {
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.signal) return originalFetch(input, init);
    return originalFetch(input, { ...init, signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS) });
  }) as typeof fetch;
  g.__tdzFetchPatched = true;
}

export {};
