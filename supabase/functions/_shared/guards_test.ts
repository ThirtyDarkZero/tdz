import assert from "node:assert/strict";
import { rateLimit } from "./rateLimit.ts";
import { getCorsHeaders } from "./cors.ts";

const req = (ip: string) => new Request("https://x.test", { headers: { "cf-connecting-ip": ip } });

Deno.test("rateLimit allows the limit, then returns 429 with Retry-After", () => {
  const scope = `t-${crypto.randomUUID()}`;
  for (let i = 0; i < 5; i++) assert.equal(rateLimit(req("1.1.1.1"), scope, {}, 5), null);
  const blocked = rateLimit(req("1.1.1.1"), scope, {}, 5);
  assert.ok(blocked);
  assert.equal(blocked!.status, 429);
  assert.ok(Number(blocked!.headers.get("Retry-After")) >= 1);
});

Deno.test("rateLimit counts each IP separately", () => {
  const scope = `t-${crypto.randomUUID()}`;
  for (let i = 0; i < 3; i++) rateLimit(req("2.2.2.2"), scope, {}, 3);
  assert.ok(rateLimit(req("2.2.2.2"), scope, {}, 3));
  assert.equal(rateLimit(req("3.3.3.3"), scope, {}, 3), null);
});

Deno.test("CORS allows the iOS app, own domains and this project's previews", () => {
  for (const origin of [
    "capacitor://localhost",
    "https://thirtydarkzero.com",
    "https://www.thirtydarkzero.net",
    "https://app.thirtydarkzero.com",
    "https://tdz.lovable.app",
    "https://id-preview--751ec7fc-ab3c-47c5-ae43-f222950f0df1.lovable.app",
  ]) {
    assert.equal(getCorsHeaders(origin)["Access-Control-Allow-Origin"], origin, origin);
  }
});

Deno.test("CORS rejects other Lovable apps and unknown sites", () => {
  for (const origin of ["https://copycat.lovable.app", "https://evil.example", "null", ""]) {
    assert.equal(getCorsHeaders(origin)["Access-Control-Allow-Origin"], undefined, origin);
  }
});
