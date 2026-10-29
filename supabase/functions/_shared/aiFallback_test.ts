import assert from "node:assert/strict";

// Stub the network before the module wraps fetch.
const calls: Array<{ url: string; auth: string | null; body: unknown }> = [];
let gatewayStatus = 200;
let gatewayThrows = false;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  calls.push({ url, auth: new Headers(init?.headers).get("Authorization"), body: init?.body });
  if (url.includes("ai.gateway.lovable.dev")) {
    if (gatewayThrows) return Promise.reject(new TypeError("network down"));
    return Promise.resolve(new Response("{}", { status: gatewayStatus }));
  }
  return Promise.resolve(new Response('{"ok":true}', { status: 200 }));
}) as typeof fetch;

await import("./aiFallback.ts");

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const body = JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: "hi" }] });
const call = () => fetch(GATEWAY, { method: "POST", headers: { Authorization: "Bearer lovable" }, body });

function reset(status = 200, throws = false) {
  calls.length = 0;
  gatewayStatus = status;
  gatewayThrows = throws;
}

Deno.test("without OPENROUTER_API_KEY nothing changes", async () => {
  Deno.env.delete("OPENROUTER_API_KEY");
  Deno.env.set("LOVABLE_API_KEY", "lovable");
  reset(503);
  const res = await call();
  assert.equal(res.status, 503);
  assert.equal(calls.length, 1);
});

Deno.test("gateway outage, rate limit or no credits fail over with the same body", async () => {
  Deno.env.set("OPENROUTER_API_KEY", "or-key");
  Deno.env.set("LOVABLE_API_KEY", "lovable");
  for (const status of [402, 429, 503]) {
    reset(status);
    const res = await call();
    assert.equal(res.status, 200, `status ${status}`);
    assert.equal(calls[1].url, "https://openrouter.ai/api/v1/chat/completions");
    assert.equal(calls[1].auth, "Bearer or-key");
    assert.equal(calls[1].body, body);
  }
});

Deno.test("network errors fail over", async () => {
  Deno.env.set("OPENROUTER_API_KEY", "or-key");
  reset(200, true);
  const res = await call();
  assert.equal(res.status, 200);
  assert.ok(calls.at(-1)!.url.includes("openrouter.ai"));
});

Deno.test("LOVABLE_API_KEY=none goes straight to the fallback", async () => {
  Deno.env.set("OPENROUTER_API_KEY", "or-key");
  Deno.env.set("LOVABLE_API_KEY", "none");
  reset(200);
  await call();
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.includes("openrouter.ai"));
});

Deno.test("healthy gateway responses and other URLs are untouched", async () => {
  Deno.env.set("OPENROUTER_API_KEY", "or-key");
  Deno.env.set("LOVABLE_API_KEY", "lovable");
  reset(200);
  await call();
  await fetch("https://api.example.com/x");
  assert.deepEqual(calls.map((c) => c.url), [GATEWAY, "https://api.example.com/x"]);
  assert.equal(calls[0].auth, "Bearer lovable");
});
