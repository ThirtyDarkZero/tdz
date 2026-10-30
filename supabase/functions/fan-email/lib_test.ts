import assert from "node:assert/strict";
import { chunk, htmlToText, personalize, sanitizeHtml, verifyResendSignature, wrapEmail } from "../_shared/fanEmailLib.ts";

Deno.test("strips scripts, handlers and javascript links", () => {
  const out = sanitizeHtml(`<p onclick="x()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><img src=x onerror=alert(1)>`);
  assert.ok(!/script|onclick|onerror|javascript:/i.test(out), out);
  assert.ok(out.includes("<p>Hi</p>"));
});

Deno.test("personalizes with fallbacks and escapes", () => {
  assert.equal(personalize("Hey {{first_name|friend}}!", {}), "Hey friend!");
  assert.equal(personalize("Hey {{ FIRST_NAME }}", { first_name: "<b>Kay</b>" }), "Hey &lt;b&gt;Kay&lt;/b&gt;");
  assert.equal(personalize("Hey {{first_name}}", { first_name: "Kay" }, false), "Hey Kay");
});

Deno.test("text version keeps links", () => {
  assert.equal(htmlToText('<p>New song</p><p><a href="https://x.co/l">Listen</a></p>'), "New song\nListen (https://x.co/l)");
});

Deno.test("every email carries an unsubscribe link", () => {
  const html = wrapEmail("<p>Hi</p>", { artistName: "Nova & Co", unsubscribeUrl: "https://t.co/u?t=1", previewText: "Out now" });
  assert.ok(html.includes('href="https://t.co/u?t=1"'));
  assert.ok(html.includes("Nova &amp; Co"));
  assert.ok(html.includes("Out now"));
});

Deno.test("chunks", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

Deno.test("verifies Resend/Svix signatures", async () => {
  const secret = "whsec_" + btoa("supersecretkey123");
  const body = '{"type":"email.opened","data":{"email_id":"abc"}}';
  const ts = "1700000000";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("supersecretkey123"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`msg_1.${ts}.${body}`)))));
  const h = { id: "msg_1", timestamp: ts, signature: `v1,bogus v1,${sig}` };
  assert.equal(await verifyResendSignature(secret, h, body, 1700000100), true);
  assert.equal(await verifyResendSignature(secret, h, body + " ", 1700000100), false);
  assert.equal(await verifyResendSignature(secret, h, body, 1700009999), false, "stale timestamp");
});
