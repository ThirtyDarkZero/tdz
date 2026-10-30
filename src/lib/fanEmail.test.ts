import { describe, expect, it } from "vitest";
import { bodyToHtml, rate } from "./fanEmail";

describe("fan email body", () => {
  it("makes paragraphs, links and a button, escaping HTML", () => {
    const h = bodyToHtml("Hi <b>fans</b>\n\nOut now: https://x.co/l", { label: "Listen", url: "https://x.co/l" });
    expect(h).toContain("&lt;b&gt;fans&lt;/b&gt;");
    expect(h).toContain('<a href="https://x.co/l">https://x.co/l</a>');
    expect(h).toContain('data-tdz-button="Listen" href="https://x.co/l"');
    expect(decodeURIComponent(h.match(/data-tdz-body="([^"]*)"/)![1])).toBe("Hi <b>fans</b>\n\nOut now: https://x.co/l");
  });
  it("drops unsafe button links", () => {
    expect(bodyToHtml("x", { label: "Go", url: "javascript:alert(1)" })).not.toContain("javascript");
  });
  it("rates", () => {
    expect(rate(1, 4)).toBe("25%");
    expect(rate(1, 0)).toBe("—");
  });
});
