const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/**
 * Turn the artist's plain text into email HTML: paragraphs, clickable links,
 * and an optional button. The original text is kept in a data attribute so
 * the draft can be reopened and edited as text.
 */
export function bodyToHtml(text: string, button: { label: string; url: string } | null): string {
  const paras = text.trim().split(/\n\s*\n/).map((p) =>
    `<p style="margin:0 0 16px">${esc(p).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>').replace(/\n/g, "<br>")}</p>`);
  const safeUrl = button && /^https?:\/\//i.test(button.url) ? esc(button.url) : null;
  const btn = button && safeUrl
    ? `<p style="margin:24px 0"><a data-tdz-button="${encodeURIComponent(button.label)}" href="${safeUrl}" style="display:inline-block;background:#ff6347;color:#000;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">${esc(button.label)}</a></p>`
    : "";
  return `<div data-tdz-body="${encodeURIComponent(text)}">${paras.join("")}${btn}</div>`;
}

export function rate(n: number, of: number): string {
  if (!of) return "—";
  return `${Math.round((n / of) * 100)}%`;
}
