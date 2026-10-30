// Pure helpers for fan email (tested in lib_test.ts).

/** Remove scripts, event handlers and javascript: links from artist-written HTML. */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|form)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|form|meta|link)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** {{first_name}} and friends. Unknown names are left blank. */
export function personalize(text: string, vars: Record<string, string | null | undefined>, html = true): string {
  return text.replace(/\{\{\s*([a-z_]+)(?:\s*\|\s*([^}]*))?\s*\}\}/gi, (_m, key: string, fallback?: string) => {
    const v = vars[key.toLowerCase()] ?? fallback?.trim() ?? "";
    return html ? escapeHtml(v) : v;
  });
}

export function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|h[1-6]|li|tr)\s*>/gi, "\n")
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n").trim();
}

export interface Wrap { artistName: string; previewText?: string | null; unsubscribeUrl: string }

/** Full email: hidden preview text, the artist's body, and a required footer. */
export function wrapEmail(bodyHtml: string, w: Wrap): string {
  const preview = w.previewText
    ? `<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(w.previewText)}</div>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f4f4f4">${preview}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px" cellpadding="0" cellspacing="0">
<tr><td style="padding:28px 28px 8px;font:16px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111">${sanitizeHtml(bodyHtml)}</td></tr>
<tr><td style="padding:16px 28px 28px;font:12px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#777;border-top:1px solid #eee">
You're getting this because you signed up for ${escapeHtml(w.artistName)} on TDZ Distribution.<br>
<a href="${w.unsubscribeUrl}" style="color:#777">Unsubscribe from ${escapeHtml(w.artistName)}</a>
</td></tr></table></td></tr></table></body></html>`;
}

/** Split into chunks of n (Resend batch limit is 100). */
export function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/** Verify a Resend (Svix) webhook signature. */
export async function verifyResendSignature(
  secret: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, body: string,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!headers.id || !headers.timestamp || !headers.signature) return false;
  const ts = Number(headers.timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > 300) return false;
  const key = Uint8Array.from(atob(secret.replace(/^whsec_/, "")), (c) => c.charCodeAt(0));
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${headers.id}.${headers.timestamp}.${body}`)));
  const expected = btoa(String.fromCharCode(...sig));
  return headers.signature.split(" ").some((part) => {
    const [ver, value] = part.split(",");
    if (ver !== "v1" || !value || value.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < value.length; i++) diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}
